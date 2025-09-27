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

export default function StudentList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSchedules, setStudentSchedules] = useState({});
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [view, setView] = useState(Views.WEEK);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
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
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isStudent = user && user.role === "student";

  useEffect(() => {
    if (isStudent) {
      setStudents([{ id: user.id, first_name: user.first_name, last_name: user.last_name }]);
      setSelectedStudent({ id: user.id, first_name: user.first_name, last_name: user.last_name });
      setLoading(false);
    } else {
      fetch("http://localhost:3000/api/students")
        .then(res => res.json())
        .then(data => { setStudents(data || []); setLoading(false); })
        .catch(err => { console.error(err); setStudents([]); setLoading(false); });
    }
  }, [user, isStudent]);

  const fetchEventsForStudent = async (studentId) => {
    try {
      const classRes = await fetch(`http://localhost:3000/api/students/${studentId}/classes`);
      const classes = classRes.ok ? await classRes.json() : [];
      let classEvents = [];
      classes.forEach(cls => classEvents = classEvents.concat(generateRecurringEvents(cls)));

      const res = await fetch(`http://localhost:3000/myCalendar?userId=${studentId}`);
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

      setStudentSchedules(prev => ({ ...prev, [studentId]: [...classEvents, ...personalEvents] }));
    } catch (err) {
      console.error(err);
      setStudentSchedules(prev => ({ ...prev, [studentId]: [] }));
    }
  };

  useEffect(() => {
    if (selectedStudent) fetchEventsForStudent(selectedStudent.id);
  }, [selectedStudent]);

  const checkEventOverlaps = (events) => {
    const overlaps = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        const start1 = new Date(event1.start), end1 = new Date(event1.end);
        const start2 = new Date(event2.start), end2 = new Date(event2.end);
        if (moment(start1).format("YYYY-MM-DD") === moment(start2).format("YYYY-MM-DD") &&
            start1 < end2 && start2 < end1) {
          overlaps.push({
            event1: event1.title,
            event2: event2.title,
            overlapStart: moment(Math.max(start1,end2)).format("MMM Do, h:mm A"),
            overlapEnd: moment(Math.min(end1,end2)).format("MMM Do, h:mm A"),
            duration: moment.duration(Math.min(end1,end2)-Math.max(start1,end2)).humanize()
          });
        }
      }
    }
    return overlaps;
  };

  const filteredStudents = students.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16, marginLeft: 300 }}>
        {loading ? <p>Loading...</p> : !selectedStudent ? (
          <div>
            <input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {filteredStudents.map(student => (
              <div key={student.id} onClick={() => setSelectedStudent(student)}>
                {student.first_name} {student.last_name}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <HoverButton onClick={() => setSelectedStudent(null)}>← Back to Student List</HoverButton>
              <HoverButton onClick={() => setShowAddEventModal(true)}>➕ Add Event</HoverButton>
              <HoverButton onClick={() => { setShowCheckboxes(prev => !prev); setSelectedEvents(new Set()); }}>
                {showCheckboxes ? "✖️ Cancel" : "🗑️ Delete Events"}
              </HoverButton>
            </div>
            <Calendar
              localizer={localizer}
              events={studentSchedules[selectedStudent.id] || []}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={["month", "week", "day"]}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

