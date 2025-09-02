




import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../App.css";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from "recharts";
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Simple modal for event details
function EventModal({ event, onClose, onDelete }) {
  if (!event) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
        <h2 style={{ marginTop: 0 }}>{event.title}</h2>
        <div style={{ marginBottom: 12 }}>
          <b>Start:</b> {new Date(event.start).toLocaleString()}<br />
          <b>End:</b> {new Date(event.end).toLocaleString()}<br />
          {event.description && <><b>Description:</b> {event.description}<br /></>}
          {event.class_id && <><b>Class ID:</b> {event.class_id}<br /></>}
          {event.user_id && <><b>User ID:</b> {event.user_id}<br /></>}
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
          <button style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>Close</button>
          <button style={{ background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// Style objects for admin dashboard cards and buttons
const cardStyle = {
  background: "#f9f9f9",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const quickStatCard = {
  background: "#f1faff",
  borderRadius: "12px",
  padding: "24px 32px",
  minWidth: 120,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxShadow: "0 2px 8px rgba(38,190,221,0.08)",
  fontWeight: 600,
  fontSize: 18
};

const quickStatNum = {
  fontSize: 32,
  fontWeight: 900,
  color: "#26bedd",
  marginBottom: 6
};

const quickActionBtn = {
  background: "#26bedd",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "12px 20px",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(38,190,221,0.08)",
  transition: "background 0.2s"
};

export default function Home() {

  // For hover/active effects on stat/action cards
  const [hovered, setHovered] = useState(null);
  const [active, setActive] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  // Admin data
  const [pendingTasks, setPendingTasks] = useState(null);
  const [quickStats, setQuickStats] = useState({ students: 0, teachers: 0, classes: 0 });
  const [recentSignups, setRecentSignups] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  // Master schedule events
  const [masterEvents, setMasterEvents] = useState([]);

  // Student/Teacher schedule
  const [schedule, setSchedule] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [nextBreak, setNextBreak] = useState(null);

  // State for calendar event modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  // Fetch admin data
  useEffect(() => {
    if (user?.role !== "admin") return;
    // ...fetchAdminData logic here (already in your code)...

    // Fetch all events for master schedule (all calendar events)
    fetch("/api/calendar")
      .then(res => res.json())
      .then(data => {
        // Expecting data as array of { title, start_time, end_time, ... }
        setMasterEvents(
          (data || []).map(ev => ({
            ...ev,
            title: ev.event_title || ev.title,
            start: new Date(ev.start_time || ev.start),
            end: new Date(ev.end_time || ev.end)
          }))
        );
      })
      .catch(() => setMasterEvents([]));
  }, [user]);

  // Fetch schedule for student/teacher
  useEffect(() => {
    // ...fetchSchedule logic here (already in your code)...
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 300, overflowY: "auto" }}>
        <h1 style={{ fontSize: "40px", fontWeight: "bold", marginBottom: "24px" }}>
          Welcome, <span style={{ color: "#26bedd" }}>{capitalizeFirst(user?.username)}</span>
        </h1>
        <p style={{ fontSize: "24px", marginBottom: "40px", color: "#333" }}>
          {time.toLocaleTimeString()}
        </p>
        {user?.role === "admin" && (
          <>
            {/* Quick Stat Cards Row as Action Buttons */}
            <div style={{ display: "flex", gap: 32, marginBottom: 48, justifyContent: "center" }}>
              {[
                {
                  label: "Add User",
                  value: "+",
                  onClick: () => navigate("/add-user"),
                  title: "Add a new user",
                  key: "add-user"
                },
                {
                  label: "Add Class",
                  value: "+",
                  onClick: () => navigate("/class"),
                  title: "Add a new class",
                  key: "add-class"
                },
                {
                  label: "Manage Users",
                  value: quickStats.students + quickStats.teachers,
                  onClick: () => navigate("/student"),
                  title: "Manage all users",
                  key: "manage-users"
                },
                {
                  label: "Manage Schedules",
                  value: "🗓️",
                  onClick: () => navigate("/schedules"),
                  title: "Manage all schedules",
                  key: "manage-schedules"
                }
              ].map((btn, idx) => {
                const isHovered = hovered === idx;
                const isActive = active === idx;
                return (
                  <button
                    key={btn.key}
                    style={{
                      ...quickStatCard,
                      cursor: "pointer",
                      border: isActive
                        ? "2.5px solid #189ab4"
                        : isHovered
                        ? "2.5px solid #26bedd"
                        : "2px solid #26bedd",
                      background: isActive
                        ? "#e0f7fa"
                        : isHovered
                        ? "#e6fafd"
                        : quickStatCard.background,
                      boxShadow: isActive
                        ? "0 4px 16px rgba(38,190,221,0.18)"
                        : isHovered
                        ? "0 4px 16px rgba(38,190,221,0.12)"
                        : quickStatCard.boxShadow,
                      transform: isActive
                        ? "scale(0.97)"
                        : isHovered
                        ? "scale(1.03)"
                        : "none",
                      minWidth: 160,
                      transition: "all 0.18s cubic-bezier(.4,1.3,.6,1)",
                    }}
                    onClick={btn.onClick}
                    title={btn.title}
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(null)}
                    onMouseDown={() => setActive(idx)}
                    onMouseUp={() => setActive(null)}
                  >
                    <div style={quickStatNum}>{btn.value}</div>
                    <div>{btn.label}</div>
                  </button>
                );
              })}
            </div>
            {/* Main Content Row: Master Schedule and Recent Signups */}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap", justifyContent: "center", alignItems: "stretch", margin: "0 auto 32px auto", width: "100%" }}>
              {/* Master Schedule Calendar */}
              <div style={{ ...cardStyle, alignItems: "flex-start", minWidth: 700, flex: 2, width: '100%', padding: 48, maxWidth: 1100 }}>
                <h2 style={{ fontSize: 36, marginBottom: 28 }}>Master Schedule</h2>
                <div style={{ width: '100%', minHeight: 650 }}>
                  <Calendar
                    localizer={localizer}
                    events={masterEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 650, width: '100%' }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    defaultView={Views.WEEK}
                    popup
                    onSelectEvent={event => setSelectedEvent(event)}
                  />
                  <EventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onDelete={async () => {
                      if (!selectedEvent) return;
                      setDeleting(true);
                      try {
                        await fetch(`/api/calendar/${selectedEvent.idcalendar || selectedEvent.id}`, { method: 'DELETE' });
                        setMasterEvents(events => events.filter(ev => (ev.idcalendar || ev.id) !== (selectedEvent.idcalendar || selectedEvent.id)));
                        setSelectedEvent(null);
                      } catch (e) {
                        alert('Failed to delete event');
                      } finally {
                        setDeleting(false);
                      }
                    }}
                  />
                </div>
              </div>
              {/* Recent Signups / Pending Activations */}
              <div style={{ ...cardStyle, alignItems: "flex-start", minWidth: 400, flex: 1, fontSize: 24, padding: 48, maxWidth: 600 }}>
                <h2 style={{ fontSize: 36, marginBottom: 28 }}>Recent Signups / Pending Activations</h2>
                {recentSignups.length === 0 ? (
                  <p style={{ fontSize: 22 }}>No recent signups.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 32, fontSize: 22 }}>
                    {recentSignups.map((u, idx) => (
                      <li key={idx} style={{ marginBottom: 16 }}>
                        <strong>{u.name}</strong> ({u.email}) - {u.status} <span style={{ color: '#888', fontSize: 16 }}>({u.date})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

