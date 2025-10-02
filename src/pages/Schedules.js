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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
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
          <div style={{ display: "flex", gap: "8px" }}>
            {deleteMode ? (
              <>
                <button
                  onClick={handleConfirmDelete}
                  disabled={selectedToDelete.length === 0}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: selectedToDelete.length > 0 ? "#e74c3c" : "#bdc3c7",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: selectedToDelete.length > 0 ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Delete Selected ({selectedToDelete.length})
                </button>
                <button
                  onClick={handleDeleteMode}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#95a5a6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleDeleteMode}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                🗑️ Delete Mode
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 240px)" }}>
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
          
          {/* Controls */}
          <div style={{ marginBottom: 16 }}>
            {selectedTeachers.length > 0 && (
              <button
                onClick={() => setSelectedTeachers([])}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  width: "100%"
                }}
              >
                Unselect All
              </button>
            )}
          </div>
          
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

  // Helper: expand recurring events for calendar
  const getCalendarEvents = () => {
    const expanded = [];
    for (const ev of createEvents) {
      if (Array.isArray(ev.recurringDays) && ev.recurringDays.length > 0 && ev.start && ev.end) {
        // For recurring events, create instances on each selected day
        const baseStart = moment(ev.start);
        const baseEnd = moment(ev.end);
        const duration = baseEnd.diff(baseStart, 'minutes');
        
        for (const recurDay of ev.recurringDays) {
          // Map 0=Monday, ... 4=Friday to moment's 1=Monday, ... 5=Friday
          const momentDay = recurDay + 1;
          
          // Create new event for this day of the week
          const weekStart = moment().startOf('week');
          const dayStart = weekStart.clone().day(momentDay);
          const instanceStart = dayStart.set({ hour: baseStart.hour(), minute: baseStart.minute(), second: 0 });
          const instanceEnd = instanceStart.clone().add(duration, 'minutes');
          
          expanded.push({
            ...ev,
            id: `${ev.id}-recurring-${recurDay}`,
            start: instanceStart.toDate(),
            end: instanceEnd.toDate(),
            title: ev.subject
          });
        }
      } else {
        // Non-recurring event
        expanded.push({
          ...ev,
          title: ev.subject
        });
      }
    }
    return expanded;
  };

  // Overlap detection (returns array of event ids that overlap for same teacher or same room)
  const getOverlappingEventIds = () => {
    const ids = new Set();
    const expandedEvents = getCalendarEvents();
    
    for (let i = 0; i < expandedEvents.length; i++) {
      for (let j = i + 1; j < expandedEvents.length; j++) {
        const a = expandedEvents[i], b = expandedEvents[j];
        
        // Skip if either is an availability block
        if (a.availability || b.availability) continue;
        
        // Check if they are on the same day
        const aStart = moment(a.start);
        const aEnd = moment(a.end);
        const bStart = moment(b.start);
        const bEnd = moment(b.end);
        const sameDay = aStart.format('YYYY-MM-DD') === bStart.format('YYYY-MM-DD');
        
        if (!sameDay) continue;
        
        // Check for any time overlap (even 1 minute)
        const hasTimeOverlap = aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
        
        if (hasTimeOverlap) {
          // Flag for same teacher conflicts
          const sameTeacher = a.teacher && b.teacher && a.teacher === b.teacher;
          
          // Flag for same room conflicts
          const sameRoom = a.room && b.room && a.room === b.room;
          
          if (sameTeacher || sameRoom) {
            // Get the original event IDs for highlighting
            const aId = a.id.includes('-recurring-') ? a.id.split('-recurring-')[0] : a.id;
            const bId = b.id.includes('-recurring-') ? b.id.split('-recurring-')[0] : b.id;
            ids.add(aId);
            ids.add(bId);
          }
        }
      }
    }
    return Array.from(ids);
  };

  // Generate time options for dropdown (6:30 AM - 4:00 PM in 5-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    const start = moment().set({ hour: 6, minute: 30, second: 0 });
    const end = moment().set({ hour: 16, minute: 0, second: 0 });
    
    while (start.isSameOrBefore(end)) {
      times.push(start.format('h:mm A'));
      start.add(5, 'minutes');
    }
    return times;
  };

  // Handle slot selection for creating new events
  const handleSelectSlot = ({ start, end }) => {
    const isFriday = moment(start).day() === 5;
    
    if (isFriday) {
      // For Friday, show A/B day selection modal
      setFridayModal({ open: true, slotInfo: { start, end } });
      return;
    }
    
    const abDay = getABDay(start);
    
    // Find overlapping teacher availabilities
    const overlappingAvailabilities = allAvailabilities.filter(av => {
      const slotStart = moment(start);
      const slotEnd = moment(end);
      const dayOfWeek = slotStart.day() === 0 ? 7 : slotStart.day(); // Convert Sunday (0) to 7
      
      if (av.day_of_week !== dayOfWeek) return false;
      
      const [avStartHour, avStartMin] = av.start_time.split(':').map(Number);
      const [avEndHour, avEndMin] = av.end_time.split(':').map(Number);
      const avStart = slotStart.clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
      const avEnd = slotStart.clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });
      
      return slotStart.isSameOrAfter(avStart) && slotEnd.isSameOrBefore(avEnd);
    });
    
    // Auto-select teacher if exactly one availability matches
    let preSelectedTeacherId = "";
    if (overlappingAvailabilities.length === 1) {
      preSelectedTeacherId = overlappingAvailabilities[0].teacher_id.toString();
    }
    
    // Pre-select recurring day for the day being added
    const dayIdx = moment(start).day() - 1; // 0=Monday, ... 4=Friday
    const recurringDays = (dayIdx >= 0 && dayIdx <= 4) ? [dayIdx] : [];
    
    setSelectedSlot({ start, end });
    setDetails(d => ({ 
      ...d, 
      teacherId: preSelectedTeacherId,
      startTime: moment(start).format("h:mm A"), 
      endTime: moment(end).format("h:mm A"),
      abDay: abDay || (isFriday ? "" : ""),
      dayType: abDay || (isFriday ? "" : ""),
      recurringDays
    }));
    setModalOpen(true);
  };

  // Handle Friday A/B day selection
  const handleFridaySelection = (abDay) => {
    const { start, end } = fridayModal.slotInfo;
    setFridayModal({ open: false, slotInfo: null });
    
    setSelectedSlot({ start, end });
    setDetails(d => ({ 
      ...d, 
      startTime: moment(start).format("h:mm A"), 
      endTime: moment(end).format("h:mm A"),
      abDay,
      dayType: abDay,
      recurringDays: [4] // Friday is index 4 (0=Monday, ... 4=Friday)
    }));
    setModalOpen(true);
  };

  // Handle detail changes in modal
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  // Handle time change
  const handleTimeChange = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }));
    
    // Update selectedSlot times for validation
    if (selectedSlot) {
      const newStart = moment(selectedSlot.start);
      const newEnd = moment(selectedSlot.end);
      
      if (field === 'startTime') {
        const [hour, minute] = moment(value, 'h:mm A').format('HH:mm').split(':');
        newStart.hour(parseInt(hour)).minute(parseInt(minute));
      } else if (field === 'endTime') {
        const [hour, minute] = moment(value, 'h:mm A').format('HH:mm').split(':');
        newEnd.hour(parseInt(hour)).minute(parseInt(minute));
      }
      
      setSelectedSlot({ start: newStart.toDate(), end: newEnd.toDate() });
    }
  };

  // Save event from modal
  const handleSaveEvent = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!details.subject || !details.teacherId || !details.grade || !details.room) {
      alert('Please fill in all required fields.');
      return;
    }

    const newTeacherId = parseInt(details.teacherId);
    const newRoom = details.room;
    const newGrade = details.grade === "Not here?" ? details.customGrade : details.grade;
    const newSubject = details.subject;
    const newStart = moment(selectedSlot.start);
    const newEnd = moment(selectedSlot.end);
    const newRecurringDays = details.recurringDays || [];
    const newAbDay = details.abDay || "";

    // Get teacher name for conflict messages
    const newTeacherName = (() => {
      const t = teachers.find(t => t.id === newTeacherId);
      return t ? `${t.first_name} ${t.last_name}` : "";
    })();

    let conflictMessages = [];

    // Helper function to check if two time ranges overlap
    const isOverlap = (start1, end1, start2, end2) => {
      return moment(start1).isBefore(moment(end2)) && moment(start2).isBefore(moment(end1));
    };

    // Check for conflicts with existing events
    const checkConflicts = () => {
      const newInstances = [];
      
      if (newRecurringDays && newRecurringDays.length > 0) {
        const duration = newEnd.diff(newStart, 'minutes');
        for (const recurDay of newRecurringDays) {
          const momentDay = recurDay + 1;
          const weekStart = moment().startOf('week');
          const dayStart = weekStart.clone().day(momentDay);
          const instanceStart = dayStart.set({ hour: newStart.hour(), minute: newStart.minute(), second: 0 });
          const instanceEnd = instanceStart.clone().add(duration, 'minutes');
          newInstances.push({ start: instanceStart, end: instanceEnd, dayOfWeek: momentDay });
        }
      } else {
        newInstances.push({ start: newStart, end: newEnd, dayOfWeek: newStart.day() });
      }

      for (const newInst of newInstances) {
        // Check teacher availability
        const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === newTeacherId);
        if (teacherAvailabilities.length > 0) {
          const newInstDayOfWeek = newInst.dayOfWeek === 0 ? 7 : newInst.dayOfWeek;
          const availableOnDay = teacherAvailabilities.some(av => {
            if (av.day_of_week !== newInstDayOfWeek) return false;
            const [avStartHour, avStartMin] = av.start_time.split(':').map(Number);
            const [avEndHour, avEndMin] = av.end_time.split(':').map(Number);
            const avStart = moment(newInst.start).clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
            const avEnd = moment(newInst.start).clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });
            return newInst.start.isSameOrAfter(avStart) && newInst.end.isSameOrBefore(avEnd);
          });
          if (!availableOnDay) {
            const dayName = moment().day(newInstDayOfWeek).format('dddd');
            conflictMessages.push(`${newTeacherName} is not available on ${dayName} from ${newInst.start.format('h:mm A')} to ${newInst.end.format('h:mm A')}`);
          }
        }

        // Check conflicts with existing events
        const otherEvents = editMode ? createEvents.filter(ev => ev.id !== editingEventId) : createEvents;
        for (const otherEvent of otherEvents) {
          let otherInstances = [];
          if (Array.isArray(otherEvent.recurringDays) && otherEvent.recurringDays.length > 0) {
            const baseStart = moment(otherEvent.start);
            const baseEnd = moment(otherEvent.end);
            const duration = baseEnd.diff(baseStart, 'minutes');
            for (const recurDay of otherEvent.recurringDays) {
              const momentDay = recurDay + 1;
              const weekStart = moment().startOf('week');
              const dayStart = weekStart.clone().day(momentDay);
              const instanceStart = dayStart.set({ hour: baseStart.hour(), minute: baseStart.minute(), second: 0 });
              const instanceEnd = instanceStart.clone().add(duration, 'minutes');
              otherInstances.push({ ...otherEvent, start: instanceStart, end: instanceEnd });
            }
          } else {
            otherInstances.push({ ...otherEvent, start: moment(otherEvent.start), end: moment(otherEvent.end) });
          }
          
          for (const otherInst of otherInstances) {
            if (isOverlap(newInst.start, newInst.end, otherInst.start, otherInst.end) && newInst.start.day() === otherInst.start.day()) {
              if (otherInst.teacher === newTeacherName) {
                const dayName = newInst.start.format('dddd');
                conflictMessages.push(`${newTeacherName} already has "${otherInst.subject}" on ${dayName} from ${otherInst.start.format('h:mm A')} to ${otherInst.end.format('h:mm A')}`);
              }
              if (otherInst.room === newRoom) {
                const dayName = newInst.start.format('dddd');
                conflictMessages.push(`Room ${newRoom} is already booked for "${otherInst.subject}" on ${dayName} from ${otherInst.start.format('h:mm A')} to ${otherInst.end.format('h:mm A')}`);
              }
            }
          }
        }
      }
    };

    checkConflicts();

    // If there are conflicts, show conflict modal
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

    // No conflicts, save the event
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

    if (editMode) {
      setCreateEvents(prev => prev.map(ev => ev.id === editingEventId ? newEvent : ev));
      setEditMode(false);
      setEditingEventId(null);
    } else {
      setCreateEvents(prev => [...prev, newEvent]);
    }

    // Reset form
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
  };

  // Handle drag start
  const handleEventDragStart = ({ event }) => {
    setDraggingEventId(event.id);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggingEventId(null);
  };

  // Handle event drop
  const handleEventDrop = ({ event, start, end }) => {
    if (event.availability) return; // Don't allow dragging availability blocks
    
    const eventToUpdate = createEvents.find(ev => {
      const baseId = event.id.includes('-recurring-') ? event.id.split('-recurring-')[0] : event.id;
      return ev.id === baseId;
    });
    
    if (!eventToUpdate) return;
    
    const updatedEvent = {
      ...eventToUpdate,
      start: start,
      end: end
    };
    
    setCreateEvents(prev => prev.map(ev => ev.id === eventToUpdate.id ? updatedEvent : ev));
    setDraggingEventId(null);
  };

  // Handle edit event
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
      endTime: moment(event.end).format("h:mm A"),
      recurringDays: event.recurringDays || [],
      abDay: event.abDay || "",
      dayType: event.abDay || ""
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
    setCreateEvents(evts => evts.filter(ev => {
      const baseId = ev.id.includes('-recurring-') ? ev.id.split('-recurring-')[0] : ev.id;
      return !selectedToDelete.includes(baseId);
    }));
    setDeleteMode(false);
    setSelectedToDelete([]);
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

    // Get expanded calendar events (with recurring instances)
    const expandedEvents = getCalendarEvents();
    const overlappingIds = getOverlappingEventIds();
    const allEventsForCreate = [...expandedEvents, ...selectedAvailabilities];

    return (
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        height: "100%"
      }}>
        <DragAndDropCalendar
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
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onDragStart={handleEventDragStart}
          onDragEnd={handleDragEnd}
          resizable={false}
          onSelectEvent={deleteMode ? (event) => {
            if (event.availability) return;
            const baseId = event.id.includes('-recurring-') ? event.id.split('-recurring-')[0] : event.id;
            setSelectedToDelete(prev => 
              prev.includes(baseId) 
                ? prev.filter(id => id !== baseId)
                : [...prev, baseId]
            );
          } : (event) => {
            if (event.availability) return;
            setEventDetailsModal({ open: true, event });
          }}
          eventPropGetter={event => {
            const baseId = event.id.includes('-recurring-') ? event.id.split('-recurring-')[0] : event.id;
            const isSelected = selectedToDelete.includes(baseId);
            const hasConflict = overlappingIds.includes(baseId);
            const isBeingDragged = draggingEventId === event.id;
            
            if (event.availability) {
              return {
                style: {
                  backgroundColor: event.color,
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "400",
                  opacity: 0.7,
                  cursor: "default"
                }
              };
            }
            
            let backgroundColor = "#3498db";
            let border = "none";
            let opacity = isBeingDragged ? 0.6 : 1;
            
            if (deleteMode && isSelected) {
              backgroundColor = "#e74c3c";
              border = "2px solid #c0392b";
            } else if (hasConflict) {
              border = "2px solid #e74c3c";
            }
            
            return {
              style: {
                backgroundColor,
                color: "white",
                border,
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500",
                opacity,
                cursor: deleteMode ? "pointer" : "grab"
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
                  : (event.title || event.subject)
                }
                {deleteMode && !event.availability && (
                  <span style={{ marginLeft: "4px", fontSize: "10px" }}>
                    {selectedToDelete.includes(event.id.includes('-recurring-') ? event.id.split('-recurring-')[0] : event.id) ? "✓" : ""}
                  </span>
                )}
              </div>
            ),
            header: CustomHeader
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

      {/* Create Event Modal */}
      {modalOpen && (
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
            minWidth: 500, 
            maxWidth: 600,
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)" 
          }}>
            <h2 style={{ margin: "0 0 24px 0", fontWeight: 700, fontSize: 24, color: "#2c3e50" }}>
              {editMode ? "Edit Class" : "Add New Class"}
            </h2>
            
            <form onSubmit={handleSaveEvent}>
              {/* Teacher Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#2c3e50" }}>
                  Teacher <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <select
                  name="teacherId"
                  value={details.teacherId}
                  onChange={handleDetailChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e1e8ed",
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: "white"
                  }}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#2c3e50" }}>
                  Subject <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={details.subject}
                  onChange={handleDetailChange}
                  required
                  placeholder="e.g. Math, Science, English"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e1e8ed",
                    borderRadius: 8,
                    fontSize: 16,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Grade */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#2c3e50" }}>
                  Grade <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <select
                  name="grade"
                  value={details.grade}
                  onChange={handleDetailChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e1e8ed",
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: "white"
                  }}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                {details.grade === "Not here?" && (
                  <input
                    type="text"
                    name="customGrade"
                    value={details.customGrade}
                    onChange={handleDetailChange}
                    placeholder="Enter custom grade"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e1e8ed",
                      borderRadius: 8,
                      fontSize: 16,
                      marginTop: 8,
                      boxSizing: "border-box"
                    }}
                  />
                )}
              </div>

              {/* Room */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#2c3e50" }}>
                  Room <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <input
                  type="text"
                  name="room"
                  value={details.room}
                  onChange={handleDetailChange}
                  required
                  placeholder="e.g. 101, Lab A, Gym"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e1e8ed",
                    borderRadius: 8,
                    fontSize: 16,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Time Selection */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#2c3e50" }}>
                    Start Time
                  </label>
                  <select
                    value={details.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e1e8ed",
                      borderRadius: 8,
                      fontSize: 16,
                      backgroundColor: "white"
                    }}
                  >
                    {generateTimeOptions().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#2c3e50" }}>
                    End Time
                  </label>
                  <select
                    value={details.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e1e8ed",
                      borderRadius: 8,
                      fontSize: 16,
                      backgroundColor: "white"
                    }}
                  >
                    {generateTimeOptions().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring Days */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 12, fontWeight: 600, color: "#2c3e50" }}>
                  Recurring Days
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, idx) => (
                    <label key={idx} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "8px 12px",
                      border: "2px solid #e1e8ed",
                      borderRadius: 8,
                      cursor: "pointer",
                      backgroundColor: details.recurringDays.includes(idx) ? "#3498db" : "white",
                      color: details.recurringDays.includes(idx) ? "white" : "#2c3e50",
                      fontWeight: 500,
                      transition: "all 0.2s ease"
                    }}>
                      <input
                        type="checkbox"
                        checked={details.recurringDays.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDetails(prev => ({
                              ...prev,
                              recurringDays: [...prev.recurringDays, idx]
                            }));
                          } else {
                            setDetails(prev => ({
                              ...prev,
                              recurringDays: prev.recurringDays.filter(d => d !== idx)
                            }));
                          }
                        }}
                        style={{ display: "none" }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              {/* A/B Day Selection (if applicable) */}
              {details.recurringDays.includes(4) && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 12, fontWeight: 600, color: "#2c3e50" }}>
                    Friday A/B Day
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {["A", "B", "Both"].map(abDay => (
                      <label key={abDay} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6, 
                        padding: "8px 16px",
                        border: "2px solid #e1e8ed",
                        borderRadius: 8,
                        cursor: "pointer",
                        backgroundColor: details.abDay === abDay ? "#3498db" : "white",
                        color: details.abDay === abDay ? "white" : "#2c3e50",
                        fontWeight: 500,
                        transition: "all 0.2s ease"
                      }}>
                        <input
                          type="radio"
                          name="abDay"
                          value={abDay}
                          checked={details.abDay === abDay}
                          onChange={handleDetailChange}
                          style={{ display: "none" }}
                        />
                        {abDay} Day{abDay === "Both" ? "s" : ""}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
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
                    fontWeight: 600, 
                    fontSize: 16, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "12px 24px", 
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ 
                    background: "#27ae60", 
                    color: "white", 
                    fontWeight: 600, 
                    fontSize: 16, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "12px 24px", 
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  {editMode ? "Update Class" : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Friday A/B Day Selection Modal */}
      {fridayModal.open && (
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
            <h2 style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: 20, color: "#2c3e50" }}>
              Friday Schedule
            </h2>
            <p style={{ margin: "0 0 24px 0", color: "#7f8c8d" }}>
              Which A/B day pattern should this Friday class follow?
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => handleFridaySelection("A")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                A Day Only
              </button>
              <button
                onClick={() => handleFridaySelection("B")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                B Day Only
              </button>
              <button
                onClick={() => handleFridaySelection("Both")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#9b59b6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                Both A/B Days
              </button>
            </div>
            
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => setFridayModal({ open: false, slotInfo: null })}
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
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
                  <strong>Time:</strong> {moment(eventDetailsModal.event.start).format('h:mm A')} - {moment(eventDetailsModal.event.end).format('h:mm A')}
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
            </div>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
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
          zIndex: 2000
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
                <strong>What can you do?</strong><br/>
                • <strong>Fix Conflicts:</strong> Close this dialog and adjust the time, teacher, room, or day to resolve conflicts.<br/>
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
                  onClick={() => {
                    if (editMode) {
                      setCreateEvents(prev => prev.map(ev => ev.id === editingEventId ? conflictModal.pendingEvent : ev));
                      setEditMode(false);
                      setEditingEventId(null);
                    } else {
                      setCreateEvents(prev => [...prev, conflictModal.pendingEvent]);
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
    </div>
  );
}
