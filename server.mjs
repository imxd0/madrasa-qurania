import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat, rm, copyFile, readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import multer from 'multer';

const PORT = Number(process.env.PORT || 4173);
const IS_DEV = process.env.NODE_ENV !== 'production';
const DATA_DIR = join(process.cwd(), 'data');
const UPLOADS_DIR = join(process.cwd(), 'uploads');
const BACKUPS_DIR = join(DATA_DIR, 'backups');
const DB_FILE = join(DATA_DIR, 'madrasa.db');
const STATIC_DIR = join(process.cwd(), 'dist');
const ROOT_DIR = process.cwd();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const SESSION_COOKIE = 'mq_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

let viteServer = null;

if (IS_DEV) {
  const { createServer: createViteServer } = await import('vite');
  viteServer = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: ROOT_DIR,
  });
  console.log('Vite middleware ready');
}

await mkdir(DATA_DIR, { recursive: true });
await mkdir(UPLOADS_DIR, { recursive: true });
await mkdir(BACKUPS_DIR, { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    age TEXT,
    phone TEXT,
    academic_level TEXT,
    address TEXT,
    department_id TEXT,
    department_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    registration_date TEXT NOT NULL,
    history TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teacher TEXT,
    capacity INTEGER DEFAULT 0,
    level TEXT,
    schedule TEXT,
    description TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tag TEXT,
    content TEXT,
    date TEXT NOT NULL,
    images TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    type TEXT,
    images TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    bio TEXT
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    user_id TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    ip TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    first_attempt TEXT NOT NULL,
    blocked_until TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date);
  CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
`);

setInterval(() => {
  try {
    const result = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
    if (result.changes > 0) console.log(`[cleanup] removed ${result.changes} expired sessions`);
  } catch (err) {
    console.error('[cleanup] sessions:', err);
  }
}, 60 * 60 * 1000);

const { departmentsData, newsAnnouncements, teachersData, activitiesData } = await import(
  './src/data/mockData.js'
);

async function seedFromMockData() {
  db.exec("CREATE TABLE IF NOT EXISTS seed_flag (key TEXT PRIMARY KEY, val TEXT)");
  const alreadySeeded = db.prepare('SELECT val FROM seed_flag WHERE key = ?').get('done');
  if (alreadySeeded) return;

  console.log('[seed] importing default data from mockData.js');
  const insertDept = db.prepare(
    'INSERT OR IGNORE INTO departments (id, name, teacher, capacity, level, schedule, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  for (const d of departmentsData) {
    insertDept.run(d.id, d.name, d.teacher, d.capacity || 0, d.level || '', d.schedule ? JSON.stringify(d.schedule) : null, d.description || '', d.image || null);
  }

  const insertTeacher = db.prepare('INSERT OR IGNORE INTO teachers (id, name, specialty, bio) VALUES (?, ?, ?, ?)');
  for (const t of teachersData) {
    insertTeacher.run(t.id || `tch-${randomUUID().slice(0, 8)}`, t.name, t.specialty || '', t.bio || '');
  }

  const insertAnn = db.prepare('INSERT OR IGNORE INTO announcements (id, title, tag, content, date, images) VALUES (?, ?, ?, ?, ?, ?)');
  for (const a of newsAnnouncements) {
    insertAnn.run(String(a.id), a.title, a.tag || '', a.content || '', a.date || new Date().toISOString().split('T')[0], JSON.stringify(a.images || []));
  }

  db.prepare('INSERT OR IGNORE INTO seed_flag (key, val) VALUES (?, ?)').run('done', '1');
  console.log('[seed] initial seed completed');
}

async function migrateFromJson() {
  const jsonFile = join(DATA_DIR, 'app-data.json');
  let raw;
  try {
    raw = await readFile(jsonFile, 'utf8');
  } catch {
    return;
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    console.warn('[migrate] could not parse app-data.json, skipping');
    return;
  }

  const existingStudents = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  if ((json.students || []).length > 0 && existingStudents === 0) {
    console.log(`[migrate] importing ${json.students.length} students from JSON`);
    const insert = db.prepare(
      `INSERT OR IGNORE INTO students (id, full_name, age, phone, academic_level, address, department_id, department_name, status, registration_date, history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const s of json.students) {
      insert.run(
        s.id,
        s.fullName,
        s.age ? String(s.age) : null,
        s.phone || null,
        s.academicLevel || null,
        s.address || null,
        s.departmentId || null,
        s.departmentName || null,
        s.status || 'pending',
        s.registrationDate || new Date().toISOString().split('T')[0],
        JSON.stringify(s.history || []),
      );
    }
  }

  if ((json.contactMessages || []).length > 0) {
    const existing = db.prepare('SELECT COUNT(*) as c FROM contact_messages').get().c;
    if (existing === 0) {
      console.log(`[migrate] importing ${json.contactMessages.length} contact messages`);
      const insert = db.prepare(
        'INSERT OR IGNORE INTO contact_messages (id, name, email, subject, message, date) VALUES (?, ?, ?, ?, ?, ?)',
      );
      for (const m of json.contactMessages) {
        insert.run(m.id, m.name || null, m.email || null, m.subject || null, m.message || null, m.date || new Date().toISOString());
      }
    }
  }

  const backupPath = join(BACKUPS_DIR, `pre-migration-${Date.now()}.json`);
  try {
    await copyFile(jsonFile, backupPath);
    await rm(jsonFile);
    console.log(`[migrate] backed up app-data.json to ${backupPath} and removed it`);
  } catch (err) {
    console.warn('[migrate] could not remove old JSON file:', err.message);
  }
}

