import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import SidebarLayout from "../../components/SidebarLayout";
import { useAuth } from "../../context/AuthContext";
import MasterSchedule from "./MasterSchedule";
import StudentSchedules from "./StudentSchedules";
import ScheduleModals from "./ScheduleModals";
import {
  getABDay,
  getABLabelForHeader,
  generateRecurringEvents,
  mergeOverlappingAvailabilities,
  getTeacherColor,
  hexToRgba,
  normalizeDayOfWeek,
  recurringDayToJsDay
} from "./scheduleUtils";

const localizer = momentLocalizer(moment);
const grades = ["K","1","2","3","4","5","6","7","8","9","10","11","12","Not here?"];

const initialDetails = {
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
};

async function saveScheduleToDatabase(data) {
  try {
    const res = await fetch("http://localhost:3000/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to save");
    return { success: true, id: json.idcalendar || json.id || json.insertId || Date.now(), insertId: json.idcalendar || json.id || json.insertId };
  } catch (e) {
    console.error("saveScheduleToDatabase error", e);
    return { success: false };
  }
}

async function updateScheduleInDatabase(id, data) {
  try {
    const res = await fetch(`http://localhost:3000/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const responseText = await res.text();
    if (!res.ok) {
      throw new Error(`Update failed: ${responseText}`);
    }
    return { success: true, response: responseText };
  } catch (e) {
    console.error("updateScheduleInDatabase error", e);
    return { success: false, error: e.message };
  }
}

async function deleteScheduleFromDatabase(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    return { success: true };
  } catch (e) {
    console.error("deleteScheduleFromDatabase error", e);
    return { success: false };
  }
}

export default function SchedulesPage() {
  const [schoolView, setSchoolView] = useState("all");
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("master-schedule");
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [masterEvents, setMasterEvents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherEvents, setTeacherEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEvents, setStudentEvents] = useState([]);
  const [createEvents, setCreateEvents] = useState([]);
  const [allAvailabilities, setAllAvailabilities] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [conflictModal, setConflictModal] = useState({ open: false, messages: [], pendingEvent: null });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fridayModal, setFridayModal] = useState({ open: false, slotInfo: null });
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [eventDetailsModal, setEventDetailsModal] = useState({ open: false, event: null });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [draggingEventId, setDraggingEventId] = useState(null);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [teacherFilterExpanded, setTeacherFilterExpanded] = useState(true);
  const [gradeFilterExpanded, setGradeFilterExpanded] = useState(true);
  const [roomFilterExpanded, setRoomFilterExpanded] = useState(true);
  const [details, setDetails] = useState(initialDetails);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const cleanupDuplicateExceptions = () => {
    setCreateEvents(prev => {
      const seen = new Set();
      return prev.filter(event => {
        const key = `${event.subject}-${event.teacherId}-${event.grade}-${event.room}-${moment(event.start).format("dddd-HH:mm")}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    });
  };

  const getRole = u => (u && u.role ? u.role.trim().toLowerCase() : "");
  const isStudent = getRole(user) === "student";
  const isTeacher = getRole(user) === "teacher";

  const handleLogout = () => {
    logout();
  };

  const getTabs = () => ([
    { id: "master-schedule", label: "Master Schedule", icon: "📘" },
    { id: "student-schedules", label: "Student Schedules", icon: "🧑‍🎓" }
  ]);

  const tabs = getTabs();

  const fetchMyScheduleEvents = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/schedules");
      const data = await res.json();
      const personalEvents = Array.isArray(data) ? data.map(event => ({
        id: event.idcalendar || event.id,
        title: event.event_title || event.title || "Event",
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description || "",
        classId: null,
        isClass: false,
        eventType: event.event_type || "event"
      })) : [];
      setScheduleEvents(personalEvents);
    } catch (err) {
      console.error("fetchMyScheduleEvents error", err);
      setScheduleEvents([]);
    }
  };

  const fetchMasterSchedule = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/schedules");
      const data = await response.json();

      const availResponse = await fetch("http://localhost:3000/api/teacher-availabilities");
      const availabilityData = await availResponse.json();

      if (!Array.isArray(data)) {
        setMasterEvents([]);
        setCreateEvents([]);
        return;
      }

      const events = data.map(schedule => {
        const recurringDay = schedule.recurring_day !== undefined && schedule.recurring_day !== null
          ? parseInt(schedule.recurring_day, 10)
          : null;

        const teacherName = schedule.first_name && schedule.last_name ? `${schedule.first_name} ${schedule.last_name}` : "Unknown Teacher";
        const subject = schedule.subject || schedule.event_title || "Class";
        const grade = schedule.grade || "";

        let title = subject;
        if (grade) title += ` (${grade})`;

        const originalStart = moment(schedule.start_time);
        const originalEnd = moment(schedule.end_time);
        const startHour = originalStart.hour();
        const startMinute = originalStart.minute();
        const endHour = originalEnd.hour();
        const endMinute = originalEnd.minute();
        const dayOfWeek = recurringDay !== null
          ? recurringDayToJsDay(recurringDay)
          : originalStart.day();
        const safeDayOfWeek = dayOfWeek === null ? originalStart.day() : dayOfWeek;

        const currentWeekStart = moment().startOf("week");
        const eventDate = currentWeekStart.clone().day(safeDayOfWeek);
        const start = eventDate.clone().set({ hour: startHour, minute: startMinute, second: 0 }).toDate();
        const end = eventDate.clone().set({ hour: endHour, minute: endMinute, second: 0 }).toDate();

        const eventObj = {
          id: schedule.idcalendar,
          title: title,
          start: start,
          end: end,
          isClass: true,
          description: schedule.description,
          teacherId: schedule.user_id,
          teacher: teacherName,
          room: schedule.room || "",
          grade: grade,
          subject: schedule.subject || schedule.event_title || "Class",
          recurringDays: recurringDay !== null ? [recurringDay] : [],
          abDay: schedule.ab_day || "",
          databaseId: schedule.idcalendar
        };

        const startTime = moment(start).format("HH:mm:ss");
        const endTime = moment(end).format("HH:mm:ss");
        const eventDay = safeDayOfWeek;

        let hasConflict = false;

        if (availabilityData && Array.isArray(availabilityData)) {
          const teacherAvail = availabilityData.filter(a => {
            if (a.teacher_id != schedule.user_id) return false;
            let availDay = normalizeDayOfWeek(a.day_of_week);
            return availDay === eventDay;
          });

          if (teacherAvail.length === 0) {
            hasConflict = true;
          } else {
            const isWithinWindow = teacherAvail.some(a => {
              const availStart = moment(a.start_time, "HH:mm:ss");
              const availEnd = moment(a.end_time, "HH:mm:ss");
              const eventStart = moment(startTime, "HH:mm:ss");
              const eventEnd = moment(endTime, "HH:mm:ss");

              return eventStart.isSameOrAfter(availStart) && eventEnd.isSameOrBefore(availEnd);
            });
            hasConflict = !isWithinWindow;
          }
        }

        eventObj.hasConflict = hasConflict;

        return eventObj;
      });

      setMasterEvents(events);
      setCreateEvents(prev => (isEditMode || editMode || pendingChanges.length > 0) ? prev : events);
    } catch (error) {
      console.error("Error fetching master schedule from backend:", error);
      setMasterEvents([]);
      setCreateEvents([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/teachers");
      if (!res.ok) {
        setTeachers([]);
        return;
      }
      const teachersData = await res.json();
      setTeachers(teachersData || []);
    } catch (err) {
      console.error("Error fetching teachers from backend:", err);
      setTeachers([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/students");
      const studentsData = res.ok ? await res.json() : [];
      setStudents(studentsData);
    } catch (err) {
      console.error("Error fetching students - trying backup port:", err);
      try {
        const res = await fetch("http://localhost:3001/api/students");
        const studentsData = res.ok ? await res.json() : [];
        setStudents(studentsData);
      } catch (backupErr) {
        console.error("Backup port failed for students:", backupErr);
        setStudents([]);
      }
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/schedules");
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const schedules = await response.json();
      const rooms = Array.from(new Set(
        schedules
          .map(schedule => {
            const roomValue = schedule.room || schedule.room_number || "";
            return roomValue ? roomValue.toString().trim() : "";
          })
          .filter(room => room !== "")
      )).sort();

      setAvailableRooms(rooms);
    } catch (err) {
      console.error("Error fetching rooms from schedules API:", err);
      setAvailableRooms([]);
    }
  };

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/teacher-availabilities");
        const availData = res.ok ? await res.json() : [];
        setAllAvailabilities(availData);
      } catch (err) {
        console.error("Error fetching teacher availability from backend:", err);
        setAllAvailabilities([]);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "my-schedule") {
          await fetchMyScheduleEvents();
        } else if (activeTab === "master-schedule") {
          await Promise.all([fetchMasterSchedule(), fetchTeachers(), fetchAvailabilities(), fetchRooms()]);
        } else if (activeTab === "teacher-schedules") {
          await fetchTeachers();
        } else if (activeTab === "student-schedules") {
          await fetchStudents();
        } else if (activeTab === "create-schedule") {
          await Promise.all([fetchTeachers(), fetchAvailabilities(), fetchMasterSchedule()]);
        }
      } catch (error) {
        console.error("Data fetching error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, activeTab]);

  useEffect(() => {
    const interval = setInterval(cleanupDuplicateExceptions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const sidebar = document.querySelector("[data-filter-sidebar]");
      if (!sidebar) return;

      const sidebarRect = sidebar.getBoundingClientRect();
      const newWidth = sidebarRect.right - e.clientX;

      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingChanges.length > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingChanges]);

  const fetchTeacherEvents = async (teacherId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/teachers/${teacherId}/schedules`);
      const data = await response.json();
      const events = data.map(schedule => {
        const recurringDay = schedule.recurring_day !== undefined && schedule.recurring_day !== null
          ? parseInt(schedule.recurring_day, 10)
          : null;

        return {
          id: schedule.idcalendar,
          title: schedule.event_title,
          start: new Date(schedule.start_time),
          end: new Date(schedule.end_time),
          isClass: true,
          description: schedule.description,
          teacherId: schedule.user_id,
          teacher: schedule.first_name && schedule.last_name ? `${schedule.first_name} ${schedule.last_name}` : "Unknown Teacher",
          room: schedule.room || "",
          grade: schedule.grade || "",
          subject: schedule.subject || schedule.event_title || "Class",
          recurringDays: recurringDay !== null ? [recurringDay] : [],
          abDay: schedule.ab_day || "",
          databaseId: schedule.idcalendar
        };
      });
      setTeacherEvents(events);
    } catch (error) {
      console.error("Error fetching teacher events:", error);
      setTeacherEvents([]);
    }
  };

  const fetchStudentEvents = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/students/${studentId}/classes`);
      const classes = res.ok ? await res.json() : [];

      let events = [];
      classes.forEach(cls => {
        const recurringEvents = generateRecurringEvents(cls);
        events = events.concat(recurringEvents);
      });

      setStudentEvents(events);
    } catch (err) {
      console.error("Error fetching student events:", err);
      try {
        const res = await fetch(`http://localhost:3001/api/students/${studentId}/classes`);
        const classes = res.ok ? await res.json() : [];
        let events = [];
        classes.forEach(cls => {
          events = events.concat(generateRecurringEvents(cls));
        });
        setStudentEvents(events);
      } catch (backupErr) {
        console.error("Backup port also failed:", backupErr);
        setStudentEvents([]);
      }
    }
  };

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    fetchTeacherEvents(teacher.id);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentEvents(student.id);
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3498db";
    let borderStyle = "none";

    if (event.hasConflict || event.hasConflicts) {
      borderStyle = "3px solid #e74c3c";
    }

    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: 4,
        border: borderStyle,
        fontSize: "13px",
        fontWeight: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }
    };
  };

  const handleEventClick = (event) => {
    if (deleteMode) {
      if (selectedToDelete.includes(event.id)) {
        setSelectedToDelete(prev => prev.filter(id => id !== event.id));
      } else {
        setSelectedToDelete(prev => [...prev, event.id]);
      }
      return;
    }

    setEventDetailsModal({ open: true, event });
  };

  const LoadingSpinner = () => (
    <div style={{
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "60px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
      textAlign: "center"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #3498db",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px auto"
      }}></div>
      <p style={{ color: "#7f8c8d", margin: 0 }}>Loading...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    switch (activeTab) {
      case "master-schedule":
        return (
          <MasterSchedule
            date={date}
            setDate={setDate}
            masterEvents={masterEvents}
            setMasterEvents={setMasterEvents}
            createEvents={createEvents}
            setCreateEvents={setCreateEvents}
            teachers={teachers}
            allAvailabilities={allAvailabilities}
            selectedTeachers={selectedTeachers}
            setSelectedTeachers={setSelectedTeachers}
            selectedGrades={selectedGrades}
            setSelectedGrades={setSelectedGrades}
            selectedRooms={selectedRooms}
            setSelectedRooms={setSelectedRooms}
            availableRooms={availableRooms}
            schoolView={schoolView}
            setSchoolView={setSchoolView}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            deleteMode={deleteMode}
            setDeleteMode={setDeleteMode}
            selectedToDelete={selectedToDelete}
            setSelectedToDelete={setSelectedToDelete}
            pendingChanges={pendingChanges}
            setPendingChanges={setPendingChanges}
            setLoading={setLoading}
            fetchMasterSchedule={fetchMasterSchedule}
            fetchRooms={fetchRooms}
            setFridayModal={setFridayModal}
            setSelectedSlot={setSelectedSlot}
            setDetails={setDetails}
            setModalOpen={setModalOpen}
            isEventInTeacherAvailability={isEventInTeacherAvailability}
            deleteScheduleFromDatabase={deleteScheduleFromDatabase}
            updateScheduleInDatabase={updateScheduleInDatabase}
            getTeacherColor={getTeacherColor}
            hexToRgba={hexToRgba}
            mergeOverlappingAvailabilities={mergeOverlappingAvailabilities}
            getABDay={getABDay}
            getABLabelForHeader={getABLabelForHeader}
            normalizeDayOfWeek={normalizeDayOfWeek}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            sidebarWidth={sidebarWidth}
            setSidebarWidth={setSidebarWidth}
            isResizing={isResizing}
            setIsResizing={setIsResizing}
            teacherFilterExpanded={teacherFilterExpanded}
            setTeacherFilterExpanded={setTeacherFilterExpanded}
            gradeFilterExpanded={gradeFilterExpanded}
            setGradeFilterExpanded={setGradeFilterExpanded}
            roomFilterExpanded={roomFilterExpanded}
            setRoomFilterExpanded={setRoomFilterExpanded}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleEventClick={handleEventClick}
          />
        );
      case "student-schedules":
        return (
          <StudentSchedules
            students={students}
            selectedStudent={selectedStudent}
            studentEvents={studentEvents}
            handleStudentSelect={handleStudentSelect}
            renderCalendar={renderCalendar}
          />
        );
      default:
        return null;
    }
  };

  const isEventInTeacherAvailability = (event) => {
    if (!event.teacherId) return true;

    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const eventDay = eventStart.day();

    const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === event.teacherId);

    for (const availability of teacherAvailabilities) {
      let availabilityDay = normalizeDayOfWeek(availability.day_of_week);

      if (eventDay === availabilityDay) {
        const availStart = moment(availability.start_time, "HH:mm:ss");
        const availEnd = moment(availability.end_time, "HH:mm:ss");

        availStart.year(eventStart.year()).month(eventStart.month()).date(eventStart.date());
        availEnd.year(eventEnd.year()).month(eventEnd.month()).date(eventEnd.date());

        const isWithin = eventStart.isSameOrAfter(availStart) && eventEnd.isSameOrBefore(availEnd);

        if (isWithin) {
          return true;
        }
      }
    }

    return false;
  };

  const handleFridaySelection = async (abDay) => {
    const { start, end, dragEvent, originalEvent, draggedEventId, isNewClass, isSaveEvent } = fridayModal.slotInfo;
    setFridayModal({ open: false, slotInfo: null });

    if (isSaveEvent) {
      setDetails(prev => ({
        ...prev,
        abDay: abDay,
        dayType: abDay
      }));
      setTimeout(() => {
        const form = document.querySelector("form");
        if (form) {
          form.dispatchEvent(new Event("submit", { bubbles: true }));
        }
      }, 50);
      return;
    }

    if (isNewClass) {
      const overlappingAvailabilities = allAvailabilities.filter(av => {
        const slotStart = moment(start);
        const slotEnd = moment(end);
        const dayOfWeek = 5;
        const avDay = normalizeDayOfWeek(av.day_of_week);

        if (avDay !== dayOfWeek) return false;

        const [avStartHour, avStartMin] = av.start_time.split(":").map(Number);
        const [avEndHour, avEndMin] = av.end_time.split(":").map(Number);
        const avStart = slotStart.clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
        const avEnd = slotStart.clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });

        return slotStart.isSameOrAfter(avStart) && slotEnd.isSameOrBefore(avEnd);
      });

      let preSelectedTeacherId = "";
      if (overlappingAvailabilities.length === 1) {
        preSelectedTeacherId = overlappingAvailabilities[0].teacher_id.toString();
      }

      const dayIdx = 4;
      const recurringDays = [dayIdx];

      setSelectedSlot({ start, end });
      setDetails({
        teacherId: preSelectedTeacherId,
        grade: "",
        customGrade: "",
        subject: "",
        room: "",
        startTime: moment(start).format("h:mm A"),
        endTime: moment(end).format("h:mm A"),
        recurringDays,
        abDay: abDay,
        dayType: abDay
      });
      setModalOpen(true);
      return;
    }

    if (dragEvent) {
      const { baseEvent, originalDate, isRecurringInstance } = fridayModal.slotInfo;

      if (isRecurringInstance && baseEvent && originalDate) {
        const exceptionId = `${baseEvent.id}-exception-${originalDate}`;
        const exceptionEvent = {
          ...baseEvent,
          id: exceptionId,
          start: start,
          end: end,
          recurringDays: [4],
          abDay: abDay,
          dayType: abDay,
          isException: true,
          originalDate: originalDate,
          originalEventId: baseEvent.id
        };

        try {
          const scheduleData = {
            start_time: moment(start).format("YYYY-MM-DD HH:mm:ss"),
            end_time: moment(end).format("YYYY-MM-DD HH:mm:ss"),
            class_id: baseEvent.id,
            event_title: `${baseEvent.subject} - ${baseEvent.grade} (Friday ${abDay} Day)`,
            user_id: baseEvent.teacherId,
            room: baseEvent.room,
            description: `Friday ${abDay} Day exception for ${baseEvent.subject}`
          };

          const result = await saveScheduleToDatabase(scheduleData);
          exceptionEvent.databaseId = result.insertId;
        } catch (error) {
          console.error("Error saving Friday exception to database:", error);
        }

        setCreateEvents(prev => [...prev, exceptionEvent]);
      } else {
        const testEvent = { ...dragEvent, start, end };
        const isInAvailability = isEventInTeacherAvailability(testEvent);

        try {
          if (dragEvent.databaseId) {
            const scheduleData = {
              start_time: moment(start).format("YYYY-MM-DD HH:mm:ss"),
              end_time: moment(end).format("YYYY-MM-DD HH:mm:ss"),
              class_id: dragEvent.id,
              event_title: `${dragEvent.subject} - ${dragEvent.grade} (Friday ${abDay} Day)`,
              user_id: dragEvent.teacherId,
              room: dragEvent.room,
              description: `Friday ${abDay} Day - ${dragEvent.subject}`,
              ab_day: abDay,
              recurring_day: 4
            };

            await updateScheduleInDatabase(dragEvent.databaseId, scheduleData);
          }
        } catch (error) {
          console.error("Error updating Friday event in database:", error);
        }

        const updatedEvent = {
          ...dragEvent,
          start: start,
          end: end,
          abDay: abDay,
          recurringDays: [4],
          hasConflict: !isInAvailability
        };

        setMasterEvents(prev => prev.map(ev =>
          ev.id === dragEvent.id ? updatedEvent : ev
        ));

        setPendingChanges(prev => {
          const filtered = prev.filter(change => change.id !== dragEvent.id);
          return [...filtered, updatedEvent];
        });

        setCreateEvents(prev => {
          const updatedEvents = prev.map(ev =>
            ev.id === dragEvent.id
              ? {
                ...ev,
                start: start,
                end: end,
                abDay: abDay,
                recurringDays: [4]
              }
              : ev
          );
          return updatedEvents;
        });
      }

      setDraggingEventId(null);
    }
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }));

    if (selectedSlot) {
      const newStart = moment(selectedSlot.start);
      const newEnd = moment(selectedSlot.end);

      if (field === "startTime") {
        const [hour, minute] = moment(value, "h:mm A").format("HH:mm").split(":");
        newStart.hour(parseInt(hour, 10)).minute(parseInt(minute, 10));
      } else if (field === "endTime") {
        const [hour, minute] = moment(value, "h:mm A").format("HH:mm").split(":");
        newEnd.hour(parseInt(hour, 10)).minute(parseInt(minute, 10));
      }

      setSelectedSlot({ start: newStart.toDate(), end: newEnd.toDate() });
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!details.subject || !details.teacherId || !details.grade || !details.room) {
      alert("Please fill in all required fields.");
      return;
    }

    const newTeacherId = parseInt(details.teacherId, 10);
    const newRoom = details.room;
    const newGrade = details.grade === "Not here?" ? details.customGrade : details.grade;
    const newSubject = details.subject;
    const newStart = moment(selectedSlot.start);
    const newEnd = moment(selectedSlot.end);
    let newRecurringDays = details.recurringDays || [];
    const newAbDay = details.abDay || "";

    if (newRecurringDays.includes(4) && !newAbDay) {
      setFridayModal({
        open: true,
        slotInfo: {
          start: newStart.toDate(),
          end: newEnd.toDate(),
          isSaveEvent: true
        }
      });
      return;
    }

    if (newRecurringDays.length === 0) {
      const dayIdx = newStart.day() - 1;
      if (dayIdx >= 0 && dayIdx <= 4) {
        newRecurringDays = [dayIdx];
      }
    }

    const newTeacherName = (() => {
      const t = teachers.find(t => t.id === newTeacherId);
      return t ? `${t.first_name} ${t.last_name}` : "";
    })();

    let conflictMessages = [];

    const isOverlap = (start1, end1, start2, end2) => {
      return moment(start1).isBefore(moment(end2)) && moment(start2).isBefore(moment(end1));
    };

    const checkConflicts = () => {
      const newInstances = [];

      if (newRecurringDays && newRecurringDays.length > 0) {
        const duration = newEnd.diff(newStart, "minutes");
        for (const recurDay of newRecurringDays) {
          const momentDay = recurDay + 1;
          const weekStart = moment().startOf("week");
          const dayStart = weekStart.clone().day(momentDay);
          const instanceStart = dayStart.set({ hour: newStart.hour(), minute: newStart.minute(), second: 0 });
          const instanceEnd = instanceStart.clone().add(duration, "minutes");
          newInstances.push({ start: instanceStart, end: instanceEnd, dayOfWeek: momentDay });
        }
      } else {
        newInstances.push({ start: newStart, end: newEnd, dayOfWeek: newStart.day() });
      }

      for (const newInst of newInstances) {
        const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === newTeacherId);
        if (teacherAvailabilities.length > 0) {
          const newInstDayOfWeek = newInst.dayOfWeek === 0 ? 7 : newInst.dayOfWeek;
          const availableOnDay = teacherAvailabilities.some(av => {
            const avDay = normalizeDayOfWeek(av.day_of_week);
            if (avDay === null) return false;
            if (avDay !== (newInstDayOfWeek === 7 ? 0 : newInstDayOfWeek)) return false;
            const [avStartHour, avStartMin] = av.start_time.split(":").map(Number);
            const [avEndHour, avEndMin] = av.end_time.split(":").map(Number);
            const avStart = moment(newInst.start).clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
            const avEnd = moment(newInst.start).clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });
            return newInst.start.isSameOrAfter(avStart) && newInst.end.isSameOrBefore(avEnd);
          });
          if (!availableOnDay) {
            const dayName = moment().day(newInstDayOfWeek).format("dddd");
            conflictMessages.push(`${newTeacherName} is not available on ${dayName} from ${newInst.start.format("h:mm A")} to ${newInst.end.format("h:mm A")}`);
          }
        }

        const allEvents = [...createEvents, ...masterEvents];
        const otherEvents = editMode ? allEvents.filter(ev => ev.id !== editingEventId) : allEvents;
        for (const otherEvent of otherEvents) {
          let otherInstances = [];
          if (Array.isArray(otherEvent.recurringDays) && otherEvent.recurringDays.length > 0) {
            const baseStart = moment(otherEvent.start);
            const baseEnd = moment(otherEvent.end);
            const duration = baseEnd.diff(baseStart, "minutes");
            for (const recurDay of otherEvent.recurringDays) {
              const momentDay = recurDay + 1;
              const weekStart = moment().startOf("week");
              const dayStart = weekStart.clone().day(momentDay);
              const instanceStart = dayStart.set({ hour: baseStart.hour(), minute: baseStart.minute(), second: 0 });
              const instanceEnd = instanceStart.clone().add(duration, "minutes");
              otherInstances.push({ ...otherEvent, start: instanceStart, end: instanceEnd });
            }
          } else {
            otherInstances.push({ ...otherEvent, start: moment(otherEvent.start), end: moment(otherEvent.end) });
          }

          for (const otherInst of otherInstances) {
            if (isOverlap(newInst.start, newInst.end, otherInst.start, otherInst.end) && newInst.start.day() === otherInst.start.day()) {
              if (otherInst.teacher === newTeacherName) {
                const dayName = newInst.start.format("dddd");
                conflictMessages.push(`${newTeacherName} already has "${otherInst.subject}" on ${dayName} from ${otherInst.start.format("h:mm A")} to ${otherInst.end.format("h:mm A")}`);
              }
              if (otherInst.room === newRoom) {
                const dayName = newInst.start.format("dddd");
                conflictMessages.push(`Room ${newRoom} is already booked for "${otherInst.subject}" on ${dayName} from ${otherInst.start.format("h:mm A")} to ${otherInst.end.format("h:mm A")}`);
              }
            }
          }
        }
      }
    };

    checkConflicts();

    if (conflictMessages.length > 0) {
      const newEvent = {
        id: editMode ? editingEventId : Date.now().toString(),
        subject: newSubject,
        teacher: newTeacherName,
        teacherId: newTeacherId,
        grade: newGrade,
        room: newRoom,
        start: newStart.toDate(),
        end: newEnd.toDate(),
        recurringDays: newRecurringDays,
        abDay: newAbDay,
        hasConflicts: true
      };

      setConflictModal({ open: true, messages: conflictMessages, pendingEvent: newEvent });
      return;
    }

    const newEvent = {
      id: editMode ? editingEventId : Date.now().toString(),
      subject: newSubject,
      teacher: newTeacherName,
      teacherId: newTeacherId,
      grade: newGrade,
      room: newRoom,
      start: newStart.toDate(),
      end: newEnd.toDate(),
      recurringDays: newRecurringDays,
      abDay: newAbDay,
      hasConflicts: false
    };

    const isInAvailability = isEventInTeacherAvailability(newEvent);
    newEvent.outOfAvailability = !isInAvailability;

    try {
      if (editMode) {
        const baseId = editingEventId;

        const oldEvents = createEvents.filter(ev => {
          if (ev.id.toString().startsWith(baseId.toString())) {
            return true;
          }
          const eventToEdit = createEvents.find(e => e.id.toString() === baseId.toString());
          if (eventToEdit) {
            return ev.subject === eventToEdit.subject &&
              ev.teacher === eventToEdit.teacher &&
              ev.grade === eventToEdit.grade &&
              ev.room === eventToEdit.room &&
              moment(ev.start).format("HH:mm") === moment(eventToEdit.start).format("HH:mm") &&
              moment(ev.end).format("HH:mm") === moment(eventToEdit.end).format("HH:mm");
          }
          return false;
        });

        for (const oldEvent of oldEvents) {
          if (oldEvent.databaseId) {
            await deleteScheduleFromDatabase(oldEvent.databaseId);
          }
        }

        const newRecurringEvents = [];
        for (const dayIdx of newRecurringDays) {
          const weekday = dayIdx + 1;
          const base = moment().startOf("week").day(weekday);
          const duration = newEnd.diff(newStart, "minutes");
          const start = base.clone().set({ hour: newStart.hour(), minute: newStart.minute(), second: 0 });
          const end = start.clone().add(duration, "minutes");

          const scheduleData = {
            start_time: start.format("YYYY-MM-DD HH:mm:ss"),
            end_time: end.format("YYYY-MM-DD HH:mm:ss"),
            class_id: null,
            event_title: `${newSubject} - Grade ${newGrade}`,
            user_id: newTeacherId,
            room: newRoom,
            grade: newGrade,
            subject: newSubject,
            recurring_day: dayIdx,
            ab_day: newAbDay || getABDay(start.toDate()),
            description: `${newSubject} - Grade ${newGrade}`
          };

          const result = await saveScheduleToDatabase(scheduleData);

          if (result.success) {
            newRecurringEvents.push({
              id: `${result.id}`,
              title: `${newSubject} - ${newGrade}`,
              subject: newSubject,
              teacher: newTeacherName,
              teacherId: newTeacherId,
              grade: newGrade,
              room: newRoom,
              start: start.toDate(),
              end: end.toDate(),
              recurringDays: [dayIdx],
              abDay: newAbDay || getABDay(start.toDate()),
              isClass: true,
              description: newSubject,
              hasConflicts: false,
              outOfAvailability: !isEventInTeacherAvailability(newEvent),
              databaseId: result.id
            });
          }
        }

        setCreateEvents(prev => {
          const eventToEdit = prev.find(e => e.id.toString() === baseId.toString());
          const filtered = prev.filter(ev => {
            if (ev.id.toString().startsWith(baseId.toString())) {
              return false;
            }
            if (eventToEdit) {
              return !(ev.subject === eventToEdit.subject &&
                ev.teacher === eventToEdit.teacher &&
                ev.grade === eventToEdit.grade &&
                ev.room === eventToEdit.room &&
                moment(ev.start).format("HH:mm") === moment(eventToEdit.start).format("HH:mm") &&
                moment(ev.end).format("HH:mm") === moment(eventToEdit.end).format("HH:mm"));
            }
            return true;
          });
          return [...filtered, ...newRecurringEvents];
        });

        setMasterEvents(prev => {
          const eventToEdit = prev.find(e => e.id.toString() === baseId.toString());
          const filtered = prev.filter(ev => {
            if (ev.id.toString().startsWith(baseId.toString())) {
              return false;
            }
            if (eventToEdit) {
              return !(ev.subject === eventToEdit.subject &&
                ev.teacher === eventToEdit.teacher &&
                ev.grade === eventToEdit.grade &&
                ev.room === eventToEdit.room &&
                moment(ev.start).format("HH:mm") === moment(eventToEdit.start).format("HH:mm") &&
                moment(ev.end).format("HH:mm") === moment(eventToEdit.end).format("HH:mm"));
            }
            return true;
          });
          return [...filtered, ...newRecurringEvents];
        });

        setEditMode(false);
        setEditingEventId(null);
      } else {
        const newRecurringEvents = [];

        for (const dayIdx of newRecurringDays) {
          const weekday = dayIdx + 1;
          const base = moment().startOf("week").day(weekday);
          const duration = newEnd.diff(newStart, "minutes");
          const start = base.clone().set({ hour: newStart.hour(), minute: newStart.minute(), second: 0 });
          const end = start.clone().add(duration, "minutes");

          const scheduleData = {
            start_time: start.format("YYYY-MM-DD HH:mm:ss"),
            end_time: end.format("YYYY-MM-DD HH:mm:ss"),
            class_id: null,
            event_title: `${newSubject} - Grade ${newGrade}`,
            user_id: newTeacherId,
            room: newRoom,
            grade: newGrade,
            subject: newSubject,
            recurring_day: dayIdx,
            ab_day: newAbDay || getABDay(start.toDate()),
            description: `${newSubject} - Grade ${newGrade}`
          };

          const result = await saveScheduleToDatabase(scheduleData);

          if (result.success) {
            newRecurringEvents.push({
              id: `${result.id}`,
              title: `${newSubject} - ${newGrade}`,
              subject: newSubject,
              teacher: newTeacherName,
              teacherId: newTeacherId,
              grade: newGrade,
              room: newRoom,
              start: start.toDate(),
              end: end.toDate(),
              recurringDays: [dayIdx],
              abDay: newAbDay || getABDay(start.toDate()),
              isClass: true,
              description: newSubject,
              hasConflicts: false,
              outOfAvailability: !isEventInTeacherAvailability(newEvent),
              databaseId: result.id
            });
          }
        }

        if (newRecurringEvents.length > 0) {
          setCreateEvents(prev => [...prev, ...newRecurringEvents]);
          setMasterEvents(prev => [...prev, ...newRecurringEvents]);
          await fetchRooms();
        } else {
          alert("Failed to save schedule to database");
          return;
        }
      }
    } catch (error) {
      console.error("Database operation failed:", error);
      alert("Failed to save schedule. Please try again.");
      return;
    }

    setModalOpen(false);
    setDetails(initialDetails);
    setSelectedSlot(null);
  };

  const handleEditEvent = (event) => {
    setEditMode(true);

    const relatedEvents = createEvents.filter(ev =>
      ev.subject === event.subject &&
      ev.teacher === event.teacher &&
      ev.grade === event.grade &&
      ev.room === event.room &&
      moment(ev.start).format("HH:mm") === moment(event.start).format("HH:mm") &&
      moment(ev.end).format("HH:mm") === moment(event.end).format("HH:mm")
    );

    const baseEditingId = relatedEvents.length > 0 ? relatedEvents[0].id : event.id;
    setEditingEventId(baseEditingId);

    const allRecurringDays = [];
    relatedEvents.forEach(ev => {
      if (ev.recurringDays && ev.recurringDays.length > 0) {
        ev.recurringDays.forEach(day => {
          if (!allRecurringDays.includes(day)) {
            allRecurringDays.push(day);
          }
        });
      }
    });

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
      endTime: moment(event.end).format("h:mm A"),
      recurringDays: allRecurringDays.sort((a, b) => a - b),
      abDay: event.abDay || "",
      dayType: event.abDay || ""
    });
    setModalOpen(true);
    setEventDetailsModal({ open: false, event: null });
  };

  const renderCalendar = (events, calendarType) => {
    const isRestricted = ["master-schedule", "teacher-schedule", "student-schedule"].includes(calendarType);
    return (
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
      }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={isRestricted ? ["work_week"] : ["month", "week", "day"]}
          view={isRestricted ? "work_week" : view}
          onView={isRestricted ? undefined : setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          selectable={false}
          onSelectEvent={handleEventClick}
          min={isRestricted ? new Date(1970, 0, 1, 6, 30, 0) : undefined}
          max={isRestricted ? new Date(1970, 0, 1, 16, 0, 0) : undefined}
          components={{
            event: ({ event }) => (
              <div
                style={{
                  padding: "4px 6px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "white"
                }}
              >
                <span>{event.title}</span>
                {event.isClass && <span style={{ fontSize: "10px", opacity: 0.8 }}>📚</span>}
              </div>
            )
          }}
        />
      </div>
    );
  };

  const TabNavigation = () => (
    <div style={{
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      marginBottom: "16px",
      display: "flex",
      gap: "4px",
      flexWrap: "wrap"
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: activeTab === tab.id ? "#3498db" : "transparent",
            color: activeTab === tab.id ? "white" : "#2c3e50",
            fontWeight: activeTab === tab.id ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: "140px",
            justifyContent: "center",
            position: "relative"
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.target.style.backgroundColor = "#f8f9fa";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  if (!user || user.role !== "admin") {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <div style={{ backgroundColor: "#f8f9fa", padding: 40 }}>
          <h2>Only admins can access the unified schedule management. Please log in as admin.</h2>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout onLogout={handleLogout}>
      <TabNavigation />
      {renderTabContent()}

      <ScheduleModals
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editMode={editMode}
        setEditMode={setEditMode}
        setEditingEventId={setEditingEventId}
        details={details}
        setDetails={setDetails}
        handleDetailChange={handleDetailChange}
        handleTimeChange={handleTimeChange}
        teachers={teachers}
        teacherDropdownOpen={teacherDropdownOpen}
        setTeacherDropdownOpen={setTeacherDropdownOpen}
        selectedSlot={selectedSlot}
        handleSaveEvent={handleSaveEvent}
        grades={grades}
        fridayModal={fridayModal}
        setFridayModal={setFridayModal}
        handleFridaySelection={handleFridaySelection}
        eventDetailsModal={eventDetailsModal}
        setEventDetailsModal={setEventDetailsModal}
        isEditMode={isEditMode}
        handleEditEvent={handleEditEvent}
        conflictModal={conflictModal}
        setConflictModal={setConflictModal}
        setCreateEvents={setCreateEvents}
        setMasterEvents={setMasterEvents}
        fetchRooms={fetchRooms}
        saveScheduleToDatabase={saveScheduleToDatabase}
        getABDay={getABDay}
        setSelectedSlot={setSelectedSlot}
      />
    </SidebarLayout>
  );
}
