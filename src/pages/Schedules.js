import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

// Inline utilities that were previously imported from a non-existent scheduleUtils
const grades = ["K","1","2","3","4","5","6","7","8","9","10","11","12","Not here?"];

function getABDay(date) {
  // Simple alternating week logic (even = A, odd = B) – adjust to real rules as needed
  return moment(date).week() % 2 === 0 ? 'A' : 'B';
}

// Header-specific label logic: Mon/Wed = A, Tue/Thu = B, Friday depends on parity
function getABLabelForHeader(date) {
  const m = moment(date);
  const day = m.day(); // 0=Sun .. 6=Sat
  if (day === 1 || day === 3) return 'A';       // Mon / Wed
  if (day === 2 || day === 4) return 'B';       // Tue / Thu
  if (day === 5) return m.week() % 2 === 0 ? 'A' : 'B'; // Friday parity by week number
  return '';                                     // Weekend (hidden)
}

// Turn a class record (with recurring_days, start_time/end_time) into recurring events for the current week
function generateRecurringEvents(cls) {
  if (!cls) return [];
  const recurring = Array.isArray(cls.recurring_days) ? cls.recurring_days : (Array.isArray(cls.recurringDays) ? cls.recurringDays : []);
  const startTime = cls.start_time || cls.startTime; // expected HH:mm:ss
  const endTime = cls.end_time || cls.endTime;
  if (!startTime || !endTime) return [];
  return recurring.map(dayIdx => {
    // dayIdx expected 0..4 (Mon..Fri) in our UI; moment weekday: 1..5
    const weekday = dayIdx + 1; // Monday=1
    const base = moment().startOf('week').day(weekday);
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = base.clone().set({ hour: sh, minute: sm || 0, second: 0 });
    const end = base.clone().set({ hour: eh, minute: em || 0, second: 0 });
    return {
      id: `${cls.id || cls.class_id || Date.now()}-${dayIdx}`,
      title: cls.event_title || cls.subject || 'Class',
      subject: cls.subject || cls.event_title || 'Class',
      teacher: cls.teacher || cls.teacher_name || cls.teacher_full_name || '',
      teacherId: cls.teacher_id || cls.user_id,
      grade: cls.grade || '',
      room: cls.room || cls.room_number || '',
      start: start.toDate(),
      end: end.toDate(),
      recurringDays: recurring,
      abDay: cls.abDay || '',
      isClass: true,
      description: cls.description || ''
    };
  });
}

// Backend persistence helpers; adjust endpoints if backend differs
async function saveScheduleToDatabase(data) {
  try {
    const res = await fetch('http://localhost:3000/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save');
    // Normalize id field
    return { success: true, id: json.idcalendar || json.id || json.insertId || Date.now(), insertId: json.idcalendar || json.id || json.insertId };
  } catch (e) {
    console.error('saveScheduleToDatabase error', e);
    return { success: false };
  }
}

