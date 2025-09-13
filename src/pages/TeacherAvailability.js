import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek as dfStartOfWeek, getDay as dfGetDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: dfStartOfWeek,
  getDay: dfGetDay,
  locales: { "en-US": enUS },
});

export default function TeacherAvailability() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [calendarView, setCalendarView] = useState("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalTimes, setModalTimes] = useState([]);

  const userId = new URLSearchParams(window.location.search).get("user_id");

  // Fetch existing availability
  useEffect(() => {
    fetch(`http://localhost:3000/api/teacher-availability/${userId}`)
      .then(res => res.json())
      .then(data => {
        const parsedEvents = (data || []).map(e => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(parsedEvents);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  // Handle event clicks
  const handleSelectEvent = (event) => {
    // Only delete immediately in weekly view
    if (calendarView === "week") {
      setEvents(events.filter(e =>
        e.start.getTime() !== event.start.getTime() || e.end.getTime() !== event.end.getTime()
      ));
    }
    // In monthly view, clicking an event does nothing
  };

  // Handle slot selection
  const handleSelectSlot = ({ start, end }) => {
    if (calendarView === "week") {
      // Weekly: add new availability immediately
      const exists = events.find(e => e.start.getTime() === start.getTime() && e.end.getTime() === end.getTime());
      if (!exists) {
        setEvents([...events, { start, end, title: "Available" }]);
      }
    } else if (calendarView === "month") {
      // Monthly: open modal to add times
      setModalDate(start);
      setModalTimes([{ allDay: true, startTime: "09:00", endTime: "17:00", note: "", alsoAvailableFor: "High School" }]);
      setModalOpen(true);
    }
  };

  // Save modal times
  const handleModalSave = () => {
    const newEvents = modalTimes.map(t => {
      const start = t.allDay
        ? new Date(new Date(modalDate).setHours(0, 0, 0, 0))
        : new Date(`${format(modalDate, "yyyy-MM-dd")}T${t.startTime}`);
      const end = t.allDay
        ? new Date(new Date(modalDate).setHours(23, 59, 59, 999))
        : new Date(`${format(modalDate, "yyyy-MM-dd")}T${t.endTime}`);
      return { start, end, title: t.note || "Available", alsoAvailableFor: t.alsoAvailableFor };
    });
    setEvents([...events, ...newEvents]);
    setModalOpen(false);
  };

  // Save availability to backend
  const handleDone = async () => {
    try {
      const formattedEvents = events.map(e => ({
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
      <h2>Set Your Availability</h2>
      {message && <p>{message}</p>}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onView={view => setCalendarView(view)} // ensures view actually switches
        view={calendarView} // controlled view
        defaultView="week"
        views={["week", "month"]}
        style={{ height: 700, margin: 20 }}
        eventPropGetter={() => ({ style: { backgroundColor: "green", color: "white" } })}
      />

      <button
        onClick={handleDone}
        style={{
          marginTop: 20,
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

      {/* Monthly view modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex",
          justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "white", padding: 20, borderRadius: 8, minWidth: 300 }}>
            <h3>Available Times for {format(modalDate, "eeee, MMMM do")}</h3>

            {modalTimes.map((t, idx) => (
              <div key={idx} style={{ marginBottom: 10, borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={t.allDay}
                    onChange={e => {
                      const newTimes = [...modalTimes];
                      newTimes[idx].allDay = e.target.checked;
                      setModalTimes(newTimes);
                    }}
                  />{" "}
                  All Day
                </label>

                {!t.allDay && (
                  <>
                    <div>
                      From: <input type="time" value={t.startTime} onChange={e => {
                        const newTimes = [...modalTimes];
                        newTimes[idx].startTime = e.target.value;
                        setModalTimes(newTimes);
                      }} />
                    </div>
                    <div>
                      Until: <input type="time" value={t.endTime} onChange={e => {
                        const newTimes = [...modalTimes];
                        newTimes[idx].endTime = e.target.value;
                        setModalTimes(newTimes);
                      }} />
                    </div>
                  </>
                )}

                <div>
                  Note: <input type="text" value={t.note} onChange={e => {
                    const newTimes = [...modalTimes];
                    newTimes[idx].note = e.target.value;
                    setModalTimes(newTimes);
                  }} />
                </div>

                <div>
                  Also available for:{" "}
                  <select value={t.alsoAvailableFor} onChange={e => {
                    const newTimes = [...modalTimes];
                    newTimes[idx].alsoAvailableFor = e.target.value;
                    setModalTimes(newTimes);
                  }}>
                    <option>High School</option>
                    <option>Middle School</option>
                  </select>
                </div>
              </div>
            ))}

            <button onClick={() => setModalTimes([...modalTimes, { allDay: true, startTime: "09:00", endTime: "17:00", note: "", alsoAvailableFor: "High School" }])}>
              Add Another Time
            </button>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
              <button onClick={handleModalSave}>Save</button>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}