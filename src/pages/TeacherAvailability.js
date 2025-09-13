import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek as dfStartOfWeek, getDay as dfGetDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => dfStartOfWeek(date, { weekStartsOn: 1 }), // week starts on Monday
  getDay: dfGetDay,
  locales: { "en-US": enUS },
});

export default function TeacherAvailability() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [calendarView, setCalendarView] = useState("week");

  const userId = new URLSearchParams(window.location.search).get("user_id");

  useEffect(() => {
    fetch(`http://localhost:3000/api/teacher-availability/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const parsedEvents = (data || [])
          .map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))
          .filter((e) => {
            const day = e.start.getDay();
            return day !== 0 && day !== 6; // remove Sat/Sun
          });
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
    if (day === 0 || day === 6) return; // ignore weekends
    const exists = events.find(
      (e) => e.start.getTime() === start.getTime() && e.end.getTime() === end.getTime()
    );
    if (!exists) setEvents([...events, { start, end, title: "Available" }]);
  };

  const handleDone = async () => {
    try {
      const formattedEvents = events.map((e) => ({
        start: format(e.start, "yyyy-MM-dd HH:mm:ss"),
        end: format(e.end, "yyyy-MM-dd HH:mm:ss"),
      }));
      const res = await fetch("http://localhost:3000/api/teacher-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: userId, events: formattedEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save availability");
      setMessage("✅ Availability saved!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error saving availability: " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      {/* Header and Save button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
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

      {/* Message */}
      {message && <p>{message}</p>}

      {/* Calendar */}
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
        style={{ height: 700, margin: 0 }}
        step={60}
        timeslots={1}
        min={new Date(1970, 1, 1, 6, 0, 0)}
        max={new Date(1970, 1, 1, 19, 0, 0)}
        eventPropGetter={() => ({ style: { backgroundColor: "green", color: "white" } })}
        formats={{
          dateHeaderFormat: (date, culture, localizer) =>
            localizer.format(date, "EEE", culture), // Only weekday name, no numbers
        }}
        dayPropGetter={(date) => {
          const day = date.getDay();
          if (day === 0 || day === 6) return { style: { display: "none" } }; // hide weekends
          return {};
        }}
      />
    </div>
  );
}