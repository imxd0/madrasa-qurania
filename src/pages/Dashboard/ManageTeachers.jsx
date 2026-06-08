import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { api } from '../../services/api';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api.getTeachers().then(setTeachers);
  }, []);

  return (
    <div className="manage-teachers animate-fade-in">
      <div className="dashboard-section-header">
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)' }}>
          إدارة الأساتذة والمشايخ
        </h2>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>قائمة الأساتذة والمشايخ</h3>
        </div>

        <div className="teachers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {teachers.map((teacher) => (
            <div key={teacher.id} className="card" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  backgroundColor: 'var(--color-green-light)', color: 'var(--color-green-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0
                }}>
                  {teacher.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-green-dark)' }}>{teacher.name}</h4>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{teacher.specialty}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award className="w-4 h-4" /> {teacher.experience} سنة خبرة
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                {teacher.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageTeachers;