async function ensureAdminUser() {
  const row = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
  if (row) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  let password;
  const passwordHashFile = join(DATA_DIR, 'admin-password-hash.txt');
  const legacyPasswordFile = join(DATA_DIR, 'admin-password.txt');

  try {
    const hash = (await readFile(passwordHashFile, 'utf8')).trim();
    db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
      `usr-${randomUUID().slice(0, 8)}`,
      username,
      hash,
      'admin',
    );
    console.log(`[auth] loaded existing admin hash from ${passwordHashFile}`);
    return;
  } catch {}

  try {
    const legacy = (await readFile(legacyPasswordFile, 'utf8')).trim();
    if (legacy) {
      password = legacy;
      console.log(`[auth] migrating legacy plaintext admin password to hashed storage`);
    }
  } catch {}

  if (!password) {
    password = process.env.ADMIN_PASSWORD || 'BENCHOUBAN2026';
    console.log(`[auth] using default admin password from env or fallback`);
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
    `usr-${randomUUID().slice(0, 8)}`,
    username,
    hash,
    'admin',
  );
  await writeFile(passwordHashFile, hash, 'utf8');
  console.log(`[auth] admin user created: username="${username}" (password hashed with bcrypt)`);
}

await seedFromMockData();
await migrateFromJson();
await ensureAdminUser();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  return JSON.parse(text);
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

const rateLimitStmt = {
  get: db.prepare('SELECT * FROM login_attempts WHERE ip = ?'),
  upsert: db.prepare(
    `INSERT INTO login_attempts (ip, count, first_attempt, blocked_until)
     VALUES (?, 1, datetime('now'), NULL)
     ON CONFLICT(ip) DO UPDATE SET count = count + 1`,
  ),
  reset: db.prepare('DELETE FROM login_attempts WHERE ip = ?'),
  setBlocked: db.prepare('UPDATE login_attempts SET blocked_until = ? WHERE ip = ?'),
  cleanup: db.prepare("DELETE FROM login_attempts WHERE first_attempt < datetime('now', ?)")
};

