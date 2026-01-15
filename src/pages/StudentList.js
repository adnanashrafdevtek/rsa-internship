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
      style={{
        ...baseStyle,
        ...hoverStyle,
        ...activeStyle
      }}
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

  // Add event modal state
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

  // Event details modal state
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- Student Self-View Mode ---
  const isStudent = user && user.role === "student";

  // Always fetch all students for admin, or just self for student, but use same UI logic
  useEffect(() => {
    if (isStudent) {
      // For student users, just set themselves as the only student
      setStudents([{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      }]);
      setSelectedStudent({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      });
      setLoading(false);
    } else {
      // For admin users, fetch all students
      fetch("${API_BASE_URL}/api/students")
        .then(res => res.json())
        .then(data => {
          setStudents(data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setStudents([]);
          setLoading(false);
        });
    }
  }, [user, isStudent]);

  // Fetch events for selected student (or self)
  const fetchEventsForStudent = async (studentId) => {
    try {
      // Classes
      const classRes = await fetch(`${API_BASE_URL}/api/students/${studentId}/classes`);
      const classes = classRes.ok ? await classRes.json() : [];
      let classEvents = [];
      classes.forEach(cls => {
        classEvents = classEvents.concat(generateRecurringEvents(cls));
      });

      // Personal events
      const res = await fetch(`${API_BASE_URL}/myCalendar?userId=${studentId}`);
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

      setStudentSchedules(prev => ({
        ...prev,
        [studentId]: [...classEvents, ...personalEvents]
      }));
    } catch (err) {
      console.error(err);
      setStudentSchedules(prev => ({ ...prev, [studentId]: [] }));
    }
  };

  // Always use selectedStudent for fetching events, even for student
  useEffect(() => {
    if (selectedStudent) {
      fetchEventsForStudent(selectedStudent.id);
    }
  }, [selectedStudent]);

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  // Check for overlapping events
  const checkEventOverlaps = (events) => {
    const overlaps = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        // Check if events overlap in time AND date
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);
        
        // Check if events are on the same date first
        const date1 = moment(start1).format("YYYY-MM-DD");
        const date2 = moment(start2).format("YYYY-MM-DD");
        
        // Only check for time overlap if events are on the same date
        if (date1 === date2 && start1 < end2 && start2 < end1) {
          // Events overlap on the same date
          const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
          const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
          
          overlaps.push({
            event1: event1.title,
            event2: event2.title,
            overlapStart: moment(overlapStart).format("MMM Do, h:mm A"),
            overlapEnd: moment(overlapEnd).format("MMM Do, h:mm A"),
            duration: moment.duration(overlapEnd - overlapStart).humanize()
          });
        }
      }
    }
    return overlaps;
  };

  // Show event description/details on click
  const handleEventClick = (event) => {
    if (!showCheckboxes) {
      setEventDetails(event);
      setShowEventDetails(true);
    }
  };

  const toggleSelectEvent = (eventId) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) newSet.delete(eventId);
      else newSet.add(eventId);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentEvents = studentSchedules[selectedStudent.id] || [];
    const selectableEvents = currentEvents.filter(e => !e.isClass);
    if (selectedEvents.size === selectableEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(selectableEvents.map(e => e.id)));
    }
  };

  const handleNewEventChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "recurringDays") {
      setNewEvent(prev => ({
        ...prev,
        recurringDays: checked
          ? [...prev.recurringDays, value]
          : prev.recurringDays.filter(d => d !== value),
      }));
    } else {
      setNewEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const { title, startDate, startTime, endDate, endTime, recurringDays, description, eventType } = newEvent;
    if (!title || !startTime || !endTime) return alert("Please fill in the title, start time, and end time");

    // Use today's date if dates are not provided
    const actualStartDate = startDate || moment().format("YYYY-MM-DD");
    const actualEndDate = endDate || moment().format("YYYY-MM-DD");

    const formatDT = (date, time) => moment(`${date} ${time}`).format("YYYY-MM-DD HH:mm:ss");

    let eventsToAdd = [];
    if (recurringDays.length > 0) {
      const start = moment(actualStartDate);
      const end = moment(actualEndDate);
      let curr = start.clone();
      while (curr.isSameOrBefore(end)) {
        if (recurringDays.includes(curr.format("ddd"))) {
          eventsToAdd.push({
            title,
            start_time: formatDT(curr.format("YYYY-MM-DD"), startTime),
            end_time: formatDT(curr.format("YYYY-MM-DD"), endTime),
            user_id: selectedStudent.id,
            description,
            event_type: eventType,
          });
        }
        curr.add(1, "day");
      }
    } else {
      eventsToAdd.push({
        title,
        start_time: formatDT(actualStartDate, startTime),
        end_time: formatDT(actualStartDate, endTime),
        user_id: selectedStudent.id,
        description,
        event_type: eventType,
      });
    }

    // Check for overlaps before adding
    const tempEvents = eventsToAdd.map(event => ({
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      eventType: event.event_type
    }));
    
    const currentEvents = studentSchedules[selectedStudent.id] || [];
    const overlaps = checkEventOverlaps([...currentEvents, ...tempEvents]);
    
    if (overlaps.length > 0) {
      const overlapMessage = overlaps.map(overlap => 
        `⚠️ "${overlap.event1}" overlaps with "${overlap.event2}"\n   Duration: ${overlap.duration} (${overlap.overlapStart} - ${overlap.overlapEnd})`
      ).join('\n\n');
      
      if (!window.confirm(`Warning: Event overlaps detected!\n\n${overlapMessage}\n\nDo you still want to add this event?`)) {
        return;
      }
    }

    try {
      for (const event of eventsToAdd) {
        await fetch("${API_BASE_URL}/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
      }
      setShowAddEventModal(false);
      setNewEvent({ 
        title: "", 
        startDate: moment().format("YYYY-MM-DD"), 
        startTime: moment().format("HH:mm"), 
        endDate: moment().format("YYYY-MM-DD"), 
        endTime: moment().add(1, 'hour').format("HH:mm"), 
        recurringDays: [], 
        description: "",
        eventType: "event"
      });
      // Refresh events
      fetchEventsForStudent(selectedStudent.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.size === 0) return;
    if (!window.confirm(`Delete ${selectedEvents.size} selected event(s)?`)) return;
    setDeleting(true);
    try {
      for (const eventId of selectedEvents) {
        await fetch(`${API_BASE_URL}/api/calendar/${eventId}`, { method: "DELETE" });
      }
      // Refresh events
      fetchEventsForStudent(selectedStudent.id);
      setSelectedEvents(new Set());
      setShowCheckboxes(false);
    } catch (err) {
      alert(err.message);
    }
    setDeleting(false);
  };

  const eventStyleGetter = (event) => {
    let backgroundColor;
    
    if (event.isClass) {
      backgroundColor = "#3498db"; // Blue for classes
    } else if (event.eventType === "personal") {
      backgroundColor = "#9b59b6"; // Purple for personal events
    } else if (event.eventType === "meeting") {
      backgroundColor = "#e74c3c"; // Red for meetings
    } else if (event.eventType === "appointment") {
      backgroundColor = "#f39c12"; // Orange for appointments
    } else if (event.eventType === "reminder") {
      backgroundColor = "#95a5a6"; // Gray for reminders
    } else {
      backgroundColor = "#27ae60"; // Green for regular events
    }
    
    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: 6,
        padding: "4px 6px",
        border: "none",
        fontSize: "13px",
        fontWeight: 500,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      },
    };
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            padding: "40px", 
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <p style={{ color: "#888", fontSize: "16px" }}>Loading...</p>
          </div>
        ) : !selectedStudent ? (
          <div>
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              padding: "16px 20px", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              marginBottom: "16px"
            }}>
              <h1 style={{ 
                fontSize: 24, 
                fontWeight: "bold", 
                margin: 0, 
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                👥 Student Schedules
              </h1>
              <p style={{ 
                margin: "8px 0 0 0", 
                fontSize: "14px", 
                color: "#7f8c8d" 
              }}>
                Select a student to view and manage their schedule
              </p>
            </div>

            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
            }}>
              <div style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  placeholder="🔍 Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    border: "2px solid #e1e8ed",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "border-color 0.2s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3498db"}
                  onBlur={(e) => e.target.style.borderColor = "#e1e8ed"}
                />
              </div>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px"
              }}>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      backgroundColor: "#f8f9fa",
                      border: "2px solid #e1e8ed",
                      borderRadius: "12px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setSelectedStudent(student)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3498db";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e1e8ed";
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#3498db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "18px"
                      }}>
                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#2c3e50"
                        }}>
                          {student.first_name} {student.last_name}
                        </h3>
                        <p style={{
                          margin: "4px 0 0 0",
                          fontSize: "12px",
                          color: "#7f8c8d"
                        }}>
                          Click to view schedule
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                    color: "#7f8c8d"
                  }}>
                    No students found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              padding: "12px 16px", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              marginBottom: "12px"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <h1 style={{ 
                    fontSize: 20, 
                    fontWeight: "bold", 
                    margin: 0, 
                    color: "#2c3e50",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    📅 {selectedStudent.first_name} {selectedStudent.last_name}'s Schedule
                  </h1>
                </div>

                <div style={{ 
                  display: "flex", 
                  gap: 8, 
                  flexWrap: "wrap" 
                }}>

                  <HoverButton
                    style={{ 
                      backgroundColor: "#27ae60", 
                      color: "white",
                      border: "2px solid transparent"
                    }}
                    onClick={() => setShowAddEventModal(true)}
                  >
                    ➕ Add Event
                  </HoverButton>

                  <HoverButton
                    style={{ 
                      backgroundColor: showCheckboxes ? "#95a5a6" : "#e74c3c", 
                      color: "white",
                      border: "2px solid transparent"
                    }}
                    onClick={() => {
                      setShowCheckboxes(prev => !prev);
                      setSelectedEvents(new Set());
                    }}
                  >
                    {showCheckboxes ? "✖️ Cancel" : "🗑️ Delete Events"}
                  </HoverButton>

                  {showCheckboxes && (
                    <HoverButton
                      style={{ 
                        backgroundColor: "#2980b9", 
                        color: "white",
                        border: "2px solid transparent"
                      }}
                      onClick={handleSelectAll}
                    >
                      {selectedEvents.size === (studentSchedules[selectedStudent.id]?.filter(e => !e.isClass).length || 0)
                        ? "Unselect All"
                        : "Select All"}
                    </HoverButton>
                  )}

                  {showCheckboxes && selectedEvents.size > 0 && (
                    <HoverButton
                      style={{ 
                        backgroundColor: "#c0392b", 
                        color: "white",
                        border: "2px solid transparent"
                      }}
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                    >
                      {deleting ? "⏳ Deleting..." : `🗑️ Delete Selected (${selectedEvents.size})`}
                    </HoverButton>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "12px",
                  fontWeight: "500",
                  flexWrap: "wrap"
                }}>
                  <span>📚 Classes</span>
                  <span>📅 Events</span>
                  <span>🟣 Personal</span>
                  <span>🔴 Meetings</span>
                  <span>🟠 Appointments</span>
                  <span>⚫ Reminders</span>
                </div>
                
                {/* Overlap detection indicator */}
                {studentSchedules[selectedStudent.id] && (() => {
                  const overlaps = checkEventOverlaps(studentSchedules[selectedStudent.id]);
                  return overlaps.length > 0 ? (
                    <div style={{
                      backgroundColor: "#e74c3c",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      ⚠️ {overlaps.length} Overlap{overlaps.length > 1 ? 's' : ''} Detected
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: "#27ae60",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      ✅ No Overlaps
                    </div>
                  );
                })()}
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
                eventPropGetter={eventStyleGetter}
                selectable={false}
                onSelectEvent={!showCheckboxes ? handleEventClick : null}
                components={{
                  event: ({ event }) => (
                    <div 
                      style={{ 
                        padding: "4px 6px", 
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        // Apply the proper background color based on event type
                        backgroundColor: event.isClass ? "#3498db" : 
                                       event.eventType === "personal" ? "#9b59b6" : 
                                       event.eventType === "meeting" ? "#e74c3c" :
                                       event.eventType === "appointment" ? "#f39c12" :
                                       event.eventType === "reminder" ? "#95a5a6" : "#27ae60",
                        color: "white"
                      }}
                      onClick={(e) => {
                        // Only open event details if NOT in delete mode
                        if (!showCheckboxes) {
                          e.stopPropagation();
                          handleEventClick(event);
                        }
                      }}
                    >
                      {showCheckboxes && !event.isClass && (
                        <input
                          type="checkbox"
                          checked={selectedEvents.has(event.id)}
                          onChange={() => toggleSelectEvent(event.id)}
                          style={{ 
                            marginRight: 4,
                            cursor: "pointer"
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <span>{event.title}</span>
                      {event.isClass && <span style={{ fontSize: "10px", opacity: 0.8 }}>📚</span>}
                      {!event.isClass && event.eventType === "personal" && <span style={{ fontSize: "10px", opacity: 0.8 }}>💜</span>}
                      {!event.isClass && event.eventType === "meeting" && <span style={{ fontSize: "10px", opacity: 0.8 }}>🔴</span>}
                      {!event.isClass && event.eventType === "appointment" && <span style={{ fontSize: "10px", opacity: 0.8 }}>🟠</span>}
                      {!event.isClass && event.eventType === "reminder" && <span style={{ fontSize: "10px", opacity: 0.8 }}>⚫</span>}
                      {!event.isClass && !["personal", "meeting", "appointment", "reminder"].includes(event.eventType) && <span style={{ fontSize: "10px", opacity: 0.8 }}>📅</span>}
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        )}

        {/* Add Event Modal */}
        {showAddEventModal && (
          <div style={{
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100vw", 
            height: "100vh",
            background: "rgba(0,0,0,0.4)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}>
            <div style={{ 
              background: "#fff", 
              padding: 40, 
              borderRadius: 16, 
              minWidth: 500, 
              maxWidth: "90vw",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <h2 style={{ 
                marginBottom: 24, 
                color: "#2c3e50",
                fontSize: "24px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                ✨ Add New Event
              </h2>
              
              <form onSubmit={handleAddEvent}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: "#34495e",
                    fontSize: "14px"
                  }}>
                    Event Title *
                  </label>
                  <input
                    name="title"
                    placeholder="Enter event title..."
                    value={newEvent.title}
                    onChange={handleNewEventChange}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "12px 16px", 
                      borderRadius: 8, 
                      border: "2px solid #e1e8ed",
                      fontSize: "14px",
                      transition: "border-color 0.2s ease",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#3498db"}
                    onBlur={(e) => e.target.style.borderColor = "#e1e8ed"}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: "#34495e",
                    fontSize: "14px"
                  }}>
                    Event Type *
                  </label>
                  <select
                    name="eventType"
                    value={newEvent.eventType}
                    onChange={handleNewEventChange}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "12px 16px", 
                      borderRadius: 8, 
                      border: "2px solid #e1e8ed",
                      fontSize: "14px",
                      backgroundColor: "white",
                      cursor: "pointer"
                    }}
                  >
                    <option value="event">📅 Regular Event (Green)</option>
                    <option value="personal">💜 Personal Event (Purple)</option>
                    <option value="meeting">🔴 Meeting (Red)</option>
                    <option value="appointment">🟠 Appointment (Orange)</option>
                    <option value="reminder">⚫ Reminder (Gray)</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#34495e",
                      fontSize: "14px"
                    }}>
                      Start Time *
                    </label>
                    <input 
                      type="time" 
                      name="startTime" 
                      value={newEvent.startTime} 
                      onChange={handleNewEventChange} 
                      required 
                      style={{ 
                        width: "100%", 
                        padding: "12px 16px", 
                        borderRadius: 8, 
                        border: "2px solid #e1e8ed",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#34495e",
                      fontSize: "14px"
                    }}>
                      End Time *
                    </label>
                    <input 
                      type="time" 
                      name="endTime" 
                      value={newEvent.endTime} 
                      onChange={handleNewEventChange} 
                      required 
                      style={{ 
                        width: "100%", 
                        padding: "12px 16px", 
                        borderRadius: 8, 
                        border: "2px solid #e1e8ed",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#34495e",
                      fontSize: "14px"
                    }}>
                      Start Date (optional)
                    </label>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={newEvent.startDate} 
                      onChange={handleNewEventChange}
                      style={{ 
                        width: "100%", 
                        padding: "12px 16px", 
                        borderRadius: 8, 
                        border: "2px solid #e1e8ed",
                        fontSize: "14px"
                      }}
                    />
                    <small style={{ color: "#7f8c8d", fontSize: "12px" }}>
                      Leave empty to use today's date
                    </small>
                  </div>
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#34495e",
                      fontSize: "14px"
                    }}>
                      End Date (optional)
                    </label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={newEvent.endDate} 
                      onChange={handleNewEventChange}
                      style={{ 
                        width: "100%", 
                        padding: "12px 16px", 
                        borderRadius: 8, 
                        border: "2px solid #e1e8ed",
                        fontSize: "14px"
                      }}
                    />
                    <small style={{ color: "#7f8c8d", fontSize: "12px" }}>
                      For recurring events only
                    </small>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 12, 
                    fontWeight: 600, 
                    color: "#34495e",
                    fontSize: "14px"
                  }}>
                    Recurring Days (optional)
                  </label>
                  <div style={{ 
                    display: "flex", 
                    gap: 12, 
                    flexWrap: "wrap",
                    padding: "16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: 8,
                    border: "2px solid #e1e8ed"
                  }}>
                    {daysOfWeek.map(day => (
                      <label key={day} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6,
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500
                      }}>
                        <input 
                          type="checkbox" 
                          name="recurringDays" 
                          value={day} 
                          checked={newEvent.recurringDays.includes(day)} 
                          onChange={handleNewEventChange}
                          style={{ cursor: "pointer" }}
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                  <small style={{ color: "#7f8c8d", fontSize: "12px" }}>
                    Select days for recurring events
                  </small>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: "#34495e",
                    fontSize: "14px"
                  }}>
                    Description (optional)
                  </label>
                  <textarea 
                    name="description" 
                    placeholder="Add event description..."
                    value={newEvent.description} 
                    onChange={handleNewEventChange} 
                    style={{ 
                      width: "100%", 
                      minHeight: 80, 
                      padding: "12px 16px", 
                      borderRadius: 8, 
                      border: "2px solid #e1e8ed",
                      fontSize: "14px",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <HoverButton 
                    style={{ 
                      backgroundColor: "#95a5a6", 
                      color: "white",
                      border: "2px solid transparent"
                    }} 
                    onClick={() => setShowAddEventModal(false)}
                  >
                    Cancel
                  </HoverButton>
                  <HoverButton 
                    style={{ 
                      backgroundColor: "#27ae60", 
                      color: "white",
                      border: "2px solid transparent"
                    }} 
                    type="submit"
                  >
                    💾 Save Event
                  </HoverButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventDetails && eventDetails && (
          <div style={{
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100vw", 
            height: "100vh",
            background: "rgba(0,0,0,0.4)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}>
            <div style={{ 
              background: "#fff", 
              padding: 32, 
              borderRadius: 16, 
              minWidth: 400, 
              maxWidth: "90vw",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20
              }}>
                <h2 style={{ 
                  margin: 0, 
                  color: "#2c3e50",
                  fontSize: "20px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  {eventDetails.isClass ? "📚" : "📅"} Event Details
                </h2>
                <button
                  onClick={() => setShowEventDetails(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#95a5a6",
                    padding: "4px"
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ 
                  fontSize: "18px", 
                  fontWeight: "600", 
                  color: "#34495e",
                  margin: "0 0 8px 0"
                }}>
                  {eventDetails.title}
                </h3>
                <div style={{
                  backgroundColor: eventDetails.isClass ? "#3498db" : 
                                  eventDetails.eventType === "personal" ? "#9b59b6" : 
                                  eventDetails.eventType === "meeting" ? "#e74c3c" :
                                  eventDetails.eventType === "appointment" ? "#f39c12" :
                                  eventDetails.eventType === "reminder" ? "#95a5a6" : "#27ae60",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-block",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  {eventDetails.isClass ? "📚 Class" : 
                   eventDetails.eventType === "personal" ? "💜 Personal Event" : 
                   eventDetails.eventType === "meeting" ? "🔴 Meeting" :
                   eventDetails.eventType === "appointment" ? "🟠 Appointment" :
                   eventDetails.eventType === "reminder" ? "⚫ Reminder" : "📅 Regular Event"}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: "14px", 
                  color: "#7f8c8d",
                  marginBottom: 4,
                  fontWeight: "500"
                }}>
                  📅 Date & Time
                </div>
                <div style={{ fontSize: "14px", color: "#2c3e50" }}>
                  <strong>Start:</strong> {moment(eventDetails.start).format("MMMM Do, YYYY [at] h:mm A")}
                </div>
                <div style={{ fontSize: "14px", color: "#2c3e50" }}>
                  <strong>End:</strong> {moment(eventDetails.end).format("MMMM Do, YYYY [at] h:mm A")}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontSize: "14px", 
                  color: "#7f8c8d",
                  marginBottom: 8,
                  fontWeight: "500"
                }}>
                  📝 Description
                </div>
                <div style={{
                  backgroundColor: "#f8f9fa",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e1e8ed",
                  fontSize: "14px",
                  color: "#2c3e50",
                  minHeight: "60px",
                  fontStyle: eventDetails.description ? "normal" : "italic"
                }}>
                  {eventDetails.description || "No description provided"}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <HoverButton 
                  style={{ 
                    backgroundColor: "#3498db", 
                    color: "white",
                    border: "2px solid transparent"
                  }} 
                  onClick={() => setShowEventDetails(false)}
                >
                  Close
                </HoverButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