async function updateScheduleInDatabase(id, data) {
  try {
    const res = await fetch(`http://localhost:3000/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Update failed');
    return { success: true };
  } catch (e) {
    console.error('updateScheduleInDatabase error', e);
    return { success: false };
  }
}

async function deleteScheduleFromDatabase(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/schedules/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return { success: true };
  } catch (e) {
    console.error('deleteScheduleFromDatabase error', e);
    return { success: false };
  }
}

// Calendar localizer and DnD wrapper
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Unified header for both Create & Master schedule calendars
const CustomHeader = ({ date }) => {
  const dayName = moment(date).format('dddd');
  const ab = getABLabelForHeader(date); // 'A' | 'B' | ''
  const isFriday = moment(date).day() === 5 && ab; // only show if we have A/B
  const bg = isFriday ? '#9b59b6' : (ab === 'A' ? '#3498db' : '#e74c3c');
  const label = ab ? (isFriday ? 'A/B Day' : `${ab} Day`) : '';
  return (
    <div style={{
      textAlign: 'center',
      padding: '8px 4px 8px 4px',
      minHeight: 70,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#fff',
      position: 'relative',
      zIndex: 20,
      borderBottom: '1px solid #ddd',
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#2c3e50'
      }}>{dayName}</div>
      {label && (
        <div style={{
          fontSize: 11,
          padding: '6px 14px',
          backgroundColor: bg,
          color: '#fff',
          borderRadius: 18,
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          lineHeight: 1.1,
          minWidth: 70
        }}>{label}</div>
      )}
    </div>
  );
};

// (Removed duplicate DragAndDropCalendar and generateRecurringEvents definitions)



export default function Schedules() {
  // School view state for master schedule
  const [schoolView, setSchoolView] = useState("all");
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
  // Master schedule filters
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
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
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [dragTimeout, setDragTimeout] = useState(null);

  // Cleanup function to remove any potential duplicate events
  const cleanupDuplicateExceptions = () => {
    setCreateEvents(prev => {
      const seen = new Set();
      return prev.filter(event => {
        // Create a unique key for each event based on its core properties
        const key = `${event.subject}-${event.teacherId}-${event.grade}-${event.room}-${moment(event.start).format('dddd-HH:mm')}`;
        
        if (seen.has(key)) {
          return false; // Remove duplicate
        }
        
        seen.add(key);
        return true;
      });
    });
  };

  const getRole = u => (u && u.role ? u.role.trim().toLowerCase() : "");
  const isStudent = getRole(user) === "student";
  const isTeacher = getRole(user) === "teacher";
  const isAdmin = getRole(user) === "admin";

  const handleLogout = () => {
    logout();
  };

  // Tab configuration for admin users
  const getTabs = () => ([
    { id: 'master-schedule', label: 'Master Schedule', icon: '📘', count: masterEvents.length || null },
    { id: 'teacher-schedules', label: 'Teacher Schedules', icon: '👨‍🏫', count: teachers.length || null },
    { id: 'student-schedules', label: 'Student Schedules', icon: '🧑‍🎓', count: students.length || null },
    { id: 'create-schedule', label: 'Create Schedule', icon: '➕', count: createEvents.length || null },
  ]);

  const tabs = getTabs();

  // Fetch current user's schedule (placeholder since roles other than admin limited now)
  const fetchMyScheduleEvents = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/schedules');
      const data = await res.json();
      const personalEvents = Array.isArray(data) ? data.map(event => ({
        id: event.idcalendar || event.id,
        title: event.event_title || event.title || 'Event',
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description || '',
        classId: null,
        isClass: false,
        eventType: event.event_type || 'event',
      })) : [];
      setScheduleEvents(personalEvents);
    } catch (err) {
      console.error('fetchMyScheduleEvents error', err);
      setScheduleEvents([]);
    }
  };

    const fetchMasterSchedule = async () => {
      try {
        // Fetch from new schedules API
        const response = await fetch('http://localhost:3000/api/schedules');
        const data = await response.json();
        const events = data.map(schedule => ({
          id: schedule.idcalendar,
          title: schedule.event_title,
          start: new Date(schedule.start_time),
          end: new Date(schedule.end_time),
          isClass: true,
          description: schedule.description,
          teacherId: schedule.user_id,
          teacher: schedule.first_name && schedule.last_name ? `${schedule.first_name} ${schedule.last_name}` : 'Unknown Teacher'
        }));
        setMasterEvents(events);
        setCreateEvents(events); // Also set for create schedule tab
      } catch (error) {
        console.error('Error fetching master schedule:', error);
        setMasterEvents([]);
        setCreateEvents([]);
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

  // Data fetching effect
  useEffect(() => {
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

  // Cleanup duplicates periodically
  useEffect(() => {
    const interval = setInterval(cleanupDuplicateExceptions, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
      const response = await fetch(`http://localhost:3000/api/teachers/${teacherId}/schedules`);
      const data = await response.json();
      const events = data.map(schedule => ({
        id: schedule.idcalendar,
        title: schedule.event_title,
        start: new Date(schedule.start_time),
        end: new Date(schedule.end_time),
        isClass: true,
        description: schedule.description,
        teacherId: schedule.user_id,
        teacher: schedule.first_name && schedule.last_name ? `${schedule.first_name} ${schedule.last_name}` : 'Unknown Teacher'
      }));
      setTeacherEvents(events);
    } catch (error) {
      console.error('Error fetching teacher events:', error);
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

  // Master Schedule renderer (custom: hide Sat/Sun and lock to week view + A/B headers + time window)
  function renderMasterSchedule() {
    // Helper to extract a normalized grade from various possible fields/title text
    const extractGradeValue = (ev) => {
      // Direct fields first
      const raw = ev.grade || ev.grade_level || ev.gradeLevel || ev.grade_id || ev.gradeId;
      if (raw) {
        const s = raw.toString().trim();
        if (/^(pre[-\s]?k|pk)$/i.test(s)) return 'PK';
        if (/^k(ind(er(garten)?)?)?$/i.test(s)) return 'K';
        // strip words like 'grade', ordinal suffixes
        const num = s.replace(/grade/i, '').replace(/(st|nd|rd|th)/i, '').trim();
        if (/^\d{1,2}$/.test(num)) return parseInt(num,10);
      }
      // Parse from title if present e.g. "Math - Grade 5 - Room 103" or "5th Grade Math"
      const title = ev.title || '';
      // Patterns: Grade 5, 5th Grade, Grade K, Kindergarten, etc.
      const gradePattern1 = /Grade\s*(K|[0-9]{1,2})/i;
      const gradePattern2 = /(K|[0-9]{1,2})(st|nd|rd|th)?\s*Grade/i;
      let match = title.match(gradePattern1) || title.match(gradePattern2);
      if (match) {
        const val = match[1];
        if (/^K$/i.test(val)) return 'K';
        const n = parseInt(val,10);
        if (!isNaN(n)) return n;
      }
      // Kindergarten keywords
      if (/Kindergarten|Kinder/i.test(title)) return 'K';
      if (/Pre[-\s]?K|PK/i.test(title)) return 'PK';
      return null;
    };

    // Classify to a school level
    const classify = (gradeVal) => {
      if (gradeVal === null || gradeVal === undefined) return null;
      if (gradeVal === 'PK' || gradeVal === 'K' || (typeof gradeVal === 'number' && gradeVal >= 1 && gradeVal <= 5)) return 'elementary';
      if (typeof gradeVal === 'number' && gradeVal >= 6 && gradeVal <= 8) return 'middle';
      if (typeof gradeVal === 'number' && gradeVal >= 9 && gradeVal <= 12) return 'high';
      return null;
    };

    let filteredMasterEvents = masterEvents.filter(ev => {
      if (schoolView === 'all') return true;
      const g = extractGradeValue(ev);
      const level = classify(g);
      return level === schoolView;
    });
    // Apply dropdown filters
    if (filterTeacher) {
      filteredMasterEvents = filteredMasterEvents.filter(ev => {
        if (filterTeacher === 'all' || filterTeacher === '') return true;
        const tId = ev.teacherId || ev.teacher_id || (ev.teacher && ev.teacher.id);
        return tId && tId.toString() === filterTeacher;
      });
    }
    if (filterGrade) {
      filteredMasterEvents = filteredMasterEvents.filter(ev => {
        if (filterGrade === 'all' || filterGrade === '') return true;
        const g = extractGradeValue(ev);
        if (g === null || g === undefined) return false;
        const gStr = (typeof g === 'number') ? g.toString() : g;
        return gStr === filterGrade;
      });
    }
    if (filterRoom) {
      filteredMasterEvents = filteredMasterEvents.filter(ev => {
        if (filterRoom === 'all' || filterRoom === '') return true;
        return (ev.room || '').toString().trim() === filterRoom;
      });
    }

    const MasterToolbar = ({ label }) => (
      <div className="rbc-toolbar" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8, gap: 12 }}>
        <span className="rbc-btn-group" style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'elementary', label: 'Elementary' },
            { id: 'middle', label: 'Middle' },
            { id: 'high', label: 'High School' }
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSchoolView(btn.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: schoolView === btn.id ? '2px solid #3498db' : '1px solid #d0d7de',
                background: schoolView === btn.id ? '#3498db' : '#fff',
                color: schoolView === btn.id ? '#fff' : '#2c3e50',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                minWidth: 90,
                boxShadow: schoolView === btn.id ? '0 2px 6px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.08)'
              }}
            >
              {btn.label}
            </button>
          ))}
        </span>
      </div>
    );

      const MasterHeader = ({ date }) => {
        const ab = getABLabelForHeader(date);
        const isFriday = moment(date).day() === 5;
        const dayName = moment(date).format('dddd');
        const colorMap = { A: '#3498db', B: '#e74c3c', F: '#9b59b6' };
        const pillColor = isFriday ? colorMap.F : colorMap[ab] || '#7f8c8d';
        const pillText = isFriday ? `${ab} Friday` : (ab ? `${ab} Day` : '');
        return (
          <div style={{
            textAlign: 'center',
            padding: '8px 4px 8px 4px',
            minHeight: 130, // Taller header area so pill can sit mid-way "above 6:30"
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            background: '#fff',
            position: 'relative',
            zIndex: 15,
            overflow: 'visible'
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#2c3e50' }}>{dayName}</div>
            {pillText && (
              <div style={{
                position: 'absolute',
                top: '60%', // push further down toward middle of header block
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 13,
                padding: '8px 24px',
                backgroundColor: pillColor,
                color: 'white',
                borderRadius: 30,
                fontWeight: 600,
                // Seamless look: remove shadow & border
                boxShadow: 'none',
                border: 'none',
                minWidth: 90,
                lineHeight: 1.2,
                zIndex: 20,
                pointerEvents: 'none' // avoid intercepting clicks on header
              }}>
                {pillText}
              </div>
            )}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              background: '#ddd'
            }} />
          </div>
        );
      };

    // Build dropdown option sets (teachers from teachers state to ensure actual teacher DB data)
    const teacherOptions = teachers
      .filter(t => (t.role ? /teacher/i.test(t.role) : true))
      .map(t => ({ id: t.id, name: `${t.first_name || t.firstName || ''} ${t.last_name || t.lastName || ''}`.trim() || `Teacher ${t.id}` }));

    // Static PreK-12 grade list
    const gradeDropdownOptions = ['PK','K','1','2','3','4','5','6','7','8','9','10','11','12'];

    // Unique room list from events
    const roomOptions = Array.from(new Set(masterEvents.map(e => (e.room||'').toString().trim()).filter(Boolean))).sort();

    return (
      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        flex:1
      }}>
        {/* Ensure calendar headers (A/B day pills) are fully visible and not clipped */}
        <style>{`
          .rbc-time-header, .rbc-time-header .rbc-header { overflow: visible !important; }
          .rbc-time-header { z-index: 60; position: relative; }
          .rbc-time-content { position: relative; z-index: 1; }
          .rbc-time-view { overflow: visible !important; }
        `}</style>
        <Calendar
          localizer={localizer}
          events={filteredMasterEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          // Force work week (Mon-Fri) only
          views={['work_week']}
          view="work_week"
          // still allow navigation via custom toolbar
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          selectable={false}
          onSelectEvent={handleEventClick}
            // Restrict visible time range 6:30 - 16:00
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
                  padding: '4px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <span>{event.title}</span>
                {event.isClass && <span style={{ fontSize: '10px', opacity: 0.8 }}>📚</span>}
              </div>
            ),
          }}
        />
        </div>
        {/* Right-side Filters Panel */}
        <div style={{
          width:240,
          backgroundColor:'white',
          borderRadius:'12px',
          padding:'16px',
          boxShadow:'0 4px 16px rgba(0,0,0,0.05)',
          maxHeight:600,
          display:'flex',
          flexDirection:'column',
          gap:16
        }}>
          <h4 style={{margin:0,fontSize:16,fontWeight:700,color:'#2c3e50'}}>Filters</h4>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,marginBottom:4,color:'#555'}}>Teacher</label>
            <select value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:8,border:'1px solid #d0d7de'}}>
              <option value=''>Any</option>
              {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,marginBottom:4,color:'#555'}}>Grade</label>
            <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:8,border:'1px solid #d0d7de'}}>
              <option value=''>Any</option>
              {gradeDropdownOptions.map(g => <option key={g} value={g}>{g === 'PK' ? 'PreK' : g}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:600,marginBottom:4,color:'#555'}}>Location / Room</label>
            <select value={filterRoom} onChange={e=>setFilterRoom(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:8,border:'1px solid #d0d7de'}}>
              <option value=''>Any</option>
              {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={()=>{setFilterTeacher('');setFilterGrade('');setFilterRoom('');}} style={{marginTop:'auto',padding:'8px 10px',fontSize:12,border:'1px solid #ccc',borderRadius:8,background:'#f1f2f4',cursor:'pointer'}}>Reset</button>
        </div>
      </div>
    );
  }

  // (Removed duplicate TabNavigation definition)
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

  // Helper function to check if an event is within teacher availability
  const isEventInTeacherAvailability = (event) => {
    if (!event.teacherId) return true; // No teacher assigned, no conflict
    
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const eventDay = eventStart.day(); // 0=Sunday, 1=Monday, etc.
    
    // Find teacher's availability for this day
    const teacherAvailabilities = allAvailabilities.filter(av => 
      av.teacher_id === event.teacherId
    );
    
    for (const availability of teacherAvailabilities) {
      let availabilityDay;
      
      // Handle different day formats
      if (typeof availability.day_of_week === 'number') {
        availabilityDay = availability.day_of_week;
      } else {
        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
        availabilityDay = dayMap[availability.day_of_week] || 0;
      }
      
      // Check if event is on the same day as availability
      if (eventDay === availabilityDay) {
        const availStart = moment(availability.start_time, 'HH:mm:ss');
        const availEnd = moment(availability.end_time, 'HH:mm:ss');
        
        // Set the date to match the event day for proper comparison
        availStart.year(eventStart.year()).month(eventStart.month()).date(eventStart.date());
        availEnd.year(eventEnd.year()).month(eventEnd.month()).date(eventEnd.date());
        
        // Check if event is within availability window
        if (eventStart.isSameOrAfter(availStart) && eventEnd.isSameOrBefore(availEnd)) {
          return true;
        }
      }
    }
    
    return false; // No matching availability found
  };

  // Helper: expand recurring events for calendar
  const getCalendarEvents = () => {
    const expanded = [];
    console.log('Getting calendar events from:', createEvents);
    
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
        // Non-recurring event or events with explicit start/end dates
        expanded.push({
          ...ev,
          title: ev.subject
        });
      }
    }
    console.log('Expanded events:', expanded);
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
            const aId = (typeof a.id === 'string' && a.id.includes('-recurring-')) ? a.id.split('-recurring-')[0] : a.id;
            const bId = (typeof b.id === 'string' && b.id.includes('-recurring-')) ? b.id.split('-recurring-')[0] : b.id;
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
      // For Friday, always show A/B day selection modal first
      setFridayModal({ 
        open: true, 
        slotInfo: { 
          start, 
          end, 
          dragEvent: false,
          isNewClass: true 
        } 
      });
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
      abDay: abDay || "",
      dayType: abDay || "",
      recurringDays
    }));
    setModalOpen(true);
  };

  // Handle Friday A/B day selection
  const handleFridaySelection = async (abDay) => {
    const { start, end, dragEvent, originalEvent, draggedEventId, isNewClass } = fridayModal.slotInfo;
    setFridayModal({ open: false, slotInfo: null });
    
    if (isNewClass) {
      // Handle new class creation on Friday
      const overlappingAvailabilities = allAvailabilities.filter(av => {
        const slotStart = moment(start);
        const slotEnd = moment(end);
        const dayOfWeek = 5; // Friday
        
        if (av.day_of_week !== dayOfWeek) return false;
        
        const [avStartHour, avStartMin] = av.start_time.split(':').map(Number);
        const [avEndHour, avEndMin] = av.end_time.split(':').map(Number);
        const avStart = slotStart.clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
        const avEnd = slotStart.clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });
        
        return slotStart.isSameOrAfter(avStart) && slotEnd.isSameOrBefore(avEnd);
      });
      
      let preSelectedTeacherId = "";
      if (overlappingAvailabilities.length === 1) {
        preSelectedTeacherId = overlappingAvailabilities[0].teacher_id.toString();
      }
      
      const dayIdx = 4; // Friday index
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
      console.log('Friday drag completed:', dragEvent.id, abDay);
      
      // Handle recurring instance vs regular/base events
      if (isRecurringInstance && baseEvent && originalDate) {
        // This is a recurring event instance - create an exception
        const exceptionId = `${baseEvent.id}-exception-${originalDate}`;
        const exceptionEvent = {
          ...baseEvent,
          id: exceptionId,
          start: start,
          end: end,
          recurringDays: [4], // Friday
          abDay: abDay,
          dayType: abDay,
          isException: true,
          originalDate: originalDate,
          originalEventId: baseEvent.id
        };
        
        // Save exception to database
        try {
          const scheduleData = {
            start_time: moment(start).format('YYYY-MM-DD HH:mm:ss'),
            end_time: moment(end).format('YYYY-MM-DD HH:mm:ss'),
            class_id: baseEvent.id,
            event_title: `${baseEvent.subject} - ${baseEvent.grade} (Friday ${abDay} Day)`,
            user_id: baseEvent.teacherId,
            description: `Friday ${abDay} Day exception for ${baseEvent.subject}`
          };
          
          const result = await saveScheduleToDatabase(scheduleData);
          console.log('Friday exception saved to database:', result);
          exceptionEvent.databaseId = result.insertId;
        } catch (error) {
          console.error('Error saving Friday exception to database:', error);
          console.log('Continuing without database save - Friday drag will still work locally');
          // Don't return here - allow the drag to continue even if database save fails
        }
        
        console.log('Creating Friday exception event:', exceptionEvent);
        setCreateEvents(prev => [...prev, exceptionEvent]);
      } else {
        // Regular event or base recurring event being moved to Friday
        try {
          if (dragEvent.databaseId) {
            const scheduleData = {
              start_time: moment(start).format('YYYY-MM-DD HH:mm:ss'),
              end_time: moment(end).format('YYYY-MM-DD HH:mm:ss'),
              class_id: dragEvent.id,
              event_title: `${dragEvent.subject} - ${dragEvent.grade} (Friday ${abDay} Day)`,
              user_id: dragEvent.teacherId,
              description: `Friday ${abDay} Day - ${dragEvent.subject}`
            };
            
            const result = await updateScheduleInDatabase(dragEvent.databaseId, scheduleData);
            console.log('Friday event updated in database:', result);
          }
        } catch (error) {
          console.error('Error updating Friday event in database:', error);
          console.log('Continuing without database update - Friday drag will still work locally');
          // Don't return here - allow the drag to continue even if database update fails
        }
        
        setCreateEvents(prev => {
          const updatedEvents = prev.map(ev =>
            ev.id === dragEvent.id
              ? {
                  ...ev,
                  start: start,
                  end: end,
                  abDay: abDay,
                  recurringDays: [4] // Friday is index 4
                }
              : ev
          );
          console.log('Updated Friday regular/base events:', updatedEvents);
          return updatedEvents;
        });
      }
      
      setDraggingEventId(null);
    }
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
  const handleSaveEvent = async (e) => {
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
    
    // Check if the event is within teacher availability
    const isInAvailability = isEventInTeacherAvailability(newEvent);
    newEvent.outOfAvailability = !isInAvailability;

    // Save to database
    try {
      const scheduleData = {
        start_time: newStart.format('YYYY-MM-DD HH:mm:ss'),
        end_time: newEnd.format('YYYY-MM-DD HH:mm:ss'),
        class_id: null, // You can link this to a classes table if you have one
        event_title: `${newSubject} - Grade ${newGrade} - Room ${newRoom}`,
        user_id: newTeacherId,
        description: `Subject: ${newSubject}, Grade: ${newGrade}, Room: ${newRoom}, Teacher: ${newTeacherName}${newAbDay ? `, A/B Day: ${newAbDay}` : ''}${newRecurringDays.length > 0 ? `, Recurring: ${newRecurringDays.map(d => ["Mon", "Tue", "Wed", "Thu", "Fri"][d]).join(", ")}` : ''}`
      };

      if (editMode) {
        await updateScheduleInDatabase(editingEventId, scheduleData);
        setCreateEvents(prev => prev.map(ev => ev.id === editingEventId ? newEvent : ev));
        setEditMode(false);
        setEditingEventId(null);
        console.log('Schedule updated in database successfully');
      } else {
        const result = await saveScheduleToDatabase(scheduleData);
        if (result.success) {
          newEvent.id = result.id.toString(); // Use the database ID
          setCreateEvents(prev => [...prev, newEvent]);
          console.log('Schedule saved to database successfully');
        } else {
          alert('Failed to save schedule to database');
          return;
        }
      }
    } catch (error) {
      console.error('Database operation failed:', error);
      alert('Failed to save schedule. Please try again.');
      return;
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
    // Don't allow dragging availability blocks or if in delete mode
    if (event.availability || deleteMode) {
      return;
    }
    setDraggingEventId(event.id);
    
    // Prevent auto-scrolling during drag
    const timeContent = document.querySelector('.rbc-time-content');
    if (timeContent) {
      timeContent.style.scrollBehavior = 'auto';
      timeContent.style.overflowAnchor = 'none';
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggingEventId(null);
    
    // Restore normal scrolling behavior
    const timeContent = document.querySelector('.rbc-time-content');
    if (timeContent) {
      timeContent.style.scrollBehavior = '';
      timeContent.style.overflowAnchor = '';
    }
  };

  // Handle event drop
  const handleEventDrop = async ({ event, start, end }) => {
    console.log('Drop event triggered:', { event, start, end });
    
    // Don't allow dragging availability blocks or if in delete mode
    if (event.availability || deleteMode) {
      console.log('Blocking drag - availability or delete mode');
      setDraggingEventId(null);
      return;
    }

    // Validate time range (6:30 AM - 4:00 PM)
    const startMoment = moment(start);
    const endMoment = moment(end);
    const minTime = moment(start).set({ hour: 6, minute: 30, second: 0 });
    const maxTime = moment(start).set({ hour: 16, minute: 0, second: 0 });
  
    if (startMoment.isBefore(minTime) || endMoment.isAfter(maxTime)) {
      alert('Classes can only be scheduled between 6:30 AM and 4:00 PM.');
      setDraggingEventId(null);
      return;
    }

    console.log('About to update event:', event.id);

    // Check if this is a recurring event instance being dragged
    if (typeof event.id === 'string' && event.id.includes('-recurring-')) {
      const baseId = event.id.split('-recurring-')[0];
      const originalDate = event.id.split('-recurring-')[1];
      const baseEvent = createEvents.find(ev => ev.id === baseId);
      
      if (baseEvent) {
        // Check if moving to Friday requires A/B day selection
        const isFriday = moment(start).day() === 5;
        if (isFriday) {
          setFridayModal({
            open: true,
            slotInfo: {
              start,
              end,
              dragEvent: true,
              originalEvent: event,
              baseEvent,
              originalDate,
              isRecurringInstance: true
            }
          });
          return;
        }

        // Create an exception for this specific instance
        const newDayIndex = moment(start).day() - 1; // Convert to 0=Monday, 4=Friday
        const newRecurringDays = (newDayIndex >= 0 && newDayIndex <= 4) ? [newDayIndex] : [];
        const exceptionId = `${baseId}-exception-${originalDate}`;
        
        const exceptionEvent = {
          ...baseEvent,
          id: exceptionId,
          start: start,
          end: end,
          recurringDays: newRecurringDays,
          isException: true,
          originalDate: originalDate,
          originalEventId: baseId,
          abDay: baseEvent.abDay || getABDay(start)
        };
        
        console.log('Creating exception event:', exceptionEvent);
        
        // Save exception to database
        try {
          const scheduleData = {
            start_time: moment(start).format('YYYY-MM-DD HH:mm:ss'),
            end_time: moment(end).format('YYYY-MM-DD HH:mm:ss'),
            class_id: baseEvent.id,
            event_title: `${baseEvent.subject} - ${baseEvent.grade} (Exception)`,
            user_id: baseEvent.teacherId,
            description: `Exception for ${baseEvent.subject} on ${moment(start).format('YYYY-MM-DD')}`
          };
          
          const result = await saveScheduleToDatabase(scheduleData);
          console.log('Exception saved to database:', result);
          
          // Add database ID to the exception event
          exceptionEvent.databaseId = result.insertId;
        } catch (error) {
          console.error('Error saving exception to database:', error);
          console.log('Continuing without database save - drag will still work locally');
          // Don't return here - allow the drag to continue even if database save fails
        }
        
        setCreateEvents(prev => [...prev, exceptionEvent]);
      }
    } else {
      // Regular event or base recurring event - move the entire series
      const newDayIndex = moment(start).day() - 1;
      const newRecurringDays = (newDayIndex >= 0 && newDayIndex <= 4) ? [newDayIndex] : [];
      
      console.log('Updating regular/base event:', event.id);
      
      // Update in database first
      try {
        if (event.databaseId) {
          const scheduleData = {
            start_time: moment(start).format('YYYY-MM-DD HH:mm:ss'),
            end_time: moment(end).format('YYYY-MM-DD HH:mm:ss'),
            class_id: event.id,
            event_title: `${event.subject} - ${event.grade}`,
            user_id: event.teacherId,
            description: event.subject
          };
          
          const result = await updateScheduleInDatabase(event.databaseId, scheduleData);
          console.log('Event updated in database:', result);
        }
      } catch (error) {
        console.error('Error updating event in database:', error);
        console.log('Continuing without database update - drag will still work locally');
        // Don't return here - allow the drag to continue even if database update fails
      }
      
      // Update local state - this will happen regardless of overlaps
      setCreateEvents(prevEvents => {
        const updatedEvents = prevEvents.map(ev =>
          ev.id === event.id
            ? {
                ...ev,
                start: start,
                end: end,
                recurringDays: newRecurringDays,
                abDay: ev.abDay || getABDay(start)
              }
            : ev
        );
        console.log('Updated events:', updatedEvents);
        return updatedEvents;
      });
    }

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
  const handleConfirmDelete = async () => {
    try {
      // Delete from database first
      for (const eventId of selectedToDelete) {
        await deleteScheduleFromDatabase(eventId);
      }
      
      // Then remove from local state
      setCreateEvents(evts => evts.filter(ev => {
        // For all events, check if the base ID is selected
        const baseId = (typeof ev.id === 'string' && ev.id.includes('-recurring-')) ? ev.id.split('-recurring-')[0] : ev.id;
        return !selectedToDelete.includes(baseId);
      }));
      
      console.log('Selected schedules deleted from database successfully');
    } catch (error) {
      console.error('Error deleting schedules:', error);
      alert('Failed to delete some schedules. Please try again.');
    } finally {
      setDeleteMode(false);
      setSelectedToDelete([]);
    }
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
        padding: "16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column"
      }}>
        <style>{`
          .rbc-header {
            z-index: 15 !important;
            position: relative !important;
            background: white !important;
            border-bottom: 1px solid #ddd !important;
          }
          .rbc-time-view .rbc-header {
            z-index: 15 !important;
            background: white !important;
            min-height: 60px !important;
          }
          .rbc-time-header {
            z-index: 14 !important;
            background: white !important;
          }
          .rbc-time-header-content {
            z-index: 13 !important;
            background: white !important;
          }
          .rbc-time-content {
            border-top: none !important;
          }
          .rbc-calendar {
            height: 100% !important;
          }
          .rbc-time-view {
            border: 1px solid #ddd !important;
            border-radius: 8px !important;
            overflow: hidden !important;
          }
          
          /* Fix drag scrolling issues */
          .rbc-time-content {
            overflow-y: auto !important;
            scroll-behavior: auto !important;
          }
          
          /* Prevent auto-scroll during drag operations */
          .rbc-addons-dnd-drag-preview {
            pointer-events: none !important;
          }
          
          .rbc-addons-dnd-drag-row {
            pointer-events: none !important;
          }
          
          /* Disable smooth scrolling during drag */
          .rbc-time-view.rbc-addons-dnd-is-dragging {
            scroll-behavior: auto !important;
          }
          
          .rbc-time-view.rbc-addons-dnd-is-dragging .rbc-time-content {
            scroll-behavior: auto !important;
            overflow-anchor: none !important;
          }
          
          /* Prevent calendar from auto-scrolling */
          .rbc-time-slot {
            pointer-events: auto !important;
          }
          
          .rbc-addons-dnd-resize-anchor {
            display: none !important;
          }
        `}</style>
        <DragAndDropCalendar
          localizer={localizer}
          events={allEventsForCreate}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "calc(100% - 20px)" }}
          views={{ work_week: true }}
          defaultView="work_week"
          toolbar={false}
          popup={false}
          min={moment().startOf('day').set({ hour: 6, minute: 30 }).toDate()}
          max={moment().startOf('day').set({ hour: 16, minute: 0 }).toDate()}
          daysOfWeek={[1,2,3,4,5]}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onDragStart={handleEventDragStart}
          onDragEnd={handleDragEnd}
          resizable={false}
          draggableAccessor={(event) => !event.availability}
          dragFromOutsideItem={null}
          onDropFromOutside={null}
          step={5}
          timeslots={6}
          showMultiDayTimes={false}
          scrollToTime={moment().set({ hour: 8, minute: 0 }).toDate()}
          onSelectEvent={deleteMode ? (event) => {
            if (event.availability) return;
            
            // For exception events, use the exact ID
            const eventId = (typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id;
            
            setSelectedToDelete(prev => 
              prev.includes(eventId) 
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
            );
          } : (event) => {
            if (event.availability) return;
            setEventDetailsModal({ open: true, event });
          }}
          eventPropGetter={event => {
            const eventId = (typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id;
            const baseId = (typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id;
            const isSelected = selectedToDelete.includes(eventId);
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
                  cursor: "default",
                  pointerEvents: "none"
                }
              };
            }
            
            let backgroundColor = "#3498db";
            let border = "none";
            let opacity = isBeingDragged ? 0.6 : 1;
            
            // Check if event is outside teacher availability
            const isOutOfAvailability = event.outOfAvailability || (!event.availability && !isEventInTeacherAvailability(event));
            
            if (deleteMode && isSelected) {
              backgroundColor = "#e74c3c";
              border = "2px solid #c0392b";
            } else if (hasConflict) {
              border = "2px solid #e74c3c";
            } else if (isOutOfAvailability && !event.availability) {
              backgroundColor = "#ff9800"; // Orange for availability warning
              border = "2px dashed #f57c00";
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
                cursor: deleteMode ? "pointer" : (isBeingDragged ? "grabbing" : "grab"),
                position: "relative"
              }
            };
          }}
          components={{
            event: ({ event }) => {
              const isOutOfAvailability = event.outOfAvailability || (!event.availability && !isEventInTeacherAvailability(event));
              
              return (
                <div style={{ 
                  padding: "2px 4px", 
                  fontSize: event.availability ? "10px" : "12px",
                  fontWeight: event.availability ? 400 : 500,
                  opacity: event.availability ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span>
                    {event.availability 
                      ? `${event.teacher_first_name} ${event.teacher_last_name}`
                      : (event.title || event.subject)
                    }
                  </span>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>

                    
                    {!event.availability && isOutOfAvailability && (
                      <span 
                        style={{ 
                          fontSize: "10px", 
                          color: "#fff",
                          backgroundColor: "rgba(255,152,0,0.8)",
                          borderRadius: "2px",
                          padding: "1px 3px",
                          fontWeight: "bold"
                        }}
                        title="Outside teacher availability"
                      >
                        ⚠
                      </span>
                    )}
                    
                    {deleteMode && !event.availability && (
                      <span style={{ fontSize: "10px" }}>
                        {selectedToDelete.includes((typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id) ? "✓" : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            },
            header: CustomHeader
          }}
        />
      </div>
    );
  };

  // Unified Calendar Component
  const renderCalendar = (events, calendarType) => {
    // Restrict to Mon-Fri and 6:30am-4:00pm for master, teacher, and student schedules
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
            ),
          }}
        />
      </div>
    );
  };

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
            
            {/* Time Selection */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Start Time</label>
                <select 
                  value={details.startTime || (selectedSlot && moment(selectedSlot.start).format("h:mm A"))}
                  onChange={e => handleTimeChange('startTime', e.target.value)}
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
                  onChange={e => handleTimeChange('endTime', e.target.value)}
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
              {/* Custom dropdown button */}
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
              
              {/* Color indicator for selected teacher */}
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
                    backgroundColor: getTeacherColor(parseInt(details.teacherId)),
                    border: "1px solid #ccc",
                    pointerEvents: "none",
                    zIndex: 1
                  }}
                />
              )}
              
              {/* Dropdown options */}
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
            
            {/* Show A/B day field for Friday classes */}
            {selectedSlot && moment(selectedSlot.start).day() === 5 && (
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

            {/* Recurring days checkboxes */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Recurring Days</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", justifyContent: "space-between", width: "100%" }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, idx) => (
                  <label key={day} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 14, fontWeight: 500, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={details.recurringDays.includes(idx)}
                      onChange={e => {
                        setDetails(d => ({
                          ...d,
                          recurringDays: e.target.checked
                            ? [...d.recurringDays, idx]
                            : d.recurringDays.filter(i => i !== idx)
                        }));
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

      {/* Friday A/B Day Selection Modal */}
      {fridayModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#333' }}>
              {fridayModal.slotInfo?.dragEvent ? 'Moving Class to Friday' : 'Friday Class Selection'}
            </h3>
            <p style={{ marginBottom: '24px', color: '#666' }}>
              {fridayModal.slotInfo?.dragEvent 
                ? 'You\'re moving a class to Friday. Is this an A day Friday or B day Friday?'
                : 'Is this an A day Friday or B day Friday?'
              }
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => handleFridaySelection('A')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#2980b9'}
                onMouseLeave={e => e.target.style.backgroundColor = '#3498db'}
              >
                A Day Friday
              </button>
              <button
                onClick={() => handleFridaySelection('B')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#c0392b'}
                onMouseLeave={e => e.target.style.backgroundColor = '#e74c3c'}
              >
                B Day Friday
              </button>
            </div>
            <button
              onClick={() => setFridayModal({ open: false, slotInfo: null })}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
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
