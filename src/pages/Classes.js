import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Classes() {
  const { user, users } = useAuth();

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin";

  const [classes, setClasses] = useState([
    {
      id: 1,
      name: "Math 101",
      grade_level: "10",
      teacher_id: 1,
      start_time: "2025-09-27T08:00",
      end_time: "2025-09-27T09:30",
      recurring_days: ["Mon", "Wed", "Fri"],
      students: [2, 5],
    },
    {
      id: 2,
      name: "Science 101",
      grade_level: "10",
      teacher_id: 1,
      start_time: "2025-09-27T10:00",
      end_time: "2025-09-27T11:30",
      recurring_days: ["Tue", "Thu"],
      students: [2],
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    grade_level: "",
    teacher_id: "",
    start_time: "",
    end_time: "",
    recurring_days: [],
    students: [],
  });

  const allTeachers = users.filter((u) => u.role === "teacher" && u.active);
  const allStudents = users.filter((u) => u.role === "student" && u.active);

  const toggleRecurringDay = (day) => {
    setNewClass((prev) => ({
      ...prev,
      recurring_days: prev.recurring_days.includes(day)
        ? prev.recurring_days.filter((d) => d !== day)
        : [...prev.recurring_days, day],
    }));
  };

  const addClass = () => {
    const id = Math.max(...classes.map((c) => c.id), 0) + 1;
    setClasses((prev) => [...prev, { ...newClass, id }]);
    setNewClass({
      name: "",
      grade_level: "",
      teacher_id: "",
      start_time: "",
      end_time: "",
      recurring_days: [],
      students: [],
    });
    setShowAddForm(false);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 40, marginLeft: 300 }}>
        <h1 style={{ marginBottom: 20 }}>Classes</h1>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{ marginBottom: 20, padding: "6px 12px", cursor: "pointer" }}
          >
            {showAddForm ? "Cancel" : "Add Class"}
          </button>
        )}

        {showAddForm && (
          <div
            style={{
              marginBottom: 20,
              padding: 20,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            <input
              type="text"
              placeholder="Class Name"
              value={newClass.name}
              onChange={(e) =>
                setNewClass({ ...newClass, name: e.target.value })
              }
              style={{ display: "block", marginBottom: 10, padding: 6, width: "100%" }}
            />
            <input
              type="text"
              placeholder="Grade Level"
              value={newClass.grade_level}
              onChange={(e) =>
                setNewClass({ ...newClass, grade_level: e.target.value })
              }
              style={{ display: "block", marginBottom: 10, padding: 6, width: "100%" }}
            />
            <select
              value={newClass.teacher_id}
              onChange={(e) =>
                setNewClass({ ...newClass, teacher_id: Number(e.target.value) })
              }
              style={{ display: "block", marginBottom: 10, padding: 6, width: "100%" }}
            >
              <option value="">Select Teacher</option>
              {allTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
            <label>
              Start Time:
              <input
                type="datetime-local"
                value={newClass.start_time}
                onChange={(e) =>
                  setNewClass({ ...newClass, start_time: e.target.value })
                }
                style={{ display: "block", marginBottom: 10, padding: 6 }}
              />
            </label>
            <label>
              End Time:
              <input
                type="datetime-local"
                value={newClass.end_time}
                onChange={(e) =>
                  setNewClass({ ...newClass, end_time: e.target.value })
                }
                style={{ display: "block", marginBottom: 10, padding: 6 }}
              />
            </label>
            <div>
              Recurring Days:
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <label key={day} style={{ marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    checked={newClass.recurring_days.includes(day)}
                    onChange={() => toggleRecurringDay(day)}
                  />{" "}
                  {day}
                </label>
              ))}
            </div>
            <button
              onClick={addClass}
              style={{ marginTop: 10, padding: "6px 12px", cursor: "pointer" }}
            >
              Save Class
            </button>
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: 8, textAlign: "left" }}>Class</th>
              <th style={{ padding: 8, textAlign: "left" }}>Teacher</th>
              <th style={{ padding: 8, textAlign: "left" }}>Grade</th>
              <th style={{ padding: 8, textAlign: "left" }}>Recurring</th>
              <th style={{ padding: 8, textAlign: "left" }}>Students</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => {
              const teacher = users.find((u) => u.id === c.teacher_id);
              const studentNames = allStudents
                .filter((s) => c.students.includes(s.id))
                .map((s) => `${s.first_name} ${s.last_name}`)
                .join(", ");

              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: 8 }}>{c.name}</td>
                  <td style={{ padding: 8 }}>
                    {teacher ? `${teacher.first_name} ${teacher.last_name}` : "N/A"}
                  </td>
                  <td style={{ padding: 8 }}>{c.grade_level}</td>
                  <td style={{ padding: 8 }}>{c.recurring_days.join(", ")}</td>
                  <td style={{ padding: 8 }}>{studentNames}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
