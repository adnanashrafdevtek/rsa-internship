import React, { useState, useEffect, useRef } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);

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

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentList() {
  const { logout } = useAuth();
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
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    recurringDays: [],
    eventType: "",
    description: "",
  });

  // Event details modal state
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);

  const calendarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/students")
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

  const fetchEventsForStudent = async (studentId) => {
    try {
      // Fetch custom events
      const res = await fetch(`http://localhost:3000/myCalendar?userId=${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      const customEvents = await res.json();

      // Fetch classes
      const classRes = await fetch(`http://localhost:3000/api/students/${studentId}/classes`);
      const classes = classRes.ok ? await classRes.json() : [];

      // Generate recurring events for classes
      let classEvents = [];
      classes.forEach(cls => {
        classEvents = classEvents.concat(generateRecurringEvents(cls));
      });

      // Format custom events from /myCalendar (calendar table)
      const formattedCustom = customEvents.map((event) => ({
        id: Number(event.id),
        title: event.title || event.event_title || "No Title",
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description || "",
        classId: event.class_id || null,
        userId: event.user_id || null,
      }));

      setStudentSchedules((prev) => ({
        ...prev,
        [studentId]: [...formattedCustom, ...classEvents],
      }));
      setSelectedEvents(new Set());
      setShowCheckboxes(false);
    } catch (err) {
      console.error(err);
      alert("Failed to load calendar events");
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchEventsForStudent(selectedStudent.id);
    }
  }, [selectedStudent]);

  // Auto-scroll to current time in week/day view
  useEffect(() => {
    if (view === "week" || view === "day") {
      setTimeout(() => {
        const now = new Date();
        const hour = now.getHours();
        const calendarContent = document.querySelector(".rbc-time-content");
        if (calendarContent) {
          calendarContent.scrollTop = Math.max(0, hour * 40 - 200);
        }
      }, 300);
    }
  }, [view, selectedStudent, studentSchedules]);

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  // Show event description/details on click
  const handleEventClick = (event) => {
    setEventDetails(event);
    setShowEventDetails(true);
  };

  const toggleSelectEvent = (eventId) => {
    setSelectedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allEventIds = (studentSchedules[selectedStudent.id] || []).map((e) => e.id);
    if (selectedEvents.size === allEventIds.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(allEventIds));
    }
  };

  const EventWithCheckbox = ({ event }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        fontWeight: 500,
        color: "#222",
      }}
      onClick={() => handleEventClick(event)}
      title={event.description || ""}
    >
      {showCheckboxes && (
        <input
          type="checkbox"
          checked={selectedEvents.has(event.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelectEvent(event.id);
          }}
          style={{ marginRight: 8 }}
        />
      )}
      <span>{event.title}</span>
    </div>
  );

  const handleNewEventChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "recurringDays") {
      setNewEvent((prev) => ({
        ...prev,
        recurringDays: checked
          ? [...prev.recurringDays, value]
          : prev.recurringDays.filter((d) => d !== value),
      }));
    } else {
      setNewEvent((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const { title, startDate, startTime, endDate, endTime, recurringDays, description } = newEvent;
    if (!title || !startDate || !startTime || !endDate || !endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Helper to format date+time as "YYYY-MM-DD HH:mm:ss"
    const formatDT = (date, time) => moment(`${date} ${time}`).format("YYYY-MM-DD HH:mm:ss");

    let eventsToAdd = [];
    if (recurringDays.length > 0) {
      // Add an event for each recurring day between startDate and endDate
      const start = moment(startDate);
      const end = moment(endDate);
      let curr = start.clone();
      while (curr.isSameOrBefore(end)) {
        const dayName = curr.format("ddd");
        if (recurringDays.includes(dayName)) {
          eventsToAdd.push({
            title,
            start_time: formatDT(curr.format("YYYY-MM-DD"), startTime),
            end_time: formatDT(curr.format("YYYY-MM-DD"), endTime),
            class_id: null,
            user_id: selectedStudent.id,
            description,
          });
        }
        curr.add(1, "day");
      }
    } else {
      // Single event
      eventsToAdd.push({
        title,
        start_time: formatDT(startDate, startTime),
        end_time: formatDT(endDate, endTime),
        class_id: null,
        user_id: selectedStudent.id,
        description,
      });
    }

    try {
      for (const event of eventsToAdd) {
        const res = await fetch("http://localhost:3000/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error("Failed to POST/add event");
      }
      setShowAddEventModal(false);
      setNewEvent({
        title: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        recurringDays: [],
        eventType: "",
        description: "",
      });
      // Refresh events
      fetchEventsForStudent(selectedStudent.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.size === 0) {
      alert("No events selected");
      return;
    }
    if (!window.confirm(`Delete ${selectedEvents.size} selected event(s)?`)) return;

    setDeleting(true);
    try {
      for (const eventId of selectedEvents) {
        const res = await fetch(`http://localhost:3000/api/calendar/${Number(eventId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          console.error(`Failed to delete event with id ${eventId}`);
          continue;
        }
      }

      setStudentSchedules((prev) => {
        const filteredEvents = (prev[selectedStudent.id] || []).filter(
          (event) => !selectedEvents.has(event.id)
        );
        return {
          ...prev,
          [selectedStudent.id]: filteredEvents,
        };
      });
      setSelectedEvents(new Set());
      setShowCheckboxes(false);
    } catch (err) {
      alert(err.message);
    }
    setDeleting(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "5px" }}>
          View Student Schedules
        </h1>
        <p style={{ marginBottom: "20px", fontSize: "16px", color: "#555" }}>
          To add an event, click the "Add Event" button for more options.
        </p>

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
                    style={{
                      ...buttonStyle,
                      backgroundColor: "#2980b9",
                    }}
                    onClick={() => setSelectedStudent(student)}
                  >
                    {student.first_name} {student.last_name}
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
              onClick={() => {
                setSelectedStudent(null);
                setShowCheckboxes(false);
                setSelectedEvents(new Set());
              }}
            >
              ← Back to Student List
            </button>

            <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
              {selectedStudent.first_name} {selectedStudent.last_name}'s Schedule
            </h2>

            <div style={{ marginBottom: 10 }}>
              <button
                style={{ ...buttonStyle, backgroundColor: "#27ae60", marginRight: 10 }}
                onClick={() => setShowAddEventModal(true)}
              >
                + Add Event
              </button>
              <button
                style={{ ...buttonStyle, backgroundColor: "#c0392b" }}
                onClick={() => {
                  setShowCheckboxes((prev) => !prev);
                  setSelectedEvents(new Set());
                }}
              >
                {showCheckboxes ? "Cancel Delete" : "Delete Events"}
              </button>

              {showCheckboxes && (
                <button
                  style={{ ...buttonStyle, marginLeft: 10, backgroundColor: "#2980b9" }}
                  onClick={handleSelectAll}
                >
                  {selectedEvents.size === (studentSchedules[selectedStudent.id]?.length || 0)
                    ? "Unselect All"
                    : "Select All"}
                </button>
              )}

              {showCheckboxes && selectedEvents.size > 0 && (
                <button
                  disabled={deleting}
                  onClick={handleDeleteSelected}
                  style={{ ...buttonStyle, backgroundColor: "#e74c3c", marginLeft: 10 }}
                >
                  {deleting ? "Deleting..." : `Delete Selected (${selectedEvents.size})`}
                </button>
              )}
            </div>

            {/* Add Event Modal */}
            {showAddEventModal && (
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
              }}>
                <div style={{
                  background: "#fff",
                  padding: 32,
                  borderRadius: 12,
                  minWidth: 400,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  maxWidth: "95vw"
                }}>
                  <h2 style={{ marginBottom: 18, color: "#2c3e50" }}>Add New Event</h2>
                  <form onSubmit={handleAddEvent}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>Title</label>
                      <input
                        name="title"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={handleNewEventChange}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          fontSize: 15
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={newEvent.startDate}
                          onChange={handleNewEventChange}
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: 15
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>Start Time</label>
                        <input
                          type="time"
                          name="startTime"
                          value={newEvent.startTime}
                          onChange={handleNewEventChange}
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: 15
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={newEvent.endDate}
                          onChange={handleNewEventChange}
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: 15
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>End Time</label>
                        <input
                          type="time"
                          name="endTime"
                          value={newEvent.endTime}
                          onChange={handleNewEventChange}
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: 15
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>Recurring Days</label>
                      <div style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        background: "#f6f8fa",
                        borderRadius: 6,
                        padding: "8px 10px"
                      }}>
                        {daysOfWeek.map((day) => (
                          <label key={day} style={{ fontWeight: 400, fontSize: 14 }}>
                            <input
                              type="checkbox"
                              name="recurringDays"
                              value={day}
                              checked={newEvent.recurringDays.includes(day)}
                              onChange={handleNewEventChange}
                              style={{ marginRight: 4 }}
                            />
                            {day}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>Type</label>
                      <select
                        name="eventType"
                        value={newEvent.eventType}
                        onChange={handleNewEventChange}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          fontSize: 15
                        }}
                      >
                        <option value="">Select type</option>
                        <option value="class">Class</option>
                        <option value="meeting">Meeting</option>
                        <option value="reminder">Reminder</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>Description</label>
                      <textarea
                        name="description"
                        placeholder="Description (optional)"
                        value={newEvent.description}
                        onChange={handleNewEventChange}
                        style={{
                          width: "100%",
                          minHeight: 60,
                          padding: "10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          fontSize: 15,
                          resize: "vertical"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          backgroundColor: "#bdc3c7",
                          color: "#222"
                        }}
                        onClick={() => setShowAddEventModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          ...buttonStyle,
                          backgroundColor: "#27ae60"
                        }}
                      >
                        Save Event
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Event Details Modal */}
            {showEventDetails && eventDetails && (
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
              }}>
                <div style={{
                  background: "#fff",
                  padding: 32,
                  borderRadius: 14,
                  minWidth: 350,
                  maxWidth: 420,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  position: "relative"
                }}>
                  <button
                    onClick={() => setShowEventDetails(false)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 16,
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      color: "#c0392b",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 style={{ marginBottom: 10, color: "#2c3e50" }}>{eventDetails.title}</h2>
                  <div style={{ marginBottom: 8, color: "#555" }}>
                    <b>Start:</b> {moment(eventDetails.start).format("YYYY-MM-DD HH:mm")}
                  </div>
                  <div style={{ marginBottom: 8, color: "#555" }}>
                    <b>End:</b> {moment(eventDetails.end).format("YYYY-MM-DD HH:mm")}
                  </div>
                  {eventDetails.description && (
                    <div style={{
                      marginTop: 12,
                      padding: "12px 14px",
                      background: "#f8f8f8",
                      borderRadius: 8,
                      color: "#222",
                      fontSize: 15,
                      minHeight: 40
                    }}>
                      <b>Description:</b>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                        {eventDetails.description}
                      </div>
                    </div>
                  )}
                  {!eventDetails.description && (
                    <div style={{
                      marginTop: 12,
                      color: "#aaa",
                      fontStyle: "italic"
                    }}>
                      No description provided.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ position: "relative" }}>
              <Calendar
                localizer={localizer}
                events={studentSchedules[selectedStudent.id] || []}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                selectable={false}
                components={{
                  event: EventWithCheckbox,
                }}
                views={["month", "week", "day"]}
                view={view}
                onView={(newView) => setView(newView)}
                date={date}
                onNavigate={handleNavigate}
                eventPropGetter={(event) =>
                  showCheckboxes && selectedEvents.has(event.id)
                    ? { style: { backgroundColor: "#e74c3c" } }
                    : {}
                }
                ref={calendarRef}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 15px",
  backgroundColor: "#c0392b",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const searchStyle = {
  padding: "10px",
  width: "100%",
  maxWidth: "400px",
  fontSize: "16px",
  marginBottom: "10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};