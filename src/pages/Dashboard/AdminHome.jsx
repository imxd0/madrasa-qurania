import { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Users, CalendarCheck } from 'lucide-react';
import { api } from '../../services/api';

const AdminHome = () => {
  const [stats, setStats] = useState({ students: 0, departments: 0, activities: 0 });
  const [allStudents, setAllStudents] = useState([]);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      const summary = await api.getAdminSummary();
      setStats({ students: summary.students, departments: summary.departments, activities: summary.activities || 0 });
      setAllStudents(summary.allStudents || []);
    } catch {
      setError('فشل تحميل الإحصائيات، تأكد من صلاحية المشرف');
    }
  };

  useEffect(() => { loadSummary(); }, []);

  useEffect(() => {
    const onFocus = () => loadSummary();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <div className="admin-home animate-fade-in">
      <div className="dashboard-section-header">
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)' }}>
          لوحة الإحصائيات العامة والتقارير
        </h2>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <div className="dashboard-stats-grid">
        <div className="stat-box">
          <div className="stat-info">
            <h4>إجمالي عدد الطلاب</h4>
            <span>{stats.students}</span>
          </div>
          <div className="stat-icon-wrapper">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-info">
            <h4>عدد الأقسام والحلقات</h4>
            <span>{stats.departments}</span>
          </div>
          <div className="stat-icon-wrapper">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-info">
            <h4>عدد الأنشطة والفعاليات</h4>
            <span>{stats.activities}</span>
          </div>
          <div className="stat-icon-wrapper">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>
            <Users className="w-5 h-5 inline-block ml-2" style={{ verticalAlign: 'text-bottom' }} />
            كل طلاب المدرسة ({allStudents.length})
          </h3>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" id="all-students-table">
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>العمر</th>
                <th>القسم</th>
                <th>تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {allStudents.length > 0 ? (
                allStudents.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.fullName}</strong></td>
                    <td>{student.age} سنة</td>
                    <td>{student.departmentName || '—'}</td>
                    <td>{student.registrationDate || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    لا يوجد طلاب مسجلون في الوقت الحالي.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
