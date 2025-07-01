import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function TeacherList() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherSchedules, setTeacherSchedules] = useState({});
  const [view, setView] = useState(Views.WEEK);
  const [loading, setLoading] = useState(true);

  // 🔁 Fetch teacher list from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/teachers")
      .then((res) => res.json())
      .then((data) => {
        setTeachers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching teachers:", err);
        setLoading(false);
      });
  }, []);

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt("Enter event title:");
    if (title) {
      const newEvent = { start, end, title };
      setTeacherSchedules((prev) => {
        const currentEvents = prev[selectedTeacher.id] || [];
        return {
          ...prev,
          [selectedTeacher.id]: [...currentEvents, newEvent]
        };
      });
    }
  };

  const handleSelectEvent = (event) => {
    if (window.confirm(`Delete the event: "${event.title}"?`)) {
      setTeacherSchedules((prev) => {
        const currentEvents = prev[selectedTeacher.id] || [];
        const updatedEvents = currentEvents.filter((e) => e !== event);
        return {
          ...prev,
          [selectedTeacher.id]: updatedEvents
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
          View Teacher Schedules
        </h1>

        {loading ? (
          <p>Loading teachers...</p>
        ) : !selectedTeacher ? (
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

            <Calendar
              localizer={localizer}
              events={teacherSchedules[selectedTeacher.id] || []}
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