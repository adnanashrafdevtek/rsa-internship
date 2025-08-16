import React, { useState, useEffect } from "react";
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

    // Format custom events
    const formattedCustom = customEvents.map((event) => ({
      id: Number(event.id),
      title: event.title || "No Title",
      start: new Date(event.start_time),
      end: new Date(event.end_time),
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

  const handleSelectSlot = async ({ start, end }) => {
    if (showCheckboxes) return;

    const title = window.prompt("Enter event title:");
    if (!title) return;

    const classId = 1;

    try {
      const res = await fetch("http://localhost:3000/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: moment(start).format("YYYY-MM-DD HH:mm:ss"),
          end_time: moment(end).format("YYYY-MM-DD HH:mm:ss"),
          class_id: classId,
          event_title: title,
        }),
      });

      if (!res.ok) throw new Error("Failed to add event");

      const newEvent = await res.json();

      setStudentSchedules((prev) => {
        const currentEvents = prev[selectedStudent.id] || [];
        return {
          ...prev,
          [selectedStudent.id]: [
            ...currentEvents,
            {
              id: Number(newEvent.idcalendar),
              title,
              start: new Date(newEvent.start_time),
              end: new Date(newEvent.end_time),
            },
          ],
        };
      });
    } catch (err) {
      alert(err.message);
    }
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


  const fetchStudentClasses = async (studentId) => {
  const res = await fetch(`http://localhost:3000/api/students/${studentId}/classes`);
  if (!res.ok) throw new Error("Failed to fetch student classes");
  return await res.json();
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
        const res = await fetch(`http://localhost:3000/calendar/${Number(eventId)}`, {
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

  const handleSelectAll = () => {
    const allEventIds = (studentSchedules[selectedStudent.id] || []).map((e) => e.id);
    if (selectedEvents.size === allEventIds.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(allEventIds));
    }
  };

  const EventWithCheckbox = ({ event }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      {showCheckboxes && (
        <input
          type="checkbox"
          checked={selectedEvents.has(event.id)}
          onChange={() => toggleSelectEvent(event.id)}
          style={{ marginRight: 8 }}
        />
      )}
      <span>{event.title}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "5px" }}>
          View Student Schedules
        </h1>
        <p style={{ marginBottom: "20px", fontSize: "16px", color: "#555" }}>
          To add an event, drag and select a time slot on the calendar. A prompt will ask you to enter the event title.
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

            <Calendar
              localizer={localizer}
              events={studentSchedules[selectedStudent.id] || []}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              selectable={!showCheckboxes}
              onSelectSlot={handleSelectSlot}
              components={{
                event: EventWithCheckbox,
              }}
              views={["month", "week", "day"]}
              view={view}
              onView={(newView) => setView(newView)}
              defaultDate={new Date()}
              eventPropGetter={(event) =>
                showCheckboxes && selectedEvents.has(event.id)
                  ? { style: { backgroundColor: "#e74c3c" } }
                  : {}
              }
            />
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
