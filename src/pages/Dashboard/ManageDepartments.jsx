import { useEffect, useState } from 'react';
import { FolderPlus, Trash2, X, User, Clock, Users, AlertCircle, ChevronDown, ChevronUp, UserPlus, BookOpen, Search } from 'lucide-react';
import { api } from '../../services/api';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddDeptForm, setShowAddDeptForm] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const [newDept, setNewDept] = useState({ name: '', teacher: '', schedule: '', description: '' });
  const [newStudent, setNewStudent] = useState({ fullName: '', age: '', academicLevel: 'التعليم الابتدائي', phone: '', address: '' });
  const [newHistory, setNewHistory] = useState({
    date: new Date().toISOString().split('T')[0],
    portion: '',
    rating: 'ممتاز',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [d, s] = await Promise.all([api.getDepartments(), api.getStudents()]);
      setDepartments(d);
      setStudents(s);
    } catch { setError('فشل تحميل البيانات'); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment(newDept);
      setNewDept({ name: '', teacher: '', schedule: '', description: '' });
      setShowAddDeptForm(false);
      loadData();
    } catch { setError('فشل إنشاء القسم، تأكد من صلاحية المشرف'); }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الطلاب المنتسبين إليه أيضاً.')) return;
    try {
      await api.deleteDepartment(id);
      setSelectedDept(null);
      loadData();
    } catch { setError('فشل حذف القسم'); }
  };

  const handlePhoneLookup = (phone) => {
    setNewStudent((p) => ({ ...p, phone }));
    if (phone.trim().length >= 5) {
      const existing = students.find((s) => s.phone && s.phone.trim() === phone.trim());
      if (existing) {
        setNewStudent((p) => ({
          ...p,
          phone,
          fullName: existing.fullName || p.fullName,
          age: existing.age || p.age,
          academicLevel: existing.academicLevel || p.academicLevel,
          address: existing.address || p.address,
        }));
      }
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const body = { ...newStudent, departmentId: selectedDept.id, departmentName: selectedDept.name };
      await api.createStudent(body);
      setNewStudent({ fullName: '', age: '', academicLevel: 'التعليم الابتدائي', phone: '', address: '' });
      setShowAddStudentForm(false);
      loadData();
    } catch { setError('فشل إضافة الطالب'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await api.deleteStudent(id);
      loadData();
    } catch { setError('فشل حذف الطالب'); }
  };

  const handleTransferStudent = async (studentId, targetDeptId) => {
    if (!targetDeptId) return;
    try {
      await api.updateStudent(studentId, { departmentId: targetDeptId });
      setExpandedStudentId(null);
      loadData();
    } catch { setError('فشل تحويل الطالب'); }
  };

  const handleAddHistory = async (studentId, e) => {
    e.preventDefault();
    if (!newHistory.portion) { alert('الرجاء كتابة السورة أو الآيات'); return; }
    try {
      const student = students.find((s) => s.id === studentId);
      const history = student?.history || [];
      await api.updateStudent(studentId, { history: [{ id: `h-${Date.now()}`, ...newHistory }, ...history] });
      setNewHistory({
        date: new Date().toISOString().split('T')[0],
        portion: '',
        rating: 'ممتاز',
        notes: '',
      });
      loadData();
    } catch { setError('فشل حفظ التسميع'); }
  };

  const getRatingClass = (rating) => {
    if (rating === 'ممتاز') return 'excellent';
    if (rating === 'جيد جداً') return 'very-good';
    if (rating === 'جيد') return 'good';
    return 'needs-review';
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deptStudents = selectedDept
    ? students.filter((s) => s.departmentId === selectedDept.id)
    : [];

  if (selectedDept) {
    return (
      <div className="manage-departments animate-fade-in">
        <div className="dashboard-section-header">
          <button onClick={() => { setSelectedDept(null); setExpandedStudentId(null); }} className="btn btn-secondary">
            العودة لقائمة الأقسام
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

        <div className="card" style={{ padding: '25px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ color: 'var(--color-green-dark)', marginBottom: '10px' }}>{selectedDept.name}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', maxWidth: '600px' }}>{selectedDept.description}</p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User className="w-4 h-4" /> المشرف: {selectedDept.teacher}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock className="w-4 h-4" /> المواعيد: {selectedDept.schedule}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users className="w-4 h-4" /> الطلاب: {deptStudents.length}</span>
              </div>
            </div>
            <button onClick={() => handleDeleteDept(selectedDept.id)} className="action-btn action-btn-delete">
              <Trash2 className="w-4 h-4" /> حذف القسم
            </button>
          </div>
        </div>

        <div className="dashboard-section-header" style={{ marginBottom: '15px' }}>
          <h3>الطلاب المنتسبين ({deptStudents.length})</h3>
          <button onClick={() => setShowAddStudentForm(!showAddStudentForm)} className="btn btn-primary">
            {showAddStudentForm ? 'إغلاق' : <><UserPlus className="w-5 h-5 ml-2" /> إضافة طالب</>}
          </button>
        </div>

        {showAddStudentForm && (
          <form onSubmit={handleAddStudent} className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h5 style={{ color: 'var(--color-green-primary)', marginBottom: '15px' }}>تسجيل طالب جديد</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div className="admin-input-group">
                <label>الاسم الكامل <span>*</span></label>
                <input type="text" value={newStudent.fullName} onChange={(e) => setNewStudent((p) => ({ ...p, fullName: e.target.value }))} required />
              </div>
              <div className="admin-input-group">
                <label>العمر <span>*</span></label>
                <input type="number" value={newStudent.age} onChange={(e) => setNewStudent((p) => ({ ...p, age: e.target.value }))} min="4" max="90" required />
              </div>
              <div className="admin-input-group">
                <label>رقم الهاتف <span>*</span></label>
                <input type="tel" value={newStudent.phone} onChange={(e) => handlePhoneLookup(e.target.value)} required />
              </div>
              <div className="admin-input-group">
                <label>المستوى الدراسي <span>*</span></label>
                <select value={newStudent.academicLevel} onChange={(e) => setNewStudent((p) => ({ ...p, academicLevel: e.target.value }))} required>
                  <option value="التعليم الابتدائي">الابتدائي</option>
                  <option value="التعليم المتوسط / الإعدادي">المتوسط</option>
                  <option value="التعليم الثانوي">الثانوي</option>
                  <option value="تعليم جامعي / ما بعد الثانوي">الجامعي</option>
                  <option value="غير ذلك / متفرغ">متفرغ</option>
                </select>
              </div>
              <div className="admin-input-group" style={{ gridColumn: 'span 2' }}>
                <label>العنوان <span>*</span></label>
                <input type="text" value={newStudent.address} onChange={(e) => setNewStudent((p) => ({ ...p, address: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="submit" className="btn btn-primary">إدراج الطالب</button>
              <button type="button" onClick={() => setShowAddStudentForm(false)} className="btn btn-secondary">إلغاء</button>
            </div>
          </form>
        )}

        <div className="students-list">
          {deptStudents.length > 0 ? deptStudents.map((stud) => {
            const isExpanded = expandedStudentId === stud.id;
            return (
              <div key={stud.id} className="student-row-card animate-fade-in">
                <div className="student-main-info">
                  <div className="student-identity">
                    <div className="student-avatar">{stud.fullName?.charAt(0) || '?'}</div>
                    <div className="student-name-details">
                      <h4>{stud.fullName}</h4>
                      <span>العمر: {stud.age} سنة | المستوى: {stud.academicLevel} | الهاتف: {stud.phone || '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="expand-history-btn" onClick={(e) => { e.stopPropagation(); setExpandedStudentId(isExpanded ? null : stud.id); }}>
                      <span>سجل التسميع</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <select
                      value=""
                      onChange={(e) => handleTransferStudent(stud.id, e.target.value)}
                      title="تحويل الطالب إلى قسم آخر"
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                    >
                      <option value="">تحويل لقسم</option>
                      {departments.filter((d) => d.id !== stud.departmentId).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(stud.id); }} className="action-btn action-btn-delete" style={{ margin: 0, padding: '6px' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="student-history-section animate-fade-in">
                    <h4 className="student-history-header">سجل الحفظ والمتابعة</h4>
                    <div className="admin-table-wrapper" style={{ marginBottom: '20px' }}>
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>التاريخ</th>
                            <th>السورة أو الجزء</th>
                            <th>التقييم</th>
                            <th>ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stud.history && stud.history.length > 0 ? stud.history.map((rec) => (
                            <tr key={rec.id}>
                              <td style={{ whiteSpace: 'nowrap' }}>{rec.date}</td>
                              <td><strong>{rec.portion}</strong></td>
                              <td><span className={`badge-rating ${getRatingClass(rec.rating)}`}>{rec.rating}</span></td>
                              <td>{rec.notes || <em style={{ color: 'var(--text-muted)' }}>لا يوجد</em>}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-muted)' }}>لا يوجد سجلات تسميع</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <form onSubmit={(e) => handleAddHistory(stud.id, e)} className="add-history-form">
                      <h5><BookOpen className="w-4 h-4" /> تسجيل حفظ أو تسميع جديد</h5>
                      <div className="add-history-form-grid">
                        <div className="admin-input-group">
                          <label>تاريخ التسميع</label>
                          <input type="date" value={newHistory.date} onChange={(e) => setNewHistory((p) => ({ ...p, date: e.target.value }))} required />
                        </div>
                        <div className="admin-input-group" style={{ gridColumn: 'span 2' }}>
                          <label>السورة أو الجزء <span>*</span></label>
                          <input type="text" placeholder="مثال: سورة الواقعة من 1 إلى 30" value={newHistory.portion} onChange={(e) => setNewHistory((p) => ({ ...p, portion: e.target.value }))} required />
                        </div>
                        <div className="admin-input-group">
                          <label>التقييم</label>
                          <select value={newHistory.rating} onChange={(e) => setNewHistory((p) => ({ ...p, rating: e.target.value }))} required>
                            <option value="ممتاز">ممتاز</option>
                            <option value="جيد جداً">جيد جداً</option>
                            <option value="جيد">جيد</option>
                            <option value="بحاجة لمراجعة">بحاجة لمراجعة</option>
                          </select>
                        </div>
                      </div>
                      <div className="admin-input-group" style={{ marginTop: '12px' }}>
                        <label>ملاحظات</label>
                        <input type="text" placeholder="ملاحظة أو توجيه للطالب..." value={newHistory.notes} onChange={(e) => setNewHistory((p) => ({ ...p, notes: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                        <button type="submit" className="btn btn-primary btn-sm">حفظ في السجل</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <h4>لا يوجد طلاب في هذا القسم</h4>
              <p>قم بإضافة طالب باستخدام الزر أعلاه</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="manage-departments animate-fade-in">
      <div className="dashboard-section-header">
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)' }}>
          إدارة الأقسام والحلقات القرآنية
        </h2>
        <button onClick={() => setShowAddDeptForm(!showAddDeptForm)} className="btn btn-primary">
          {showAddDeptForm ? <><X className="w-5 h-5 ml-2" /> إغلاق</> : <><FolderPlus className="w-5 h-5 ml-2" /> إضافة قسم جديد</>}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

      {showAddDeptForm && (
        <div className="dashboard-section animate-fade-in">
          <div className="dashboard-section-header"><h3>إنشاء حلقة / قسم تعليمي جديد</h3></div>
          <form onSubmit={handleAddDept} className="admin-form">
            <div className="admin-form-group">
              <label>اسم القسم / الحلقة <span>*</span></label>
              <input type="text" value={newDept.name} onChange={(e) => setNewDept((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="admin-form-group">
              <label>المعلم المشرف <span>*</span></label>
              <input type="text" value={newDept.teacher} onChange={(e) => setNewDept((p) => ({ ...p, teacher: e.target.value }))} required />
            </div>
            <div className="admin-form-group">
              <label>أوقات الدراسة <span>*</span></label>
              <input type="text" value={newDept.schedule} onChange={(e) => setNewDept((p) => ({ ...p, schedule: e.target.value }))} required />
            </div>
            <div className="admin-form-group form-group-full">
              <label>الوصف <span>*</span></label>
              <textarea value={newDept.description} onChange={(e) => setNewDept((p) => ({ ...p, description: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>إنشاء الحلقة</button>
          </form>
        </div>
      )}

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>الحلقات والأقسام</h3>
          <div className="search-input-wrapper" style={{ maxWidth: '300px' }}>
            <Search className="w-4 h-4" />
            <input type="text" placeholder="ابحث عن قسم..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" id="admin-departments-table">
            <thead>
              <tr>
                <th>اسم الحلقة / القسم</th>
                <th>المشرف</th>
                <th>عدد الطلاب</th>
                <th>الجدول</th>
                <th>العمليات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepts.length > 0 ? filteredDepts.map((d) => (
                <tr key={d.id} onClick={() => setSelectedDept(d)} style={{ cursor: 'pointer' }}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.teacher}</td>
                  <td>{d.studentsCount} طالب</td>
                  <td>{d.schedule}</td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDept(d.id); }} className="action-btn action-btn-delete">
                      <Trash2 className="w-4 h-4" /> حذف
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>لا توجد أقسام</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageDepartments;
