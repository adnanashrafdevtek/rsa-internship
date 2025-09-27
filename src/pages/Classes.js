import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Classes() {
  const { user, users } = useAuth();
  const navigate = useNavigate();

  // Role helpers
  const getRole = (u) => (u && u.role ? u.role.trim().toLowerCase() : "");
  const isStudent = getRole(user) === "student";
  const isTeacher = getRole(user) === "teacher";
  const isAdmin = getRole(user) === "admin";

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    grade_level: "",
    teacher_id: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    recurring_days: [],
  });
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Fetchers
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchClasses = async () => {
      try {
        let url = "http://localhost:3000/api/classes";
        const role = getRole(user);
        if (role === "student") url = `http://localhost:3000/api/students/${user.id}/classes`;
        else if (role === "teacher") url = `http://localhost:3000/api/teachers/${user.id}/classes`;
        const res = await fetch(url);
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeachers = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/teachers");
        setTeachers(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    const fetchStudents = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/students");
        setAllStudents(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, [user]);

  // Handlers
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAddRecurringDay = (day) => {
    setAddForm((prev) => {
      const days = prev.recurring_days.includes(day)
        ? prev.recurring_days.filter((d) => d !== day)
        : [...prev.recurring_days, day];
      return { ...prev, recurring_days: days };
    });
  };

  const combineLocalDatetime = (date, time) => {
    if (!date || !time) return null;
    return `${date} ${time}:00`;
  };

  const addClass = async () => {
    try {
      const start_time = combineLocalDatetime(addForm.start_date, addForm.start_time);
      const end_time = combineLocalDatetime(addForm.end_date, addForm.end_time);
      const res = await fetch("http://localhost:3000/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, start_time, end_time, recurring_days: addForm.recurring_days.join(",") }),
      });
      if (!res.ok) throw new Error("Failed to add class");
      setAddForm({
        name: "",
        grade_level: "",
        teacher_id: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        recurring_days: [],
      });
      setShowAddForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const allTeachers = teachers.filter((t) => t.active);
  const allStudentsActive = allStudents.filter((s) => s.active);

  if (!user)
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: 40, marginLeft: 300 }}>Loading...</div>
      </div>
    );

  if (isStudent)
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: 32, marginLeft: 300 }}>
          <h1>My Classes</h1>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {classes.map((c) => (
                <li key={c.id}>
                  <Link to={`/rosters/${c.id}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 40, marginLeft: 300 }}>
        <h1>Classes</h1>
        <button onClick={() => setShowAddForm((prev) => !prev)}>{showAddForm ? "Cancel" : "Add Class"}</button>
        {showAddForm && (
          <div style={{ marginTop: 20 }}>
            <input name="name" value={addForm.name} onChange={handleAddChange} placeholder="Name" />
            <select name="teacher_id" value={addForm.teacher_id} onChange={handleAddChange}>
              <option value="">Select Teacher</option>
              {allTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
            <button onClick={addClass}>Save</button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Teacher</th>
              <th>Grade</th>
              <th>Recurring</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => {
              const teacher = allTeachers.find((t) => t.id === c.teacher_id);
              const studentIds = Array.isArray(c.students) ? c.students : [];
              const studentNames = allStudentsActive
                .filter((s) => studentIds.includes(s.id))
                .map((s) => `${s.first_name} ${s.last_name}`)
                .join(", ");
              const recurring = Array.isArray(c.recurring_days) ? c.recurring_days.join(", ") : "";
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{teacher ? `${teacher.first_name} ${teacher.last_name}` : "N/A"}</td>
                  <td>{c.grade_level}</td>
                  <td>{recurring}</td>
                  <td>{studentNames}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
