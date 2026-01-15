import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek as dfStartOfWeek,
  getDay as dfGetDay,
  addDays,
  setHours,
  setMinutes,
  setSeconds,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/SidebarLayout";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => dfStartOfWeek(date, { weekStartsOn: 1 }),
  getDay: dfGetDay,
  locales: { "en-US": enUS },
});

// Simple Day Header (no A/B day)
const CustomHeader = ({ date, label }) => {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{label}</div>
    </div>
  );
};

export default function TeacherAvailability() {
  const { user, logout } = useAuth();
  const urlUserId = new URLSearchParams(window.location.search).get("user_id");
  const userId = urlUserId || user?.id;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [calendarView, setCalendarView] = useState("week");
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Helper: convert day + time string → Date object (current week)
  const timeStringToDate = (dayOfWeek, timeStr) => {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    const start = dfStartOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    const date = addDays(start, dayOfWeek - 1); // 1=Monday
    return setSeconds(setMinutes(setHours(date, hours), minutes), seconds);
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    fetch(`${API_BASE_URL}/api/teacher-availability/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const parsedEvents = (data || []).map((e) => ({
          ...e,
          start: timeStringToDate(e.day_of_week, e.start_time),
          end: timeStringToDate(e.day_of_week, e.end_time),
          title: "Available",
        }));
        setEvents(parsedEvents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSelectEvent = (event) => {
    setEvents(
      events.filter(
        (e) =>
          e.start.getTime() !== event.start.getTime() ||
          e.end.getTime() !== event.end.getTime()
      )
    );
  };

  const handleSelectSlot = ({ start, end }) => {
    const day = start.getDay();
    if (day === 0 || day === 6) return; // skip weekends
    const exists = events.find(
      (e) =>
        e.start.getTime() === start.getTime() &&
        e.end.getTime() === end.getTime()
    );
    if (!exists) setEvents([...events, { start, end, title: "Available" }]);
  };

  const handleDone = async () => {
  try {
    if (!events || events.length === 0) {
      alert("No availability selected.");
      return;
    }

    // Ensure events use valid Date objects
    const formattedEvents = events.map(event => {
      // If the event already has start/end strings, preserve them
      if (typeof event.start === "string" && typeof event.end === "string") {
        return { start: event.start, end: event.end };
      }
      if (!(event.start instanceof Date) || !(event.end instanceof Date)) {
        console.error("❌ Invalid event (not Date):", event);
        return null;
      }
      return {
        start: event.start.toISOString(), // ISO so backend's new Date(...) works
        end: event.end.toISOString(),
      };
    }).filter(e => e !== null);

    console.log("📌 Sending payload:", { teacher_id: userId, events: formattedEvents });

    const response = await fetch("${API_BASE_URL}/api/teacher-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: userId, events: formattedEvents }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data.success) {
      // show modal or alert
      setShowModal(true);
      console.log("✅ Availability saved:", data);
    } else {
      alert("❌ Error saving availability: " + (data.error || "unknown"));
    }
  } catch (err) {
    console.error("❌ handleDone error:", err);
    alert("An unexpected error occurred while saving.");
  }
};

  if (loading) return <SidebarLayout onLogout={handleLogout}><p>Loading...</p></SidebarLayout>;

  return (
    <SidebarLayout onLogout={handleLogout}>
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2>Set Your Availability</h2>
        <button
          onClick={handleDone}
          style={{
            padding: "10px 20px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Save Availability
        </button>
      </div>

      {message && <p>{message}</p>}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        view={calendarView}
        onView={setCalendarView}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        toolbar={false}
        style={{ height: 700 }}
        step={30}
        timeslots={2}
        min={setMinutes(setHours(new Date(), 6), 30)}
        max={setHours(new Date(), 16)}
        eventPropGetter={() => ({
          style: { backgroundColor: "green", color: "white" },
        })}
        formats={{
          dayHeaderFormat: (date, culture, localizer) =>
            localizer.format(date, "EEE", culture),
        }}
        components={{
          week: {
            header: CustomHeader,
          },
        }}
        dayPropGetter={(date) => {
          const day = date.getDay();
          // Hide weekends (0 = Sunday, 6 = Saturday)
          if (day === 0 || day === 6) {
            return { style: { display: 'none' } };
          }
          return {};
        }}
      />

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 40,
              borderRadius: 12,
              textAlign: "center",
              maxWidth: 400,
              width: "80%",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h3>Availability Saved!</h3>
            <p>Do you want to go to the login page or stay here?</p>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  cursor: "pointer",
                }}
              >
                Stay Here
              </button>
              <button
                onClick={() => (window.location.href = "http://localhost:3001")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "green",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </SidebarLayout>
  );
}