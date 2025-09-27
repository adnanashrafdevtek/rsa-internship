import React, { useState, useEffect, useRef } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "./Sidebar";
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

        const res = await fetch(`http://localhost:3000/myCalendar?userId=${user.id}`);
        const personalEventsRaw = res.ok ? await res.json() : [];
        const personalEvents = personalEventsRaw.map(event => ({
          id: Number(event.id || Math.random()*1000000),
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
        end_time: formatDT(actualStartDate, endTime),
        user_id: user.id,
        description,
        event_type: eventType,
      });
    }

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
      window.location.reload();
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
    
    if (event.isClass) backgroundColor = "#3498db";
    else if (event.eventType === "personal") backgroundColor = "#9b59b6";
    else if (event.eventType === "meeting") backgroundColor = "#e74c3c";
    else if (event.eventType === "appointment") backgroundColor = "#f39c12";
    else if (event.eventType === "reminder") backgroundColor = "#95a5a6";
    else backgroundColor = "#27ae60";
    
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
        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <HoverButton onClick={() => setShowAddEventModal(true)}>Add Event</HoverButton>
          {showCheckboxes && (
            <HoverButton onClick={handleDeleteSelected} disabled={deleting}>
              Delete Selected
            </HoverButton>
          )}
        </div>

        {/* Calendar */}
        <Calendar
          ref={calendarRef}
          localizer={localizer}
          events={scheduleEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "80vh" }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          defaultView={Views.WEEK}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={!showCheckboxes ? handleEventClick : undefined}
        />
      </div>
    </div>
  );
}
