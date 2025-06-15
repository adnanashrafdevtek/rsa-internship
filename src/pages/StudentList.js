import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);

// Dummy student list
const dummyStudents = [
  { id: 1, name: "Alice Thompson" },
  { id: 2, name: "Brian Wilson" },
  { id: 3, name: "Catherine Lee" },
  { id: 4, name: "Daniel Kim" },
  { id: 5, name: "Emily Davis" },
  { id: 6, name: "Frank Wright" },
  { id: 7, name: "Grace Parker" },
  { id: 8, name: "Henry Martinez" },
  { id: 9, name: "Isabella Clark" },
  { id: 10, name: "Jack Nguyen" }
];

export default function StudentList() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSchedules, setStudentSchedules] = useState({});

  const filteredStudents = dummyStudents.filter((student) =>
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

        {!selectedStudent ? (
          <div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchStyle}
            />

            <p style={{ marginBottom: "15px", marginTop: "10px" }}>Select a student to view their schedule:</p>
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
              style={{ ...buttonStyle, marginBottom: "20px", backgroundColor: "#95a5a6" }}
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
