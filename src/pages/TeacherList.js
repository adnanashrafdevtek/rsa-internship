import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateRecurringEvents(classObj, weeks = 8) {
  const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const events = [];
  const startDate = new Date(classObj.start_time.slice(0, 10));
  const startTime = classObj.start_time.slice(11, 16);
  const endTime = classObj.end_time.slice(11, 16);
  const recurringDays = classObj.recurring_days.split(",").map(d => d.trim());

  for (let week = 0; week < weeks; week++) {
    recurringDays.forEach(day => {
      const dayOfWeek = daysMap[day];
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + (dayOfWeek - eventDate.getDay() + 7 * week));
      const [sh, sm] = startTime.split(":");
      const [eh, em] = endTime.split(":");
      const start = new Date(eventDate);
      start.setHours(Number(sh), Number(sm), 0, 0);
      const end = new Date(eventDate);
      end.setHours(Number(eh), Number(em), 0, 0);

      events.push({
        id: `class-${classObj.id}-${week}-${day}`,
        title: classObj.name,
        start,
        end,
        classId: classObj.id,
        isClass: true,
      });
    });
  }
  return events;
}

const HoverButton = ({ style, children, onClick, type, disabled }) => {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const baseStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const hoverStyle = hover && !disabled ? {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    filter: "brightness(1.05)"
  } : {};

  const activeStyle = active && !disabled ? {
    transform: "translateY(-1px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
  } : {};

  return (
    <button
      type={type}
      disabled={disabled}
      style={{ ...baseStyle, ...hoverStyle, ...activeStyle }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default function TeacherList() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherSchedules, setTeacherSchedules] = useState({});
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [view, setView] = useState(Views.WEEK);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    startDate: moment().format("YYYY-MM-DD"),
    startTime: moment().format("HH:mm"),
    endDate: moment().format("YYYY-MM-DD"),
    endTime: moment().add(1, 'hour').format("HH:mm"),
    recurringDays: [],
    eventType: "event",
    description: "",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/teachers")
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

  const fetchEventsForTeacher = async (teacherId) => {
    try {
      const classRes = await fetch(`http://localhost:3000/api/teachers/${teacherId}/classes`);
      const classes = classRes.ok ? await classRes.json() : [];
      let classEvents = [];
      classes.forEach(cls => {
        classEvents = classEvents.concat(generateRecurringEvents(cls));
      });

      const res = await fetch(`http://localhost:3000/myCalendar?userId=${teacherId}`);
      const personalEventsRaw = res.ok ? await res.json() : [];
      const personalEvents = personalEventsRaw.map(event => ({
        id: Number(event.id),
        title: event.title || event.event_title || "No Title",
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description || "",
        classId: null,
        isClass: false,
        eventType: event.event_type || "event",
      }));

      setTeacherSchedules(prev => ({
        ...prev,
        [teacherId]: [...classEvents, ...personalEvents]
      }));
    } catch (err) {
      console.error(err);
      setTeacherSchedules(prev => ({ ...prev, [teacherId]: [] }));
    }
  };

  useEffect(() => {
    if (selectedTeacher) {
      fetchEventsForTeacher(selectedTeacher.id);
    }
  }, [selectedTeacher]);

  const handleEventClick = (event) => {
    if (!showCheckboxes) {
      setEventDetails(event);
      setShowEventDetails(true);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor;
    if (event.isClass) backgroundColor = "#3498db";
    else if (event.eventType === "personal") backgroundColor = "#9b59b6";
    else if (event.eventType === "meeting") backgroundColor = "#e74c3c";
    else if (event.eventType === "appointment") backgroundColor = "#f39c12";
    else if (event.eventType === "reminder") backgroundColor = "#95a5a6";
    else backgroundColor = "#27ae60";

    return { style: { backgroundColor, color: "white", borderRadius: 6, padding: "4px 6px", fontSize: "13px", fontWeight: 500 } };
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16, marginLeft: 300 }}>
        <div style={{ margin: "24px 0 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 22px",
              background: "#26bedd",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(38,190,221,0.08)",
              transition: "background 0.2s"
            }}
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "40px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <p style={{ color: "#888", fontSize: "16px" }}>Loading teachers...</p>
          </div>
        ) : !selectedTeacher ? (
          <div>
            {/* Teacher List Grid */}
            {/* ... keep your teacher grid code here ... */}
          </div>
        ) : (
          <div>
            {/* Selected Teacher Calendar */}
            {/* ... keep your calendar and modal code here ... */}
          </div>
        )}
      </div>
    </div>
  );
}

