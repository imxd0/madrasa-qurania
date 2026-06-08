// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Award,
  Heart,
  Users,
  GraduationCap,
  Megaphone,
  CalendarCheck,
} from "lucide-react";
import { academyGoals } from "../data/mockData";
import { teachersData } from "../data/mockData";
import { api } from "../services/api";
import "../styles/home.css";

const Home = () => {
  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getStudents(),
      api.getDepartments(),
      api.getActivities(),
      api.getAnnouncements(),
    ])
      .then(([students, departments, activities, anns]) => {
        setStudentsCount(students.length);
        setTeachersCount(teachersData.length);
        setDepartmentsCount(departments.length);
        setActivitiesCount(activities.length);
        setAnnouncements((anns || []).slice(0, 3));
      })
      .catch(() => {
        setStudentsCount(0);
        setTeachersCount(teachersData.length);
        setDepartmentsCount(0);
        setActivitiesCount(0);
        setAnnouncements([]);
      });
  }, []);

  return (
    <div className="home-page">
      {/* قسم الترحيب */}
      <section className="hero">
        <div
          className="hero-bg-img"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(15,81,50,0.82) 0%, rgba(15,81,50,0.60) 60%, rgba(0,0,0,0.70) 100()), url('https://images.unsplash.com/photo-1519222970733-f546218fa6d4?auto=format&fit=crop&q=80&w=1600')`,
          }}
        />
        <div className="container hero-content">
          <p className="hero-subtitle">مرحباً بكم في </p>
          <h1 className="hero-title">المدرسة القرآنية لمسجد الإتحاد</h1>
          <p className="hero-description">
            صرحٌ علميٌّ لتحفيظ كتاب الله وتعليم أحكام التجويد على يد مشايخ .
          </p>
          <div className="hero-buttons">
            <Link
              to="/departments"
              className="btn btn-gold"
              id="hero-departments-btn"
            >
              استكشف حلقاتنا
            </Link>
            <Link
              to="/about"
              className="btn btn-secondary hero-btn-secondary"
              id="hero-about-btn"
            >
              تعرّف علينا
            </Link>
          </div>
        </div>
      </section>

      {/* قسم الإحصائيات */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">
                <Users className="w-8 h-8" />
              </div>
              <div className="stat-number">{studentsCount}+</div>
              <div className="stat-label">طالب </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="stat-number">{departmentsCount}</div>
              <div className="stat-label">أقسام وحلقات تعليمية</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <div className="stat-number">{activitiesCount}</div>
              <div className="stat-label">نشاط وفعالية</div>
            </div>
          </div>
        </div>
      </section>

      {/* أهداف المدرسة */}
      <section className="goals-section">
        <div className="container">
          <div className="section-title">
            <h2>أهداف المدرسة</h2>
            <p>
              نسعى لبناء جيل قرآني متخلق بأخلاق المصحف، ملم بأحكام تلاوته، ومدرك
              لقيم الإسلام السامية.
            </p>
          </div>
          <div className="goals-grid">
            {academyGoals.map((goal) => {
              const Icon =
                goal.icon === "BookOpen"
                  ? BookOpen
                  : goal.icon === "Award"
                    ? Award
                    : goal.icon === "Heart"
                      ? Heart
                      : Users;
              return (
                <div key={goal.id} className="card goal-card">
                  <div className="goal-icon-box">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* آية قرآنية */}
      <section className="verse-section">
        <div className="container">
          <div className="quran-verse">
            "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ
            الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ
            أَجْرًا كَبِيرًا"
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
