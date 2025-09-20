import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Add grades array at the top (it was missing)
const grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Not here?"];

function CreateSchedule() {
  const localizer = momentLocalizer(moment);

  const [teachers, setTeachers] = useState([]);
  const [allAvailabilities, setAllAvailabilities] = useState([]);
  const [showUnselect, setShowUnselect] = useState(false);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [details, setDetails] = useState({
    teacherId: "",
    grade: "",
    customGrade: "",
    subject: "",
    room: "",
    startTime: "",
    endTime: ""
  });
  const [eventDetailsModal, setEventDetailsModal] = useState({ open: false, event: null });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  // Add searchTerm state for the search bar
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teachers and availabilities on mount
  useEffect(() => {
    fetch("http://localhost:3000/api/teachers")
      .then(res => res.json())
      .then(data => setTeachers(data || []));
    fetch("http://localhost:3000/api/teacher-availabilities")
      .then(res => res.json())
      .then(data => setAllAvailabilities(data || []));
  }, []);

  // Assign a color to each teacher (repeat if more than 4)
  const teacherColors = ["#27ae60", "#26bedd", "#f39c12", "#8e44ad"];
  const getTeacherColor = (teacherId) => {
    const idx = teachers.findIndex(t => t.id === teacherId);
    return teacherColors[idx % teacherColors.length];
  };

  // Only show availabilities for selected teachers
  const selectedAvailabilities = allAvailabilities.filter(av =>
    selectedTeachers.includes(av.teacher_id)
  ).map(av => {
    // Convert day_of_week, start_time, end_time to JS Date objects for the current week
    // day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
    const weekStart = moment().startOf('week').add(av.day_of_week, 'days');
    const [startHour, startMinute] = av.start_time.split(":");
    const [endHour, endMinute] = av.end_time.split(":");
    const start = weekStart.clone().set({ hour: +startHour, minute: +startMinute, second: 0 }).toDate();
    const end = weekStart.clone().set({ hour: +endHour, minute: +endMinute, second: 0 }).toDate();
    return {
      id: `avail-${av.teacher_id}-${av.id}`,
      start,
      end,
      availability: true,
      color: getTeacherColor(av.teacher_id),
      teacher_id: av.teacher_id,
      teacher_first_name: av.teacher_first_name,
      teacher_last_name: av.teacher_last_name
    };
  });

  // When user selects a slot on the calendar, allow adding events even if overlapping with a teacher availability block
  const handleSelectSlot = ({ start, end }) => {
    // Removed restriction: allow adding events over availability slots
    setSelectedSlot({ start, end });
    setDetails(d => ({ ...d, startTime: moment(start).format("h:mm A"), endTime: moment(end).format("h:mm A") }));
    setModalOpen(true);
  };

  // Handle modal input changes
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(d => ({ ...d, [name]: value }));
  };

  // Helper to determine if custom grade input should show
  const showCustomGrade = details.grade === "Not here?";

  // Save event from modal (add or edit)
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!details.teacherId || !details.grade || !details.subject || !details.room || (showCustomGrade && !details.customGrade)) return;
    if (editMode && editingEventId) {
      setEvents(evts =>
        evts.map(ev =>
          ev.id === editingEventId
            ? {
                ...ev,
                title: `${details.subject}`,
                start: selectedSlot.start,
                end: selectedSlot.end,
                teacher: (() => {
                  const t = teachers.find(t => t.id === +details.teacherId);
                  return t ? `${t.first_name} ${t.last_name}` : "";
                })(),
                grade: showCustomGrade ? details.customGrade : details.grade,
                subject: details.subject,
                room: details.room
              }
            : ev
        )
      );
    } else {
      setEvents(evts => [
        ...evts,
        {
          id: Math.random().toString(36).substr(2, 9),
          title: `${details.subject}`,
          start: selectedSlot.start,
          end: selectedSlot.end,
          teacher: (() => {
            const t = teachers.find(t => t.id === +details.teacherId);
            return t ? `${t.first_name} ${t.last_name}` : "";
          })(),
          grade: showCustomGrade ? details.customGrade : details.grade,
          subject: details.subject,
          room: details.room
        }
      ]);
    }
    setModalOpen(false);
    setSelectedSlot(null);
    setDetails({ teacherId: "", grade: "", customGrade: "", subject: "", room: "" });
    setEditMode(false);
    setEditingEventId(null);
  };

  // Open edit modal for an event
  const handleEditEvent = (event) => {
    setEditMode(true);
    setEditingEventId(event.id);
    setSelectedSlot({ start: event.start, end: event.end });
    setDetails({
      teacherId: (() => {
        const t = teachers.find(t =>
          `${t.first_name} ${t.last_name}` === event.teacher
        );
        return t ? t.id : "";
      })(),
      grade: grades.includes(event.grade) ? event.grade : "Not here?",
      customGrade: grades.includes(event.grade) ? "" : event.grade,
      subject: event.subject,
      room: event.room,
      startTime: moment(event.start).format("h:mm A"),
      endTime: moment(event.end).format("h:mm A")
    });
    setModalOpen(true);
    setEventDetailsModal({ open: false, event: null });
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

  // Overlap detection (returns array of event ids that overlap for same teacher or same room)
  const getOverlappingEventIds = () => {
    const ids = new Set();
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i], b = events[j];
        // Only overlap if same teacher or same room
        const sameTeacher = a.teacher && b.teacher && a.teacher === b.teacher;
        const sameRoom = a.room && b.room && a.room === b.room;
        if ((sameTeacher || sameRoom) && a.start < b.end && b.start < a.end) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return Array.from(ids);
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
            >{deleteMode ? "Cancel Delete" : "Select to Delete"}</button>
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
          <div style={{ background: "#f8f9fa", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxWidth: 900, minWidth: 0, width: "100%" }}>
            <Calendar
              localizer={localizer}
              events={[
                ...events,
                ...selectedAvailabilities
              ]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700, width: "100%", minWidth: 0, maxWidth: 700, margin: "0 auto", position: "relative" }}
              selectable
              onSelectSlot={handleSelectSlot}
              views={{ work_week: true }}
              defaultView="work_week"
              toolbar={false}
              popup={false}
              min={moment().startOf('day').set({ hour: 7, minute: 0 }).toDate()}
              max={moment().startOf('day').set({ hour: 16, minute: 0 }).toDate()}
              daysOfWeek={[1,2,3,4,5]}
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
                        userSelect: "none",
                        border: "none"
                      }}>
                      </div>
                    );
                  }
                  return (
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        padding: "10px 10px 8px 10px",
                        background: "#26bedd",
                        transition: "background 0.2s",
                        cursor: deleteMode ? "pointer" : "pointer"
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
                      <span style={{ fontSize: 18, marginBottom: 2 }}>📘</span>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#222",
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "120px",
                        padding: "0 2px"
                      }}>{event.title}</span>
                      {deleteMode && (
                        <span
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            margin: "10px auto 0 auto",
                            width: 36,
                            height: 36,
                            border: "2px solid #bbb",
                            borderRadius: 8,
                            background: "#fff",
                            fontSize: 26,
                            color: "#444",
                            zIndex: 2,
                            cursor: "pointer"
                          }}
                        >
                          {isSelected ? <span style={{fontSize: 26, color: "#444"}}>✔️</span> : null}
                        </span>
                      )}
                      {event.teacher && (
                        <div style={{ fontSize: 11, color: "#fff", opacity: 0.8, textAlign: "center", marginTop: "auto" }}>{event.teacher}</div>
                      )}
                    </div>
                  );
                }
                // Remove eventWrapper: use default for Outlook-style overlap
              }}
            />
          </div>
        </div>
        {/* Teacher sidebar */}
  <div style={{ width: 260, marginLeft: 32, background: "#f8f9fa", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxHeight: 700, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Teacher Availability</h3>
    {/* Search bar */}
    <input
      type="text"
      placeholder="Search teachers..."
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      style={{
        marginBottom: 12,
        padding: "8px 12px",
        borderRadius: 6,
        border: "1.5px solid #b8e0ef",
        fontSize: 15,
        outline: "none",
        width: "90%"
      }}
    />
    {/* Select/Unselect All button below search bar */}
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      {!showUnselect ? (
        <button
          onClick={() => {
            setSelectedTeachers(teachers.map(t => t.id));
            setShowUnselect(true);
          }}
          style={{ background: "#27ae60", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", transition: "background 0.2s", width: "100%" }}
          onMouseEnter={e => e.target.style.background = "#219150"}
          onMouseLeave={e => e.target.style.background = "#27ae60"}
        >Select All</button>
      ) : (
        <button
          onClick={() => {
            setSelectedTeachers([]);
            setShowUnselect(false);
          }}
          style={{ background: "#95a5a6", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", transition: "background 0.2s", width: "100%" }}
          onMouseEnter={e => e.target.style.background = "#7f8c8d"}
          onMouseLeave={e => e.target.style.background = "#95a5a6"}
        >Unselect All</button>
      )}
    </div>
    {/* Teacher list stretches to fill sidebar, even if few teachers */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 300 }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
        {teachers
          .filter(t =>
            searchTerm.trim() === "" ||
            `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.trim().toLowerCase())
          )
          .map((t, idx) => {
            const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === t.id);
            return (
              <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 500, borderRadius: 8, padding: "6px 8px", transition: "background 0.2s" }}
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
                    style={{ width: 18, height: 18, accentColor: getTeacherColor(t.id) }}
                  />
                  <span style={{ width: 16, height: 16, background: getTeacherColor(t.id), borderRadius: 4, display: "inline-block", border: "1px solid #ccc" }}></span>
                  {t.first_name} {t.last_name}
                </label>
                <div style={{ marginLeft: 34, marginTop: 2, marginBottom: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                  {teacherAvailabilities.length > 0 ? (
                    teacherAvailabilities.map(av => (
                      <div key={av.id} style={{ fontSize: 13, color: "#555", background: "#eaf6fb", borderRadius: 4, padding: "2px 8px", borderLeft: `4px solid ${getTeacherColor(t.id)}` }}>
                        {typeof av.day_of_week === 'number' ? moment().day(av.day_of_week).format('dddd') : av.day_of_week}, {av.start_time} - {av.end_time}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic", padding: "2px 8px" }}>No availability set</div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
    {/* Info/help text always at bottom, not scrolling, more space above */}
    <div style={{ 
      fontWeight: 500, 
      fontSize: 16, 
      color: "#444", 
      marginTop: 135, 
      background: "#eaf6fb", 
      borderRadius: 8, 
      padding: "12px 18px",
      border: "1px solid #b8e0ef"
    }}>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        <li>Select <b>teachers</b> from the right to view their weekly availability.</li>
        <li><b>Drag</b> on the calendar to create a new class during any time slot.</li>
        <li>Click on a class to view its details and edit.</li>
        <li>Use <b>Select to Delete</b> to remove classes from the schedule.</li>
        <li>Overlapping classes will be <span style={{color:"#e74c3c",fontWeight:600}}>highlighted</span> for review.</li>
      </ul>
    </div>
  </div>
      </div>
      {/* Event details modal with edit option */}
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
              <button
                type="button"
                onClick={() => handleEditEvent(eventDetailsModal.event)}
                style={{ background: "#26bedd", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}
              >Edit</button>
            </div>
          </div>
        </div>
      ) : null}
      {/* Add/Edit modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <form onSubmit={handleSaveEvent} style={{ background: "#fff", padding: "40px 32px 40px 32px", borderRadius: 16, minWidth: 340, boxShadow: "0 8px 32px rgba(38,190,221,0.18)", width: 400, boxSizing: "border-box" }}>
            <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: 24 }}>{editMode ? "Edit Schedule Details" : "Add Schedule Details"}</h2>
            <div style={{ marginBottom: 18, fontWeight: 600, fontSize: 16 }}>
              <span>Start Time: {details.startTime || (selectedSlot && moment(selectedSlot.start).format("h:mm A"))}</span>
              <div style={{ height: 12 }} />
              <span>End Time: {details.endTime || (selectedSlot && moment(selectedSlot.end).format("h:mm A"))}</span>
            </div>
            <label style={{ fontWeight: 600, marginBottom: 8, display: "block", marginLeft: 2 }}>Teacher</label>
            <select name="teacherId" value={details.teacherId} onChange={handleDetailChange} required style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 22, fontSize: 16, boxSizing: "border-box" }}>
              <option value="">Select a teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
            <label style={{ fontWeight: 600, marginBottom: 8, display: "block", marginLeft: 2 }}>Grade</label>
            <select name="grade" value={details.grade} onChange={handleDetailChange} required style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: showCustomGrade ? 10 : 22, fontSize: 16, boxSizing: "border-box" }}>
              <option value="">Select grade...</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {showCustomGrade && (
              <input
                name="customGrade"
                value={details.customGrade}
                onChange={handleDetailChange}
                required
                placeholder="Enter custom grade..."
                style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 22, fontSize: 16, boxSizing: "border-box" }}
              />
            )}
            <label style={{ fontWeight: 600, marginBottom: 8, display: "block", marginLeft: 2 }}>Subject</label>
            <input name="subject" value={details.subject} onChange={handleDetailChange} required placeholder="Enter subject..." style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 22, fontSize: 16, boxSizing: "border-box" }} />
            <label style={{ fontWeight: 600, marginBottom: 8, display: "block", marginLeft: 2 }}>Room Number</label>
            <input
              name="room"
              value={details.room}
              onChange={handleDetailChange}
              required
              placeholder="Enter room number..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 22, fontSize: 16, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <button type="button" onClick={() => { setModalOpen(false); setEditMode(false); setEditingEventId(null); }} style={{ background: "#95a5a6", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ background: "#26bedd", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer" }}>{editMode ? "Save Changes" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CreateSchedule;