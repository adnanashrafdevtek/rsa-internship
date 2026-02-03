import React from "react";
import moment from "moment";
import { generateTimeOptions, getTeacherColor } from "./scheduleUtils";

export default function ScheduleModals({
  modalOpen,
  setModalOpen,
  editMode,
  setEditMode,
  setEditingEventId,
  details,
  setDetails,
  handleDetailChange,
  handleTimeChange,
  teachers,
  teacherDropdownOpen,
  setTeacherDropdownOpen,
  selectedSlot,
  handleSaveEvent,
  grades,
  fridayModal,
  setFridayModal,
  handleFridaySelection,
  eventDetailsModal,
  setEventDetailsModal,
  isEditMode,
  handleEditEvent,
  conflictModal,
  setConflictModal,
  setCreateEvents,
  setMasterEvents,
  fetchRooms,
  saveScheduleToDatabase,
  getABDay,
  setSelectedSlot
}) {
  return (
    <>
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <form onSubmit={handleSaveEvent} style={{
            background: "#fff",
            padding: "24px 16px 24px 16px",
            borderRadius: 16,
            minWidth: 300,
            maxWidth: 340,
            boxShadow: "0 8px 32px rgba(38,190,221,0.18)",
            width: 340,
            boxSizing: "border-box"
          }}>
            <h2 style={{
              marginBottom: 10,
              fontWeight: 700,
              fontSize: 22
            }}>
              {editMode ? "Edit Schedule Details" : "Add Schedule Details"}
            </h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Start Time</label>
                <select
                  value={details.startTime || (selectedSlot && moment(selectedSlot.start).format("h:mm A"))}
                  onChange={e => handleTimeChange("startTime", e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #e1e8ed", fontSize: 15, boxSizing: "border-box" }}
                >
                  {generateTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>End Time</label>
                <select
                  value={details.endTime || (selectedSlot && moment(selectedSlot.end).format("h:mm A"))}
                  onChange={e => handleTimeChange("endTime", e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #e1e8ed", fontSize: 15, boxSizing: "border-box" }}
                >
                  {generateTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Teacher</label>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div
                onClick={() => setTeacherDropdownOpen(!teacherDropdownOpen)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  paddingLeft: details.teacherId ? "32px" : "12px",
                  borderRadius: 8,
                  border: "2px solid #e1e8ed",
                  fontSize: 15,
                  boxSizing: "border-box",
                  cursor: "pointer",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: "40px"
                }}
              >
                <span style={{ color: details.teacherId ? "#000" : "#999" }}>
                  {details.teacherId
                    ? (() => {
                      const teacher = teachers.find(t => t.id.toString() === details.teacherId);
                      return teacher ? `${teacher.first_name} ${teacher.last_name}` : "Select a teacher...";
                    })()
                    : "Select a teacher..."
                  }
                </span>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {teacherDropdownOpen ? "▲" : "▼"}
                </span>
              </div>

              {details.teacherId && (
                <div
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    backgroundColor: getTeacherColor(parseInt(details.teacherId, 10)),
                    border: "1px solid #ccc",
                    pointerEvents: "none",
                    zIndex: 1
                  }}
                />
              )}

              {teacherDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "2px solid #e1e8ed",
                  borderRadius: 8,
                  backgroundColor: "white",
                  zIndex: 3000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div
                    onClick={() => {
                      setDetails(d => ({ ...d, teacherId: "" }));
                      setTeacherDropdownOpen(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      backgroundColor: !details.teacherId ? "#f8f9fa" : "white",
                      fontSize: 15
                    }}
                    onMouseEnter={e => {
                      if (details.teacherId) {
                        e.target.style.backgroundColor = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={e => {
                      if (details.teacherId) {
                        e.target.style.backgroundColor = "white";
                      }
                    }}
                  >
                    Select a teacher...
                  </div>
                  {teachers.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setDetails(d => ({ ...d, teacherId: t.id.toString() }));
                        setTeacherDropdownOpen(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: details.teacherId === t.id.toString() ? "#e3f2fd" : "white",
                        fontSize: 15,
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={e => {
                        if (details.teacherId !== t.id.toString()) {
                          e.target.style.backgroundColor = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={e => {
                        if (details.teacherId !== t.id.toString()) {
                          e.target.style.backgroundColor = "white";
                        }
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          backgroundColor: getTeacherColor(t.id),
                          border: "1px solid #ccc",
                          flexShrink: 0
                        }}
                      />
                      <span>{t.first_name} {t.last_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Grade</label>
            <select
              name="grade"
              value={details.grade}
              onChange={handleDetailChange}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #e1e8ed",
                marginBottom: details.grade === "Not here?" ? 6 : 12,
                fontSize: 15,
                boxSizing: "border-box"
              }}
            >
              <option value="">Select grade...</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {details.grade === "Not here?" && (
              <input
                name="customGrade"
                value={details.customGrade}
                onChange={handleDetailChange}
                required
                placeholder="Enter custom grade..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "2px solid #e1e8ed",
                  marginBottom: 12,
                  fontSize: 15,
                  boxSizing: "border-box"
                }}
              />
            )}

            {((selectedSlot && moment(selectedSlot.start).day() === 5) || (details.recurringDays && details.recurringDays.includes(4))) && (
              <>
                <label
                  style={{
                    fontWeight: 600,
                    marginBottom: 4,
                    display: "block",
                    marginLeft: 2
                  }}
                >
                  Friday Type
                </label>
                <select
                  name="abDay"
                  value={details.abDay || ""}
                  onChange={handleDetailChange}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "2px solid #e1e8ed",
                    marginBottom: 12,
                    fontSize: 15,
                    boxSizing: "border-box"
                  }}
                >
                  <option value="">Select A or B day</option>
                  <option value="A">A Day</option>
                  <option value="B">B Day</option>
                </select>
              </>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Recurring Days</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", justifyContent: "space-between", width: "100%" }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, idx) => (
                  <label key={day} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 14, fontWeight: 500, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(details.recurringDays) && details.recurringDays.includes(idx)}
                      onChange={e => {
                        setDetails(d => {
                          const current = Array.isArray(d.recurringDays) ? d.recurringDays : [];
                          return {
                            ...d,
                            recurringDays: e.target.checked
                              ? [...current, idx]
                              : current.filter(i => i !== idx)
                          };
                        });
                      }}
                      style={{ width: 14, height: 14, accentColor: "#26bedd", margin: 0 }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Subject</label>
            <input
              name="subject"
              value={details.subject}
              onChange={handleDetailChange}
              required
              placeholder="Enter subject..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #e1e8ed",
                marginBottom: 12,
                fontSize: 15,
                boxSizing: "border-box"
              }}
            />

            <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Room Number</label>
            <input
              name="room"
              value={details.room}
              onChange={handleDetailChange}
              required
              placeholder="Enter room number..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #e1e8ed",
                marginBottom: 12,
                fontSize: 15,
                boxSizing: "border-box"
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => {
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
                }}
                style={{
                  background: "#95a5a6",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: "#26bedd",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  cursor: "pointer"
                }}
              >
                {editMode ? "Save Changes" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {fridayModal.open && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 3000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            maxWidth: "400px",
            textAlign: "center"
          }}>
            <h3 style={{ marginBottom: "16px", color: "#333" }}>
              {fridayModal.slotInfo?.dragEvent ? "Moving Class to Friday" : "Friday Class Selection"}
            </h3>
            <p style={{ marginBottom: "24px", color: "#666" }}>
              {fridayModal.slotInfo?.dragEvent
                ? "You're moving a class to Friday. Is this an A day Friday or B day Friday?"
                : "Is this an A day Friday or B day Friday?"
              }
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => handleFridaySelection("A")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "16px",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={e => e.target.style.backgroundColor = "#2980b9"}
                onMouseLeave={e => e.target.style.backgroundColor = "#3498db"}
              >
                A Day Friday
              </button>
              <button
                onClick={() => handleFridaySelection("B")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "16px",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={e => e.target.style.backgroundColor = "#c0392b"}
                onMouseLeave={e => e.target.style.backgroundColor = "#e74c3c"}
              >
                B Day Friday
              </button>
            </div>
            <button
              onClick={() => setFridayModal({ open: false, slotInfo: null })}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {eventDetailsModal.open && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: 32,
            borderRadius: 16,
            minWidth: 400,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }}>
            <h2 style={{ margin: "0 0 20px 0", fontWeight: 700, fontSize: 20, color: "#2c3e50" }}>
              Class Details
            </h2>

            {eventDetailsModal.event && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Subject:</strong> {eventDetailsModal.event.subject}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Teacher:</strong> {eventDetailsModal.event.teacher}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Grade:</strong> {eventDetailsModal.event.grade}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Room:</strong> {eventDetailsModal.event.room}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Time:</strong> {moment(eventDetailsModal.event.start).format("h:mm A")} - {moment(eventDetailsModal.event.end).format("h:mm A")}
                </div>
                {eventDetailsModal.event.recurringDays && eventDetailsModal.event.recurringDays.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Days:</strong> {eventDetailsModal.event.recurringDays.map(d =>
                      ["Mon", "Tue", "Wed", "Thu", "Fri"][d]
                    ).join(", ")}
                  </div>
                )}
                {eventDetailsModal.event.abDay && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>A/B Day:</strong> {eventDetailsModal.event.abDay}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEventDetailsModal({ open: false, event: null })}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#95a5a6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Close
              </button>
              {isEditMode && (
                <button
                  onClick={() => handleEditEvent(eventDetailsModal.event)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {conflictModal.open && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 4000
        }}>
          <div style={{
            background: "#fff",
            padding: 32,
            borderRadius: 16,
            minWidth: 400,
            maxWidth: 600,
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(231,76,60,0.18)"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 28, marginRight: 12 }}>⚠️</span>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24, color: "#e74c3c" }}>Schedule Conflicts Detected</h2>
            </div>

            <div style={{
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20
            }}>
              <p style={{ margin: "0 0 12px 0", color: "#c53030", fontWeight: 600 }}>
                The following conflicts were found with your class schedule:
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                color: "#c53030",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "1.5"
              }}>
                {conflictModal.messages.map((msg, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>{msg}</li>
                ))}
              </ul>
            </div>

            <div style={{
              background: "#f7fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20
            }}>
              <p style={{ margin: 0, color: "#4a5568", fontSize: 14 }}>
                <strong>What can you do?</strong><br />
                • <strong>Fix Conflicts:</strong> Close this dialog and adjust the time, teacher, room, or day to resolve conflicts.<br />
                • <strong>Add Anyway:</strong> Create the class despite conflicts. It will be highlighted with a red outline for review.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConflictModal({ open: false, messages: [], pendingEvent: null })}
                style={{
                  background: "#718096",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Cancel & Fix Conflicts
              </button>
              {conflictModal.pendingEvent && (
                <button
                  type="button"
                  onClick={async () => {
                    if (editMode) {
                      setCreateEvents(prev => prev.map(ev => ev.id === conflictModal.pendingEvent.id ? conflictModal.pendingEvent : ev));
                      setEditMode(false);
                      setEditingEventId(null);
                    } else {
                      const pendingEvent = conflictModal.pendingEvent;
                      const newRecurringDays = pendingEvent.recurringDays || [];

                      try {
                        if (newRecurringDays.length > 0) {
                          const newRecurringEvents = [];
                          for (const dayIdx of newRecurringDays) {
                            const weekday = dayIdx + 1;
                            const base = moment().startOf("week").day(weekday);
                            const newStart = moment(pendingEvent.start);
                            const newEnd = moment(pendingEvent.end);
                            const duration = newEnd.diff(newStart, "minutes");
                            const start = base.clone().set({ hour: newStart.hour(), minute: newStart.minute(), second: 0 });
                            const end = start.clone().add(duration, "minutes");

                            const scheduleData = {
                              start_time: start.format("YYYY-MM-DD HH:mm:ss"),
                              end_time: end.format("YYYY-MM-DD HH:mm:ss"),
                              class_id: null,
                              event_title: `${pendingEvent.subject} - Grade ${pendingEvent.grade}`,
                              user_id: pendingEvent.teacherId,
                              room: pendingEvent.room,
                              grade: pendingEvent.grade,
                              subject: pendingEvent.subject,
                              recurring_day: dayIdx,
                              ab_day: pendingEvent.abDay || getABDay(start.toDate()),
                              description: `${pendingEvent.subject} - Grade ${pendingEvent.grade}`
                            };

                            const result = await saveScheduleToDatabase(scheduleData);

                            if (result.success) {
                              newRecurringEvents.push({
                                id: `${result.id}`,
                                title: `${pendingEvent.subject} - ${pendingEvent.grade}`,
                                subject: pendingEvent.subject,
                                teacher: pendingEvent.teacher,
                                teacherId: pendingEvent.teacherId,
                                grade: pendingEvent.grade,
                                room: pendingEvent.room,
                                start: start.toDate(),
                                end: end.toDate(),
                                recurringDays: [dayIdx],
                                abDay: pendingEvent.abDay || getABDay(start.toDate()),
                                isClass: true,
                                description: pendingEvent.subject,
                                hasConflicts: true,
                                outOfAvailability: false,
                                databaseId: result.id
                              });
                            }
                          }
                          setCreateEvents(prev => [...prev, ...newRecurringEvents]);
                          setMasterEvents(prev => [...prev, ...newRecurringEvents]);
                          await fetchRooms();
                        } else {
                          const scheduleData = {
                            start_time: moment(pendingEvent.start).format("YYYY-MM-DD HH:mm:ss"),
                            end_time: moment(pendingEvent.end).format("YYYY-MM-DD HH:mm:ss"),
                            class_id: null,
                            event_title: `${pendingEvent.subject} - Grade ${pendingEvent.grade}`,
                            user_id: pendingEvent.teacherId,
                            room: pendingEvent.room,
                            grade: pendingEvent.grade,
                            subject: pendingEvent.subject,
                            ab_day: pendingEvent.abDay || getABDay(moment(pendingEvent.start).toDate()),
                            description: `${pendingEvent.subject} - Grade ${pendingEvent.grade}`
                          };

                          const result = await saveScheduleToDatabase(scheduleData);

                          if (result.success) {
                            const savedEvent = {
                              ...pendingEvent,
                              id: `${result.id}`,
                              databaseId: result.id
                            };
                            setCreateEvents(prev => [...prev, savedEvent]);
                            setMasterEvents(prev => [...prev, savedEvent]);
                            await fetchRooms();
                          }
                        }
                      } catch (error) {
                        console.error("Error saving conflicting event:", error);
                        alert("Failed to save event with conflicts");
                        return;
                      }
                    }
                    setConflictModal({ open: false, messages: [], pendingEvent: null });
                    setModalOpen(false);
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
                    setSelectedSlot(null);
                  }}
                  style={{
                    background: "#e53e3e",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 14,
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 20px",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  ⚠️ Add Anyway
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
