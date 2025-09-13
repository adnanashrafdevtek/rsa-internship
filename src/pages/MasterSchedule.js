import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

// Dummy teachers
const teachers = [
  { id: 1, name: "Ms. Pam", color: "#ff7f50" },
  { id: 2, name: "Mr. Bum", color: "#1e90ff" },
  { id: 3, name: "Ms. Lee", color: "#32cd32" },
];

// Dummy events
const dummyEvents = [
  { id: 1, title: "Math 101", teacherId: 1, day: "Monday", hour: 9 },
  { id: 2, title: "History 201", teacherId: 2, day: "Wednesday", hour: 11 },
];

// Weekdays and time slots
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = [8, 9, 10, 11, 12, 13, 14, 15]; // 8AM - 3PM

export default function MasterSchedule() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(dummyEvents);
  }, []);

  // Handle assigning a class to a teacher
  const handleAssign = (teacherId, day, hour) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    const existing = events.find((e) => e.teacherId === teacherId && e.day === day && e.hour === hour);
    if (existing) return alert(`${teacher.name} is already booked at ${day} ${hour}:00`);

    const className = prompt(`Enter class name for ${teacher.name} on ${day} at ${hour}:00`);
    if (!className) return;

    const newEvent = { id: events.length + 1, title: className, teacherId, day, hour };
    setEvents([...events, newEvent]);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 40, marginLeft: 250, overflowX: "auto" }}>
        <h1 style={{ fontSize: 36, fontWeight: "bold", marginBottom: 24 }}>Master Schedule</h1>

        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Time</th>
              {teachers.map((t) => (
                <th key={t.id} style={{ border: "1px solid #ccc", padding: 8 }}>{t.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((day) => (
              <React.Fragment key={day}>
                {hours.map((hour) => (
                  <tr key={`${day}-${hour}`}>
                    <td style={{ border: "1px solid #ccc", padding: 8 }}>{day} {hour}:00</td>
                    {teachers.map((t) => {
                      const event = events.find((e) => e.teacherId === t.id && e.day === day && e.hour === hour);
                      return (
                        <td
                          key={t.id}
                          onClick={() => handleAssign(t.id, day, hour)}
                          style={{
                            border: "1px solid #ccc",
                            padding: 8,
                            backgroundColor: event ? t.color : "white",
                            color: event ? "white" : "black",
                            cursor: "pointer",
                          }}
                        >
                          {event ? event.title : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
