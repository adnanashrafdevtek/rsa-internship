import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function ClassRosters() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [newStudents, setNewStudents] = useState({});
  const [allUsers, setAllUsers] = useState([]);

  // Fetch classes and all students on load
  useEffect(() => {
    fetch("/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data));

    fetch("/users?role=STUDENT")
      .then((res) => res.json())
      .then((data) => setAllUsers(data));
  }, []);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Filter visible classes
  const visibleClasses = classes.filter((cls) => {
    if (user?.role === "ADMIN") return true;
    if (user?.role === "TEACHER") return cls.teacher.toLowerCase().includes(user.username.toLowerCase());
    if (user?.role === "STUDENT") {
      return cls.students.some(
        (s) => s.name.toLowerCase() === user.username.toLowerCase()
      );
    }
    return false;
  });

  const handleAddStudent = async (classId, index) => {
    const input = newStudents[index]?.trim();
    if (!input) return;

    const student = allUsers.find(
      (u) => `${u.first_name} ${u.last_name}`.toLowerCase() === input.toLowerCase()
    );

    if (!student) return alert("Student not found");

    await fetch(`/classes/${classId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: student.id }),
    });

    const res = await fetch("/classes");
    const updated = await res.json();
    setClasses(updated);
    setNewStudents({ ...newStudents, [index]: "" });
  };

  const handleRemoveStudent = async (classId, studentId) => {
    await fetch(`/classes/${classId}/students/${studentId}`, {
      method: "DELETE",
    });

    const res = await fetch("/classes");
    const updated = await res.json();
    setClasses(updated);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ padding: "30px", flex: 1 }}>
        <h1 style={{ marginBottom: "20px" }}>
          {user?.role === "ADMIN"
            ? "All Class Rosters"
            : user?.role === "TEACHER"
            ? "Your Class Rosters"
            : "Class Rosters You're Enrolled In"}
        </h1>

        {visibleClasses.length === 0 ? (
          <p>You don’t have any assigned classes.</p>
        ) : (
          visibleClasses.map((cls, index) => (
            <div
              key={cls.classId}
              style={{
                background: "#f9f9f9",
                padding: "16px",
                marginBottom: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <h2>{cls.subject}</h2>
              <p style={{ color: "#888" }}>
                Teacher: {capitalize(cls.teacher)}
              </p>

              <ul style={{ paddingLeft: "20px" }}>
                {cls.students.map((student, i) => (
                  <li key={student.id} style={{ marginBottom: "4px" }}>
                    {student.name}
                    {(user?.role === "ADMIN" || cls.teacher.includes(user.username)) && (
                      <button
                        onClick={() => handleRemoveStudent(cls.classId, student.id)}
                        style={{
                          marginLeft: "10px",
                          background: "#e74c3c",
                          color: "white",
                          border: "none",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {(user?.role === "ADMIN" || cls.teacher.includes(user.username)) && (
                <div style={{ marginTop: "12px" }}>
                  <input
                    type="text"
                    placeholder="Add student"
                    value={newStudents[index] || ""}
                    onChange={(e) =>
                      setNewStudents({ ...newStudents, [index]: e.target.value })
                    }
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      width: "60%",
                    }}
                  />
                  <button
                    onClick={() => handleAddStudent(cls.classId, index)}
                    style={{
                      marginLeft: "10px",
                      padding: "6px 10px",
                      backgroundColor: "#3498db",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}