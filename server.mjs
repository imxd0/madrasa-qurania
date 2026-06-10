import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const PORT = Number(process.env.PORT || 4173);
const IS_DEV = process.env.NODE_ENV !== 'production';
const UPLOADS_DIR = join(process.cwd(), 'uploads');
const STATIC_DIR = join(process.cwd(), 'dist');
const ROOT_DIR = process.cwd();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wxixzhyrtfgbnzyuxuei.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aXh6aHlydGZnYm56eXV4dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTE5NDMsImV4cCI6MjA5NjY2Nzk0M30.AMrP-pj9ewBW5IV8CmIlOEM_xn_38ITqw9pFzxxSrZI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const SESSION_COOKIE = 'mq_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const ADMIN_PASSWORD_HASH = '$2a$12$LJ3XFiJW0U9C5ZC5k5K5Z.eKXKXKXKXKXKXKXKXKXKXKXKXKXKX';

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

await mkdir(UPLOADS_DIR, { recursive: true });

setInterval(async () => {
  try {
    await supabase.from('sessions').delete().lt('expires_at', new Date().toISOString());
  } catch (err) {
    console.error('[cleanup] sessions:', err);
  }
}, 60 * 60 * 1000);

const { departmentsData, newsAnnouncements, teachersData } = await import('./src/data/mockData.js');

async function seedFromMockData() {
  const { data: existing } = await supabase.from('departments').select('id').limit(1);
  if (existing && existing.length > 0) return;

  console.log('[seed] importing default data from mockData.js');

  for (const d of departmentsData) {
    await supabase.from('departments').insert({
      id: d.id, name: d.name, teacher: d.teacher, capacity: d.capacity || 0,
      level: d.level || '', schedule: d.schedule ? JSON.stringify(d.schedule) : null,
      description: d.description || '', image: d.image || null,
    });
  }

  for (const t of teachersData) {
    await supabase.from('teachers').insert({
      id: t.id || `tch-${randomUUID().slice(0, 8)}`, name: t.name,
      specialty: t.specialty || '', bio: t.bio || '',
    });
  }

  for (const a of newsAnnouncements) {
    await supabase.from('announcements').insert({
      id: String(a.id), title: a.title, tag: a.tag || '',
      content: a.content || '', date: a.date || new Date().toISOString().split('T')[0],
      images: a.images || [],
    });
  }

  console.log('[seed] initial seed completed');
}

async function ensureAdminUser() {
  const { data } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
  if (data && data.length > 0) return;

  const password = process.env.ADMIN_PASSWORD || 'BENCHOUBAN2026';
  const hash = await bcrypt.hash(password, 12);
  await supabase.from('users').insert({
    id: `usr-${randomUUID().slice(0, 8)}`, username: 'admin',
    password_hash: hash, role: 'admin',
  });
  console.log('[auth] admin user created');
}

await seedFromMockData();
await ensureAdminUser();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.gif': 'image/gif',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
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
    (req.headers.cookie || '').split(';').map(p => p.trim()).filter(Boolean).map(part => {
      const i = part.indexOf('=');
      return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
    }),
  );
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkLoginRateLimit(ip) {
  return { allowed: true, retryAfter: 0 };
}

function recordLoginAttempt(ip) {}
function clearLoginAttempts(ip) {}

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
    else cb(new Error('نوع الملف غير مسموح'));
  },
});

async function setSessionCookie(res, session) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await supabase.from('sessions').insert({
    token, role: session.role, is_admin: session.isAdmin || false,
    user_id: session.userId || null, expires_at: expiresAt,
  });
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  );
  return token;
}

async function clearSessionCookie(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) await supabase.from('sessions').delete().eq('token', token);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

async function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const { data } = await supabase.from('sessions').select('*').eq('token', token).single();
  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('token', token);
    return null;
  }
  return { role: data.role, isAdmin: data.is_admin, userId: data.user_id };
}

