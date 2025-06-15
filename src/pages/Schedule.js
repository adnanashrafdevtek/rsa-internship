import React, { useState } from "react";
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

// Dummy calendar events
const dummyEvents = [
  {
    title: "Math",
    start: new Date(2025, 5, 16, 9, 0),
    end: new Date(2025, 5, 16, 10, 30),
  },
  {
    title: "Science",
    start: new Date(2025, 5, 17, 11, 0),
    end: new Date(2025, 5, 17, 12, 30),
  },
  {
    title: "History",
    start: new Date(2025, 5, 18, 14, 0),
    end: new Date(2025, 5, 18, 15, 30),
  },
];

export default function Schedule() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState(dummyEvents);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSelectSlot = ({ start, end }) => {
    const title = prompt("Enter class name:");
    if (title) {
      setEvents([...events, { start, end, title }]);
    }
  };

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