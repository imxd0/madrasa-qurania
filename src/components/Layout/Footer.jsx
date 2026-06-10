import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, BookOpen } from 'lucide-react';
import '../../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-info">
          <div className="footer-logo">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <span>المدرسة القرآنية</span>
          </div>
          <p>
      مدرسة قرآنية متكاملة تهدف إلى ربط قلوب وعقول الأجيال بالقرآن الكريم تلاوة وحفظاً وفهماً وسلوكاً، وفق مناهج علمية متطورة و بإشراف كوكبة من المشايخ .
          </p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="فيسبوك">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="تويتر">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="يوتيوب">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>روابط سريعة</h3>
          <ul className="footer-links">
            <li><Link to="/">لوحة التحكم</Link></li>
            <li><Link to="/site/about">من نحن</Link></li>
            <li><Link to="/site/departments">الأقسام والحلقات</Link></li>
            <li><Link to="/site/schedule">أوقات الدراسة</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>معلومات الاتصال</h3>
          <div className="footer-contact-info">
            <div className="footer-contact-item">
              <MapPin className="w-5 h-5" />
              <span>حي بن شوبان الرويبة - مسجد الإتحاد</span>
            </div>
            <div className="footer-contact-item">
              <Phone className="w-5 h-5" />
              <span dir="ltr">+213 000 000 000</span>
            </div>
            <div className="footer-contact-item">
              <Mail className="w-5 h-5" />
              <span>example@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} المدرسة القرآنية. جميع الحقوق محفوظة.</p>
        <p>تصميم وتطوير بكل فخر بمناسبة عام العلم والتقى</p>
      </div>
    </footer>
  );
};

export default Footer;
