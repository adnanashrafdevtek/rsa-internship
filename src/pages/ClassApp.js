import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const allStudents = [
  "student", "Fatima Ahmed", "Zayd Ali", "Maryam Yusuf", "Bilal Rahman",
  "Layla Hussein", "Imran Saeed", "Noor Zaman", "Sara Iqbal", "Khalid Rafi"
];

export default function ClassApp() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  // 🔁 Fetch real class data from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/classes")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching classes:", err);
        setLoading(false);
      });
  }, []);

  // 🧠 Filter based on user role
  const visibleClasses = classes.filter((cls) => {
    if (isAdmin) return true;
    if (isTeacher) return cls.teacher === user.username;
    if (isStudent) {
      const list = cls.students?.includes("All students") ? allStudents : cls.students || [];
      return list.includes(user.username);
    }
    return false;
  });

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "40px" }}>
        <h1 style={{ marginBottom: "20px" }}>
          {isAdmin
            ? "All Classes"
            : isTeacher
            ? "Your Classes"
            : isStudent
            ? "Your Enrolled Classes"
            : "Classes"}
        </h1>

        {loading ? (
          <p>Loading classes...</p>
        ) : visibleClasses.length === 0 ? (
          <p>
            {isStudent
              ? "You are not enrolled in any classes."
              : isTeacher
              ? "You are not assigned to any classes."
              : "No classes to display."}
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#eee" }}>
                <th style={thStyle}>Class</th>
                <th style={thStyle}>Section</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Room</th>
                <th style={thStyle}>Timings</th>
                {isAdmin && <th style={thStyle}>Teacher</th>}
              </tr>
            </thead>
            <tbody>
              {visibleClasses.map((cls, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={tdStyle}>{cls.name}</td>
                  <td style={tdStyle}>{cls.section}</td>
                  <td style={tdStyle}>{cls.subject}</td>
                  <td style={tdStyle}>{cls.room}</td>
                  <td style={tdStyle}>{cls.timings}</td>
                  {isAdmin && <td style={tdStyle}>{capitalize(cls.teacher)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "10px",
};