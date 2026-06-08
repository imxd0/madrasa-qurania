import Dexie from 'dexie';

const db = new Dexie('MadrasaQuraniaDB');

db.version(1).stores({
  students: 'id, department_id, department_name, status, registration_date',
  departments: 'id, name',
  announcements: 'id, date, tag',
  activities: 'id, date, type',
  teachers: 'id, name',
  contact_messages: 'id, date',
  sessions: 'token, expires_at',
  pending_changes: '++localId, table, recordId, action, timestamp',
  sync_meta: 'key',
});

export default db;