async function requireAdmin(req, res) {
  const session = await getSession(req);
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

async function withDepartmentCounts() {
  const { data: departments } = await supabase.from('departments').select('*');
  const { data: students } = await supabase.from('students').select('department_id');
  const countMap = {};
  (students || []).forEach(s => {
    if (s.department_id) countMap[s.department_id] = (countMap[s.department_id] || 0) + 1;
  });
  return (departments || []).map(d => ({
    ...d,
    schedule: d.schedule ? (typeof d.schedule === 'string' ? JSON.parse(d.schedule) : d.schedule) : null,
    studentsCount: countMap[d.id] || 0,
  }));
}

function rowToStudent(row) {
  if (!row) return null;
  return {
    id: row.id, fullName: row.full_name, age: row.age, phone: row.phone,
    academicLevel: row.academic_level, address: row.address,
    departmentId: row.department_id, departmentName: row.department_name,
    status: row.status, registrationDate: row.registration_date,
    history: Array.isArray(row.history) ? row.history : (row.history ? JSON.parse(row.history) : []),
  };
}

function rowToActivity(row) {
  if (!row) return null;
  return {
    id: row.id, title: row.title, description: row.description,
    date: row.date, type: row.type,
    images: Array.isArray(row.images) ? row.images : (row.images ? JSON.parse(row.images) : []),
  };
}

function rowToAnnouncement(row) {
  if (!row) return null;
  return {
    id: row.id, title: row.title, tag: row.tag, content: row.content,
    date: row.date,
    images: Array.isArray(row.images) ? row.images : (row.images ? JSON.parse(row.images) : []),
  };
}

function rowToTeacher(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, specialty: row.specialty, bio: row.bio };
}

function requireString(value, field, max = 500) {
  if (typeof value !== 'string' || value.trim() === '') throw new ValidationError(`الحقل "${field}" مطلوب`);
  return value.trim().slice(0, max);
}

function optionalString(value, max = 1000) {
  if (value == null || typeof value !== 'string') return null;
  return value.trim().slice(0, max);
}

class ValidationError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

async function parseJsonBody(req) {
  try { return await readBody(req); } catch { throw new ValidationError('صيغة البيانات غير صحيحة'); }
}

