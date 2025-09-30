import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const localizer = momentLocalizer(moment);

// Add grades array for CreateSchedule functionality
const grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Not here?"];

// Helper function to determine if a date is an A day or B day
const getABDay = (date) => {
  const dayOfYear = moment(date).dayOfYear();
  return dayOfYear % 2 === 0 ? 'B' : 'A';
};

// Custom header component to show A/B day indicators
const CustomHeader = ({ label, date }) => {
  const abDay = getABDay(date);
  const dayName = moment(date).format('dddd');
  const isFriday = moment(date).day() === 5;
  
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '12px 8px 8px 8px',
      height: '60px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ 
        fontSize: '16px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        color: '#2c3e50',
        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
      }}>
        {dayName}
      </div>
      <div style={{
        fontSize: '11px',
        padding: '4px 10px',
        backgroundColor: isFriday ? '#9b59b6' : (abDay === 'A' ? '#3498db' : '#e74c3c'),
        color: 'white',
        borderRadius: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.2)',
        minWidth: '60px',
        textAlign: 'center'
      }}>
        {isFriday ? 'A/B Day' : `${abDay} Day`}
      </div>
    </div>
  );
};

// Create drag and drop enabled calendar
const DragAndDropCalendar = withDragAndDrop(Calendar);

function generateRecurringEvents(classObj, weeks = 8) {
  const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const events = [];
  const startDate = new Date(classObj.start_time.slice(0, 10));
  const startTime = classObj.start_time.slice(11, 16);
  const endTime = classObj.end_time.slice(11, 16);
  const recurringDays = classObj.recurring_days.split(",").map(d => d.trim());

  for (let week = 0; week < weeks; week++) {
    recurringDays.forEach(day => {
      const dayOfWeek = daysMap[day];
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + (dayOfWeek - eventDate.getDay() + 7 * week));
      const [sh, sm] = startTime.split(":");
      const [eh, em] = endTime.split(":");
      const start = new Date(eventDate);
      start.setHours(Number(sh), Number(sm), 0, 0);
      const end = new Date(eventDate);
      end.setHours(Number(eh), Number(em), 0, 0);

      events.push({
        id: `class-${classObj.id}-${week}-${day}`,
        title: classObj.name,
        start,
        end,
        classId: classObj.id,
        isClass: true,
      });
    });
  }
  return events;
}



