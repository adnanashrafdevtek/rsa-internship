import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Schedule() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch schedule events from backend for current user
  useEffect(() => {
    if (!user?.username) return;

    fetch(`http://localhost:5000/api/schedule?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => {
        // Make sure your backend returns array of events with start/end as ISO strings or timestamps
        const formattedEvents = data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(formattedEvents);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading schedule:", err);
        setLoading(false);
      });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSelectSlot = ({ start, end }) => {
    const title = prompt("Enter class name:");
    if (title) {
      setEvents([...events, { start, end, title }]);
      // Optional: POST to backend here to save new event permanently
    }
  };

  if (loading) return <p>Loading schedule...</p>;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{ flex: 1, padding: "20px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "20px" }}>
          {user?.username}'s Schedule
        </h1>

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          style={{ height: "80vh" }}
        />
      </div>
    </div>
  );
}