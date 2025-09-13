import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment 
from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

function CreateSchedule() {
  const localizer = momentLocalizer(moment);
  // Track if Select All was clicked to show Unselect All
  const [showUnselect, setShowUnselect] = useState(false);
  const teachers = [
    { id: 1, name: "Alice Smith" },
    { id: 2, name: "Bob Johnson" },
    { id: 3, name: "Carol Lee" },
    { id: 4, name: "David Kim" }
  ];
  const rooms = ["101", "102", "201", "202", "301", "302"];
  const grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [details, setDetails] = useState({
    teacherId: "",
    grade: "",
    subject: "",
    room: "",
    startTime: "",
    endTime: ""
  });
  // For event details modal
  const [eventDetailsModal, setEventDetailsModal] = useState({ open: false, event: null });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);

  // Fixed weekly schedules for each teacher
  const teacherColors = ["#27ae60", "#26bedd", "#f39c12", "#8e44ad"];
  // Each teacher gets a different pattern for Mon-Fri
  const teacherAvailability = {
    1: [ // Alice Smith
      { start: moment().startOf('week').add(1, 'days').set({ hour: 8, minute: 0 }).toDate(), end: moment().startOf('week').add(1, 'days').set({ hour: 11, minute: 0 }).toDate(), color: teacherColors[0] },
      { start: moment().startOf('week').add(2, 'days').set({ hour: 9, minute: 0 }).toDate(), end: moment().startOf('week').add(2, 'days').set({ hour: 12, minute: 0 }).toDate(), color: teacherColors[0] },
      { start: moment().startOf('week').add(3, 'days').set({ hour: 7, minute: 0 }).toDate(), end: moment().startOf('week').add(3, 'days').set({ hour: 10, minute: 0 }).toDate(), color: teacherColors[0] },
      { start: moment().startOf('week').add(4, 'days').set({ hour: 13, minute: 0 }).toDate(), end: moment().startOf('week').add(4, 'days').set({ hour: 16, minute: 0 }).toDate(), color: teacherColors[0] },
      { start: moment().startOf('week').add(5, 'days').set({ hour: 8, minute: 0 }).toDate(), end: moment().startOf('week').add(5, 'days').set({ hour: 11, minute: 0 }).toDate(), color: teacherColors[0] },
    ],
    2: [ // Bob Johnson
      { start: moment().startOf('week').add(1, 'days').set({ hour: 13, minute: 0 }).toDate(), end: moment().startOf('week').add(1, 'days').set({ hour: 16, minute: 0 }).toDate(), color: teacherColors[1] },
      { start: moment().startOf('week').add(2, 'days').set({ hour: 7, minute: 0 }).toDate(), end: moment().startOf('week').add(2, 'days').set({ hour: 10, minute: 0 }).toDate(), color: teacherColors[1] },
      { start: moment().startOf('week').add(3, 'days').set({ hour: 9, minute: 0 }).toDate(), end: moment().startOf('week').add(3, 'days').set({ hour: 12, minute: 0 }).toDate(), color: teacherColors[1] },
      { start: moment().startOf('week').add(4, 'days').set({ hour: 8, minute: 0 }).toDate(), end: moment().startOf('week').add(4, 'days').set({ hour: 11, minute: 0 }).toDate(), color: teacherColors[1] },
      { start: moment().startOf('week').add(5, 'days').set({ hour: 13, minute: 0 }).toDate(), end: moment().startOf('week').add(5, 'days').set({ hour: 16, minute: 0 }).toDate(), color: teacherColors[1] },
    ],
    3: [ // Carol Lee
      { start: moment().startOf('week').add(1, 'days').set({ hour: 9, minute: 0 }).toDate(), end: moment().startOf('week').add(1, 'days').set({ hour: 12, minute: 0 }).toDate(), color: teacherColors[2] },
      { start: moment().startOf('week').add(2, 'days').set({ hour: 13, minute: 0 }).toDate(), end: moment().startOf('week').add(2, 'days').set({ hour: 16, minute: 0 }).toDate(), color: teacherColors[2] },
      { start: moment().startOf('week').add(3, 'days').set({ hour: 8, minute: 0 }).toDate(), end: moment().startOf('week').add(3, 'days').set({ hour: 11, minute: 0 }).toDate(), color: teacherColors[2] },
      { start: moment().startOf('week').add(4, 'days').set({ hour: 7, minute: 0 }).toDate(), end: moment().startOf('week').add(4, 'days').set({ hour: 10, minute: 0 }).toDate(), color: teacherColors[2] },
      { start: moment().startOf('week').add(5, 'days').set({ hour: 9, minute: 0 }).toDate(), end: moment().startOf('week').add(5, 'days').set({ hour: 12, minute: 0 }).toDate(), color: teacherColors[2] },
    ],
    4: [ // David Kim
      { start: moment().startOf('week').add(1, 'days').set({ hour: 7, minute: 0 }).toDate(), end: moment().startOf('week').add(1, 'days').set({ hour: 10, minute: 0 }).toDate(), color: teacherColors[3] },
      { start: moment().startOf('week').add(2, 'days').set({ hour: 8, minute: 0 }).toDate(), end: moment().startOf('week').add(2, 'days').set({ hour: 11, minute: 0 }).toDate(), color: teacherColors[3] },
      { start: moment().startOf('week').add(3, 'days').set({ hour: 13, minute: 0 }).toDate(), end: moment().startOf('week').add(3, 'days').set({ hour: 16, minute: 0 }).toDate(), color: teacherColors[3] },
      { start: moment().startOf('week').add(4, 'days').set({ hour: 9, minute: 0 }).toDate(), end: moment().startOf('week').add(4, 'days').set({ hour: 12, minute: 0 }).toDate(), color: teacherColors[3] },
      { start: moment().startOf('week').add(5, 'days').set({ hour: 8, minute: 0 }).toDate(), end: moment().startOf('week').add(5, 'days').set({ hour: 11, minute: 0 }).toDate(), color: teacherColors[3] },
    ],
  };

  // When user selects a slot on the calendar, only allow adding if not a teacher availability block
  const handleSelectSlot = ({ start, end }) => {
    // Prevent adding events if the slot overlaps with a teacher availability block
    const isAvailability = selectedTeachers.some(tid =>
      teacherAvailability[tid].some(slot =>
        start < slot.end && slot.start < end
      )
    );
    if (isAvailability) return;
    setSelectedSlot({ start, end });
    setDetails(d => ({ ...d, startTime: moment(start).format("h:mm A"), endTime: moment(end).format("h:mm A") }));
    setModalOpen(true);
  };

  // Handle modal input changes
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(d => ({ ...d, [name]: value }));
  };

  // Save event from modal
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!details.teacherId || !details.grade || !details.subject || !details.room) return;
    setEvents(evts => [
      ...evts,
      {
        id: Math.random().toString(36).substr(2, 9),
        // Only class name and teacher shown in calendar
        title: `${details.subject}`,
        start: selectedSlot.start,
        end: selectedSlot.end,
        teacher: teachers.find(t => t.id == details.teacherId)?.name,
        grade: details.grade,
        subject: details.subject,
        room: details.room
      }
    ]);
    setModalOpen(false);
    setSelectedSlot(null);
    setDetails({ teacherId: "", grade: "", subject: "", room: "" });
  };

  // Toggle delete mode
  const handleDeleteMode = () => {
    setDeleteMode(dm => !dm);
    setSelectedToDelete([]);
  };

  // Confirm delete selected events
  const handleConfirmDelete = () => {
    setEvents(evts => evts.filter(ev => !selectedToDelete.includes(ev.id)));
    setDeleteMode(false);
    setSelectedToDelete([]);
  };

  // Overlap detection (returns array of event ids that overlap)
  const getOverlappingEventIds = () => {
    const ids = new Set();
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i], b = events[j];
        if (a.start < b.end && b.start < a.end) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return Array.from(ids);
  };

  // Delete event by id (used for single delete, not in delete mode)
  const handleDeleteEvent = (eventId) => {
    setEvents(evts => evts.filter(ev => ev.id !== eventId));
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
  <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 320, overflowY: "auto", display: "flex" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 16 }}>
            <h1 style={{ fontSize: "36px", fontWeight: "bold", margin: 0 }}>Create Schedule</h1>
          </div>
          {/* Labels removed for cleaner look */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18, gap: 16 }}>
            <button
              onClick={() => window.location.href = "/schedules"}
              style={{
                background: "#95a5a6",
                color: "white",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(149,165,166,0.12)",
                transition: "background 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = "#7f8c8d"}
              onMouseLeave={e => e.target.style.background = "#95a5a6"}
            >Back</button>
            <button
              onClick={handleDeleteMode}
              style={{
                background: deleteMode ? "#c0392b" : "#e74c3c",
                color: "white",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(231,76,60,0.12)",
                transition: "background 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = "#c0392b"}
              onMouseLeave={e => e.target.style.background = deleteMode ? "#c0392b" : "#e74c3c"}
            >{deleteMode ? "Cancel Delete" : "Delete"}</button>
            {deleteMode && (
              <button
                onClick={handleConfirmDelete}
                disabled={selectedToDelete.length === 0}
                style={{
                  background: selectedToDelete.length === 0 ? "#bdc3c7" : "#e74c3c",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 22px",
                  cursor: selectedToDelete.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(231,76,60,0.12)",
                  marginLeft: 8,
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => { if (selectedToDelete.length > 0) e.target.style.background = "#c0392b"; }}
                onMouseLeave={e => { if (selectedToDelete.length > 0) e.target.style.background = "#e74c3c"; }}
              >Confirm Delete</button>
            )}
            {getOverlappingEventIds().length > 0 && (
              <div style={{ background: "#fffbe6", border: "2px solid #e74c3c", borderRadius: 10, padding: "10px 18px", color: "#c0392b", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: "#e74c3c" }}>⚠️ Some events overlap. Please review highlighted events in the calendar.</span>
              </div>
            )}
          </div>
          <div style={{ background: "#f8f9fa", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxWidth: 900 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#222", marginBottom: 8 }}>
              Master Schedule Calendar
            </div>
            <Calendar
              localizer={localizer}
              events={[
                ...events,
                ...selectedTeachers.flatMap((tid, tIdx) => teacherAvailability[tid].map((slot, idx) => ({
                  id: `avail-${tid}-${idx}`,
                  start: slot.start,
                  end: slot.end,
                  availability: true,
                  color: slot.color
                })))
              ]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              selectable
              onSelectSlot={handleSelectSlot}
              views={{ week: true }}
              defaultView="week"
              toolbar={false}
              popup={false}
              min={moment().startOf('day').set({ hour: 7, minute: 0 }).toDate()}
              max={moment().startOf('day').set({ hour: 16, minute: 0 }).toDate()}
              eventPropGetter={event => {
                if (event.availability) {
                  return {
                    style: {
                      backgroundColor: event.color || "#27ae60",
                      color: "white",
                      opacity: 0.85,
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                      padding: "2px 6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "box-shadow 0.2s",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                      height: "100%"
                    }
                  };
                }
                const isOverlapping = getOverlappingEventIds().includes(event.id);
                return {
                  style: {
                    backgroundColor: isOverlapping ? "#ffeaea" : "#26bedd",
                    color: isOverlapping ? "#c0392b" : "white",
                    borderRadius: 8,
                    fontWeight: 600,
                    border: isOverlapping ? "2px solid #e74c3c" : "none",
                    boxShadow: isOverlapping ? "0 0 8px #e74c3c" : "0 0 4px #26bedd",
                    cursor: deleteMode && !event.availability ? "pointer" : "default",
                    transition: "box-shadow 0.2s, background 0.2s"
                  }
                };
              }}
              components={{
                event: ({ event }) => {
                  const isSelected = selectedToDelete.includes(event.id);
                  if (event.availability) {
                    // Teacher availability block: show colored block with label
                    return (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: event.color || "#27ae60",
                        opacity: 0.85,
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        pointerEvents: "none",
                        userSelect: "none"
                      }}>
                          <span style={{
                            position: "absolute",
                            top: 4,
                            left: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            textAlign: "left",
                            background: "rgba(0,0,0,0.18)",
                            borderRadius: 6,
                            padding: "2px 8px",
                            maxWidth: "80%",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis"
                          }}>Available</span>
                      </div>
                    );
                  }
                  // Scheduled class block: show class label and color
                  return (
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        padding: "6px 8px 4px 8px",
                        boxShadow: isSelected ? "0 0 0 3px #e74c3c" : undefined,
                        border: isSelected ? "2px solid #e74c3c" : undefined,
                        background: isSelected ? "#fff0f0" : "#26bedd",
                        transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                        cursor: deleteMode ? "pointer" : "pointer"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = "0 0 12px #26bedd";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = isSelected ? "0 0 0 3px #e74c3c" : "0 0 4px #26bedd";
                      }}
                      onClick={() => {
                        if (deleteMode) {
                          setSelectedToDelete(sel =>
                            sel.includes(event.id)
                              ? sel.filter(id => id !== event.id)
                              : [...sel, event.id]
                          );
                        } else {
                          setEventDetailsModal({ open: true, event });
                        }
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: 4,
                        left: 0,
                        right: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        textAlign: "center",
                        background: "#26bedd",
                        borderRadius: 6,
                        padding: "2px 0"
                      }}>Class</span>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: "#222", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 16 }}>{event.title}</div>
                      {event.teacher && (
                        <div style={{ fontSize: 11, color: "#fff", opacity: 0.8, textAlign: "right", marginTop: "auto" }}>{event.teacher}</div>
                      )}
                      {deleteMode && (
                        <span style={{ position: "absolute", right: 0, top: 2, fontSize: 12, color: isSelected ? "#e74c3c" : "#888", fontWeight: 700 }}>
                          {isSelected ? "Selected" : "Click to select"}
                        </span>
                      )}
                    </div>
                  );
                }
              }}
              daysOfWeek={[1,2,3,4,5]}
            />
          </div>
          {modalOpen && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
            }}>
              <form onSubmit={handleSaveEvent} style={{ background: "#fff", padding: 32, borderRadius: 16, minWidth: 340, boxShadow: "0 8px 32px rgba(38,190,221,0.18)" }}>
                <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: 24 }}>Add Schedule Details</h2>
                <div style={{ marginBottom: 18, fontWeight: 600, fontSize: 16 }}>
                  <span>Start Time: {details.startTime || (selectedSlot && moment(selectedSlot.start).format("h:mm A"))}</span>
                  <div style={{ height: 12 }} />
                  <span>End Time: {details.endTime || (selectedSlot && moment(selectedSlot.end).format("h:mm A"))}</span>
                </div>
                <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Teacher</label>
                <select name="teacherId" value={details.teacherId} onChange={handleDetailChange} required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 18, fontSize: 16 }}>
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Grade</label>
                <select name="grade" value={details.grade} onChange={handleDetailChange} required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 18, fontSize: 16 }}>
                  <option value="">Select grade...</option>
                  {grades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Subject</label>
                <input name="subject" value={details.subject} onChange={handleDetailChange} required placeholder="Enter subject..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 18, fontSize: 16 }} />
                <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Room Number</label>
                <select name="room" value={details.room} onChange={handleDetailChange} required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 18, fontSize: 16 }}>
                  <option value="">Select room...</option>
                  {rooms.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{ background: "#95a5a6", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ background: "#26bedd", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}>Save</button>
                </div>
              </form>
            </div>
          )}

          {/* Event details modal */}
          {eventDetailsModal.open && eventDetailsModal.event ? (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
            }}>
              <div style={{ background: "#fff", padding: 32, borderRadius: 16, minWidth: 340, boxShadow: "0 8px 32px rgba(38,190,221,0.18)" }}>
                <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: 24 }}>Event Details</h2>
                <div style={{ marginBottom: 18, fontWeight: 600, fontSize: 16 }}>
                  <div><strong>Class Name:</strong> {eventDetailsModal.event.subject}</div>
                  <div><strong>Teacher:</strong> {eventDetailsModal.event.teacher}</div>
                  <div><strong>Grade:</strong> {eventDetailsModal.event.grade}</div>
                  <div><strong>Room:</strong> {eventDetailsModal.event.room}</div>
                  <div><strong>Start Time:</strong> {moment(eventDetailsModal.event.start).format("dddd h:mm A")}</div>
                  <div><strong>End Time:</strong> {moment(eventDetailsModal.event.end).format("dddd h:mm A")}</div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button type="button" onClick={() => setEventDetailsModal({ open: false, event: null })} style={{ background: "#95a5a6", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}>Close</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {/* Teacher sidebar */}
        <div style={{ width: 220, marginLeft: 32, background: "#f8f9fa", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", height: "fit-content" }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#222", marginBottom: 8 }}>
            Teacher Selection
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Teachers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => {
                  setSelectedTeachers(teachers.map(t => t.id));
                  setShowUnselect(true);
                }}
                style={{ background: "#27ae60", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={e => e.target.style.background = "#219150"}
                onMouseLeave={e => e.target.style.background = "#27ae60"}
              >Select All</button>
              {showUnselect && (
                <button
                  onClick={() => {
                    setSelectedTeachers([]);
                    setShowUnselect(false);
                  }}
                  style={{ background: "#95a5a6", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={e => e.target.style.background = "#7f8c8d"}
                  onMouseLeave={e => e.target.style.background = "#95a5a6"}
                >Unselect All</button>
              )}
            </div>
            {teachers.map((t, idx) => (
              <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 500, borderRadius: 8, padding: "6px 8px", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#e1e8ed"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <input
                  type="checkbox"
                  checked={selectedTeachers.includes(t.id)}
                  onChange={e => {
                    setSelectedTeachers(sel =>
                      e.target.checked
                        ? [...sel, t.id]
                        : sel.filter(id => id !== t.id)
                    );
                  }}
                  style={{ width: 18, height: 18, accentColor: teacherColors[idx] }}
                />
                <span style={{ width: 16, height: 16, background: teacherColors[idx], borderRadius: 4, display: "inline-block", border: "1px solid #ccc" }}></span>
                {t.name}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateSchedule;

