import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);

export default function StudentList() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSchedules, setStudentSchedules] = useState({});
  const [view, setView] = useState(Views.WEEK);
  const [loading, setLoading] = useState(true);

  // 🔁 Fetch students from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/students")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setLoading(false);
      });
  }, []);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt("Enter event title:");
    if (title) {
      const newEvent = { start, end, title };
      setStudentSchedules((prev) => {
        const currentEvents = prev[selectedStudent.id] || [];
        return {
          ...prev,
          [selectedStudent.id]: [...currentEvents, newEvent]
        };
      });
    }
  };

  const handleSelectEvent = (event) => {
    if (window.confirm(`Delete the event: "${event.title}"?`)) {
      setStudentSchedules((prev) => {
        const currentEvents = prev[selectedStudent.id] || [];
        const updatedEvents = currentEvents.filter((e) => e !== event);
        return {
          ...prev,
          [selectedStudent.id]: updatedEvents
        };
      });
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
          View Student Schedules
        </h1>

        {loading ? (
          <p>Loading students...</p>
        ) : !selectedStudent ? (
          <div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchStyle}
            />

            <p style={{ marginBottom: "15px", marginTop: "10px" }}>
              Select a student to view their schedule:
            </p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredStudents.map((student) => (
                <li key={student.id} style={{ marginBottom: "10px" }}>
                  <button
                    style={buttonStyle}
                    onClick={() => setSelectedStudent(student)}
                  >
                    {student.name}
                  </button>
                </li>
              ))}
              {filteredStudents.length === 0 && <li>No students found.</li>}
            </ul>
          </div>
        ) : (
          <div>
            <button
              style={{
                ...buttonStyle,
                marginBottom: "20px",
                backgroundColor: "#95a5a6"
              }}
              onClick={() => setSelectedStudent(null)}
            >
              ← Back to Student List
            </button>

            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
              {selectedStudent.name}'s Schedule
            </h2>

            <Calendar
              localizer={localizer}
              events={studentSchedules[selectedStudent.id] || []}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              views={["month", "week", "day"]}
              view={view}
              onView={(newView) => setView(newView)}
              defaultDate={new Date()}
            />
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