import React, { useState, useEffect, useRef } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "./Sidebar"; // keep this
import { useAuth } from "../context/AuthContext";

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


export default function MySchedule() {
  const { user, logout } = useAuth();
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    startDate: moment().format("YYYY-MM-DD"),
    startTime: moment().format("HH:mm"),
    endDate: moment().format("YYYY-MM-DD"),
    endTime: moment().add(1, 'hour').format("HH:mm"),
    recurringDays: [],
    description: "",
    eventType: "event",
  });
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [deleting, setDeleting] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const calendarRef = useRef(null);

  const getRole = u => (u && u.role ? u.role.trim().toLowerCase() : "");
  const isStudent = getRole(user) === "student";
  const isTeacher = getRole(user) === "teacher";

  const handleLogout = () => {
    logout();
  };

  // Fetch classes (student or teacher) + personal events
  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      try {
        let classes = [];
        if (isStudent) {
          const classRes = await fetch(`http://localhost:3000/api/students/${user.id}/classes`);
          classes = classRes.ok ? await classRes.json() : [];
        } else if (isTeacher) {
          const classRes = await fetch(`http://localhost:3000/api/teachers/${user.id}/classes`);
          classes = classRes.ok ? await classRes.json() : [];
        }
        let classEvents = [];
        classes.forEach(cls => {
          classEvents = classEvents.concat(generateRecurringEvents(cls));
        });

        // Personal events
        const res = await fetch(`http://localhost:3000/myCalendar?userId=${user.id}`);
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

        setScheduleEvents([...classEvents, ...personalEvents]);
      } catch (err) {
        console.error(err);
        setScheduleEvents([]);
      }
    };

    fetchEvents();
  }, [user]);

  // Check for overlapping events
  const checkEventOverlaps = (events) => {
    const overlaps = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);
        const date1 = moment(start1).format("YYYY-MM-DD");
        const date2 = moment(start2).format("YYYY-MM-DD");
        if (date1 === date2 && start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime()) {
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

  const toggleSelectEvent = (eventId) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) newSet.delete(eventId);
      else newSet.add(eventId);
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.size === 0) return;
    if (!window.confirm(`Delete ${selectedEvents.size} selected event(s)?`)) return;
    setDeleting(true);
    try {
      for (const eventId of selectedEvents) {
        await fetch(`http://localhost:3000/api/calendar/${eventId}`, { method: "DELETE" });
      }
  setScheduleEvents(prev => prev.filter(e => !selectedEvents.has(e.id)));
      setSelectedEvents(new Set());
      setShowCheckboxes(false);
    } catch (err) {
      alert(err.message);
    }
    setDeleting(false);
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
            user_id: user.id,
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
        end_time: formatDT(actualStartDate, endTime), // Use same date for one-time events
        user_id: user.id,
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
    
  const overlaps = checkEventOverlaps([...scheduleEvents, ...tempEvents]);
    
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
        await fetch("http://localhost:3000/api/calendar", {
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
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEventDetails(event);
    setShowEventModal(true);
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
        borderRadius: 4,
        border: "none",
        fontSize: "13px",
        fontWeight: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      },
    };
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16, marginLeft: 300 }}>
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
                📅 My Schedule
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
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#3498db", borderRadius: "2px" }}></div>
                📚 Classes
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#27ae60", borderRadius: "2px" }}></div>
                📅 Events
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#9b59b6", borderRadius: "2px" }}></div>
                🟣 Personal
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#e74c3c", borderRadius: "2px" }}></div>
                🔴 Meetings
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#f39c12", borderRadius: "2px" }}></div>
                🟠 Appointments
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#95a5a6", borderRadius: "2px" }}></div>
                ⚫ Reminders
              </span>
            </div>
            
            {/* Overlap detection indicator */}
            {scheduleEvents.length > 0 && (() => {
              const overlaps = checkEventOverlaps(scheduleEvents);
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
            events={scheduleEvents}
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

        {showEventModal && selectedEventDetails && (
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
                  {selectedEventDetails.isClass ? "📚" : "📅"} Event Details
                </h2>
                <button
                  onClick={() => setShowEventModal(false)}
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
                  {selectedEventDetails.title}
                </h3>
                <div style={{
                  backgroundColor: selectedEventDetails.isClass ? "#3498db" : 
                                  selectedEventDetails.eventType === "personal" ? "#9b59b6" : 
                                  selectedEventDetails.eventType === "meeting" ? "#e74c3c" :
                                  selectedEventDetails.eventType === "appointment" ? "#f39c12" :
                                  selectedEventDetails.eventType === "reminder" ? "#95a5a6" : "#27ae60",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-block",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  {selectedEventDetails.isClass ? "📚 Class" : 
                   selectedEventDetails.eventType === "personal" ? "💜 Personal Event" : 
                   selectedEventDetails.eventType === "meeting" ? "🔴 Meeting" :
                   selectedEventDetails.eventType === "appointment" ? "🟠 Appointment" :
                   selectedEventDetails.eventType === "reminder" ? "⚫ Reminder" : "📅 Regular Event"}
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
                  <strong>Start:</strong> {moment(selectedEventDetails.start).format("MMMM Do, YYYY [at] h:mm A")}
                </div>
                <div style={{ fontSize: "14px", color: "#2c3e50" }}>
                  <strong>End:</strong> {moment(selectedEventDetails.end).format("MMMM Do, YYYY [at] h:mm A")}
                </div>
                <div style={{ fontSize: "14px", color: "#2c3e50", marginTop: "4px" }}>
                  <strong>Duration:</strong> {moment.duration(moment(selectedEventDetails.end).diff(moment(selectedEventDetails.start))).humanize()}
                </div>
              </div>

              {selectedEventDetails.description && (
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
                    color: "#2c3e50"
                  }}>
                    {selectedEventDetails.description}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <HoverButton 
                  style={{ 
                    backgroundColor: "#3498db", 
                    color: "white",
                    border: "2px solid transparent"
                  }} 
                  onClick={() => setShowEventModal(false)}
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
