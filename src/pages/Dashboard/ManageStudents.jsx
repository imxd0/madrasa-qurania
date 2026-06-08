import React, { useEffect, useState } from 'react';
import { Check, Trash2, UserPlus, X } from 'lucide-react';
import { api } from '../../services/api';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    academicLevel: '',
    phone: '',
    address: '',
    departmentId: '',
  });

  const loadData = async () => {
    const [studentsData, departmentsData] = await Promise.all([
      api.getStudents(),
      api.getDepartments(),
    ]);
    setStudents(studentsData);
    setDepartments(departmentsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    await api.deleteStudent(id);
    loadData();
  };

  const handleApprove = async (id) => {
    await api.updateStudent(id, { status: 'approved' });
    loadData();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.createStudent({ ...formData, status: 'approved' });
    setFormData({
      fullName: '',
      age: '',
      academicLevel: '',
      phone: '',
      address: '',
      departmentId: '',
    });
    setShowAddForm(false);
    loadData();
  };

  return (
    <div className="manage-students animate-fade-in">
      <div className="dashboard-section-header">
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-green-dark)', fontFamily: 'var(--font-arabic)' }}>
          إدارة شؤون الطلاب والمسجلين
        </h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary" id="toggle-add-student-form-btn">
          {showAddForm ? <><X className="w-5 h-5 ml-2" /> إغلاق</> : <><UserPlus className="w-5 h-5 ml-2" /> إضافة طالب يدوياً</>}
        </button>
      </div>

      {showAddForm && (
        <div className="dashboard-section animate-fade-in">
          <div className="dashboard-section-header">
            <h3>تسجيل وإدراج طالب جديد في الحلقات</h3>
          </div>
          <form onSubmit={handleSubmit} className="admin-form" id="admin-add-student-form">
            <div className="admin-form-group">
              <label>الاسم الكامل للطالب</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="admin-form-group">
              <label>العمر</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} required />
            </div>
            <div className="admin-form-group">
              <label>المستوى الدراسي</label>
              <input type="text" name="academicLevel" value={formData.academicLevel} onChange={handleChange} required />
            </div>
            <div className="admin-form-group">
              <label>رقم الهاتف</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="admin-form-group form-group-full">
              <label>عنوان السكن بالتفصيل</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="admin-form-group form-group-full">
              <label>تعيين للحلقة / القسم</label>
              <select name="departmentId" value={formData.departmentId} onChange={handleChange} required>
                <option value="">حدد الحلقة المناسبة للطالب...</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} بإشراف {department.teacher}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-full">
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} id="admin-save-student-btn">
                إضافة وحفظ في النظام
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>قائمة الطلاب المسجلين</h3>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" id="admin-students-table">
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>العمر</th>
                <th>رقم الهاتف</th>
                <th>الحلقة المسكن بها</th>
                <th>المستوى الدراسي</th>
                <th>حالة الطلب</th>
                <th>العمليات</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.fullName}</strong></td>
                    <td>{student.age} سنة</td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>{student.phone}</td>
                    <td>{student.departmentName}</td>
                    <td>{student.academicLevel}</td>
                    <td>
                      {student.status === 'pending' && <span style={{ color: 'var(--color-gold)', fontWeight: '700' }}>قيد الانتظار</span>}
                      {student.status === 'approved' && <span style={{ color: 'var(--color-green-primary)', fontWeight: '700' }}>مقبول</span>}
                      {student.status === 'rejected' && <span style={{ color: '#dc3545', fontWeight: '700' }}>مرفوض</span>}
                    </td>
                    <td>
                      {student.status === 'pending' && (
                        <button onClick={() => handleApprove(student.id)} className="action-btn action-btn-approve">
                          <Check className="w-4 h-4" /> موافقة
                        </button>
                      )}
                      <button onClick={() => handleDelete(student.id)} className="action-btn action-btn-delete">
                        <Trash2 className="w-4 h-4" /> حذف
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    لا يوجد أي طلاب مسجلين في الوقت الحالي.
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

export default ManageStudents;
