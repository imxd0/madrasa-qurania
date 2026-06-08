import { useState, useEffect, useMemo } from "react";
import {
  Search,
  User,
  Clock,
  Users,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  UserPlus,
  BookOpen,
  Trash2,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import "../styles/departments.css";

const Departments = () => {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedDeptDetail, setSelectedDeptDetail] = useState(null);
  const [showAddDeptForm, setShowAddDeptForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [error, setError] = useState("");

  const [newDeptData, setNewDeptData] = useState({
    name: "",
    teacher: "",
    schedule: "",
    description: "",
  });

  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const [newStudentData, setNewStudentData] = useState({
    fullName: "",
    age: "",
    academicLevel: "التعليم الابتدائي",
    phone: "",
    address: "",
  });

  const [newHistoryData, setNewHistoryData] = useState({
    date: new Date().toISOString().split("T")[0],
    portion: "",
    rating: "ممتاز",
    notes: "",
  });

  const loadAll = async () => {
    try {
      const [d, s] = await Promise.all([api.getDepartments(), api.getStudents()]);
      setDepartments(d);
      setStudents(s);
    } catch {
      setError("فشل تحميل الأقسام والطلاب");
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment(newDeptData);
      setNewDeptData({ name: "", teacher: "", schedule: "", description: "" });
      setShowAddDeptForm(false);
      setError("");
      loadAll();
    } catch {
      setError("فشل إنشاء القسم، تأكد من صلاحية المشرف");
    }
  };

  const handleDeleteDept = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("هل أنت متأكد من حذف هذا القسم؟ سيتم إلغاء انتساب الطلاب منه.")) return;
    try {
      await api.deleteDepartment(id);
      setSelectedDeptDetail(null);
      loadAll();
    } catch {
      setError("فشل حذف القسم");
    }
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((dep) => {
      const matchesSearch =
        dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dep.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [departments, searchTerm]);

  const currentDeptStudents = useMemo(() => {
    if (!selectedDeptDetail) return [];
    let filtered = students.filter((s) => s.departmentId === selectedDeptDetail.id);
    if (studentSearchTerm.trim()) {
      const term = studentSearchTerm.trim().toLowerCase();
      filtered = filtered.filter((s) => (s.fullName || '').toLowerCase().includes(term));
    }
    return filtered;
  }, [students, selectedDeptDetail, studentSearchTerm]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.createStudent({ ...newStudentData, departmentId: selectedDeptDetail.id });
      setNewStudentData({
        fullName: "",
        age: "",
        academicLevel: "التعليم الابتدائي",
        phone: "",
        address: "",
      });
      setShowAddStudentForm(false);
      setError("");
      loadAll();
    } catch {
      setError("فشل إضافة الطالب، تأكد من صلاحية المشرف");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب من هذا القسم؟")) return;
    try {
      await api.deleteStudent(id);
      loadAll();
    } catch {
      setError("فشل حذف الطالب");
    }
  };

  const handleTransferStudent = async (studentId, targetDeptId) => {
    if (!targetDeptId) return;
    const targetDept = departments.find((d) => d.id === targetDeptId);
    if (!targetDept) return;
    try {
      await api.updateStudent(studentId, { departmentId: targetDept.id, departmentName: targetDept.name });
      setExpandedStudentId(null);
      loadAll();
    } catch {
      setError("فشل تحويل الطالب");
    }
  };

  const handleAddHistoryRecord = async (studentId, e) => {
    e.preventDefault();
    if (!newHistoryData.portion) {
      alert("الرجاء كتابة السورة أو الآيات التي تم حفظها.");
      return;
    }
    try {
      const student = students.find((s) => s.id === studentId);
      const history = student?.history || [];
      await api.updateStudent(studentId, {
        history: [{ id: `h-${Date.now()}`, ...newHistoryData }, ...history],
      });
      setNewHistoryData({
        date: new Date().toISOString().split("T")[0],
        portion: "",
        rating: "ممتاز",
        notes: "",
      });
      loadAll();
    } catch {
      setError("فشل حفظ التسميع");
    }
  };

  const getRatingClass = (rating) => {
    if (rating === "ممتاز") return "excellent";
    if (rating === "جيد جداً") return "very-good";
    if (rating === "جيد") return "good";
    return "needs-review";
  };

  return (
    <div className="departments-page">
      <section className="page-header">
        <div className="container">
          <h1>حلقات وأقسام التحفيظ</h1>
          <p>
            تسيير الحلقات القرآنية، تسجيل الطلاب يدوياً، ومتابعة سجل الحفظ
            اليومي لكل طالب.
          </p>
        </div>
      </section>

      <section className="departments-section">
        <div className="container">
          {error && (
            <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '15px' }}>
              {error}
            </div>
          )}

          {!selectedDeptDetail ? (
            <div className="dept-list-view">
              <div className="section-actions-header">
                <div
                  className="section-title"
                  style={{ textAlign: "right", marginBottom: "0" }}
                >
                  <h2>حلقات التحفيظ المعتمدة</h2>
                  <p>ابحث عن الحلقة الدراسية أو قم بإدراج حلقة جديدة مباشرة.</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddDeptForm(!showAddDeptForm)}
                    className="btn btn-primary"
                    id="add-new-dept-btn"
                  >
                    <Plus className="w-5 h-5 ml-2" /> إضافة حلقة / قسم جديد
                  </button>
                )}
              </div>

              {isAdmin && showAddDeptForm && (
                <div className="card admin-add-dept-card">
                  <h3
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                      paddingBottom: "12px",
                      marginBottom: "15px",
                    }}
                  >
                    إنشاء حلقة دراسية جديدة
                  </h3>
                  <form
                    onSubmit={handleAddDept}
                    className="admin-dept-form"
                    id="create-dept-form"
                  >
                    <div className="admin-input-group">
                      <label>
                        اسم الحلقة / القسم <span>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: حلقة الإتقان (للصغار)"
                        value={newDeptData.name}
                        onChange={(e) =>
                          setNewDeptData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="admin-input-group">
                      <label>
                        اسم الشيخ أو الأستاذ المشرف <span>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: الشيخ أحمد الفاضلي"
                        value={newDeptData.teacher}
                        onChange={(e) =>
                          setNewDeptData((prev) => ({ ...prev, teacher: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="admin-input-group form-group-full">
                      <label>
                        أوقات الدراسة الأسبوعية <span>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: السبت والإثنين والأربعاء (16:30 - 18:30)"
                        value={newDeptData.schedule}
                        onChange={(e) =>
                          setNewDeptData((prev) => ({ ...prev, schedule: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="admin-input-group form-group-full">
                      <label>وصف مختصر للقسم ومقررات الحفظ</label>
                      <textarea
                        placeholder="صف أهداف الحلقة التعليمية والمناهج المتبعة فيها..."
                        value={newDeptData.description}
                        onChange={(e) =>
                          setNewDeptData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows="3"
                      ></textarea>
                    </div>
                    <div className="dept-form-actions">
                      <button type="submit" className="btn btn-primary" id="save-dept-btn">
                        حفظ وإنشاء القسم
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddDeptForm(false)}
                        className="btn btn-secondary"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="search-filter-container">
                <div className="search-input-wrapper">
                  <Search className="w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ابحث عن قسم , استاد ....."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    id="search-input"
                  />
                </div>
              </div>

              {filteredDepartments.length > 0 ? (
                <div className="departments-grid">
                  {filteredDepartments.map((dep) => {
                    const currentCount = students.filter(
                      (s) => s.departmentId === dep.id,
                    ).length;

                    return (
                      <div
                        key={dep.id}
                        className="card dep-card animate-fade-in"
                        onClick={() => {
                          setSelectedDeptDetail(dep);
                          setStudentSearchTerm("");
                        }}
                        id={`dep-card-${dep.id}`}
                      >
                        <div className="dep-card-header">
                          <img
                            src="/Screenshot%202026-06-06%20125705.png"
                            alt={dep.name}
                            className="dep-card-img"
                          />
                        </div>

                        <div className="dep-card-body">
                          <h3 className="dep-title">{dep.name}</h3>
                          <p className="dep-desc">{dep.description}</p>

                          <div className="dep-meta-list">
                            <div className="dep-meta-item">
                              <User className="w-4 h-4" />
                              <span>المشرف: {dep.teacher}</span>
                            </div>
                            <div className="dep-meta-item">
                              <Clock className="w-4 h-4" />
                              <span>المواعيد: {dep.schedule}</span>
                            </div>
                          </div>

                          <div className="dep-capacity">
                            <div className="dep-capacity-text">
                              <span>عدد الطلاب المنتسبين: {currentCount} طالب</span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "auto",
                            }}
                          >
                            <button
                              className="btn btn-primary"
                              style={{ flexGrow: "1" }}
                            >
                              عرض تسيير الطلاب والسجل
                            </button>
                            {isAdmin && (
                              <button
                                onClick={(e) => handleDeleteDept(dep.id, e)}
                                className="btn btn-icon"
                                style={{
                                  backgroundColor: "#fff3cd",
                                  color: "#7a4b00",
                                  borderColor: "#ffe69c",
                                  fontSize: "1.15rem",
                                }}
                                title="حذف هذه الحلقة"
                                id={`delete-dep-btn-${dep.id}`}
                              >
                                <span aria-hidden="true">🗑️</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-results animate-fade-in">
                  <AlertCircle className="w-16 h-16" />
                  <h3>لا يوجد حلقات متوافقة مع شروط البحث!</h3>
                  <p>يرجى التعديل على كلمة البحث أو الفلاتر.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="dept-details-view">
              <div className="dept-details-header animate-fade-in">
                <div className="dept-header-top">
                  <div className="dept-header-title">
                    <h2>{selectedDeptDetail.name}</h2>
                    <p style={{ color: "var(--text-muted)" }}>
                      {selectedDeptDetail.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDeptDetail(null);
                      setExpandedStudentId(null);
                      setStudentSearchTerm("");
                    }}
                    className="btn btn-secondary"
                    id="back-to-depts-btn"
                  >
                    العودة لقائمة الحلقات
                  </button>
                </div>

                <div className="dept-header-meta">
                  <div className="dept-meta-box">
                    <User className="w-5 h-5" />
                    <div>
                      <h5>الأستاذ المشرف</h5>
                      <p>{selectedDeptDetail.teacher}</p>
                    </div>
                  </div>

                  <div className="dept-meta-box">
                    <Clock className="w-5 h-5" />
                    <div>
                      <h5>مواعيد الحلقة</h5>
                      <p>{selectedDeptDetail.schedule}</p>
                    </div>
                  </div>

                  <div className="dept-meta-box">
                    <Users className="w-5 h-5" />
                    <div>
                      <h5>إحصائية التسجيل</h5>
                      <p>{currentDeptStudents.length} طالب منتسب</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="students-panel animate-fade-in">
                <div
                  className="dashboard-section-header"
                  style={{ marginBottom: "15px" }}
                >
                  <h3>
                    قائمة المنتسبين للحلقة ({currentDeptStudents.length} طلاب)
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                      className="btn btn-primary"
                      id="toggle-enroll-student-btn"
                    >
                      {showAddStudentForm
                        ? "إغلاق الاستمارة"
                        : "تسجيل طالب جديد يدوياً"}
                    </button>
                  )}
                </div>

                {/* بحث عن طالب داخل القسم */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search className="w-5 h-5" style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="ابحث عن طالب بالاسم..."
                      className="search-input"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                  </div>
                </div>

                {isAdmin && showAddStudentForm && (
                  <form
                    onSubmit={handleAddStudent}
                    className="add-history-form"
                    style={{ marginBottom: "30px" }}
                    id="manual-student-enrollment-form"
                  >
                    <h5
                      style={{
                        fontSize: "1rem",
                        color: "var(--color-green-primary)",
                      }}
                    >
                      <UserPlus className="w-5 h-5 inline-block" /> تسجيل وإدراج
                      طالب جديد في هذه الحلقة
                    </h5>
                    <div
                      className="add-history-form-grid"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        margin: "15px 0",
                      }}
                    >
                      <div className="admin-input-group">
                        <label>الاسم الكامل للطالب <span>*</span></label>
                        <input
                          type="text"
                          placeholder="الاسم و اللقب"
                          value={newStudentData.fullName}
                          onChange={(e) =>
                            setNewStudentData((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>العمر <span>*</span></label>
                        <input
                          type="number"
                          placeholder="مثال: 12"
                          value={newStudentData.age}
                          onChange={(e) =>
                            setNewStudentData((prev) => ({ ...prev, age: e.target.value }))
                          }
                          min="4"
                          max="90"
                          required
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>رقم الهاتف للتواصل <span>*</span></label>
                        <input
                          type="tel"
                          placeholder="05XXXXXXXX"
                          value={newStudentData.phone}
                          onChange={(e) =>
                            setNewStudentData((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="admin-input-group">
                        <label>المستوى الدراسي الأكاديمي <span>*</span></label>
                        <select
                          value={newStudentData.academicLevel}
                          onChange={(e) =>
                            setNewStudentData((prev) => ({ ...prev, academicLevel: e.target.value }))
                          }
                          required
                        >
                          <option value="التعليم الابتدائي">الابتدائي</option>
                          <option value="التعليم المتوسط / الإعدادي">المتوسط</option>
                          <option value="التعليم الثانوي">الثانوي</option>
                          <option value="تعليم جامعي / ما بعد الثانوي">الجامعي</option>
                          <option value="غير ذلك / متفرغ">متفرغ</option>
                        </select>
                      </div>
                      <div className="admin-input-group form-group-full">
                        <label>عنوان السكن بالتفصيل <span>*</span></label>
                        <input
                          type="text"
                          placeholder="المدينة، اسم الحي، الشارع"
                          value={newStudentData.address}
                          onChange={(e) =>
                            setNewStudentData((prev) => ({ ...prev, address: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button type="submit" className="btn btn-primary" id="save-student-manual-btn">
                        إدراج الطالب
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddStudentForm(false)}
                        className="btn btn-secondary"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                )}

                <div className="students-list">
                  {currentDeptStudents.length > 0 ? (
                    currentDeptStudents.map((stud) => {
                      const isExpanded = expandedStudentId === stud.id;

                      return (
                        <div
                          key={stud.id}
                          className="student-row-card animate-fade-in"
                          id={`student-row-${stud.id}`}
                        >
                          <div
                            className="student-main-info"
                            id={`student-info-click-${stud.id}`}
                          >
                            <div className="student-identity">
                              <div className="student-avatar">
                                {stud.fullName?.charAt(0) || '?'}
                              </div>
                              <div className="student-name-details">
                                <h4>{stud.fullName}</h4>
                                <span>
                                  العمر: {stud.age} سنة | المستوى:{" "}
                                  {stud.academicLevel}
                                </span>
                              </div>
                            </div>

                            <div className="student-contact-meta">
                              <span>
                                <Clock className="w-4 h-4" /> انتساب:{" "}
                                {stud.registrationDate}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                              }}
                            >
                              <button
                                className="expand-history-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedStudentId(isExpanded ? null : stud.id);
                                }}
                              >
                                <span>سجل التسميع (Historique)</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>

                              {isAdmin && (
                                <label
                                  className="transfer-student-control"
                                >
                                  <ArrowLeftRight className="w-4 h-4" />
                                  <select
                                    value=""
                                    onChange={(e) =>
                                      handleTransferStudent(stud.id, e.target.value)
                                    }
                                    title="تحويل الطالب إلى قسم آخر مع الحفاظ على معلوماته"
                                    id={`transfer-student-select-${stud.id}`}
                                  >
                                    <option value="">تحويل لقسم</option>
                                    {departments
                                      .filter((department) => department.id !== stud.departmentId)
                                      .map((department) => (
                                        <option key={department.id} value={department.id}>
                                          {department.name}
                                        </option>
                                      ))}
                                  </select>
                                </label>
                              )}

                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    handleDeleteStudent(stud.id);
                                  }}
                                  className="action-btn action-btn-delete"
                                  style={{ margin: "0", padding: "6px" }}
                                  title="حذف الطالب من الحلقة"
                                  id={`delete-student-row-btn-${stud.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div
                              className="student-history-section animate-fade-in"
                              id={`student-history-box-${stud.id}`}
                            >
                              <h4 className="student-history-header">
                                سجل الحفظ والمتابعة اليومي للطالب
                              </h4>

                              <div
                                className="admin-table-wrapper"
                                style={{ marginBottom: "20px" }}
                              >
                                <table
                                  className="history-table"
                                  id={`student-history-table-${stud.id}`}
                                >
                                  <thead>
                                    <tr>
                                      <th>التاريخ</th>
                                      <th>السورة أو الجزء المحفوظ</th>
                                      <th>التقييم</th>
                                      <th>ملاحظات المعلم والتوصيات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stud.history && stud.history.length > 0 ? (
                                      stud.history.map((record) => (
                                        <tr key={record.id}>
                                          <td style={{ whiteSpace: "nowrap" }}>
                                            {record.date}
                                          </td>
                                          <td>
                                            <strong>{record.portion}</strong>
                                          </td>
                                          <td>
                                            <span
                                              className={`badge-rating ${getRatingClass(record.rating)}`}
                                            >
                                              {record.rating}
                                            </span>
                                          </td>
                                          <td>
                                            {record.notes || (
                                              <em style={{ color: "var(--text-muted)" }}>
                                                لا يوجد ملاحظات
                                              </em>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan="4"
                                          style={{
                                            textAlign: "center",
                                            padding: "15px",
                                            color: "var(--text-muted)",
                                          }}
                                        >
                                          لا يوجد سجلات تسميع مسجلة لهذا الطالب
                                          حتى الآن.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {isAdmin && (
                                <form
                                  onSubmit={(e) =>
                                    handleAddHistoryRecord(stud.id, e)
                                  }
                                  className="add-history-form"
                                  id={`add-memorization-log-form-${stud.id}`}
                                >
                                  <h5>
                                    <BookOpen className="w-4 h-4" /> تسجيل عملية
                                    حفظ أو تسميع جديدة
                                  </h5>
                                  <div className="add-history-form-grid">
                                    <div className="admin-input-group">
                                      <label>تاريخ التسميع</label>
                                      <input
                                        type="date"
                                        value={newHistoryData.date}
                                        onChange={(e) =>
                                          setNewHistoryData((prev) => ({ ...prev, date: e.target.value }))
                                        }
                                        required
                                      />
                                    </div>
                                    <div
                                      className="admin-input-group"
                                      style={{ gridColumn: "span 2" }}
                                    >
                                      <label>السورة أو الجزء المحفوظ <span>*</span></label>
                                      <input
                                        type="text"
                                        placeholder="مثال: سورة الواقعة من 1 إلى 30"
                                        value={newHistoryData.portion}
                                        onChange={(e) =>
                                          setNewHistoryData((prev) => ({ ...prev, portion: e.target.value }))
                                        }
                                        required
                                      />
                                    </div>
                                    <div className="admin-input-group">
                                      <label>تقييم الأداء والحفظ</label>
                                      <select
                                        value={newHistoryData.rating}
                                        onChange={(e) =>
                                          setNewHistoryData((prev) => ({ ...prev, rating: e.target.value }))
                                        }
                                        required
                                      >
                                        <option value="ممتاز">ممتاز</option>
                                        <option value="جيد جداً">جيد جداً</option>
                                        <option value="جيد">جيد</option>
                                        <option value="بحاجة لمراجعة">بحاجة لمراجعة</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div
                                    className="admin-input-group"
                                    style={{ marginTop: "12px" }}
                                  >
                                    <label>ملاحظات المعلم / التوجيهات</label>
                                    <input
                                      type="text"
                                      placeholder="اكتب ملاحظة أو توجيه للطالب لمساعدته في تثبيت حفظه..."
                                      value={newHistoryData.notes}
                                      onChange={(e) =>
                                        setNewHistoryData((prev) => ({ ...prev, notes: e.target.value }))
                                      }
                                    />
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      marginTop: "15px",
                                    }}
                                  >
                                    <button
                                      type="submit"
                                      className="btn btn-primary btn-sm"
                                      id={`save-history-log-btn-${stud.id}`}
                                    >
                                      حفظ وتدوين في السجل
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                      <h4>لا يوجد أي طلاب منضمين لهذه الحلقة حالياً.</h4>
                      <p>
                        قم بتسجيل طالب جديد وتسكينه في الحلقة باستخدام الزر
                        أعلاه.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Departments;
