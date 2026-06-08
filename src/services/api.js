import db from './localDb';
import { pushPendingToServer } from './syncManager';

const API_BASE = import.meta.env.VITE_API_URL || '';

function isOnline() {
  return navigator.onLine;
}

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function serverRequest(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'request_failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

async function queuePending(table, recordId, action, data) {
  await db.pending_changes.add({ table, recordId, action, data, timestamp: Date.now() });
}

export const api = {
  session: () => serverRequest('/api/session'),
  login: (role, password) =>
    serverRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ role, password }),
    }),
  logout: () => serverRequest('/api/logout', { method: 'POST' }),

  getDepartments: async () => {
    if (isOnline()) {
      try {
        const data = await serverRequest('/api/departments');
        if (Array.isArray(data)) {
          await db.departments.clear();
          await db.departments.bulkPut(data);
        }
        return data;
      } catch { return await db.departments.toArray(); }
    }
    return await db.departments.toArray();
  },

  createDepartment: async (department) => {
    const id = department.id || randomId('dep');
    const record = { ...department, id };
    await db.departments.put(record);
    if (isOnline()) {
      try {
        const created = await serverRequest('/api/departments', { method: 'POST', body: JSON.stringify(record) });
        if (created?.id) await db.departments.put(created);
        return created;
      } catch { await queuePending('departments', id, 'create', record); }
    } else {
      await queuePending('departments', id, 'create', record);
    }
    return record;
  },

  deleteDepartment: async (id) => {
    await db.departments.delete(id);
    await db.students.where('department_id').equals(id).delete();
    if (isOnline()) {
      try { await serverRequest(`/api/departments/${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch { await queuePending('departments', id, 'delete', {}); }
    } else {
      await queuePending('departments', id, 'delete', {});
    }
    return { ok: true };
  },

  getStudents: async () => {
    if (isOnline()) {
      try {
        const data = await serverRequest('/api/students');
        if (Array.isArray(data)) {
          await db.students.clear();
          await db.students.bulkPut(data);
        }
        return data;
      } catch { return await db.students.toArray(); }
    }
    return await db.students.toArray();
  },

  createStudent: async (student) => {
    const id = student.id || randomId('stud');
    const record = { ...student, id, status: student.status || 'pending', registration_date: student.registration_date || new Date().toISOString().split('T')[0], history: student.history || '[]' };
    await db.students.put(record);
    if (isOnline()) {
      try {
        const created = await serverRequest('/api/students', { method: 'POST', body: JSON.stringify(record) });
        if (created?.id) await db.students.put(created);
        return created;
      } catch { await queuePending('students', id, 'create', record); }
    } else {
      await queuePending('students', id, 'create', record);
    }
    return record;
  },

  updateStudent: async (id, patch) => {
    const existing = await db.students.get(id);
    if (existing) await db.students.put({ ...existing, ...patch });
    if (isOnline()) {
      try {
        const updated = await serverRequest(`/api/students/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
        if (updated?.id) await db.students.put(updated);
        return updated;
      } catch { await queuePending('students', id, 'update', patch); }
    } else {
      await queuePending('students', id, 'update', patch);
    }
    return { ...existing, ...patch };
  },

  deleteStudent: async (id) => {
    await db.students.delete(id);
    if (isOnline()) {
      try { await serverRequest(`/api/students/${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch { await queuePending('students', id, 'delete', {}); }
    } else {
      await queuePending('students', id, 'delete', {});
    }
    return { ok: true };
  },

  getAdminSummary: async () => {
    if (isOnline()) {
      try { return await serverRequest('/api/admin/summary'); } catch {}
    }
    const students = await db.students.toArray();
    const departments = await db.departments.toArray();
    const activities = await db.activities.toArray();
    return {
      studentsCount: students.length,
      departmentsCount: departments.length,
      activitiesCount: activities.length,
      students: students.map(s => ({ id: s.id, full_name: s.full_name, age: s.age, department_name: s.department_name, registration_date: s.registration_date, status: s.status })),
    };
  },

  getTeachers: async () => {
    if (isOnline()) {
      try {
        const data = await serverRequest('/api/teachers');
        if (Array.isArray(data)) { await db.teachers.clear(); await db.teachers.bulkPut(data); }
        return data;
      } catch { return await db.teachers.toArray(); }
    }
    return await db.teachers.toArray();
  },

  getAnnouncements: async () => {
    if (isOnline()) {
      try {
        const data = await serverRequest('/api/announcements');
        if (Array.isArray(data)) { await db.announcements.clear(); await db.announcements.bulkPut(data); }
        return data;
      } catch { return await db.announcements.toArray(); }
    }
    return await db.announcements.toArray();
  },

  createAnnouncement: async (announcement) => {
    const id = announcement.id || randomId('ann');
    const record = { ...announcement, id, images: announcement.images || [] };
    await db.announcements.put(record);
    if (isOnline()) {
      try { const created = await serverRequest('/api/announcements', { method: 'POST', body: JSON.stringify(record) }); if (created?.id) await db.announcements.put(created); return created; } catch { await queuePending('announcements', id, 'create', record); }
    } else {
      await queuePending('announcements', id, 'create', record);
    }
    return record;
  },

  deleteAnnouncement: async (id) => {
    await db.announcements.delete(id);
    if (isOnline()) {
      try { await serverRequest(`/api/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch { await queuePending('announcements', id, 'delete', {}); }
    } else {
      await queuePending('announcements', id, 'delete', {});
    }
    return { ok: true };
  },

  updateAnnouncement: async (id, patch) => {
    const existing = await db.announcements.get(id);
    if (existing) await db.announcements.put({ ...existing, ...patch });
    if (isOnline()) {
      try { const updated = await serverRequest(`/api/announcements/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }); if (updated?.id) await db.announcements.put(updated); return updated; } catch { await queuePending('announcements', id, 'update', patch); }
    } else {
      await queuePending('announcements', id, 'update', patch);
    }
    return { ...existing, ...patch };
  },

  getActivities: async () => {
    if (isOnline()) {
      try {
        const data = await serverRequest('/api/activities');
        if (Array.isArray(data)) { await db.activities.clear(); await db.activities.bulkPut(data); }
        return data;
      } catch { return await db.activities.toArray(); }
    }
    return await db.activities.toArray();
  },

  createActivity: async (activity) => {
    const id = activity.id || randomId('act');
    const record = { ...activity, id, images: activity.images || [] };
    await db.activities.put(record);
    if (isOnline()) {
      try { const created = await serverRequest('/api/activities', { method: 'POST', body: JSON.stringify(record) }); if (created?.id) await db.activities.put(created); return created; } catch { await queuePending('activities', id, 'create', record); }
    } else {
      await queuePending('activities', id, 'create', record);
    }
    return record;
  },

  updateActivity: async (id, patch) => {
    const existing = await db.activities.get(id);
    if (existing) await db.activities.put({ ...existing, ...patch });
    if (isOnline()) {
      try { const updated = await serverRequest(`/api/activities/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }); if (updated?.id) await db.activities.put(updated); return updated; } catch { await queuePending('activities', id, 'update', patch); }
    } else {
      await queuePending('activities', id, 'update', patch);
    }
    return { ...existing, ...patch };
  },

  deleteActivity: async (id) => {
    await db.activities.delete(id);
    if (isOnline()) {
      try { await serverRequest(`/api/activities/${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch { await queuePending('activities', id, 'delete', {}); }
    } else {
      await queuePending('activities', id, 'delete', {});
    }
    return { ok: true };
  },

  createContactMessage: async (message) => {
    const id = message.id || randomId('msg');
    const record = { ...message, id, date: message.date || new Date().toISOString() };
    if (isOnline()) {
      try { return await serverRequest('/api/contact', { method: 'POST', body: JSON.stringify(record) }); } catch {}
    }
    return { ok: true, offline: true };
  },

  uploadFiles: async (files) => {
    if (!isOnline()) throw new Error('الرفع متاح فقط عند الاتصال بالإنترنت');
    const formData = new FormData();
    for (const file of files) { formData.append('files', file); }
    const response = await fetch(API_BASE + '/api/upload', { method: 'POST', credentials: 'include', body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || 'upload_failed'); error.status = response.status; throw error; }
    return data;
  },

  createBackup: () => serverRequest('/api/admin/backup', { method: 'POST' }),
  listBackups: () => serverRequest('/api/admin/backups'),
  restoreBackup: (filename) => serverRequest(`/api/admin/restore/${encodeURIComponent(filename)}`, { method: 'POST' }),
};