export default function Schedules() {
  const { user, logout } = useAuth();
  
  // All useState hooks must come before any conditional returns
  const [activeTab, setActiveTab] = useState("master-schedule");
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    startDate: moment().format("YYYY-MM-DD"),
    startTime: moment().format("HH:mm"),
    endDate: moment().format("YYYY-MM-DD"),
    endTime: moment().add(1, 'hour').format("HH:mm"),
    recurringDays: [],
    description: "",
    eventType: "event",
  });
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [deleting, setDeleting] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [masterEvents, setMasterEvents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherEvents, setTeacherEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEvents, setStudentEvents] = useState([]);
  const [createEvents, setCreateEvents] = useState([]);
  const [allAvailabilities, setAllAvailabilities] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [createDetails, setCreateDetails] = useState({
    teacherId: "",
    grade: "",
    customGrade: "",
    subject: "",
    room: "",
    startTime: "",
    endTime: "",
    recurringDays: [],
    dayType: ""
  });
  const [showCustomGrade, setShowCustomGrade] = useState(false);
  const [conflictModal, setConflictModal] = useState({ open: false, messages: [], pendingEvent: null });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fridayModal, setFridayModal] = useState({ open: false, slotInfo: null });
  const [draggingEventId, setDraggingEventId] = useState(null);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [eventDetailsModal, setEventDetailsModal] = useState({ open: false, event: null });
  const [loading, setLoading] = useState(false);
  const [showUnselect, setShowUnselect] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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

  const getRole = u => (u && u.role ? u.role.trim().toLowerCase() : "");
  const isStudent = getRole(user) === "student";
  const isTeacher = getRole(user) === "teacher";
  const isAdmin = getRole(user) === "admin";

  const handleLogout = () => {
    logout();
  };

  // Tab configuration for admin users
  const getTabs = () => {
    return [
      { 
        id: "master-schedule", 
        label: "Master Schedule", 
        icon: "🗂️",
        count: masterEvents.length
      },
      { 
        id: "teacher-schedules", 
        label: "Teacher Schedules", 
        icon: "👨‍🏫",
        count: teachers.length
      },
      { 
        id: "student-schedules", 
        label: "Student Schedules", 
        icon: "🧑‍🎓",
        count: students.length
      },
      { 
        id: "create-schedule", 
        label: "Create Schedule", 
        icon: "➕",
        count: null
      }
    ];
  };

  const tabs = getTabs();

  // Fetch data based on active tab (must be before conditional returns)
  useEffect(() => {
    if (!user) return;

    const fetchMyScheduleEvents = async () => {
      try {
        let classes = [];
        if (isStudent) {
          const classRes = await fetch(`http://localhost:3000/api/students/${user.id}/classes`);
          classes = classRes.ok ? await classRes.json() : [];
        } else if (isTeacher) {
          const classRes = await fetch(`http://localhost:3000/api/teachers/${user.id}/classes`);
          classes = classRes.ok ? await classRes.json() : [];
        }
        let classEvents = [];
        classes.forEach(cls => {
          classEvents = classEvents.concat(generateRecurringEvents(cls));
        });

        // Personal events
        const res = await fetch(`http://localhost:3000/myCalendar?userId=${user.id}`);
        const personalEventsRaw = res.ok ? await res.json() : [];
        const personalEvents = personalEventsRaw.map(event => ({
          id: Number(event.id),
          title: event.title || event.event_title || "No Title",
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          description: event.description || "",
          classId: null,
          isClass: false,
          eventType: event.event_type || "event",
        }));

        setScheduleEvents([...classEvents, ...personalEvents]);
      } catch (err) {
        console.error(err);
        setScheduleEvents([]);
      }
    };

    const fetchMasterSchedule = async () => {
      try {
        // Fetch all classes and events for master schedule
        const classRes = await fetch("http://localhost:3000/api/classes");
        const allClasses = classRes.ok ? await classRes.json() : [];
        
        let allEvents = [];
        allClasses.forEach(cls => {
          allEvents = allEvents.concat(generateRecurringEvents(cls));
        });

        setMasterEvents(allEvents);
        setCreateEvents(allEvents); // Also set for create schedule tab
      } catch (err) {
        console.error(err);
        setMasterEvents([]);
      }
    };

    const fetchTeachers = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/teachers");
        const teachersData = res.ok ? await res.json() : [];
        setTeachers(teachersData);
      } catch (err) {
        console.error(err);
        setTeachers([]);
      }
    };

    const fetchStudents = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/students");
        const studentsData = res.ok ? await res.json() : [];
        setStudents(studentsData);
      } catch (err) {
        console.error(err);
        setStudents([]);
      }
    };

    const fetchAvailabilities = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/teacher-availabilities");
        const availData = res.ok ? await res.json() : [];
        setAllAvailabilities(availData);
      } catch (err) {
        console.error(err);
        setAllAvailabilities([]);
      }
    };

    // Fetch data based on active tab
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "my-schedule") {
          await fetchMyScheduleEvents();
        } else if (activeTab === "master-schedule") {
          await fetchMasterSchedule();
        } else if (activeTab === "teacher-schedules") {
          await fetchTeachers();
        } else if (activeTab === "student-schedules") {
          await fetchStudents();
        } else if (activeTab === "create-schedule") {
          await Promise.all([fetchTeachers(), fetchAvailabilities(), fetchMasterSchedule()]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, activeTab, isStudent, isTeacher]);

  // Role check - admin only for full access (after all hooks)
  if (!user || user.role !== "admin") {
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar onLogout={logout} />
        <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 40, marginLeft: 300 }}>
          <h2>Only admins can access the unified schedule management. Please log in as admin.</h2>
        </div>
      </div>
    );
  }

  // Fetch teacher-specific events
  const fetchTeacherEvents = async (teacherId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/teachers/${teacherId}/classes`);
      const classes = res.ok ? await res.json() : [];
      
      let events = [];
      classes.forEach(cls => {
        events = events.concat(generateRecurringEvents(cls));
      });
      
      setTeacherEvents(events);
    } catch (err) {
      console.error(err);
      setTeacherEvents([]);
    }
  };

  // Fetch student-specific events
  const fetchStudentEvents = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/students/${studentId}/classes`);
      const classes = res.ok ? await res.json() : [];
      
      let events = [];
      classes.forEach(cls => {
        events = events.concat(generateRecurringEvents(cls));
      });
      
      setStudentEvents(events);
    } catch (err) {
      console.error(err);
      setStudentEvents([]);
    }
  };

  // Handle teacher selection
  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    fetchTeacherEvents(teacher.id);
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentEvents(student.id);
  };

  // Check for overlapping events
  const checkEventOverlaps = (events) => {
    const overlaps = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);
        const date1 = moment(start1).format("YYYY-MM-DD");
        const date2 = moment(start2).format("YYYY-MM-DD");
        if (date1 === date2 && start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime()) {
          const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
          const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
          overlaps.push({
            event1: event1.title,
            event2: event2.title,
            overlapStart: moment(overlapStart).format("MMM Do, h:mm A"),
            overlapEnd: moment(overlapEnd).format("MMM Do, h:mm A"),
            duration: moment.duration(overlapEnd - overlapStart).humanize()
          });
        }
      }
    }
    return overlaps;
  };

  const eventStyleGetter = (event) => {
    let backgroundColor;
    
    if (event.isClass) {
      backgroundColor = "#3498db"; // Blue for classes
    } else if (event.eventType === "personal") {
      backgroundColor = "#9b59b6"; // Purple for personal events
    } else if (event.eventType === "meeting") {
      backgroundColor = "#e74c3c"; // Red for meetings
    } else if (event.eventType === "appointment") {
      backgroundColor = "#f39c12"; // Orange for appointments
    } else if (event.eventType === "reminder") {
      backgroundColor = "#95a5a6"; // Gray for reminders
    } else {
      backgroundColor = "#27ae60"; // Green for regular events
    }
    
    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: 4,
        border: "none",
        fontSize: "13px",
        fontWeight: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      },
    };
  };

  const handleEventClick = (event) => {
    setSelectedEventDetails(event);
    setShowEventModal(true);
  };

  // Loading Component
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

  // Render content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    switch (activeTab) {
      case "master-schedule":
        return renderMasterSchedule();
      case "teacher-schedules":
        return renderTeacherSchedules();
      case "student-schedules":
        return renderStudentSchedules();
      case "create-schedule":
        return renderCreateSchedule();
      default:
        return renderMasterSchedule();
    }
  };

  // Master Schedule Tab Content
  const renderMasterSchedule = () => (
    <>
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        padding: "12px 16px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: "12px"
      }}>
        <h1 style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          margin: 0, 
          color: "#2c3e50",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          🗂️ Master Schedule - All Classes
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#7f8c8d", fontSize: "14px" }}>
          View all scheduled classes across the entire school
        </p>
      </div>
      {masterEvents.length > 0 ? (
        renderCalendar(masterEvents, "master-schedule")
      ) : (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          textAlign: "center",
          color: "#7f8c8d"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#2c3e50" }}>No Classes Scheduled</h3>
          <p style={{ margin: 0 }}>There are currently no classes in the master schedule</p>
        </div>
      )}
    </>
  );

  // Teacher Schedules Tab Content
  const renderTeacherSchedules = () => (
    <>
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        padding: "12px 16px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: "12px"
      }}>
        <h1 style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          margin: 0, 
          color: "#2c3e50",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          👨‍🏫 Teacher Schedules
        </h1>
      </div>
      
      <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 200px)" }}>
        {/* Teacher List */}
        <div style={{
          width: "300px",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#2c3e50" }}>Select Teacher</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {teachers.map(teacher => (
              <button
                key={teacher.id}
                onClick={() => handleTeacherSelect(teacher)}
                style={{
                  padding: "12px",
                  border: "2px solid #e1e8ed",
                  borderRadius: "8px",
                  backgroundColor: selectedTeacher?.id === teacher.id ? "#3498db" : "white",
                  color: selectedTeacher?.id === teacher.id ? "white" : "#2c3e50",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (selectedTeacher?.id !== teacher.id) {
                    e.target.style.backgroundColor = "#f8f9fa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTeacher?.id !== teacher.id) {
                    e.target.style.backgroundColor = "white";
                  }
                }}
              >
                <div style={{ fontWeight: "600" }}>
                  {teacher.first_name} {teacher.last_name}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                  ID: {teacher.id}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Calendar */}
        <div style={{ flex: 1 }}>
          {selectedTeacher ? (
            <>
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "12px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: "12px"
              }}>
                <h3 style={{ margin: 0, color: "#2c3e50" }}>
                  Schedule for {selectedTeacher.first_name} {selectedTeacher.last_name}
                </h3>
              </div>
              {renderCalendar(teacherEvents, "teacher-schedule")}
            </>
          ) : (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              textAlign: "center",
              color: "#7f8c8d"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👨‍🏫</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#2c3e50" }}>Select a Teacher</h3>
              <p style={{ margin: 0 }}>Choose a teacher from the list to view their schedule</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Student Schedules Tab Content
  const renderStudentSchedules = () => (
    <>
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        padding: "12px 16px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: "12px"
      }}>
        <h1 style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          margin: 0, 
          color: "#2c3e50",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          🧑‍🎓 Student Schedules
        </h1>
      </div>
      
      <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 200px)" }}>
        {/* Student List */}
        <div style={{
          width: "300px",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#2c3e50" }}>Select Student</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                style={{
                  padding: "12px",
                  border: "2px solid #e1e8ed",
                  borderRadius: "8px",
                  backgroundColor: selectedStudent?.id === student.id ? "#3498db" : "white",
                  color: selectedStudent?.id === student.id ? "white" : "#2c3e50",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (selectedStudent?.id !== student.id) {
                    e.target.style.backgroundColor = "#f8f9fa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStudent?.id !== student.id) {
                    e.target.style.backgroundColor = "white";
                  }
                }}
              >
                <div style={{ fontWeight: "600" }}>
                  {student.first_name} {student.last_name}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                  ID: {student.id}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Calendar */}
        <div style={{ flex: 1 }}>
          {selectedStudent ? (
            <>
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "12px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: "12px"
              }}>
                <h3 style={{ margin: 0, color: "#2c3e50" }}>
                  Schedule for {selectedStudent.first_name} {selectedStudent.last_name}
                </h3>
              </div>
              {renderCalendar(studentEvents, "student-schedule")}
            </>
          ) : (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              textAlign: "center",
              color: "#7f8c8d"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧑‍🎓</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#2c3e50" }}>Select a Student</h3>
              <p style={{ margin: 0 }}>Choose a student from the list to view their schedule</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Create Schedule Tab Content (Full implementation like CreateSchedule.js)
  const renderCreateSchedule = () => (
    <>
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        padding: "12px 16px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: "12px"
      }}>
        <h1 style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          margin: 0, 
          color: "#2c3e50",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          ➕ Create Schedule
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#7f8c8d", fontSize: "14px" }}>
          Drag on the calendar to create new class schedules. Select teachers to view their availability.
        </p>
      </div>
      
      <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 200px)" }}>
        {/* Calendar */}
        <div style={{ flex: 1 }}>
          {renderCreateCalendar()}
        </div>
        
        {/* Teacher sidebar */}
        <div style={{ 
          width: 260, 
          backgroundColor: "#f8f9fa", 
          borderRadius: 16, 
          padding: 24, 
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)", 
          maxHeight: "100%", 
          display: "flex", 
          flexDirection: "column" 
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Teacher Availability</h3>
          
          {/* Search bar */}
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
              marginBottom: 16,
              fontSize: 14,
              boxSizing: "border-box"
            }}
          />
          
          {/* Teacher list */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {teachers
              .filter(t =>
                searchTerm.trim() === "" ||
                `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.trim().toLowerCase())
              )
              .map((t) => {
                const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === t.id);
                const isSelected = selectedTeachers.includes(t.id);
                
                return (
                  <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 2 }}>
                    <label style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 10, 
                      fontSize: 16, 
                      fontWeight: 500, 
                      borderRadius: 8, 
                      padding: "6px 8px", 
                      backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                      transition: "background 0.2s",
                      cursor: "pointer"
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeachers(prev => [...prev, t.id]);
                          } else {
                            setSelectedTeachers(prev => prev.filter(id => id !== t.id));
                          }
                        }}
                        style={{ 
                          width: 16, 
                          height: 16, 
                          accentColor: "#2196f3", 
                          cursor: "pointer"
                        }}
                      />
                      <div style={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: getTeacherColor(t.id), 
                        borderRadius: 2, 
                        border: "1px solid #ccc"
                      }}></div>
                      <span>{t.first_name} {t.last_name}</span>
                    </label>
                    
                    <div style={{ marginLeft: 34, display: "flex", flexDirection: "column", gap: 2 }}>
                      {teacherAvailabilities.length > 0 ? (
                        teacherAvailabilities.map(av => (
                          <div key={av.id} style={{ 
                            fontSize: 13, 
                            color: "#555", 
                            background: "#eaf6fb", 
                            borderRadius: 4, 
                            padding: "2px 8px", 
                            borderLeft: `4px solid ${getTeacherColor(t.id)}`
                          }}>
                            {typeof av.day_of_week === 'number' ? moment().day(av.day_of_week).format('dddd') : av.day_of_week}, {av.start_time} - {av.end_time}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic", padding: "2px 8px" }}>
                          No availability set
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );

  // Teacher colors for availability blocks
  const getTeacherColor = (teacherId) => {
    const teacherColors = [
      "#27ae60", "#f39c12", "#8e44ad", "#e67e22", "#d35400", 
      "#16a085", "#2980b9", "#2c3e50", "#c0392b", "#7f8c8d"
    ];
    const idx = teachers.findIndex(t => t.id === teacherId);
    if (idx === -1) return "#000000";
    return teacherColors[idx % teacherColors.length];
  };

  // Render Create Calendar with drag and drop functionality
  const renderCreateCalendar = () => {
    // Show availabilities for selected teachers
    const selectedAvailabilities = allAvailabilities.filter(av =>
      selectedTeachers.includes(av.teacher_id)
    ).map(av => {
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

    const allEventsForCreate = [...createEvents, ...selectedAvailabilities];

    return (
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        height: "100%"
      }}>
        <Calendar
          localizer={localizer}
          events={allEventsForCreate}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "calc(100% - 20px)" }}
          views={{ work_week: true }}
          defaultView="work_week"
          toolbar={true}
          popup={false}
          min={moment().startOf('day').set({ hour: 6, minute: 30 }).toDate()}
          max={moment().startOf('day').set({ hour: 16, minute: 0 }).toDate()}
          selectable={true}
          onSelectSlot={({ start, end }) => {
            // Simple slot selection for now
            setSelectedSlot({ start, end });
            setCreateDetails(prev => ({
              ...prev,
              startTime: moment(start).format("HH:mm"),
              endTime: moment(end).format("HH:mm")
            }));
            setCreateModalOpen(true);
          }}
          eventPropGetter={event => {
            if (event.availability) {
              return {
                style: {
                  backgroundColor: event.color || "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  opacity: 0.7,
                  fontSize: "11px",
                  padding: "2px 4px"
                }
              };
            }
            return {
              style: {
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500"
              }
            };
          }}
          components={{
            event: ({ event }) => (
              <div style={{ 
                padding: "2px 4px", 
                fontSize: event.availability ? "10px" : "12px",
                fontWeight: event.availability ? 400 : 500,
                opacity: event.availability ? 0.8 : 1
              }}>
                {event.availability 
                  ? `${event.teacher_first_name} ${event.teacher_last_name}`
                  : event.title
                }
              </div>
            )
          }}
        />
      </div>
    );
  };

  // Unified Calendar Component
  const renderCalendar = (events, calendarType) => (
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
        views={["month", "week", "day"]}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        selectable={false}
        onSelectEvent={handleEventClick}
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
          ),
        }}
      />
    </div>
  );

  // Tab Navigation Component
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
          {tab.count !== null && tab.count > 0 && (
            <span style={{
              backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "#e74c3c",
              color: activeTab === tab.id ? "white" : "white",
              fontSize: "11px",
              fontWeight: "600",
              padding: "2px 6px",
              borderRadius: "10px",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16, marginLeft: 300 }}>
        <TabNavigation />
        {renderTabContent()}
      </div>
    </div>
  );
}
