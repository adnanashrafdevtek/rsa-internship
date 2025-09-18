import Sidebar from "./Sidebar";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Schedules() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user || user.role !== "admin") {
    return <div style={{ padding: 40 }}><h2>Only admins can view schedules. Please log in as admin.</h2></div>;
  }

  // Dummy data for cards
  const cards = [
    {
      title: "Master Schedule",
      description: "View all events and classes in the school.",
      link: "/master-schedule",
      icon: "📅"
    },
    {
      title: "Teacher Schedules",
      description: "See and manage all teacher schedules.",
      link: "/teacher-list",
      icon: "👨‍🏫"
    },
    {
      title: "Student Schedules",
      description: "See and manage all student schedules.",
      link: "/student-list",
      icon: "🧑‍🎓"
    },
    {
      title: "Create Schedule",
      description: "Add a new schedule for a class, teacher, or student.",
      link: "/create-schedule",
      icon: "➕"
    }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 300, overflowY: "auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "32px" }}>Schedules Overview</h1>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "flex-start", marginLeft: 80 }}>
          {cards.map(card => (
            <HoverCardLink to={card.link} key={card.title}>
              <div style={{ fontSize: 48, marginBottom: 18 }}>{card.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>{card.title}</div>
              <div style={{ fontSize: 18, color: "#555" }}>{card.description}</div>
            </HoverCardLink>
          ))}
        </div>
      </div>
    </div>
  );
}


function HoverCardLink({ to, children }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      style={{
        background: hover ? "#e6fafd" : "#f1faff",
        borderRadius: "16px",
        padding: "32px 48px",
        minWidth: 280,
        maxWidth: 340,
        boxShadow: hover
          ? "0 6px 24px rgba(38,190,221,0.18)"
          : "0 2px 8px rgba(38,190,221,0.08)",
        textDecoration: "none",
        color: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "background 0.2s, box-shadow 0.2s, transform 0.18s cubic-bezier(.4,1.3,.6,1)",
        cursor: "pointer",
        transform: hover ? "scale(1.04)" : "none"
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}