export async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/session') {
      const session = await getSession(req);
      sendJson(res, 200, { isAuthenticated: Boolean(session), isAdmin: Boolean(session?.isAdmin), role: session?.role || '' });
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
        await setSessionCookie(res, { role: 'parent', isAdmin: false });
        sendJson(res, 200, { role: 'parent', isAdmin: false });
        return;
      }
      if (body.role === 'admin') {
        recordLoginAttempt(ip);
        const password = typeof body.password === 'string' ? body.password : '';
        const { data: adminUsers } = await supabase.from('users').select('*').eq('role', 'admin').limit(1);
        const adminUser = adminUsers?.[0];
        const ok = adminUser ? await bcrypt.compare(password, adminUser.password_hash) : false;
        if (ok) {
          clearLoginAttempts(ip);
          await setSessionCookie(res, { role: 'admin', isAdmin: true, userId: adminUser.id });
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
      await clearSessionCookie(req, res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/upload') {
      if (!(await requireAdmin(req, res))) return;
      upload.array('files', 10)(req, res, (err) => {
        if (err) { sendJson(res, err.status || 400, { error: err.message || 'upload_failed' }); return; }
        const files = (req.files || []).map(f => ({
          url: `/uploads/${f.filename}`, filename: f.filename, size: f.size, mimetype: f.mimetype,
        }));
        sendJson(res, 201, { files });
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/departments') {
      sendJson(res, 200, await withDepartmentCounts());
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/departments') {
      if (!(await requireAdmin(req, res))) return;
      const body = await parseJsonBody(req);
      const dept = {
        id: `dep-${randomUUID().slice(0, 8)}`,
        name: requireString(body.name, 'اسم القسم'),
        teacher: optionalString(body.teacher, 200),
        capacity: Number(body.capacity || 0) || 0,
        level: optionalString(body.level, 100),
        schedule: body.schedule ? JSON.stringify(body.schedule) : null,
        description: optionalString(body.description, 2000),
        image: optionalString(body.image, 500) || '/assets/images/class-default.jpg',
      };
      const { error } = await supabase.from('departments').insert(dept);
      if (error) throw error;
      sendJson(res, 201, { ...dept, studentsCount: 0 });
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/departments/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      await supabase.from('students').delete().eq('department_id', id);
      await supabase.from('departments').delete().eq('id', id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/students') {
      const { data } = await supabase.from('students').select('*').order('registration_date', { ascending: false });
      const students = (data || []).map(rowToStudent);
      const session = await getSession(req);
      sendJson(res, 200, session?.isAdmin ? students : students.map(publicStudent));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/students') {
      if (!(await requireAdmin(req, res))) return;
      const body = await parseJsonBody(req);
      const student = {
        id: `stud-${randomUUID().slice(0, 8)}`,
        full_name: requireString(body.fullName, 'الاسم الكامل'),
        age: optionalString(body.age, 50), phone: optionalString(body.phone, 50),
        academic_level: optionalString(body.academicLevel, 200),
        address: optionalString(body.address, 500),
        department_id: optionalString(body.departmentId, 100),
        department_name: optionalString(body.departmentName, 200),
        status: 'approved', registration_date: new Date().toISOString().split('T')[0],
        history: body.history || [],
      };
      const { error } = await supabase.from('students').insert(student);
      if (error) throw error;
      sendJson(res, 201, rowToStudent(student));
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/students/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
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
      if (patch.history != null) updates.history = patch.history;
      if (Object.keys(updates).length > 0) {
        await supabase.from('students').update(updates).eq('id', id);
      }
      const { data } = await supabase.from('students').select('*').eq('id', id).single();
      sendJson(res, 200, rowToStudent(data));
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/students/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      await supabase.from('students').delete().eq('id', id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/summary') {
      if (!(await requireAdmin(req, res))) return;
      const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: departmentsCount } = await supabase.from('departments').select('*', { count: 'exact', head: true });
      const { count: activitiesCount } = await supabase.from('activities').select('*', { count: 'exact', head: true });
      const { data: allStudentsRaw } = await supabase.from('students').select('id, full_name, age, phone, department_name, registration_date, status').order('registration_date', { ascending: false });
      const allStudents = (allStudentsRaw || []).map(s => ({
        id: s.id, fullName: s.full_name, age: s.age, phone: s.phone,
        departmentName: s.department_name, registrationDate: s.registration_date, status: s.status,
      }));
      sendJson(res, 200, { students: studentsCount || 0, departments: departmentsCount || 0, activities: activitiesCount || 0, allStudents });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/teachers') {
      const { data } = await supabase.from('teachers').select('*');
      sendJson(res, 200, (data || []).map(rowToTeacher));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/announcements') {
      const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false });
      sendJson(res, 200, (data || []).map(rowToAnnouncement));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/announcements') {
      if (!(await requireAdmin(req, res))) return;
      const body = await parseJsonBody(req);
      const ann = {
        id: `ann-${randomUUID().slice(0, 8)}`, title: requireString(body.title, 'العنوان'),
        tag: optionalString(body.tag, 50) || 'إعلان', content: optionalString(body.content, 5000),
        date: new Date().toISOString().split('T')[0],
        images: Array.isArray(body.images) ? body.images.filter(u => typeof u === 'string').slice(0, 20) : [],
      };
      await supabase.from('announcements').insert(ann);
      sendJson(res, 201, ann);
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/announcements/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      await supabase.from('announcements').delete().eq('id', id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/announcements/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const patch = await parseJsonBody(req);
      const updates = {};
      if (patch.title != null) updates.title = requireString(patch.title, 'العنوان');
      if (patch.tag != null) updates.tag = optionalString(patch.tag, 50);
      if (patch.content != null) updates.content = optionalString(patch.content, 5000);
      if (patch.images != null) updates.images = Array.isArray(patch.images) ? patch.images.filter(u => typeof u === 'string').slice(0, 20) : [];
      if (Object.keys(updates).length > 0) await supabase.from('announcements').update(updates).eq('id', id);
      const { data } = await supabase.from('announcements').select('*').eq('id', id).single();
      sendJson(res, 200, rowToAnnouncement(data));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/activities') {
      const { data } = await supabase.from('activities').select('*').order('date', { ascending: false });
      sendJson(res, 200, (data || []).map(rowToActivity));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/activities') {
      if (!(await requireAdmin(req, res))) return;
      const body = await parseJsonBody(req);
      const act = {
        id: `act-${randomUUID().slice(0, 8)}`, title: requireString(body.title, 'العنوان'),
        description: optionalString(body.description, 5000),
        date: optionalString(body.date, 50) || new Date().toISOString().split('T')[0],
        type: optionalString(body.type, 50) || 'نشاط',
        images: Array.isArray(body.images) ? body.images.filter(u => typeof u === 'string').slice(0, 20) : [],
      };
      await supabase.from('activities').insert(act);
      sendJson(res, 201, act);
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/activities/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const patch = await parseJsonBody(req);
      const updates = {};
      if (patch.title != null) updates.title = requireString(patch.title, 'العنوان');
      if (patch.description != null) updates.description = optionalString(patch.description, 5000);
      if (patch.date != null) updates.date = optionalString(patch.date, 50);
      if (patch.type != null) updates.type = optionalString(patch.type, 50);
      if (patch.images != null) updates.images = Array.isArray(patch.images) ? patch.images.slice(0, 20) : [];
      if (Object.keys(updates).length > 0) await supabase.from('activities').update(updates).eq('id', id);
      const { data } = await supabase.from('activities').select('*').eq('id', id).single();
      sendJson(res, 200, rowToActivity(data));
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/activities/')) {
      if (!(await requireAdmin(req, res))) return;
      const id = decodeURIComponent(url.pathname.split('/').pop());
      await supabase.from('activities').delete().eq('id', id);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (err) {
    if (err instanceof ValidationError) { sendJson(res, 400, { error: err.message }); return; }
    console.error('[api error]', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'server_error' });
  }
}

async function serveUploads(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(url.pathname.replace('/uploads/', ''));
  const filePath = normalize(join(UPLOADS_DIR, decodedPath));
  if (!filePath.startsWith(normalize(UPLOADS_DIR))) { res.writeHead(403); res.end('Forbidden'); return; }
  try {
    await stat(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
    createReadStream(filePath).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
}

async function serveStaticProd(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const requestPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = normalize(join(STATIC_DIR, requestPath));
  if (!filePath.startsWith(normalize(STATIC_DIR))) { res.writeHead(403); res.end('Forbidden'); return; }
  try {
    await stat(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  } catch {
    const fallback = join(STATIC_DIR, 'index.html');
    try { await stat(fallback); res.writeHead(200, { 'Content-Type': mimeTypes['.html'] }); createReadStream(fallback).pipe(res); }
    catch { res.writeHead(404); res.end('Not found'); }
  }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  try {
    if (req.url.startsWith('/api/')) { await handleApi(req, res); return; }
    if (req.url.startsWith('/uploads/')) { await serveUploads(req, res); return; }
    if (IS_DEV && viteServer) { viteServer.middlewares(req, res); return; }
    await serveStaticProd(req, res);
  } catch (error) {
    console.error('[server error]', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'server_error' });
  }
});

function gracefulShutdown(signal) {
  console.log(`\n[shutdown] received ${signal}`);
  server.close(() => { console.log('[shutdown] done'); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('server.mjs') || process.argv[1]?.endsWith('server.js')) {
  server.listen(PORT, () => {
    console.log(`Madrasa Qurania server running on http://localhost:${PORT}`);
    console.log(`Mode: ${IS_DEV ? 'development' : 'production'}`);
    console.log(`Database: Supabase (${SUPABASE_URL})`);
  });
}

export default server;
