import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User, Calendar, GraduationCap, Phone, MapPin, Check, BookOpen, Home, ArrowLeft } from 'lucide-react';
import { departmentsData } from '../data/mockData';
import { api } from '../services/api';
import '../styles/register.css';

const Register = () => {
  const location = useLocation();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    academicLevel: '',
    phone: '',
    address: '',
    departmentId: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  // الكشف عن تحديد القسم المسبق عند الانتقال من صفحة الأقسام
  useEffect(() => {
    api.getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments(departmentsData));

    if (location.state && location.state.selectedDept) {
      setFormData((prev) => ({
        ...prev,
        departmentId: location.state.selectedDept
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // العثور على اسم القسم بناء على المعرف لتخزينه بالاسم أيضاً
    const department = departments.find(d => d.id === formData.departmentId);
    
    const newStudent = {
      id: 'stud-' + Date.now(),
      fullName: formData.fullName,
      age: parseInt(formData.age),
      academicLevel: formData.academicLevel,
      phone: formData.phone,
      address: formData.address,
      departmentId: formData.departmentId,
      departmentName: department ? department.name : 'عام / غير محدد',
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'pending' // pending, approved, rejected
    };

    // جلب الطلاب المسجلين سابقاً وتخزين الجديد في localStorage
    await api.createStudent(newStudent);

    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      age: '',
      academicLevel: '',
      phone: '',
      address: '',
      departmentId: ''
    });
    setIsSubmitted(false);
  };

  return (
    <div className="register-page">
      {/* رأس الصفحة */}
      <section className="page-header">
        <div className="container">
          <h1>التسجيل الإلكتروني</h1>
          <p>املأ استمارة التسجيل أدناه للانضمام إلى حلقات المدرسة القرآنية.</p>
        </div>
      </section>

      {/* استمارة التسجيل */}
      <section className="register-section">
        <div className="container register-container">
          
          {!isSubmitted ? (
            <div className="card register-form-card animate-fade-in">
              <h2>استمارة تسجيل طالب جديد</h2>
              <p className="register-subtitle">يرجى كتابة البيانات بشكل دقيق، وسيتم التواصل معكم فور مراجعة الطلب.</p>
              
              <form onSubmit={handleSubmit} className="contact-form" id="student-registration-form">
                <div className="form-grid">
                  
                  {/* الاسم الكامل */}
                  <div className="form-group">
                    <label htmlFor="fullName">
                      <User className="w-4 h-4 text-green-700" />
                      الاسم الكامل للطالب <span>*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      placeholder="الاسم الثلاثي أو الرباعي"
                      className="form-control"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* العمر */}
                  <div className="form-group">
                    <label htmlFor="age">
                      <Calendar className="w-4 h-4 text-green-700" />
                      العمر (بالسنوات) <span>*</span>
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      placeholder="مثال: 12"
                      className="form-control"
                      value={formData.age}
                      onChange={handleChange}
                      min="4"
                      max="100"
                      required
                    />
                  </div>

                  {/* المستوى الدراسي الأكاديمي */}
                  <div className="form-group">
                    <label htmlFor="academicLevel">
                      <GraduationCap className="w-4 h-4 text-green-700" />
                      المستوى الدراسي <span>*</span>
                    </label>
                    <select
                      id="academicLevel"
                      name="academicLevel"
                      className="form-control"
                      value={formData.academicLevel}
                      onChange={handleChange}
                      required
                    >
                      <option value="">اختر المستوى الدراسي...</option>
                      <option value="الروضة / ما قبل المدرسة">الروضة / ما قبل المدرسة</option>
                      <option value="التعليم الابتدائي">التعليم الابتدائي</option>
                      <option value="التعليم المتوسط / الإعدادي">التعليم المتوسط / الإعدادي</option>
                      <option value="التعليم الثانوي">التعليم الثانوي</option>
                      <option value="تعليم جامعي / ما بعد الثانوي">تعليم جامعي / ما بعد الثانوي</option>
                      <option value="غير ذلك / متفرغ">غير ذلك / متفرغ</option>
                    </select>
                  </div>

                  {/* رقم الهاتف */}
                  <div className="form-group">
                    <label htmlFor="phone">
                      <Phone className="w-4 h-4 text-green-700" />
                      رقم الهاتف (ولي الأمر أو الطالب) <span>*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="مثال: 0501234567"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* عنوان السكن */}
                  <div className="form-group full-width">
                    <label htmlFor="address">
                      <MapPin className="w-4 h-4 text-green-700" />
                      عنوان السكن بالتفصيل <span>*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      placeholder="الحي، اسم الشارع، رقم المنزل"
                      className="form-control"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* القسم المراد الالتحاق به */}
                  <div className="form-group full-width">
                    <label htmlFor="departmentId">
                      <BookOpen className="w-4 h-4 text-green-700" />
                      القسم التعليمي المطلوب <span>*</span>
                    </label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      className="form-control"
                      value={formData.departmentId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">اختر القسم المطلوب...</option>
                      {departments.map(dep => (
                        <option key={dep.id} value={dep.id}>
                          {dep.name} - بإشراف {dep.teacher}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <button type="submit" className="btn btn-primary register-submit-btn" id="register-submit-btn">
                  إرسال طلب التسجيل
                </button>
              </form>
            </div>
          ) : (
            <div className="card register-success-card">
              <div className="success-icon-wrapper">
                <Check className="w-12 h-12" />
              </div>
              <h2>تم تسجيل طلبك بنجاح!</h2>
              <p>
                شكراً لثقتكم بالمدرسة القرآنية. لقد استلمنا طلب تسجيل الطالب <strong>{formData.fullName}</strong> بنجاح.
                <br />
                يقوم الفريق الإداري بمراجعة الطلب لتسكينه في الحلقة المناسبة، وسنقوم بالتواصل معكم عبر رقم الهاتف <strong>{formData.phone}</strong> في أقرب وقت لتأكيد المواعيد وبدء الدراسة.
              </p>
              <div className="success-actions">
                <Link to="/" className="btn btn-primary" id="success-home-btn">
                  <Home className="w-5 h-5 ml-2" /> العودة للرئيسية
                </Link>
                <button onClick={handleReset} className="btn btn-secondary" id="success-register-another-btn">
                  تسجيل طالب آخر <ArrowLeft className="w-5 h-5 mr-2" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default Register;
