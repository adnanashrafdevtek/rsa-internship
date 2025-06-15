import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Dummy teacher list
const dummyTeachers = [
  { id: 1, name: "Mr. Smith" },
  { id: 2, name: "Ms. Johnson" },
  { id: 3, name: "Dr. Lee" }
];

export default function TeacherList() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredTeachers = dummyTeachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
          View Teacher Schedules
        </h1>

        {!selectedTeacher ? (
          <div>
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchStyle}
            />
            <p style={{ marginBottom: "15px", marginTop: "10px" }}>Select a teacher to view their schedule:</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredTeachers.map((teacher) => (
                <li key={teacher.id} style={{ marginBottom: "10px" }}>
                  <button
                    style={buttonStyle}
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    {teacher.name}
                  </button>
                </li>
              ))}
              {filteredTeachers.length === 0 && <li>No teachers found.</li>}
            </ul>
          </div>
        ) : (
          <div>
            <button
              style={{ ...buttonStyle, marginBottom: "20px", backgroundColor: "#95a5a6" }}
              onClick={() => setSelectedTeacher(null)}
            >
              ← Back to Teacher List
            </button>

            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
              {selectedTeacher.name}'s Calendar
            </h2>

            <p>This is where the calendar will go. (We will integrate react-big-calendar next.)</p>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 15px",
  backgroundColor: "#2980b9",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const searchStyle = {
  padding: "10px",
  width: "100%",
  maxWidth: "400px",
  fontSize: "16px",
  marginBottom: "10px",
  borderRadius: "4px",
  border: "1px solid #ccc"
};