import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, Check } from 'lucide-react';
import { api } from '../services/api';
import '../styles/contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSent, setIsSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.createContactMessage(formData);

    setIsSent(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
      {/* رأس الصفحة */}
      <section className="page-header">
        <div className="container">
          <h1>اتصل بنا</h1>
          <p>يسعدنا تواصلكم واستقبال استفساراتكم واقتراحاتكم لتطوير العمل القرآني.</p>
        </div>
      </section>

      {/* محتوى الاتصال */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            
            {/* معلومات الاتصال */}
            <div className="contact-info-panel animate-fade-in">
              <h3 className="contact-panel-title">معلومات التواصل</h3>
              <p className="contact-panel-desc">
                يمكنكم زيارة المدرسة أو الاتصال بنا عبر قنوات التواصل المتاحة طيلة أيام الأسبوع عدا الجمعة.
              </p>

              <div className="contact-items-list">
                <div className="contact-item-box">
                  <div className="contact-item-icon">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="contact-item-details">
                    <h4>العنوان الجغرافي</h4>
                    <p>حي السلام، شارع القرآن، المدينة المنورة، المملكة العربية السعودية</p>
                  </div>
                </div>

                <div className="contact-item-box">
                  <div className="contact-item-icon">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="contact-item-details">
                    <h4>أرقام الهاتف والواتس</h4>
                    <p dir="ltr">+966 50 123 4567</p>
                    <p dir="ltr">+966 14 888 9999</p>
                  </div>
                </div>

                <div className="contact-item-box">
                  <div className="contact-item-icon">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="contact-item-details">
                    <h4>البريد الإلكتروني الرسمي</h4>
                    <p>info@tarmeezquran.edu.sa</p>
                    <p>support@tarmeezquran.edu.sa</p>
                  </div>
                </div>
              </div>

              <div className="contact-panel-socials">
                <h4>تابعنا على شبكات التواصل الاجتماعي</h4>
                <div className="socials-row">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="فيسبوك">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="تويتر">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="يوتيوب">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* نموذج إرسال الرسالة */}
            <div className="contact-form-panel card animate-fade-in">
              <h3>أرسل لنا رسالة</h3>
              <p className="contact-form-desc">سنقوم بالرد على رسالتكم عبر البريد الإلكتروني أو الهاتف في غضون 24 ساعة.</p>

              {isSent ? (
                <div className="register-success-card" style={{ padding: '20px 0' }} id="contact-success-msg">
                  <div className="success-icon-wrapper" style={{ width: '70px', height: '70px', marginBottom: '15px' }}>
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 style={{ color: 'var(--color-green-primary)', marginBottom: '10px' }}>تم إرسال رسالتك بنجاح!</h3>
                  <p style={{ fontSize: '0.95rem' }}>نشكرك على تواصلك، سيتواصل معك أحد مسؤولي العلاقات العامة قريباً.</p>
                  <button onClick={() => setIsSent(false)} className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: '0.9rem' }} id="contact-send-another-btn">إرسال رسالة أخرى</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form" id="contact-query-form">
                  <div className="form-group">
                    <label htmlFor="name">الاسم الكامل <span>*</span></label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="اكتب اسمك الثلاثي هنا"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-grid" style={{ gap: '20px' }}>
                    <div className="form-group">
                      <label htmlFor="email">البريد الإلكتروني <span>*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="example@mail.com"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">رقم الهاتف <span>*</span></label>
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
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">موضوع الرسالة <span>*</span></label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      placeholder="عنوان الرسالة الاستفسارية"
                      className="form-control"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">نص الرسالة <span>*</span></label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="اكتب تفاصيل استفسارك أو رسالتك بالتفصيل هنا..."
                      className="form-control"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} id="contact-submit-btn">
                    <Send className="w-5 h-5 ml-2" /> إرسال الرسالة
                  </button>
                </form>
              )}
            </div>

            {/* خريطة تفاعلية محاكاة */}
            <div className="map-iframe-container animate-fade-in">
              <div className="map-placeholder">
                <MapPin className="w-12 h-12 text-green-700" />
                <h3>موقع المدرسة الجغرافي</h3>
                <p>مجاورة المسجد النبوي الشريف، المدينة المنورة</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>[خريطة تفاعلية محاكاة بنجاح]</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
