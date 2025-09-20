import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek as dfStartOfWeek, getDay as dfGetDay, addDays, setHours, setMinutes, setSeconds } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuth } from "../context/AuthContext";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => dfStartOfWeek(date, { weekStartsOn: 1 }),
  getDay: dfGetDay,
  locales: { "en-US": enUS },
});

export default function TeacherAvailability() {
  const { user } = useAuth();
  const urlUserId = new URLSearchParams(window.location.search).get("user_id");
  const userId = urlUserId || user?.id;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [calendarView, setCalendarView] = useState("week");
  const [showModal, setShowModal] = useState(false);

  // Helper to convert day + time to a Date object in the current week
  const timeStringToDate = (dayOfWeek, timeStr) => {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    const start = dfStartOfWeek(new Date(), { weekStartsOn: 1 }); // Monday as week start
    const date = addDays(start, dayOfWeek - 1); // 1=Monday
    return setSeconds(setMinutes(setHours(date, hours), minutes), seconds);
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    fetch(`http://localhost:3000/api/teacher-availability/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const parsedEvents = (data || [])
          .map((e) => ({
            ...e,
            start: timeStringToDate(e.day_of_week, e.start_time),
            end: timeStringToDate(e.day_of_week, e.end_time),
            title: "Available",
          }))
          .filter((e) => e.start.getDay() !== 0 && e.start.getDay() !== 6);
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
      (e) => e.start.getTime() === start.getTime() && e.end.getTime() === end.getTime()
    );
    if (!exists) setEvents([...events, { start, end, title: "Available" }]);
  };

  const handleDone = async () => {
    if (!userId) {
      setMessage("❌ Error: Teacher not found.");
      return;
    }

    try {
      // Convert each event back to day_of_week + HH:mm:ss
      const formattedEvents = events.map((e) => ({
        day_of_week: e.start.getDay(),
        start_time: format(e.start, "HH:mm:ss"),
        end_time: format(e.end, "HH:mm:ss"),
      }));

      const res = await fetch("http://localhost:3000/api/teacher-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: userId, availability: formattedEvents }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save availability");

      setMessage("✅ Availability saved!");
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error saving availability: " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2>Set Your Availability</h2>
        <button
          onClick={handleDone}
          style={{ padding: "10px 20px", backgroundColor: "green", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
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
        step={60}
        timeslots={1}
        min={setHours(new Date(), 6)}
        max={setHours(new Date(), 19)}
        eventPropGetter={() => ({ style: { backgroundColor: "green", color: "white" } })}
        formats={{
          dateHeaderFormat: (date, culture, localizer) =>
            localizer.format(date, "EEE", culture),
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
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-around" }}>
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
  );
}