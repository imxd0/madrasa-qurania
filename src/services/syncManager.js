import db from './localDb';

const API_BASE = import.meta.env.VITE_API_URL || '';

let isSyncing = false;
let listeners = [];

export function onSyncStateChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function emitSyncState() {
  listeners.forEach(cb => cb({ isSyncing }));
}

async function apiFetch(path, options = {}) {
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

export async function pullAllFromServer() {
  if (!navigator.onLine) return false;
  try {
    const [students, departments, announcements, activities, teachers] = await Promise.all([
      apiFetch('/api/students'),
      apiFetch('/api/departments'),
      apiFetch('/api/activities'),
      apiFetch('/api/announcements'),
      apiFetch('/api/teachers'),
    ]);

    await db.transaction('rw', db.students, db.departments, db.announcements, db.activities, db.teachers, db.sync_meta, async () => {
      await db.students.clear();
      if (Array.isArray(students)) await db.students.bulkAdd(students);

      await db.departments.clear();
      if (Array.isArray(departments)) await db.departments.bulkAdd(departments);

      await db.activities.clear();
      if (Array.isArray(activities)) await db.activities.bulkAdd(activities);

      await db.announcements.clear();
      if (Array.isArray(announcements)) await db.announcements.bulkAdd(announcements);

      await db.teachers.clear();
      if (Array.isArray(teachers)) await db.teachers.bulkAdd(teachers);

      await db.sync_meta.put({ key: 'last_pull', value: new Date().toISOString() });
    });
    return true;
  } catch (err) {
    console.warn('Pull from server failed:', err.message);
    return false;
  }
}

export async function pushPendingToServer() {
  if (!navigator.onLine || isSyncing) return;
  isSyncing = true;
  emitSyncState();

  try {
    const pending = await db.pending_changes.orderBy('localId').toArray();
    if (pending.length === 0) { isSyncing = false; emitSyncState(); return; }

    const tablePaths = {
      students: '/api/students',
      departments: '/api/departments',
      announcements: '/api/announcements',
      activities: '/api/activities',
    };

    for (const change of pending) {
      try {
        const tablePath = tablePaths[change.table];
        if (!tablePath) {
          await db.pending_changes.delete(change.localId);
          continue;
        }

        if (change.action === 'create') {
          await apiFetch(tablePath, { method: 'POST', body: JSON.stringify(change.data) });
        } else if (change.action === 'update') {
          await apiFetch(`${tablePath}/${encodeURIComponent(change.recordId)}`, { method: 'PATCH', body: JSON.stringify(change.data) });
        } else if (change.action === 'delete') {
          await apiFetch(`${tablePath}/${encodeURIComponent(change.recordId)}`, { method: 'DELETE' });
        }
        await db.pending_changes.delete(change.localId);
      } catch (err) {
        console.warn(`Sync failed for ${change.table} ${change.action}:`, err.message);
      }
    }
  } finally {
    isSyncing = false;
    emitSyncState();
  }
}

export async function fullSync() {
  if (!navigator.onLine) return;
  await pushPendingToServer();
  await pullAllFromServer();
}

export function startAutoSync() {
  window.addEventListener('online', () => { fullSync(); });
  setInterval(() => { if (navigator.onLine) pushPendingToServer(); }, 30000);
}
