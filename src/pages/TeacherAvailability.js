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
import { getToken } from "../lib/jwt";
import SidebarLayout from "../components/SidebarLayout";

const API_BASE_URL = "http://3.143.57.120:4000";
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => dfStartOfWeek(date, { weekStartsOn: 1 }),
  getDay: dfGetDay,
  locales: { "en-US": enUS },
});

// Simple Day Header
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
  const [selectedTeacherId, setSelectedTeacherId] = useState(urlUserId || null);
  const userId = selectedTeacherId || user?.id;

  const [teacherList, setTeacherList] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message] = useState("");
  // Changed default view to WORK_WEEK to natively hide weekends without breaking grid
  const [calendarView, setCalendarView] = useState(Views.WORK_WEEK); 
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
    const fetchTeachers = async () => {
      try {
        // Hardcoding the exact URL that worked in SchedulesPage.js
        const res = await fetch("http://3.143.57.120:4000/api/teachers"); 
        
        if (!res.ok) {
          console.error("Server responded with a bad status:", res.status);
          setTeacherList([]);
          return;
        }
        
        const data = await res.json();
        console.log("Teacher data received:", data); // <-- This will help us debug!
        
        setTeacherList(data || []);
      } catch (err) {
        console.error("Error fetching teachers from backend:", err);
        setTeacherList([]);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const token = getToken();

    fetch(`${API_BASE_URL}/api/teacher-availability/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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
    // Added a quick confirmation so teachers don't accidentally delete slots
    if (window.confirm("Remove this availability slot?")) {
      setEvents(
        events.filter(
          (e) =>
            e.start.getTime() !== event.start.getTime() ||
            e.end.getTime() !== event.end.getTime()
        )
      );
    }
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

      const formattedEvents = events.map(event => {
        if (typeof event.start === "string" && typeof event.end === "string") {
          return { start: event.start, end: event.end };
        }
        if (!(event.start instanceof Date) || !(event.end instanceof Date)) {
          console.error("❌ Invalid event (not Date):", event);
          return null;
        }
        return {
          start: event.start.toISOString(),
          end: event.end.toISOString(),
        };
      }).filter(e => e !== null);

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/teacher-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teacher_id: userId, events: formattedEvents }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowModal(true);
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
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2>Set Teacher Availability</h2>
            {user?.role === "admin" && (
              <select
                value={selectedTeacherId || ""}
                onChange={(e) => setSelectedTeacherId(e.target.value || null)}
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  minWidth: 260,
                }}
              >
                <option value="">Select a Teacher</option>
                {teacherList.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>
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
          defaultView={Views.WORK_WEEK} // Updated to work_week
          views={[Views.WORK_WEEK]} // Only allow work_week view
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
            work_week: { // Must match the view name
              header: CustomHeader,
            },
          }}
          // Removed the broken dayPropGetter
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
                  // Fixed the hardcoded localhost port!
                  onClick={() => (window.location.href = "/")} 
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