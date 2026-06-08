import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, X, Edit3, Image as ImageIcon, Loader2, Eye, ArrowRight, Calendar } from 'lucide-react';
import { api } from '../../services/api';

const TYPE_LABELS = { competition: 'مسابقة', activity: 'نشاط', event: 'إعلان', trip: 'رحلة' };

const ManageActivities = () => {
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', date: '', type: 'activity', images: [] });
  const [editPendingFiles, setEditPendingFiles] = useState([]);
  const [editPreviewImages, setEditPreviewImages] = useState([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', type: 'activity' });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const loadActivities = async () => {
    try {
      const data = await api.getActivities();
      setActivities(data || []);
    } catch { setError('فشل تحميل الأنشطة'); }
  };

  useEffect(() => { loadActivities(); }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const MAX_SIZE = 8 * 1024 * 1024;
    const validFiles = [];
    const newPreviews = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) { setError(`الملف "${file.name}" أكبر من 8 ميجابايت`); continue; }
      if (!file.type.startsWith('image/')) { setError(`الملف "${file.name}" ليس صورة`); continue; }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }
    setPendingFiles((prev) => [...prev, ...validFiles]);
    setPreviewImages((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const MAX_SIZE = 8 * 1024 * 1024;
    const validFiles = [];
    const newPreviews = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) { setError(`الملف "${file.name}" أكبر من 8 ميجابايت`); continue; }
      if (!file.type.startsWith('image/')) { setError(`الملف "${file.name}" ليس صورة`); continue; }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }
    setEditPendingFiles((prev) => [...prev, ...validFiles]);
    setEditPreviewImages((prev) => [...prev, ...newPreviews]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const removeEditImage = (index) => {
    setEditPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setEditPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeEditExistingImage = (index) => {
    setEditData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.title.trim()) { setError('الرجاء إدخال عنوان النشاط'); return; }
    setIsSubmitting(true);
    try {
      let imageUrls = [];
      if (pendingFiles.length > 0) {
        const uploadResult = await api.uploadFiles(pendingFiles);
        imageUrls = uploadResult.files.map((f) => f.url);
      }
      await api.createActivity({ title: formData.title.trim(), description: formData.description.trim(), date: formData.date, type: formData.type, images: imageUrls });
      setFormData({ title: '', description: '', date: '', type: 'activity' });
      setPendingFiles([]);
      setPreviewImages([]);
      setShowAddForm(false);
      await loadActivities();
    } catch (err) { setError(`فشل إضافة النشاط: ${err?.message || err}`); }
    finally { setIsSubmitting(false); }
  };

  const startEdit = (a) => {
    setEditData({ title: a.title, description: a.description || '', date: a.date || '', type: a.type || 'activity', images: a.images || [] });
    setEditPendingFiles([]);
    setEditPreviewImages([]);
    setEditing(true);
    setError('');
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData({ title: '', description: '', date: '', type: 'activity', images: [] });
    setEditPendingFiles([]);
    setEditPreviewImages([]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!editData.title.trim()) { setError('الرجاء إدخال عنوان النشاط'); return; }
    setIsEditSubmitting(true);
    try {
      let allImages = [...(editData.images || [])];
      if (editPendingFiles.length > 0) {
        const uploadResult = await api.uploadFiles(editPendingFiles);
        allImages = [...allImages, ...uploadResult.files.map((f) => f.url)];
      }
      await api.updateActivity(selected.id, {
        title: editData.title.trim(),
        description: editData.description.trim(),
        date: editData.date,
        type: editData.type,
        images: allImages,
      });
      cancelEdit();
      await loadActivities();
      const updated = await api.getActivities();
      const fresh = updated.find((a) => a.id === selected.id);
      if (fresh) setSelected(fresh);
    } catch (err) {
      setError(`فشل تعديل النشاط: ${err?.message || err}`);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا النشاط؟')) return;
    try {
      await api.deleteActivity(id);
      setSelected(null);
      setEditing(false);
      await loadActivities();
    } catch { setError('فشل حذف النشاط'); }
  };

  const openDetail = (a) => {
    setSelected(a);
    setEditing(false);
    setEditPendingFiles([]);
    setEditPreviewImages([]);
    setError('');
  };

  const closeDetail = () => {
    setSelected(null);
    setEditing(false);
    setEditPendingFiles([]);
    setEditPreviewImages([]);
  };

  return (
    <div className="manage-activities animate-fade-in">
      <div className="dashboard-section-header">
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)' }}>
          إدارة الأنشطة والفعاليات
        </h2>
        <button onClick={() => { setShowAddForm(!showAddForm); closeDetail(); }} className="btn btn-primary">
          {showAddForm ? <><X className="w-5 h-5 ml-2" /> إغلاق</> : <><Plus className="w-5 h-5 ml-2" /> إضافة نشاط جديد</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {/* نموذج إضافة نشاط جديد */}
      {showAddForm && (
        <div className="dashboard-section animate-fade-in">
          <div className="dashboard-section-header"><h3>إضافة نشاط أو فعالية جديدة</h3></div>
          <form onSubmit={handleSubmit} className="admin-form" id="admin-add-activity-form">
            <div className="admin-form-group">
              <label>عنوان النشاط <span style={{ color: '#dc3545' }}>*</span></label>
              <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="مثال: مسابقة ورتل السنوية" required />
            </div>
            <div className="admin-form-group">
              <label>التصنيف <span style={{ color: '#dc3545' }}>*</span></label>
              <select value={formData.type} onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))} required>
                <option value="activity">نشاط</option>
                <option value="competition">مسابقة</option>
                <option value="event">إعلان</option>
                <option value="trip">رحلة</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>التاريخ <span style={{ color: '#dc3545' }}>*</span></label>
              <input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="admin-form-group form-group-full">
              <label>وصف النشاط <span style={{ color: '#dc3545' }}>*</span></label>
              <textarea rows={4} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="اكتب وصفاً مختصراً عن هذا النشاط..." required />
            </div>
            <div className="admin-form-group form-group-full">
              <label>صور النشاط (اختياري، حتى 8 ميجابايت لكل صورة)</label>
              <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isSubmitting}>
                <ImageIcon className="w-5 h-5" /> اختر صوراً
              </button>
              {previewImages.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {previewImages.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '120px', height: '90px' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      <button type="button" onClick={() => removeImage(i)} disabled={isSubmitting} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', background: '#dc3545', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} id="admin-save-activity-btn" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-5 h-5 ml-2" style={{ animation: 'spin 1s linear infinite' }} /> جاري الحفظ...</> : 'حفظ ونشر النشاط'}
            </button>
          </form>
        </div>
      )}

      {/* نافذة تفاصيل النشاط */}
      {selected && (
        <div className="dashboard-section animate-fade-in">
          <div className="dashboard-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={closeDetail} className="btn-icon" title="العودة للقائمة">
                <ArrowRight className="w-5 h-5" />
              </button>
              <h3>{editing ? 'تعديل النشاط' : 'تفاصيل النشاط'}</h3>
            </div>
            {!editing && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(selected)} className="action-btn action-btn-edit">
                  <Edit3 className="w-4 h-4" /> تعديل
                </button>
                <button onClick={() => handleDelete(selected.id)} className="action-btn action-btn-delete">
                  <Trash2 className="w-4 h-4" /> حذف
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', backgroundColor: 'var(--color-green-primary)', color: '#fff', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem' }}>
                  {TYPE_LABELS[selected.type] || selected.type}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar className="w-4 h-4" /> {selected.date}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)', marginBottom: '16px' }}>{selected.title}</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>{selected.description}</p>
              {selected.images && selected.images.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '700' }}>صور النشاط ({selected.images.length})</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selected.images.map((src, i) => (
                      <img key={i} src={src} alt="" style={{ width: '140px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="admin-form">
              <div className="admin-form-group">
                <label>عنوان النشاط <span style={{ color: '#dc3545' }}>*</span></label>
                <input type="text" value={editData.title} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="admin-form-group">
                <label>التصنيف <span style={{ color: '#dc3545' }}>*</span></label>
                <select value={editData.type} onChange={(e) => setEditData((p) => ({ ...p, type: e.target.value }))} required>
                  <option value="activity">نشاط</option>
                  <option value="competition">مسابقة</option>
                  <option value="event">إعلان</option>
                  <option value="trip">رحلة</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>التاريخ <span style={{ color: '#dc3545' }}>*</span></label>
                <input type="date" value={editData.date} onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="admin-form-group form-group-full">
                <label>وصف النشاط <span style={{ color: '#dc3545' }}>*</span></label>
                <textarea rows={4} value={editData.description} onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))} required />
              </div>
              <div className="admin-form-group form-group-full">
                <label>الصور الحالية ({editData.images?.length || 0})</label>
                {editData.images && editData.images.length > 0 ? (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                    {editData.images.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: '120px', height: '90px' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        <button type="button" onClick={() => removeEditExistingImage(i)} disabled={isEditSubmitting} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', background: '#dc3545', color: '#fff', border: 'none', cursor: isEditSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>&times;</button>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>لا توجد صور حالياً</p>}
              </div>
              <div className="admin-form-group form-group-full">
                <label>إضافة صور جديدة</label>
                <input type="file" ref={editFileInputRef} accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleEditImageSelect} style={{ display: 'none' }} />
                <button type="button" onClick={() => editFileInputRef.current?.click()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isEditSubmitting}>
                  <ImageIcon className="w-5 h-5" /> اختر صوراً
                </button>
                {editPreviewImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {editPreviewImages.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: '120px', height: '90px' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        <button type="button" onClick={() => removeEditImage(i)} disabled={isEditSubmitting} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', background: '#dc3545', color: '#fff', border: 'none', cursor: isEditSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isEditSubmitting}>
                  {isEditSubmitting ? <><Loader2 className="w-5 h-5 ml-2" style={{ animation: 'spin 1s linear infinite' }} /> جاري الحفظ...</> : 'حفظ التعديلات'}
                </button>
                <button type="button" onClick={cancelEdit} className="btn btn-secondary" disabled={isEditSubmitting}>إلغاء</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* قائمة الأنشطة */}
      {!selected && (
        <div className="dashboard-section">
          <div className="dashboard-section-header"><h3>الأنشطة والفعاليات ({activities.length})</h3></div>
          {activities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities.map((a) => (
                <div
                  key={a.id}
                  onClick={() => openDetail(a)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-green-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {a.images && a.images.length > 0 && (
                    <img src={a.images[0]} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ padding: '2px 8px', backgroundColor: 'var(--color-green-primary)', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>{a.date}</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>
                  </div>
                  <Eye className="w-5 h-5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              لا توجد أنشطة بعد
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageActivities;
