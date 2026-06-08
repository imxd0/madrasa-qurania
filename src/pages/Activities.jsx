import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, X, Image as ImageIcon } from 'lucide-react';
import '../styles/activities.css';
import '../styles/departments.css';
import { api } from '../services/api';

const TYPE_LABELS = {
  competition: 'مسابقة',
  activity: 'نشاط',
  event: 'إعلان',
  trip: 'رحلة',
  مسابقة: 'مسابقة',
  نشاط: 'نشاط',
  إعلان: 'إعلان',
  رحلة: 'رحلة',
};

const TYPE_TABS = [
  { value: 'all', label: 'الكل' },
  { value: 'competition', label: 'مسابقات' },
  { value: 'activity', label: 'نشاطات' },
  { value: 'event', label: 'إعلانات' },
];

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [error, setError] = useState('');

  const loadActivities = useCallback(async () => {
    try {
      const data = await api.getActivities();
      const normalized = (data || []).map((act) => {
        if (act.image && (!act.images || act.images.length === 0)) {
          return { ...act, images: [act.image] };
        }
        return { ...act, images: act.images || [] };
      });
      setActivities(normalized);
    } catch {
      setError('فشل تحميل الأنشطة');
    }
  }, []);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  useEffect(() => {
    const onFocus = () => loadActivities();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadActivities]);

  const filteredActivities = activities.filter((act) =>
    activeTab === 'all' ? true : act.type === activeTab
  );

  const openDetailsModal = (act) => {
    setSelectedActivity(act);
    setActiveImage(act.images && act.images.length > 0 ? act.images[0] : null);
  };

  const closeDetailsModal = () => {
    setSelectedActivity(null);
    setActiveImage(null);
  };

  return (
    <div className="activities-page">
      <section className="page-header">
        <div className="container">
          <h1>نشاطاتنا وفعالياتنا</h1>
          <p>شاهد الفعاليات الإيمانية، المسابقات القرآنية، والرحلات الترفيهية التي تقيمها المدرسة لطلابها.</p>
        </div>
      </section>

      {error && (
        <div className="container" style={{ padding: '12px 20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', margin: '15px auto' }}>
          {error}
        </div>
      )}

      <section className="activities-section">
        <div className="container">
          <div className="section-title">
            <h2>الأنشطة والفعاليات الحالية</h2>
            <p>برامج متكاملة تجمع بين العلم والتربية والترفيه الهادف.</p>
          </div>

          <div className="activity-tabs">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`activity-tab ${activeTab === tab.value ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
                id={`act-tab-${tab.value}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="events-grid">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="card event-card animate-fade-in"
                id={`activity-${act.id}`}
                onClick={() => openDetailsModal(act)}
                style={{ cursor: 'pointer' }}
              >
                <div className="event-card-img-box" style={{ position: 'relative' }}>
                  <img
                    src={act.images && act.images.length > 0 ? act.images[0] : 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=400'}
                    alt={act.title}
                    className="event-card-img"
                  />
                  {act.images && act.images.length > 1 && (
                    <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(15, 81, 50, 0.85)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      +{act.images.length - 1} صور إضافية
                    </span>
                  )}
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--color-green-primary)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {TYPE_LABELS[act.type] || act.type}
                  </span>
                </div>
                <div className="event-card-body">
                  <span className="event-card-date">
                    <Calendar className="w-4 h-4 inline-block ml-1" style={{ verticalAlign: 'text-bottom' }} />
                    {act.date}
                  </span>
                  <h3 className="event-card-title">{act.title}</h3>
                  <p className="event-card-desc" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{act.description}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.4 }} />
              <h3 style={{ marginBottom: '8px' }}>لا توجد أنشطة حالياً</h3>
              <p>سيتم عرض الأنشطة والفعاليات هنا فور نشرها.</p>
            </div>
          )}
        </div>
      </section>

      {selectedActivity && (
        <div
          className="lightbox-backdrop"
          onClick={closeDetailsModal}
          id="activity-details-modal"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
        >
          <div
            className="lightbox-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '700px',
              width: '92%',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              overflowY: 'auto',
              maxHeight: '90vh',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              position: 'relative',
            }}
          >
            <button
              onClick={closeDetailsModal}
              id="close-modal-btn"
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                zIndex: 10,
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="event-card-date" style={{ fontSize: '0.85rem' }}>
                  <Calendar className="w-4 h-4 inline-block ml-1" style={{ verticalAlign: 'text-bottom' }} />
                  {selectedActivity.date}
                </span>
                <span style={{ background: 'var(--color-green-primary)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {TYPE_LABELS[selectedActivity.type] || selectedActivity.type}
                </span>
              </div>
              <h2 style={{ color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)', fontSize: '1.5rem', marginBottom: '15px' }}>
                {selectedActivity.title}
              </h2>

              {selectedActivity.images && selectedActivity.images.length > 0 ? (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ height: '300px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src={activeImage || selectedActivity.images[0]}
                      alt={selectedActivity.title}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {selectedActivity.images.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0', marginTop: '8px' }}>
                      {selectedActivity.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          onClick={() => setActiveImage(img)}
                          style={{
                            width: '70px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: (activeImage === img || (!activeImage && idx === 0)) ? '2px solid var(--color-green-primary)' : '1px solid var(--border-color)',
                            opacity: (activeImage === img || (!activeImage && idx === 0)) ? 1 : 0.6,
                            transition: 'all 0.2s',
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '20px', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  <ImageIcon className="w-10 h-10 ml-2" /> لا توجد صور متوفرة لهذا النشاط
                </div>
              )}

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>تفاصيل النشاط:</h4>
                <p style={{ margin: 0, lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                  {selectedActivity.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '15px', textAlign: 'center' }}>
                <button onClick={closeDetailsModal} className="btn btn-secondary">إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;
