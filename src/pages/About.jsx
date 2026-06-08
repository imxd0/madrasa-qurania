import React from "react";
import { Target, Compass, Heart, Award } from "lucide-react";
import "../styles/about.css";

const About = () => {
  const values = [
    {
      title: "الإخلاص والتقوى",
      desc: "نغرس في نفوس طلابنا إخلاص العمل لله تعالى واستشعار عظمة كلامه في كل آية.",
    },
    {
      title: "الإتقان والجودة",
      desc: "الالتزام بأعلى معايير جودة الحفظ ومخارج الحروف التجويد العلمي الدقيق.",
    },
    {
      title: "الرعاية التربوية",
      desc: "تقديم الرعاية والمتابعة الفردية لكل طالب لبناء شخصية إسلامية متوازنة.",
    },
    {
      title: "التميز والريادة",
      desc: "تطوير وسائل الحفظ والتعليم الإلكتروني لنكون نموذجاً يحتذى به محلياً وعالمياً.",
    },
  ];

  return (
    <div className="about-page">
      {/* رأس الصفحة */}
      <section className="page-header">
        <div className="container">
          <h1>من نحن</h1>
          <p>
            تعرّف على مسيرة المدرسة القرآنية ورؤيتها في تعليم كتاب الله
            وتنشئة أجيال الهدى والنور.
          </p>
        </div>
      </section>

      {/* مقدمة عن المدرسة */}
      <section className="about-intro-section">
        <div className="container about-grid">
          <div className="about-text">
            <h2>نبذة عن المدرسة</h2>
            <p>
              تأسست المدرسة القرآنية لتكون صرحاً علمياً قرآنياً متميزاً يهدف
              لتسهيل وتيسير حفظ كتاب الله تعالى وفهم معانيه لكافة الفئات
              العمرية.
            </p>
            <p>
              نحن نؤمن بأن حفظ القرآن ليس مجرد ترديد للكلمات، بل هو تربية
              إيمانية وسلوكية متكاملة تصنع من الطالب فرداً صالحاً متميزاً ينفع
              دينه ومجتمعه ووطنه.
            </p>
            <p>
              تضم المدرسة نخبة من أفضل المشايخ المتميزين في تلقين الصغار وتحفيظ
              الكبار.
            </p>
          </div>
          <div className="about-img-box">
            <img
              src="/1000005971.jpg"
              alt="صورة المدرسة القرآنية"
            />
          </div>
        </div>
      </section>

      {/* الرؤية والرسالة */}
      <section className="vision-mission-section">
        <div className="container">
          <div className="vmv-grid">
            <div className="card vmv-card">
              <div className="vmv-icon">
                <Compass className="w-8 h-8" />
              </div>
              <h3>رؤيتنا</h3>
              <p>
                أن نكون المدرسة الرائدة والأولى في تقديم تعليم قرآني متميز يجمع
                بين أصالة التلقي وحداثة وسائل التعليم والتحفيظ الرقمي.
              </p>
            </div>

            <div className="card vmv-card">
              <div className="vmv-icon">
                <Target className="w-8 h-8" />
              </div>
              <h3>رسالتنا</h3>
              <p>
                تحفيظ القرآن الكريم وتعليم أحكامه ونشر علومه وقيمه بأساليب
                تربوية محببة ومناهج علمية رصينة قادرة على إعداد جيل قرآني قيادي
                نافع.
              </p>
            </div>

            <div className="card vmv-card">
              <div className="vmv-icon">
                <Award className="w-8 h-8" />
              </div>
              <h3>أهداف المدرسة</h3>
              <p>
             بناء شراكات مجتمعية رائدة، وتخريج حفاظ لكتاب الله تعالى ،
                ونشر الوعي بالعلوم القرآنية، وتدريب معلمين مؤهلين لحمل الأمانة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* قيمنا الجوهرية */}
      <section className="values-section">
        <div className="container">
          <div className="section-title">
            <h2>قيمنا الجوهرية</h2>
            <p>
              المبادئ والقواعد التي تحكم مسيرتنا التعليمية والتربوية داخل
              المدرسة.
            </p>
          </div>
          <div className="values-grid">
            {values.map((v, idx) => (
              <div key={idx} className="value-box">
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
