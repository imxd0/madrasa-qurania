import React from "react";
import { Clock, CheckCircle } from "lucide-react";
import { weeklySchedule } from "../data/mockData";
import "../styles/schedule.css";

const Schedule = () => {
  const currentSchedule = weeklySchedule.male;

  return (
    <div className="schedule-page">
      <section className="page-header">
        <div className="container">
          <h1>أوقات وجداول الدراسة</h1>
          <p>
            تعرف على المواعيد اليومية والأسبوعية لحلقات الحفظ والمراجعة للطلاب.
          </p>
        </div>
      </section>

      <section className="schedule-section">
        <div className="container">
          <div className="schedule-table-card animate-fade-in">
            <div className="schedule-title-wrapper">
              <Clock className="w-6 h-6 text-amber-500" />
              <h3>الجدول الأسبوعي المعتمد للطلاب الذكور</h3>
            </div>

            <div className="schedule-responsive-wrapper">
              <table className="schedule-table" id="schedule-timetable">
                <thead>
                  <tr>
                    <th>السبت</th>
                    <th>الأحد</th>
                    <th>الإثنين</th>
                    <th>الثلاثاء</th>
                    <th>الأربعاء</th>
                    <th>الخميس</th>
                    <th>الجمعة</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSchedule.map((row, idx) => {
                    const isFree = (val) =>
                      val === "استراحة" || val === "لا يوجد دراسة";
                    return (
                      <tr key={idx}>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.sat) ? "cell-free" : ""}`}
                          >
                            {row.sat}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.sun) ? "cell-free" : ""}`}
                          >
                            {row.sun}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.mon) ? "cell-free" : ""}`}
                          >
                            {row.mon}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.tue) ? "cell-free" : ""}`}
                          >
                            {row.tue}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.wed) ? "cell-free" : ""}`}
                          >
                            {row.wed}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.thu) ? "cell-free" : ""}`}
                          >
                            {row.thu}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`schedule-cell-content ${isFree(row.fri) ? "cell-free" : ""}`}
                          >
                            {row.fri}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="schedule-notes">
            <h4>
              <CheckCircle
                className="w-5 h-5 inline-block ml-2 text-amber-500"
                style={{ verticalAlign: "text-bottom" }}
              />{" "}
              توجيهات هامة للطلاب وأولياء الأمور:
            </h4>
            <ul>
              <li>
                يرجى الالتزام التام بالمواعيد المحددة أعلاه والحضور قبل موعد
                الحلقة بـ 10 دقائق على الأقل.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Schedule;