function checkLoginRateLimit(ip) {
  rateLimitStmt.cleanup.run(`-${LOGIN_WINDOW_MS / 1000} seconds`);
  const row = rateLimitStmt.get.get(ip);
  if (!row) return { allowed: true, retryAfter: 0 };
  if (row.blocked_until && new Date(row.blocked_until + 'Z') > new Date()) {
    const retryAfter = Math.ceil((new Date(row.blocked_until + 'Z') - new Date()) / 1000);
    return { allowed: false, retryAfter };
  }
  if (row.count >= LOGIN_MAX_ATTEMPTS) {
    const blockedUntil = new Date(Date.now() + LOGIN_WINDOW_MS).toISOString();
    rateLimitStmt.setBlocked.run(blockedUntil, ip);
    return { allowed: false, retryAfter: Math.ceil(LOGIN_WINDOW_MS / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

function recordLoginAttempt(ip) {
  rateLimitStmt.upsert.run(ip);
}

function clearLoginAttempts(ip) {
  rateLimitStmt.reset.run(ip);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = (file.originalname || '').toLowerCase().match(/\.(jpe?g|png|webp|gif)$/)?.[0] || '.jpg';
      cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 10 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مسموح (يُقبل فقط: JPG, PNG, WebP, GIF)'));
  },
});

const insertSession = db.prepare(
  'INSERT INTO sessions (token, role, is_admin, user_id, expires_at) VALUES (?, ?, ?, ?, ?)',
);
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token = ?');
const getSessionStmt = db.prepare('SELECT * FROM sessions WHERE token = ?');

function setSessionCookie(res, session) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  insertSession.run(token, session.role, session.isAdmin ? 1 : 0, session.userId || null, expiresAt);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  );
  return token;
}

function clearSessionCookie(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) deleteSessionStmt.run(token);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const row = getSessionStmt.get(token);
  if (!row) return null;
  if (new Date(row.expires_at + 'Z') < new Date()) {
    deleteSessionStmt.run(token);
    return null;
  }
  return { role: row.role, isAdmin: row.is_admin === 1, userId: row.user_id };
}

function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session?.isAdmin) {
    sendJson(res, 401, { error: 'unauthorized' });
    return null;
  }
  return session;
}

function publicStudent(s) {
  if (!s) return s;
  const { phone, address, ...safe } = s;
  return safe;
}

function withDepartmentCounts() {
  const departments = db.prepare('SELECT * FROM departments').all();
  const counts = db.prepare(
    'SELECT department_id, COUNT(*) as count FROM students WHERE department_id IS NOT NULL GROUP BY department_id',
  ).all();
  const countMap = new Map(counts.map((c) => [c.department_id, c.count]));
  return departments.map((d) => ({
    ...d,
    schedule: d.schedule ? JSON.parse(d.schedule) : null,
    studentsCount: countMap.get(d.id) || 0,
  }));
}

function rowToStudent(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    age: row.age,
    phone: row.phone,
    academicLevel: row.academic_level,
    address: row.address,
    departmentId: row.department_id,
    departmentName: row.department_name,
    status: row.status,
    registrationDate: row.registration_date,
    history: row.history ? JSON.parse(row.history) : [],
  };
}

function rowToAnnouncement(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    tag: row.tag,
    content: row.content,
    date: row.date,
    images: row.images ? JSON.parse(row.images) : [],
  };
}

function rowToActivity(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    type: row.type,
    images: row.images ? JSON.parse(row.images) : [],
  };
}

function rowToTeacher(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, specialty: row.specialty, bio: row.bio };
}

function rowToContactMessage(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, subject: row.subject, message: row.message, date: row.date };
}

function requireString(value, field, max = 500) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`الحقل "${field}" مطلوب`);
  }
  return value.trim().slice(0, max);
}

function optionalString(value, max = 1000) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, max);
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

async function parseJsonBody(req) {
  try {
    return await readBody(req);
  } catch {
    throw new ValidationError('صيغة البيانات غير صحيحة');
  }
}

