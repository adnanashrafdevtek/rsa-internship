import React, { useState, useEffect } from "react";
import moment from "moment";
import DragAndDropCalendar from "./DragAndDropCalendar"; // Your calendar component
import CustomHeader from "./CustomHeader"; // Optional custom header component

export default function CreateSchedule() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [details, setDetails] = useState({
    teacherId: "",
    grade: "",
    customGrade: "",
    subject: "",
    room: "",
    startTime: "",
    endTime: "",
    recurringDays: [],
    abDay: "",
    dayType: ""
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnselect, setShowUnselect] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [eventDetailsModal, setEventDetailsModal] = useState({ open: false, event: null });

  const teachers = []; // Populate from your context or backend
  const allAvailabilities = []; // Populate from your context or backend
  const grades = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

  const generateTimeOptions = () => {
    const times = [];
    let start = moment().startOf('day').set({ hour: 6, minute: 30 });
    const end = moment().startOf('day').set({ hour: 16, minute: 0 });
    while (start <= end) {
      times.push(start.format("h:mm A"));
      start.add(30, 'minutes');
    }
    return times;
  };

  const handleTimeChange = (field, value) => {
    setDetails(d => ({ ...d, [field]: value }));
  };

  const handleDetailChange = e => {
    const { name, value } = e.target;
    setDetails(d => ({ ...d, [name]: value }));
  };

  const handleSaveEvent = e => {
    e.preventDefault();
    // Save or update event logic here
    setModalOpen(false);
    setEditMode(false);
    setEditingEventId(null);
    setDetails({
      teacherId: "",
      grade: "",
      customGrade: "",
      subject: "",
      room: "",
      startTime: "",
      endTime: "",
      recurringDays: [],
      abDay: "",
      dayType: ""
    });
  };

  const handleEditEvent = event => {
    setEditMode(true);
    setEditingEventId(event.id);
    setDetails({
      teacherId: event.teacherId,
      grade: event.grade,
      customGrade: event.customGrade || "",
      subject: event.subject,
      room: event.room,
      startTime: moment(event.start).format("h:mm A"),
      endTime: moment(event.end).format("h:mm A"),
      recurringDays: event.recurringDays || [],
      abDay: event.abDay || "",
      dayType: event.dayType || ""
    });
    setModalOpen(true);
  };

  const handleSelectSlot = slot => {
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    if (deleteMode) setSelectedToDelete([]);
  };

  const handleConfirmDelete = () => {
    // Delete logic here using selectedToDelete array
    setSelectedToDelete([]);
    setDeleteMode(false);
  };

  const getTeacherColor = id => {
    const colors = ["#27ae60", "#3498db", "#9b59b6", "#f39c12", "#e67e22", "#e74c3c"];
    return colors[id % colors.length];
  };

  const getCalendarEvents = () => {
    return []; // Combine scheduled events and selected availability
  };

  const getOverlappingEventIds = () => {
    return []; // Detect overlapping events
  };

  const handleEventDragStart = () => {};
  const handleDragEnd = () => {};
  const handleEventDrop = () => {};

  const selectedAvailabilities = []; // map selectedTeachers to their availabilities

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Calendar area */}
      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 320, overflowY: "auto", display: "flex" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 16 }}>
            <h1 style={{ fontSize: "36px", fontWeight: "bold", margin: 0 }}>Create Schedule</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18, gap: 16 }}>
            <button
              onClick={() => window.location.href = "/schedules"}
              style={{ background: "#95a5a6", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer", boxShadow: "0 2px 8px rgba(149,165,166,0.12)", transition: "background 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => e.target.style.background = "#7f8c8d"}
              onMouseLeave={e => e.target.style.background = "#95a5a6"}
            >Back</button>
            <button
              onClick={handleDeleteMode}
              style={{ background: deleteMode ? "#c0392b" : "#e74c3c", color: "white", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer", boxShadow: "0 2px 8px rgba(231,76,60,0.12)", transition: "background 0.2s, box-shadow 0.2s" }}
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
                <span style={{ fontWeight: 700, color: "#e74c3c" }}>⚠️ Room or teacher conflicts detected. Please review highlighted events in the calendar.</span>
              </div>
            )}
          </div>

          <div style={{ background: "#ffffff", borderRadius: 8, padding: 0, maxWidth: 900, minWidth: 0, width: "100%", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: "1px solid #e9ecef" }}>
            <DragAndDropCalendar
              localizer={{}} // Your calendar localizer
              events={[ ...getCalendarEvents(), ...selectedAvailabilities ]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700, width: "100%", minWidth: 0, maxWidth: 700, margin: "0 auto", position: "relative", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden" }}
              selectable
              resizable
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventDrop}
              dragFromOutsideItem={null}
              onDragStart={handleEventDragStart}
              onDragEnd={handleDragEnd}
              views={{ work_week: true }}
              defaultView="work_week"
              toolbar={false}
              popup={false}
              min={moment().startOf('day').set({ hour: 6, minute: 30 }).toDate()}
              max={moment().startOf('day').set({ hour: 16, minute: 0 }).toDate()}
              daysOfWeek={[1,2,3,4,5]}
              step={5}
              timeslots={6}
              eventPropGetter={event => {
                // Styling logic (availability, overlaps, dragging)
                return {};
              }}
              components={{
                header: CustomHeader,
                event: ({ event }) => <div>{event.title}</div>
              }}
            />
          </div>
        </div>

        {/* Teacher sidebar */}
        <div style={{ width: 260, marginLeft: 32, background: "#f8f9fa", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxHeight: 700, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Teacher Availability</h3>
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, border: "1.5px solid #b8e0ef", fontSize: 15, outline: "none", width: "90%" }}
          />
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {!showUnselect ? (
              <button
                onClick={() => { setSelectedTeachers(teachers.map(t => t.id)); setShowUnselect(true); }}
                style={{ background: "#27ae60", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", width: "100%" }}
                onMouseEnter={e => e.target.style.background = "#219150"}
                onMouseLeave={e => e.target.style.background = "#27ae60"}
              >Select All</button>
            ) : (
              <button
                onClick={() => { setSelectedTeachers([]); setShowUnselect(false); }}
                style={{ background: "#95a5a6", color: "white", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", width: "100%" }}
                onMouseEnter={e => e.target.style.background = "#7f8c8d"}
                onMouseLeave={e => e.target.style.background = "#95a5a6"}
              >Unselect All</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
