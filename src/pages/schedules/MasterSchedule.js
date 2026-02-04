import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

export default function MasterSchedule({
  date,
  setDate,
  masterEvents,
  setMasterEvents,
  createEvents,
  setCreateEvents,
  teachers,
  allAvailabilities,
  selectedTeachers,
  setSelectedTeachers,
  selectedGrades,
  setSelectedGrades,
  selectedRooms,
  setSelectedRooms,
  availableRooms,
  schoolView,
  setSchoolView,
  isEditMode,
  setIsEditMode,
  deleteMode,
  setDeleteMode,
  selectedToDelete,
  setSelectedToDelete,
  pendingChanges,
  setPendingChanges,
  setLoading,
  fetchMasterSchedule,
  fetchRooms,
  setFridayModal,
  setSelectedSlot,
  setDetails,
  setModalOpen,
  isEventInTeacherAvailability,
  deleteScheduleFromDatabase,
  updateScheduleInDatabase,
  getTeacherColor,
  hexToRgba,
  mergeOverlappingAvailabilities,
  getABDay,
  getABLabelForHeader,
  normalizeDayOfWeek,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarWidth,
  setSidebarWidth,
  isResizing,
  setIsResizing,
  teacherFilterExpanded,
  setTeacherFilterExpanded,
  gradeFilterExpanded,
  setGradeFilterExpanded,
  roomFilterExpanded,
  setRoomFilterExpanded,
  searchTerm,
  setSearchTerm,
  handleEventClick
}) {
  const CustomHeader = ({ date: headerDate }) => {
    const dayName = moment(headerDate).format("dddd");
    const dateNum = moment(headerDate).format("M/D");
    const ab = getABLabelForHeader(headerDate); // 'A' | 'B' | ''
    const isFriday = moment(headerDate).day() === 5 && ab;
    const bg = isFriday ? "#8e63d9" : (ab === "A" ? "#3b82f6" : "#ef4444");
    const label = ab ? (isFriday ? "A/B" : ab) : "";

    return (
      <div style={{
        textAlign: "center",
        padding: "6px 6px",
        minHeight: 52,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: "transparent",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#1f2937",
          whiteSpace: "nowrap",
          letterSpacing: "0.2px"
        }}>{dayName} {dateNum}</div>

        {label && (
          <div style={{
            fontSize: 10,
            padding: "2px 8px",
            backgroundColor: bg,
            color: "#fff",
            borderRadius: 999,
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            textAlign: "center",
            boxShadow: "none"
          }}>{label}</div>
        )}
      </div>
    );
  };

  const extractGradeValue = (ev) => {
    const raw = ev.grade || ev.grade_level || ev.gradeLevel || ev.grade_id || ev.gradeId;
    if (raw) {
      const s = raw.toString().trim();
      if (/^(pre[-\s]?k|pk)$/i.test(s)) return "PK";
      if (/^k(ind(er(garten)?)?)?$/i.test(s)) return "K";
      const num = s.replace(/grade/i, "").replace(/(st|nd|rd|th)/i, "").trim();
      if (/^\d{1,2}$/.test(num)) return parseInt(num, 10);
    }
    const title = ev.title || "";
    const gradePattern1 = /Grade\s*(K|[0-9]{1,2})/i;
    const gradePattern2 = /(K|[0-9]{1,2})(st|nd|rd|th)?\s*Grade/i;
    let match = title.match(gradePattern1) || title.match(gradePattern2);
    if (match) {
      const val = match[1];
      if (/^K$/i.test(val)) return "K";
      const n = parseInt(val, 10);
      if (!isNaN(n)) return n;
    }
    if (/Kindergarten|Kinder/i.test(title)) return "K";
    if (/Pre[-\s]?K|PK/i.test(title)) return "PK";
    return null;
  };

  const classify = (gradeVal) => {
    if (gradeVal === null || gradeVal === undefined) return null;
    if (gradeVal === "PK" || gradeVal === "K" || (typeof gradeVal === "number" && gradeVal >= 1 && gradeVal <= 5)) return "elementary";
    if (typeof gradeVal === "number" && gradeVal >= 6 && gradeVal <= 8) return "middle";
    if (typeof gradeVal === "number" && gradeVal >= 9 && gradeVal <= 12) return "high";
    return null;
  };

  let filteredMasterEvents = masterEvents.filter(ev => {
    if (schoolView === "all") return true;
    const g = extractGradeValue(ev);
    const level = classify(g);
    return level === schoolView;
  });

  if (selectedGrades.length > 0) {
    filteredMasterEvents = filteredMasterEvents.filter(ev => {
      const g = extractGradeValue(ev);
      if (g === null || g === undefined) return false;
      const gStr = (typeof g === "number") ? g.toString() : g;
      return selectedGrades.includes(gStr);
    });
  }
  if (selectedRooms.length > 0) {
    filteredMasterEvents = filteredMasterEvents.filter(ev => {
      const room = (ev.room || "").toString().trim();
      return selectedRooms.includes(room);
    });
  }
  if (selectedTeachers.length > 0) {
    filteredMasterEvents = filteredMasterEvents.filter(ev => {
      return selectedTeachers.includes(ev.teacherId);
    });
  }

  const getMasterOverlappingEventIds = () => {
    const ids = new Set();
    const events = filteredMasterEvents;

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (!event1 || !event2 || !event1.start || !event1.end || !event2.start || !event2.end) {
          continue;
        }

        const start1 = moment(event1.start);
        const end1 = moment(event1.end);
        const start2 = moment(event2.start);
        const end2 = moment(event2.end);

        if (!start1.isValid() || !end1.isValid() || !start2.isValid() || !end2.isValid()) {
          continue;
        }

        const timeOverlap = start1.isBefore(end2) && start2.isBefore(end1);

        if (timeOverlap) {
          const sameRoom = event1.room && event2.room &&
            event1.room.toString().trim().toLowerCase() === event2.room.toString().trim().toLowerCase();
          const sameTeacher = event1.teacherId && event2.teacherId &&
            event1.teacherId.toString() === event2.teacherId.toString();

          if (sameRoom || sameTeacher) {
            ids.add(event1.id);
            ids.add(event2.id);
          }
        }
      }
    }
    return Array.from(ids);
  };

  const overlappingEventIds = getMasterOverlappingEventIds();

  const masterEventStyleGetter = (event) => {
    let backgroundColor = "#4a90e2"; // Default blue
    let opacity = 1;
    let borderStyle = "none";
    let boxShadow = "0 2px 4px rgba(0,0,0,0.08)";

    if (event.availability) {
      backgroundColor = event.color || getTeacherColor(event.teacher_id);
      opacity = 0.25;
      borderStyle = `1px dashed ${backgroundColor}`;
      boxShadow = "none";
    } else if (!event.isClass) {
      const colors = ["#4a90e2", "#9b59b6", "#f39c12", "#e74c3c", "#1abc9c"];
      const colorIndex = event.id ? String(event.id).length % colors.length : 0;
      backgroundColor = colors[colorIndex];
    }

    if (overlappingEventIds.includes(event.id) && !event.availability) {
      backgroundColor = "#e67e22";
      boxShadow = "0 3px 8px rgba(230,126,34,0.4), inset 0 0 0 1px rgba(255,255,255,0.15)";
    }

    if (deleteMode && selectedToDelete.includes(event.id)) {
      borderStyle = "2px solid #9b59b6";
      boxShadow = "0 4px 12px rgba(155,89,182,0.4)";
    }

    return {
      style: {
        backgroundColor,
        opacity,
        color: "white",
        borderRadius: 6,
        border: borderStyle,
        fontSize: "12px",
        fontWeight: 600,
        boxShadow,
        cursor: event.availability ? "default" : (deleteMode ? "pointer" : "move"),
        zIndex: event.availability ? 1 : 10,
        pointerEvents: event.availability ? "none" : "auto",
        overflow: "hidden",
        padding: "6px 8px",
        lineHeight: 1.3
      }
    };
  };

  const handleMasterSelectSlot = ({ start, end }) => {
    if (!isEditMode) return;
    if (deleteMode) return;

    const isFriday = moment(start).day() === 5;
    if (isFriday) {
      setFridayModal({
        open: true,
        slotInfo: { start, end, isNewClass: true }
      });
      return;
    }

    const abDay = getABDay(start);

    const overlappingAvailabilities = allAvailabilities.filter(av => {
      const avDay = normalizeDayOfWeek(av.day_of_week);
      const slotDay = moment(start).day();

      if (avDay !== slotDay) return false;

      const slotStart = moment(start);
      const slotEnd = moment(end);
      const avStart = moment(av.start_time, "HH:mm:ss");
      const avEnd = moment(av.end_time, "HH:mm:ss");

      return slotStart.format("HH:mm") >= avStart.format("HH:mm") &&
        slotEnd.format("HH:mm") <= avEnd.format("HH:mm");
    });

    let preSelectedTeacherId = "";
    if (overlappingAvailabilities.length === 1) {
      preSelectedTeacherId = overlappingAvailabilities[0].teacher_id.toString();
    }

    const dayIdx = moment(start).day() - 1; // 0=Monday, ... 4=Friday
    const recurringDays = (dayIdx >= 0 && dayIdx <= 4) ? [dayIdx] : [];

    setSelectedSlot({ start, end });
    setDetails(d => ({
      ...d,
      teacherId: preSelectedTeacherId,
      startTime: moment(start).format("h:mm A"),
      endTime: moment(end).format("h:mm A"),
      abDay: abDay || "",
      dayType: abDay || "",
      recurringDays
    }));
    setModalOpen(true);
  };

  const handleMasterEventDrop = async ({ event, start, end }) => {
    if (!isEditMode) return;
    if (event.availability) return;

    const isFriday = moment(start).day() === 5;
    if (isFriday && !event.abDay) {
      setFridayModal({
        open: true,
        slotInfo: {
          start,
          end,
          dragEvent: event,
          originalEvent: event,
          draggedEventId: event.id,
          isDragging: true
        }
      });
      return;
    }

    const testEvent = { ...event, start, end };
    const isInAvailability = isEventInTeacherAvailability(testEvent);

    const updatedEvent = {
      ...event,
      start,
      end,
      startTime: moment(start).format("HH:mm:ss"),
      endTime: moment(end).format("HH:mm:ss"),
      hasConflict: !isInAvailability,
      id: event.id,
      title: event.title || event.subject,
      subject: event.subject,
      teacher: event.teacher,
      teacherId: event.teacherId,
      grade: event.grade,
      room: event.room,
      description: event.description,
      databaseId: event.databaseId || event.id
    };

    setMasterEvents(prev => prev.map(ev =>
      ev.id === event.id ? updatedEvent : ev
    ));

    setPendingChanges(prev => {
      const filtered = prev.filter(change => change.id !== event.id);
      return [...filtered, updatedEvent];
    });
  };

  const MasterToolbar = ({ label }) => (
    <div className="rbc-toolbar" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="rbc-btn-group" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All" },
            { id: "elementary", label: "Elementary" },
            { id: "middle", label: "Middle" },
            { id: "high", label: "High School" }
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSchoolView(btn.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: schoolView === btn.id ? "1px solid #2563eb" : "1px solid #d0d7de",
                background: schoolView === btn.id ? "#2563eb" : "#fff",
                color: schoolView === btn.id ? "#fff" : "#111827",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                minWidth: 90,
                boxShadow: "none"
              }}
            >
              {btn.label}
            </button>
          ))}
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
          <span className="rbc-btn-group" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setDate(moment(date).subtract(1, "week").toDate())}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #d0d7de",
                background: "#fff",
                color: "#111827",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              ◀ Previous Week
            </button>
            <button
              type="button"
              onClick={() => setDate(new Date())}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #d0d7de",
                background: "#fff",
                color: "#111827",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDate(moment(date).add(1, "week").toDate())}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #d0d7de",
                background: "#fff",
                color: "#111827",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              Next Week ▶
            </button>
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "nowrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isEditMode && (
            <span className="rbc-btn-group" style={{ display: "flex", gap: 6 }}>
              {pendingChanges.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Save ${pendingChanges.length} change(s)?`)) return;

                    setLoading(true);
                    let successCount = 0;

                    for (const change of pendingChanges) {
                      try {
                        const result = await updateScheduleInDatabase(change.databaseId, {
                          start_time: moment(change.start).format("YYYY-MM-DD HH:mm:ss"),
                          end_time: moment(change.end).format("YYYY-MM-DD HH:mm:ss"),
                          user_id: change.teacherId,
                          subject: change.subject,
                          grade: change.grade,
                          room: change.room,
                          ab_day: change.abDay,
                          recurring_day: change.recurringDays.length > 0 ? change.recurringDays[0] : null
                        });

                        if (result.success) successCount++;
                      } catch (error) {
                        console.error("Error saving change:", error);
                      }
                    }

                    setLoading(false);
                    setPendingChanges([]);
                    alert(`Successfully saved ${successCount} of ${pendingChanges.length} changes!`);
                    fetchMasterSchedule();
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #16a34a",
                    background: "#16a34a",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: "none"
                  }}
                >
                  Save ({pendingChanges.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!deleteMode) {
                    setDeleteMode(true);
                    setSelectedToDelete([]);
                  } else {
                    setDeleteMode(false);
                    setSelectedToDelete([]);
                  }
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: deleteMode ? "1px solid #ef4444" : "1px solid #d0d7de",
                  background: deleteMode ? "#ef4444" : "#fff",
                  color: deleteMode ? "#fff" : "#ef4444",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {deleteMode ? "Cancel Delete" : "Delete Mode"}
              </button>

              {deleteMode && selectedToDelete.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete ${selectedToDelete.length} event(s)?`)) return;

                    setLoading(true);
                    let successCount = 0;

                    for (const eventId of selectedToDelete) {
                      const event = masterEvents.find(e => e.id === eventId);
                      if (event && event.databaseId) {
                        const result = await deleteScheduleFromDatabase(event.databaseId);
                        if (result.success) successCount++;
                      }
                    }

                    setLoading(false);
                    setDeleteMode(false);
                    setSelectedToDelete([]);
                    alert(`Successfully deleted ${successCount} of ${selectedToDelete.length} events!`);
                    fetchMasterSchedule();
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #dc2626",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: "none"
                  }}
                >
                  Confirm Delete ({selectedToDelete.length})
                </button>
              )}
            </span>
          )}
        </div>

        <span className="rbc-btn-group" style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => {
              if (isEditMode && pendingChanges.length > 0) {
                if (window.confirm("You have unsaved changes. Discard them?")) {
                  setIsEditMode(false);
                  setPendingChanges([]);
                  setDeleteMode(false);
                  setSelectedToDelete([]);
                  fetchMasterSchedule();
                }
              } else {
                setIsEditMode(false);
                setDeleteMode(false);
                setSelectedToDelete([]);
              }
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: !isEditMode ? "1px solid #2563eb" : "1px solid #d0d7de",
              background: !isEditMode ? "#2563eb" : "#fff",
              color: !isEditMode ? "#fff" : "#111827",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              minWidth: 84,
              boxShadow: "none"
            }}
          >
            View
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(true);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: isEditMode ? "1px solid #2563eb" : "1px solid #d0d7de",
              background: isEditMode ? "#2563eb" : "#fff",
              color: isEditMode ? "#fff" : "#111827",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              minWidth: 84,
              boxShadow: "none"
            }}
          >
            Edit
          </button>
        </span>
      </div>
    </div>
  );

  const gradeDropdownOptions = ["PK","K","1","2","3","4","5","6","7","8","9","10","11","12"];
  const roomOptions = availableRooms;

  return (
    <>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }} data-master-schedule-container>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            flex: 1,
            position: "relative"
          }}
          data-calendar-container
        >
          {!isEditMode && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(73, 119, 236, 0.15)",
              borderRadius: "12px",
              pointerEvents: "none",
              zIndex: 100
            }} />
          )}
          <style>{`
            .rbc-time-header, .rbc-time-header .rbc-header { overflow: visible !important; }
            .rbc-time-header { z-index: 60; position: relative; }
            .rbc-time-content { position: relative; z-index: 1; }
            .rbc-time-view { overflow: visible !important; }
            .rbc-header { padding: 2px 2px; }
            .rbc-header > * { width: 100%; }
          `}</style>
          <DragAndDropCalendar
            localizer={localizer}
            events={[
              ...filteredMasterEvents,
              ...mergeOverlappingAvailabilities(allAvailabilities)
                .filter(av => selectedTeachers.includes(av.teacher_id))
                .map(av => {
                  const dayOfWeek = normalizeDayOfWeek(av.day_of_week);
                  if (dayOfWeek === null) return null;

                  const weekStart = moment().startOf("week").day(dayOfWeek);
                  const [startHour, startMinute] = av.start_time.split(":");
                  const [endHour, endMinute] = av.end_time.split(":");
                  const start = weekStart.clone().set({ hour: +startHour, minute: +startMinute, second: 0 }).toDate();
                  const end = weekStart.clone().set({ hour: +endHour, minute: +endMinute, second: 0 }).toDate();

                  return {
                    id: `avail-${av.teacher_id}-${av.day_of_week}-${av.start_time}-${av.end_time}`,
                    title: `${av.teacher_first_name || ""} ${av.teacher_last_name || ""} - Available`.trim(),
                    start,
                    end,
                    availability: true,
                    isDraggable: false,
                    resizable: false,
                    color: getTeacherColor(av.teacher_id),
                    teacher_id: av.teacher_id,
                    teacher_first_name: av.teacher_first_name,
                    teacher_last_name: av.teacher_last_name
                  };
                })
                .filter(Boolean)
            ]}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={["work_week"]}
            view="work_week"
            date={date}
            onNavigate={setDate}
            eventPropGetter={masterEventStyleGetter}
            selectable={true}
            selectOverlap={true}
            onSelectSlot={handleMasterSelectSlot}
            onSelectEvent={handleEventClick}
            onEventDrop={handleMasterEventDrop}
            onEventResize={handleMasterEventDrop}
            resizable={isEditMode}
            draggableAccessor={(event) => isEditMode && !event.availability}
            resizableAccessor={(event) => isEditMode && !event.availability}
            min={new Date(1970, 0, 1, 6, 30, 0)}
            max={new Date(1970, 0, 1, 16, 0, 0)}
            step={5}
            timeslots={6}
            components={{
              toolbar: MasterToolbar,
              header: CustomHeader,
              event: ({ event }) => (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "2px",
                    overflow: "hidden"
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {event.subject || event.title}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    opacity: 0.95,
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}>
                    {event.grade && (
                      <span style={{
                        background: "rgba(255,255,255,0.25)",
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: "10px"
                      }}>
                        Gr {event.grade}
                      </span>
                    )}
                    {event.room && (
                      <span style={{ fontSize: "10px", fontWeight: 600 }}>Rm {event.room}</span>
                    )}
                  </div>
                  {event.teacher && (
                    <div style={{
                      fontSize: "10px",
                      opacity: 0.85,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {event.teacher}
                    </div>
                  )}
                </div>
              )
            }}
          />
        </div>

        {!sidebarCollapsed && (
          <div
            data-filter-sidebar
            style={{
              width: sidebarWidth,
              maxWidth: "36vw",
              minWidth: 220,
              flexShrink: 1,
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
              maxHeight: 649,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "relative",
              transition: isResizing ? "none" : "width 0.2s ease"
            }}>
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{
                position: "absolute",
                top: 21,
                right: 16,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "#7f8c8d",
                padding: 0,
                lineHeight: 1,
                zIndex: 10,
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Collapse sidebar"
            >
              ✕
            </button>

            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              style={{
                position: "absolute",
                left: -3,
                top: 0,
                bottom: 0,
                width: 12,
                cursor: "ew-resize",
                backgroundColor: "transparent",
                transition: "background-color 0.2s",
                zIndex: 100,
                borderLeft: "3px solid transparent",
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => {
                e.target.style.borderLeft = "3px solid #3498db";
                e.target.style.backgroundColor = "rgba(52, 152, 219, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderLeft = "3px solid transparent";
                e.target.style.backgroundColor = "transparent";
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingRight: 32 }}>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2c3e50" }}>Filters</h4>
              {(selectedTeachers.length > 0 || selectedGrades.length > 0 || selectedRooms.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedTeachers([]);
                    setSelectedGrades([]);
                    setSelectedRooms([]);
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "#3498db",
                    border: "1px solid #3498db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#3498db";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#3498db";
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #e1e8ed",
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                onClick={() => setTeacherFilterExpanded(!teacherFilterExpanded)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                  cursor: "pointer",
                  padding: "8px 4px",
                  borderRadius: "6px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e1e8ed",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "12px", color: "#666", transition: "transform 0.2s ease", transform: teacherFilterExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                    ▶
                  </span>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer" }}>
                    Select Teachers
                  </label>
                </div>
              </div>
              {teacherFilterExpanded && (
                <>
                  {teachers && teachers.length > 0 ? (
                    teachers
                      .filter(t =>
                        searchTerm.trim() === "" ||
                        `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase())
                      )
                      .map((t) => {
                        const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === t.id);
                        const isSelected = selectedTeachers.includes(t.id);
                        const teacherColor = getTeacherColor(t.id);

                        return (
                          <div key={t.id} style={{
                            border: `2px solid ${isSelected ? teacherColor : "#e1e8ed"}`,
                            borderRadius: 8,
                            padding: 10,
                            backgroundColor: isSelected ? hexToRgba(teacherColor, 0.15) : "#f8f9fa",
                            transition: "all 0.2s ease",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTeachers(prev => prev.filter(id => id !== t.id));
                            } else {
                              setSelectedTeachers(prev => [...prev, t.id]);
                            }
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                border: `3px solid ${teacherColor}`,
                                backgroundColor: isSelected ? teacherColor : "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: 14,
                                fontWeight: "bold",
                                flexShrink: 0,
                                boxShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.1)"
                              }}>
                                {isSelected ? "✓" : ""}
                              </div>
                              <div style={{
                                width: 16,
                                height: 16,
                                backgroundColor: teacherColor,
                                borderRadius: 3,
                                border: "2px solid white",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                flexShrink: 0
                              }}></div>
                              <span style={{
                                fontSize: 14,
                                fontWeight: isSelected ? 600 : 500,
                                color: "#2c3e50",
                                flex: 1
                              }}>
                                {t.first_name} {t.last_name}
                              </span>
                            </div>

                            {(isSelected || teacherAvailabilities.length > 0) && (
                              <div style={{ marginLeft: 40, display: "flex", flexDirection: "column", gap: 3 }}>
                                {teacherAvailabilities.length > 0 ? (
                                  teacherAvailabilities.slice(0, 3).map((av, idx) => (
                                    <div key={av.id || idx} style={{
                                      fontSize: 11,
                                      color: "#666",
                                      background: "rgba(255,255,255,0.7)",
                                      borderRadius: 3,
                                      padding: "2px 6px",
                                      borderLeft: `3px solid ${teacherColor}`
                                    }}>
                                      {typeof av.day_of_week === "number" ?
                                        moment().day(av.day_of_week).format("ddd") :
                                        av.day_of_week.slice(0, 3)
                                      } {av.start_time?.slice(0, 5)} - {av.end_time?.slice(0, 5)}
                                    </div>
                                  ))
                                ) : (
                                  <div style={{
                                    fontSize: 11,
                                    color: "#999",
                                    fontStyle: "italic",
                                    padding: "2px 6px"
                                  }}>
                                    No availability set
                                  </div>
                                )}
                                {teacherAvailabilities.length > 3 && (
                                  <div style={{ fontSize: 10, color: "#999", padding: "2px 6px" }}>
                                    +{teacherAvailabilities.length - 3} more...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <div style={{
                      padding: 20,
                      textAlign: "center",
                      color: "#666",
                      fontSize: 14
                    }}>
                      {teachers === null || teachers === undefined ? "Loading teachers..." : "No teachers found"}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <div
                onClick={() => setGradeFilterExpanded(!gradeFilterExpanded)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                  cursor: "pointer",
                  padding: "8px 4px",
                  borderRadius: "6px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e1e8ed",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "12px", color: "#666", transition: "transform 0.2s ease", transform: gradeFilterExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                    ▶
                  </span>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer" }}>
                    Filter by Grade
                  </label>
                </div>
              </div>
              {gradeFilterExpanded && (
                <div style={{ maxHeight: 100, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {gradeDropdownOptions.map(grade => {
                    const isSelected = selectedGrades.includes(grade);
                    const gradeColor = grade === "PK" ? "#9b59b6" : "#3498db";
                    return (
                      <div
                        key={grade}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGrades(prev => prev.filter(g => g !== grade));
                          } else {
                            setSelectedGrades(prev => [...prev, grade]);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: `2px solid ${isSelected ? gradeColor : "#e1e8ed"}`,
                          backgroundColor: isSelected ? hexToRgba(gradeColor, 0.15) : "#f8f9fa",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          border: `2px solid ${gradeColor}`,
                          backgroundColor: isSelected ? gradeColor : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 10,
                          fontWeight: "bold",
                          flexShrink: 0
                        }}>
                          {isSelected ? "✓" : ""}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500 }}>
                          {grade === "PK" ? "PreK" : grade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div
                onClick={() => setRoomFilterExpanded(!roomFilterExpanded)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                  cursor: "pointer",
                  padding: "8px 4px",
                  borderRadius: "6px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e1e8ed",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "12px", color: "#666", transition: "transform 0.2s ease", transform: roomFilterExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                    ▶
                  </span>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer" }}>
                    Filter by Room
                  </label>
                </div>
              </div>
              {roomFilterExpanded && (
                <div style={{ maxHeight: 100, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {roomOptions.map(room => {
                    const isSelected = selectedRooms.includes(room);
                    const roomColor = "#f39c12";
                    return (
                      <div
                        key={room}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRooms(prev => prev.filter(r => r !== room));
                          } else {
                            setSelectedRooms(prev => [...prev, room]);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: `2px solid ${isSelected ? roomColor : "#e1e8ed"}`,
                          backgroundColor: isSelected ? hexToRgba(roomColor, 0.15) : "#f8f9fa",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          border: `2px solid ${roomColor}`,
                          backgroundColor: isSelected ? roomColor : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 10,
                          fontWeight: "bold",
                          flexShrink: 0
                        }}>
                          {isSelected ? "✓" : ""}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500 }}>
                          Room {room}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              width: 40,
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "12px 8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#3498db",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "fit-content"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#3498db";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#3498db";
            }}
            title="Expand filters"
          >
            ☰
          </button>
        )}

        
      </div>
    </>
  );
}
