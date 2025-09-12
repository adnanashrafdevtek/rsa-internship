import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { useSearchParams } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date()), getDay, locales });

export default function TeacherAvailability() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]); // safe empty array
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user_id");

  // Fetch teachers safely
  useEffect(() => {
    fetch("http://localhost:3000/api/teachers")
      .then(res => res.json())
      .then(data => setTeachers(data || [])) // default to empty array
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle selecting calendar slot
  const handleSelectSlot = ({ start, end }) => {
    const newEvent = { start, end, title: "Available", user_id: userId };
    setEvents([...events, newEvent]);
  };

  // Handle Done button
  const handleDone = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, events }),
      });

      if (!res.ok) throw new Error("Failed to save availability");
      alert("✅ Availability saved!");
      window.location.href = "http://localhost:3001"; // redirect after save
    } catch (err) {
      console.error(err);
      alert("❌ Error sending availability: " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Set Your Weekly Availability</h2>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        style={{ height: 500, margin: "20px" }}
        onSelectSlot={handleSelectSlot}
      />

      <button
        onClick={handleDone}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Done
      </button>

      <h3>Other Teachers</h3>
      {teachers.length === 0 ? (
        <p>No teachers found</p>
      ) : (
        teachers.map(t => (
          <div key={t.id}>
            {t.first_name} {t.last_name}
          </div>
        ))
      )}
    </div>
  );
}