export async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/session') {
      const session = getSession(req);
      sendJson(res, 200, {
        isAuthenticated: Boolean(session),
        isAdmin: Boolean(session?.isAdmin),
        role: session?.role || '',
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/login') {
      const ip = clientIp(req);
      const limit = checkLoginRateLimit(ip);
      if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter));
        sendJson(res, 429, { error: 'too_many_attempts', retryAfter: limit.retryAfter });
        return;
      }

      const body = await parseJsonBody(req);
      if (body.role === 'parent') {
        clearLoginAttempts(ip);
        setSessionCookie(res, { role: 'parent', isAdmin: false });
        sendJson(res, 200, { role: 'parent', isAdmin: false });
        return;
      }
      if (body.role === 'admin') {
        recordLoginAttempt(ip);
        const password = typeof body.password === 'string' ? body.password : '';
        const adminUser = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('admin');
        const ok = adminUser ? await bcrypt.compare(password, adminUser.password_hash) : false;
        if (ok) {
          clearLoginAttempts(ip);
          setSessionCookie(res, { role: 'admin', isAdmin: true, userId: adminUser.id });
          sendJson(res, 200, { role: 'admin', isAdmin: true });
          return;
        }
        sendJson(res, 401, { error: 'invalid_credentials' });
        return;
      }
      sendJson(res, 400, { error: 'invalid_role' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/logout') {
      clearSessionCookie(req, res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/upload') {
      if (!requireAdmin(req, res)) return;
      upload.array('files', 10)(req, res, (err) => {
        if (err) {
          sendJson(res, err.status || 400, { error: err.message || 'upload_failed' });
          return;
        }
        const files = (req.files || []).map((f) => ({
          url: `/uploads/${f.filename}`,
          filename: f.filename,
          size: f.size,
          mimetype: f.mimetype,
        }));
        sendJson(res, 201, { files });
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/departments') {
      sendJson(res, 200, withDepartmentCounts());
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/departments') {
      if (!requireAdmin(req, res)) return;
      const body = await parseJsonBody(req);
      const department = {
        id: `dep-${randomUUID().slice(0, 8)}`,
        name: requireString(body.name, 'اسم القسم'),
        teacher: optionalString(body.teacher, 200),
        capacity: Number(body.capacity || 0) || 0,
        level: optionalString(body.level, 100),
        schedule: body.schedule || null,
        description: optionalString(body.description, 2000),
        image: optionalString(body.image, 500) || '/assets/images/class-default.jpg',
      };
      db.prepare(
        'INSERT INTO departments (id, name, teacher, capacity, level, schedule, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        department.id,
        department.name,
        department.teacher,
        department.capacity,
        department.level,
        department.schedule ? JSON.stringify(department.schedule) : null,
        department.description,
        department.image,
      );
      sendJson(res, 201, { ...department, studentsCount: 0 });
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/departments/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      db.prepare('DELETE FROM students WHERE department_id = ?').run(id);
      db.prepare('DELETE FROM departments WHERE id = ?').run(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/students') {
      const rows = db.prepare('SELECT * FROM students ORDER BY registration_date DESC, id DESC').all();
      const session = getSession(req);
      const students = rows.map(rowToStudent);
      if (session?.isAdmin) {
        sendJson(res, 200, students);
      } else {
        sendJson(res, 200, students.map(publicStudent));
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/students') {
      if (!requireAdmin(req, res)) return;
      const body = await parseJsonBody(req);
      const fullName = requireString(body.fullName, 'الاسم الكامل');
      const id = `stud-${randomUUID().slice(0, 8)}`;
      const student = {
        id,
        fullName,
        age: optionalString(body.age, 50),
        phone: optionalString(body.phone, 50),
        academicLevel: optionalString(body.academicLevel, 200),
        address: optionalString(body.address, 500),
        departmentId: optionalString(body.departmentId, 100),
        departmentName: optionalString(body.departmentName, 200),
        status: 'approved',
        registrationDate: new Date().toISOString().split('T')[0],
        history: [],
      };
      db.prepare(
        `INSERT INTO students (id, full_name, age, phone, academic_level, address, department_id, department_name, status, registration_date, history)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        student.id, student.fullName, student.age, student.phone, student.academicLevel,
        student.address, student.departmentId, student.departmentName, student.status,
        student.registrationDate, JSON.stringify(student.history),
      );
      sendJson(res, 201, student);
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/students/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
      if (!existing) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const patch = await parseJsonBody(req);
      const updates = {};
      if (patch.fullName != null) updates.full_name = requireString(patch.fullName, 'الاسم الكامل');
      if (patch.age != null) updates.age = optionalString(patch.age, 50);
      if (patch.phone != null) updates.phone = optionalString(patch.phone, 50);
      if (patch.academicLevel != null) updates.academic_level = optionalString(patch.academicLevel, 200);
      if (patch.address != null) updates.address = optionalString(patch.address, 500);
      if (patch.departmentId != null) updates.department_id = optionalString(patch.departmentId, 100);
      if (patch.departmentName != null) updates.department_name = optionalString(patch.departmentName, 200);
      if (patch.status != null) updates.status = optionalString(patch.status, 50);
      if (patch.history != null) updates.history = JSON.stringify(patch.history);

      const keys = Object.keys(updates);
      if (keys.length > 0) {
        const sql = `UPDATE students SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
        db.prepare(sql).run(...keys.map((k) => updates[k]), id);
      }
      const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
      sendJson(res, 200, rowToStudent(updated));
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/students/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      db.prepare('DELETE FROM students WHERE id = ?').run(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/summary') {
      if (!requireAdmin(req, res)) return;
      const studentsCount = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
      const departmentsCount = db.prepare('SELECT COUNT(*) as c FROM departments').get().c;
      const activitiesCount = db.prepare('SELECT COUNT(*) as c FROM activities').get().c;
      const allStudents = db.prepare(
        'SELECT id, full_name, age, phone, department_name, registration_date, status FROM students ORDER BY registration_date DESC',
      ).all().map((s) => ({
        id: s.id,
        fullName: s.full_name,
        age: s.age,
        phone: s.phone,
        departmentName: s.department_name,
        registrationDate: s.registration_date,
        status: s.status,
      }));
      sendJson(res, 200, { students: studentsCount, departments: departmentsCount, activities: activitiesCount, allStudents });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/teachers') {
      const rows = db.prepare('SELECT * FROM teachers').all();
      sendJson(res, 200, rows.map(rowToTeacher));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/announcements') {
      const rows = db.prepare('SELECT * FROM announcements ORDER BY date DESC, id DESC').all();
      sendJson(res, 200, rows.map(rowToAnnouncement));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/announcements') {
      if (!requireAdmin(req, res)) return;
      const body = await parseJsonBody(req);
      const id = `ann-${randomUUID().slice(0, 8)}`;
      const announcement = {
        id,
        title: requireString(body.title, 'العنوان'),
        tag: optionalString(body.tag, 50) || 'إعلان',
        content: optionalString(body.content, 5000),
        date: new Date().toISOString().split('T')[0],
        images: Array.isArray(body.images) ? body.images.filter((u) => typeof u === 'string').slice(0, 20) : [],
      };
      db.prepare(
        'INSERT INTO announcements (id, title, tag, content, date, images) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(announcement.id, announcement.title, announcement.tag, announcement.content, announcement.date, JSON.stringify(announcement.images));
      sendJson(res, 201, announcement);
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/announcements/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/announcements/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
      if (!existing) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const patch = await parseJsonBody(req);
      const updates = {};
      if (patch.title != null) updates.title = requireString(patch.title, 'العنوان');
      if (patch.tag != null) updates.tag = optionalString(patch.tag, 50);
      if (patch.content != null) updates.content = optionalString(patch.content, 5000);
      if (patch.images != null) updates.images = JSON.stringify(Array.isArray(patch.images) ? patch.images.filter((u) => typeof u === 'string').slice(0, 20) : []);

      const keys = Object.keys(updates);
      if (keys.length > 0) {
        const sql = `UPDATE announcements SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
        db.prepare(sql).run(...keys.map((k) => updates[k]), id);
      }
      const updated = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
      sendJson(res, 200, rowToAnnouncement(updated));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/activities') {
      const rows = db.prepare('SELECT * FROM activities ORDER BY date DESC, id DESC').all();
      sendJson(res, 200, rows.map(rowToActivity));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/activities') {
      if (!requireAdmin(req, res)) return;
      const body = await parseJsonBody(req);
      const id = `act-${randomUUID().slice(0, 8)}`;
      const activity = {
        id,
        title: requireString(body.title, 'العنوان'),
        description: optionalString(body.description, 5000),
        date: optionalString(body.date, 50) || new Date().toISOString().split('T')[0],
        type: optionalString(body.type, 50) || 'نشاط',
        images: Array.isArray(body.images) ? body.images.filter((u) => typeof u === 'string').slice(0, 20) : [],
      };
      db.prepare(
        'INSERT INTO activities (id, title, description, date, type, images) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(activity.id, activity.title, activity.description, activity.date, activity.type, JSON.stringify(activity.images));
      sendJson(res, 201, activity);
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/activities/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
      if (!existing) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const patch = await parseJsonBody(req);
      const updates = {};
      if (patch.title != null) updates.title = requireString(patch.title, 'العنوان');
      if (patch.description != null) updates.description = optionalString(patch.description, 5000);
      if (patch.date != null) updates.date = optionalString(patch.date, 50);
      if (patch.type != null) updates.type = optionalString(patch.type, 50);
      if (patch.images != null) updates.images = JSON.stringify(Array.isArray(patch.images) ? patch.images.slice(0, 20) : []);

      const keys = Object.keys(updates);
      if (keys.length > 0) {
        const sql = `UPDATE activities SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
        db.prepare(sql).run(...keys.map((k) => updates[k]), id);
      }
      const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
      sendJson(res, 200, rowToActivity(updated));
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/activities/')) {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      db.prepare('DELETE FROM activities WHERE id = ?').run(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/contact') {
      const body = await parseJsonBody(req);
      const message = {
        id: `msg-${randomUUID().slice(0, 8)}`,
        name: optionalString(body.name, 200),
        email: optionalString(body.email, 200),
        subject: optionalString(body.subject, 300),
        message: optionalString(body.message, 3000),
        date: new Date().toISOString(),
      };
      db.prepare(
        'INSERT INTO contact_messages (id, name, email, subject, message, date) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(message.id, message.name, message.email, message.subject, message.message, message.date);
      sendJson(res, 201, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/backup') {
      if (!requireAdmin(req, res)) return;
      const filename = await createBackup();
      sendJson(res, 201, { ok: true, filename });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/backups') {
      if (!requireAdmin(req, res)) return;
      const files = await readdir(BACKUPS_DIR).catch(() => []);
      const list = await Promise.all(
        files
          .filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
          .map(async (f) => {
            const st = await stat(join(BACKUPS_DIR, f));
            return { filename: f, size: st.size, createdAt: st.mtime.toISOString() };
          }),
      );
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      sendJson(res, 200, list);
      return;
    }

    if (req.method === 'POST' && url.pathname.startsWith('/api/admin/restore/')) {
      if (!requireAdmin(req, res)) return;
      const filename = decodeURIComponent(url.pathname.split('/').pop());
      if (!/^backup-[\w-]+\.db$/.test(filename)) {
        sendJson(res, 400, { error: 'invalid_filename' });
        return;
      }
      const backupPath = join(BACKUPS_DIR, filename);
      try {
        await stat(backupPath);
      } catch {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      db.close();
      await copyFile(backupPath, DB_FILE);
      console.log(`[restore] database restored from ${filename}`);
      sendJson(res, 200, { ok: true, message: 'تم الاستعادة، أعد تشغيل الخادم لتطبيق التغييرات' });
      setTimeout(() => process.exit(0), 1000);
      return;
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (err) {
    if (err instanceof ValidationError) {
      sendJson(res, 400, { error: err.message });
      return;
    }
    console.error('[api error]', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'server_error' });
  }
}

async function createBackup() {
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  const tempPath = join(BACKUPS_DIR, `.temp-${Date.now()}.db`);
  const backupPath = join(BACKUPS_DIR, filename);

  try {
    await db.backup(tempPath);
  } catch (err) {
    throw new Error(`backup failed: ${err.message}`);
  }

  await copyFile(tempPath, backupPath);
  await rm(tempPath, { force: true });

  const uploadsBackup = join(BACKUPS_DIR, filename.replace('.db', '-uploads'));
  await mkdir(uploadsBackup, { recursive: true });
  const uploadFiles = await readdir(UPLOADS_DIR).catch(() => []);
  for (const f of uploadFiles) {
    try {
      await copyFile(join(UPLOADS_DIR, f), join(uploadsBackup, f));
    } catch {}
  }

  const files = (await readdir(BACKUPS_DIR).catch(() => []))
    .filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
    .sort()
    .reverse();
  for (const old of files.slice(7)) {
    try {
      await rm(join(BACKUPS_DIR, old));
      await rm(join(BACKUPS_DIR, old.replace('.db', '-uploads')), { recursive: true, force: true });
    } catch {}
  }

  try {
    await rm(join(BACKUPS_DIR, '.temp-backup.db'));
  } catch {}

  console.log(`[backup] created ${filename}`);
  return filename;
}

setInterval(async () => {
  try {
    await createBackup();
  } catch (err) {
    console.error('[backup] failed:', err);
  }
}, 24 * 60 * 60 * 1000);

async function serveUploads(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(url.pathname.replace('/uploads/', ''));
  const filePath = normalize(join(UPLOADS_DIR, decodedPath));
  if (!filePath.startsWith(normalize(UPLOADS_DIR))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    await stat(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

async function serveStaticProd(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const requestPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = normalize(join(STATIC_DIR, requestPath));
  const safeStaticDir = normalize(STATIC_DIR);

  if (!filePath.startsWith(safeStaticDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    await stat(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  } catch {
    const fallback = join(STATIC_DIR, 'index.html');
    try {
      await stat(fallback);
      res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
      createReadStream(fallback).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    if (req.url.startsWith('/uploads/')) {
      await serveUploads(req, res);
      return;
    }
    if (IS_DEV && viteServer) {
      viteServer.middlewares(req, res);
      return;
    }
    await serveStaticProd(req, res);
  } catch (error) {
    console.error('[server error]', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'server_error' });
  }
});

function gracefulShutdown(signal) {
  console.log(`\n[shutdown] received ${signal}, closing server...`);
  server.close(() => {
    try {
      db.close();
    } catch {}
    console.log('[shutdown] done');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[shutdown] forced exit after 10s');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

if (
  import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('server.mjs') ||
  process.argv[1]?.endsWith('server.js')
) {
  server.listen(PORT, () => {
    console.log(`Madrasa Qurania server running on http://localhost:${PORT}`);
    console.log(`Mode: ${IS_DEV ? 'development (Vite middleware enabled)' : 'production'}`);
    console.log(`Database: ${DB_FILE}`);
    console.log(`Uploads: ${UPLOADS_DIR}`);
    console.log(`Backups: ${BACKUPS_DIR}`);
  });
}

export default server;
