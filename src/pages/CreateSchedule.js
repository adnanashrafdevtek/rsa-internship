import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Add grades array at the top (it was missing)
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

function CreateSchedule() {
  // State for conflict modal
  const [conflictModal, setConflictModal] = useState({ open: false, messages: [], pendingEvent: null });
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
    endTime: "",
    recurringDays: [], // Array of selected days (0=Monday, ... 4=Friday)
    dayType: "" // A or B day Friday
  });
  const [eventDetailsModal, setEventDetailsModal] = useState({ open: false, event: null });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  // Add searchTerm state for the search bar
  const [searchTerm, setSearchTerm] = useState("");
  // Add Friday modal state
  const [fridayModal, setFridayModal] = useState({ open: false, slotInfo: null });
  // Add dragging state to track which event is being dragged
  const [draggingEventId, setDraggingEventId] = useState(null);
  // Add teacher dropdown state
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);

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
  // Unique colors for teachers (exclude blue used by classes)
const teacherColors = [
  "#27ae60", // green
  "#f39c12", // orange
  "#8e44ad", // purple
  "#e67e22", // darker orange
  "#d35400", // reddish-orange
  "#16a085", // teal
  "#2980b9", // dark blue-ish (not bright class blue)
  "#2c3e50", // dark gray
  "#c0392b", // red
  "#7f8c8d"  // gray
  // add more if you have more teachers
];

const getTeacherColor = (teacherId) => {
  const idx = teachers.findIndex(t => t.id === teacherId);
  if (idx === -1) return "#000000"; // fallback black if teacher not found
  return teacherColors[idx]; // unique color per teacher
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
  const handleSelectSlot = ({ start, end, abDay }) => {
    // Don't allow slot selection if we're currently dragging an event
    if (draggingEventId) {
      return;
    }
    
    // Validate time range (6:30 AM - 4:00 PM)
    const startMoment = moment(start);
    const endMoment = moment(end);
    const minTime = moment(start).set({ hour: 6, minute: 30, second: 0 });
    const maxTime = moment(start).set({ hour: 16, minute: 0, second: 0 });
    
    if (startMoment.isBefore(minTime) || endMoment.isAfter(maxTime)) {
      alert('Classes can only be scheduled between 6:30 AM and 4:00 PM.');
      return;
    }
    
    // Check if it's Friday and no abDay is specified (direct calendar click)
    const isFriday = moment(start).day() === 5;
    
    if (isFriday && !abDay) {
      // Show Friday selection modal
      setFridayModal({ open: true, slotInfo: { start, end } });
      return;
    }
    
    // Check for overlapping teacher availabilities and auto-select teacher if only one matches
    const overlappingAvailabilities = selectedAvailabilities.filter(av => {
      const avStart = moment(av.start);
      const avEnd = moment(av.end);
      const slotStart = moment(start);
      const slotEnd = moment(end);
      
      // Check if the slot overlaps with this availability and is on the same day
      return (
        avStart.format('YYYY-MM-DD') === slotStart.format('YYYY-MM-DD') &&
        slotStart.isBefore(avEnd) && 
        avStart.isBefore(slotEnd)
      );
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
      teacherId: preSelectedTeacherId, // Auto-select teacher if found
      startTime: moment(start).format("h:mm A"), 
      endTime: moment(end).format("h:mm A"),
      abDay: abDay || (isFriday ? "" : ""),
      dayType: abDay || (isFriday ? "" : ""), // Also set dayType for the form
      recurringDays
    }));
    setModalOpen(true);
  };

  // Handle drag end to clear dragging state and restore event opacity
  const handleDragEnd = () => {
    setDraggingEventId(null);
  };
  
  // Handle Friday A/B day selection
  const handleFridaySelection = (abDay) => {
    const { start, end, dragEvent } = fridayModal.slotInfo;
    setFridayModal({ open: false, slotInfo: null });
    
    // Helper function to validate conflicts (same as in handleEventDrop)
    const validateNewPosition = (eventToCheck, newStart, newEnd, newRecurringDays) => {
      const teacherId = (() => {
        const teacher = teachers.find(t => `${t.first_name} ${t.last_name}` === eventToCheck.teacher);
        return teacher ? teacher.id : null;
      })();
      
      if (!teacherId) return false;
      
      const teacherName = eventToCheck.teacher;
      const newMomentStart = moment(newStart);
      const newMomentEnd = moment(newEnd);
      
      const isOverlap = (start1, end1, start2, end2) => {
        return moment(start1).isBefore(moment(end2)) && moment(start2).isBefore(moment(end1));
      };
      
      let newInstances = [];
      if (newRecurringDays && newRecurringDays.length > 0) {
        const duration = newMomentEnd.diff(newMomentStart, 'minutes');
        for (const recurDay of newRecurringDays) {
          const momentDay = recurDay + 1;
          const weekStart = moment().startOf('week');
          const dayStart = weekStart.clone().day(momentDay);
          const instanceStart = dayStart.set({ hour: newMomentStart.hour(), minute: newMomentStart.minute(), second: 0 });
          const instanceEnd = instanceStart.clone().add(duration, 'minutes');
          newInstances.push({ start: instanceStart, end: instanceEnd, dayOfWeek: momentDay });
        }
      } else {
        newInstances.push({ start: newMomentStart, end: newMomentEnd, dayOfWeek: newMomentStart.day() });
      }
      
      for (const newInst of newInstances) {
        const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === teacherId);
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
          if (!availableOnDay) return true;
        }
        
        const otherEvents = events.filter(ev => ev.id !== eventToCheck.id);
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
              if ((otherInst.teacher && otherInst.teacher === teacherName) ||
                  (otherInst.room && otherInst.room === eventToCheck.room) ||
                  (otherInst.grade && otherInst.grade === eventToCheck.grade && 
                   otherInst.subject && otherInst.subject === eventToCheck.subject && 
                   otherInst.room !== eventToCheck.room)) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };
    
    // If this is a drag operation, update the existing event
    if (dragEvent) {
      // Check if this is a recurring event instance being dragged
      if (typeof dragEvent.id === 'string' && dragEvent.id.includes('-recurring-')) {
        const [originalEventId] = dragEvent.id.split('-recurring-');
        const newDayOfWeek = moment(start).day(); // 5 for Friday
        const newDayIndex = newDayOfWeek - 1; // 4 for Friday
        
        // Find the original event
        const originalEvent = events.find(ev => ev.id === originalEventId);
        if (originalEvent) {
          // Replace recurring days with only Friday (no duplication)
          const updatedRecurringDays = [newDayIndex];
          
          // Check for conflicts in the new position
          const hasConflicts = validateNewPosition(originalEvent, start, end, updatedRecurringDays);
          
          // Update the original event with new time, day, and abDay
          setEvents(evts =>
            evts.map(ev =>
              ev.id === originalEventId
                ? {
                    ...ev,
                    start,
                    end,
                    recurringDays: updatedRecurringDays,
                    abDay,
                    hasOverlaps: hasConflicts,
                    hasConflictDays: hasConflicts ? [moment(start).day()] : []
                  }
                : ev
            )
          );
        }
      } else {
        // Regular event - update it to Friday with the new time and abDay
        const newDayIndex = 4; // Friday = 4 (0=Monday, 4=Friday)
        const newRecurringDays = [newDayIndex];
        
        // Check for conflicts in the new position
        const hasConflicts = validateNewPosition(dragEvent, start, end, newRecurringDays);
        
        setEvents(evts =>
          evts.map(ev =>
            ev.id === dragEvent.id
              ? {
                  ...ev,
                  start,
                  end,
                  recurringDays: newRecurringDays, // Set to Friday only
                  abDay,
                  hasOverlaps: hasConflicts,
                  hasConflictDays: hasConflicts ? [moment(start).day()] : []
                }
              : ev
          )
        );
      }
      // Clear dragging state after Friday selection
      setDraggingEventId(null);
    } else {
      // Regular slot selection for new event
      const dayIdx = moment(start).day() - 1; // 0=Monday, ... 4=Friday
      const recurringDays = (dayIdx >= 0 && dayIdx <= 4) ? [dayIdx] : [];
      
      // Check for overlapping teacher availabilities and auto-select teacher if only one matches (Friday logic)
      const overlappingAvailabilities = selectedAvailabilities.filter(av => {
        const avStart = moment(av.start);
        const avEnd = moment(av.end);
        const slotStart = moment(start);
        const slotEnd = moment(end);
        
        // Check if the slot overlaps with this availability and is on the same day
        return (
          avStart.format('YYYY-MM-DD') === slotStart.format('YYYY-MM-DD') &&
          slotStart.isBefore(avEnd) && 
          avStart.isBefore(slotEnd)
        );
      });
      
      // Auto-select teacher if exactly one availability matches
      let preSelectedTeacherId = "";
      if (overlappingAvailabilities.length === 1) {
        preSelectedTeacherId = overlappingAvailabilities[0].teacher_id.toString();
      }
      
      setSelectedSlot({ start, end });
      setDetails(d => ({ 
        ...d, 
        teacherId: preSelectedTeacherId, // Auto-select teacher if found
        startTime: moment(start).format("h:mm A"), 
        endTime: moment(end).format("h:mm A"),
        abDay: abDay,
        dayType: abDay, // Also set dayType for the form
        recurringDays
      }));
      setModalOpen(true);
    }
  };

  // Handle drag start to track which event is being dragged
  const handleEventDragStart = ({ event }) => {
    // Prevent dragging if in delete mode
    if (deleteMode) return;
    if (!event.availability) {
      setDraggingEventId(event.id);
    }
  };

  // Handle dragging events to new times
  const handleEventDrop = ({ event, start, end }) => {
    // Prevent moving classes if in delete mode
    if (deleteMode) {
      setDraggingEventId(null);
      return;
    }
    // Don't allow dragging availability blocks
    if (event.availability) {
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

    // Check if it's Friday and handle A/B day logic
    const isFriday = moment(start).day() === 5;
    const wasOriginallyFriday = moment(event.start).day() === 5;
  
    // If dragging to Friday and the event doesn't have an abDay, or dragging from non-Friday to Friday
    if (isFriday && (!event.abDay || !wasOriginallyFriday)) {
      // Show Friday selection modal for the drag operation - don't clear drag state yet
      setFridayModal({ 
        open: true, 
        slotInfo: { start, end, dragEvent: event } 
      });
      return;
    }

    // Helper function to validate conflicts for the new position
    const validateNewPosition = (eventToCheck, newStart, newEnd, newRecurringDays) => {
      const teacherId = (() => {
        const teacher = teachers.find(t => `${t.first_name} ${t.last_name}` === eventToCheck.teacher);
        return teacher ? teacher.id : null;
      })();
      
      if (!teacherId) return false; // No conflicts if teacher not found
      
      const teacherName = eventToCheck.teacher;
      const newMomentStart = moment(newStart);
      const newMomentEnd = moment(newEnd);
      
      // Helper function to check if two time ranges overlap
      const isOverlap = (start1, end1, start2, end2) => {
        return moment(start1).isBefore(moment(end2)) && moment(start2).isBefore(moment(end1));
      };
      
      // Create instances for the new position
      let newInstances = [];
      if (newRecurringDays && newRecurringDays.length > 0) {
        const duration = newMomentEnd.diff(newMomentStart, 'minutes');
        for (const recurDay of newRecurringDays) {
          const momentDay = recurDay + 1;
          const weekStart = moment().startOf('week');
          const dayStart = weekStart.clone().day(momentDay);
          const instanceStart = dayStart.set({ hour: newMomentStart.hour(), minute: newMomentStart.minute(), second: 0 });
          const instanceEnd = instanceStart.clone().add(duration, 'minutes');
          newInstances.push({
            start: instanceStart,
            end: instanceEnd,
            dayOfWeek: momentDay
          });
        }
      } else {
        newInstances.push({
          start: newMomentStart,
          end: newMomentEnd,
          dayOfWeek: newMomentStart.day()
        });
      }
      
      // Check each new instance for conflicts
      for (const newInst of newInstances) {
        // 1. Check teacher availability conflicts
        const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === teacherId);
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
          if (!availableOnDay) return true; // Has conflict
        }
        
        // 2. Check for overlaps with other existing classes (excluding the event being moved)
        const otherEvents = events.filter(ev => ev.id !== eventToCheck.id);
        for (const otherEvent of otherEvents) {
          // Expand other event instances
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
          
          // Check for conflicts with other instances
          for (const otherInst of otherInstances) {
            if (isOverlap(newInst.start, newInst.end, otherInst.start, otherInst.end) && newInst.start.day() === otherInst.start.day()) {
              // Teacher conflict
              if (otherInst.teacher && otherInst.teacher === teacherName) return true;
              // Room conflict
              if (otherInst.room && otherInst.room === eventToCheck.room) return true;
              // Class duplication conflict
              if (otherInst.grade && otherInst.grade === eventToCheck.grade && 
                  otherInst.subject && otherInst.subject === eventToCheck.subject && 
                  otherInst.room !== eventToCheck.room) return true;
            }
          }
        }
      }
      
      return false; // No conflicts found
    };

    // Check if this is a recurring event instance being dragged
    if (typeof event.id === 'string' && event.id.includes('-recurring-')) {
      const [originalEventId] = event.id.split('-recurring-');
      const newDayOfWeek = moment(start).day(); // 1=Monday, 5=Friday
      const newDayIndex = newDayOfWeek - 1; // Convert to 0=Monday, 4=Friday

      // Find the original event
      const originalEvent = events.find(ev => ev.id === originalEventId);
      if (originalEvent) {
        // Replace recurringDays with only the new day (no duplication)
        let updatedRecurringDays = (newDayIndex >= 0 && newDayIndex <= 4) ? [newDayIndex] : [];
        
        // Check for conflicts in the new position
        const hasConflicts = validateNewPosition(originalEvent, start, end, updatedRecurringDays);
        
        setEvents(evts =>
          evts.map(ev =>
            ev.id === originalEventId
              ? {
                  ...ev,
                  start,
                  end,
                  recurringDays: updatedRecurringDays,
                  abDay: isFriday ? ev.abDay : "",
                  hasOverlaps: hasConflicts, // Update conflict status
                  hasConflictDays: hasConflicts ? [moment(start).day()] : []
                }
              : ev
          )
        );
      }
    } else {
      // Regular non-recurring event or original recurring event
      const newDayIndex = moment(start).day() - 1; // Convert to 0=Monday, 4=Friday
      const newRecurringDays = (newDayIndex >= 0 && newDayIndex <= 4) ? [newDayIndex] : [];
      
      // Check for conflicts in the new position
      const hasConflicts = validateNewPosition(event, start, end, newRecurringDays);
      
      setEvents(evts =>
        evts.map(ev =>
          ev.id === event.id
            ? {
                ...ev,
                start,
                end,
                // Replace recurring days with only the new day (no duplication)
                recurringDays: newRecurringDays,
                // Clear abDay if dragging away from Friday
                abDay: isFriday ? ev.abDay : "",
                hasOverlaps: hasConflicts, // Update conflict status
                hasConflictDays: hasConflicts ? [moment(start).day()] : []
              }
            : ev
        )
      );
    }
    // Always reset dragging state after drop to restore full color
    setDraggingEventId(null);
  };
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(d => ({ ...d, [name]: value }));
  };

  // Helper to determine if custom grade input should show
  const showCustomGrade = details.grade === "Not here?";

  // Handle time change
  const handleTimeChange = (field, value) => {
    const [time, period] = value.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const newDate = moment(selectedSlot.start).set({ hour: hour24, minute: parseInt(minutes), second: 0 }).toDate();
    
    if (field === 'startTime') {
      const duration = moment(selectedSlot.end).diff(moment(selectedSlot.start), 'minutes');
      const newEnd = moment(newDate).add(duration, 'minutes').toDate();
      setSelectedSlot({ start: newDate, end: newEnd });
    } else {
      setSelectedSlot({ ...selectedSlot, end: newDate });
    }
    
    setDetails(d => ({ ...d, [field]: value }));
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

  // Save event from modal (add or edit)
  const handleSaveEvent = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!details.subject || !details.teacherId || !details.grade || !details.room) {
      alert('Please fill in all required fields.');
      return;
    }

    const newTeacherId = parseInt(details.teacherId);
    const newRoom = details.room;
    const newGrade = showCustomGrade ? details.customGrade : details.grade;
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
    let availabilityConflicts = [];

    // Helper function to check if two time ranges overlap
    const isOverlap = (start1, end1, start2, end2) => {
      return moment(start1).isBefore(moment(end2)) && moment(start2).isBefore(moment(end1));
    };

    // Helper: expand event to all its recurring instances
    const expandEventInstances = (ev) => {
      if (Array.isArray(ev.recurringDays) && ev.recurringDays.length > 0 && ev.start && ev.end) {
        const baseStart = moment(ev.start);
        const baseEnd = moment(ev.end);
        const duration = baseEnd.diff(baseStart, 'minutes');
        return ev.recurringDays.map(recurDay => {
          const momentDay = recurDay + 1;
          const weekStart = moment().startOf('week');
          const instanceStart = weekStart.clone().day(momentDay).set({ hour: baseStart.hour(), minute: baseStart.minute(), second: 0 });
          const instanceEnd = instanceStart.clone().add(duration, 'minutes');
          return {
            ...ev,
            start: instanceStart,
            end: instanceEnd,
            _recurringInstance: recurDay
          };
        });
      } else {
        return [{ ...ev, start: moment(ev.start), end: moment(ev.end) }];
      }
    };

    // Create new event instances for validation
    let newInstances = [];
    if (newRecurringDays.length > 0) {
      const baseStart = newStart;
      const baseEnd = newEnd;
      const duration = baseEnd.diff(baseStart, 'minutes');
      for (const recurDay of newRecurringDays) {
        const momentDay = recurDay + 1;
        const weekStart = moment().startOf('week');
        const dayStart = weekStart.clone().day(momentDay);
        const instanceStart = dayStart.set({ hour: baseStart.hour(), minute: baseStart.minute(), second: 0 });
        const instanceEnd = instanceStart.clone().add(duration, 'minutes');
        newInstances.push({
          start: instanceStart,
          end: instanceEnd,
          teacherId: newTeacherId,
          room: newRoom,
          grade: newGrade,
          subject: newSubject,
          abDay: newAbDay,
          dayOfWeek: momentDay
        });
      }
    } else {
      newInstances.push({
        start: newStart,
        end: newEnd,
        teacherId: newTeacherId,
        room: newRoom,
        grade: newGrade,
        subject: newSubject,
        abDay: newAbDay,
        dayOfWeek: newStart.day()
      });
    }

    // Gather all events except the one being edited (if in edit mode)
    const otherEvents = editMode && editingEventId
      ? events.filter(ev => ev.id !== editingEventId)
      : events;

    // Expand all existing event instances for conflict checking
    let allInstances = [];
    for (const ev of otherEvents) {
      allInstances.push(...expandEventInstances(ev));
    }

    // Helper function to get detailed conflict information
    const getConflictDetails = (newInst, inst) => {
      const overlapStart = moment.max(moment(newInst.start), moment(inst.start));
      const overlapEnd = moment.min(moment(newInst.end), moment(inst.end));
      const overlapMinutes = overlapEnd.diff(overlapStart, 'minutes');
      
      return {
        overlapMinutes,
        overlapTimeRange: `${overlapStart.format('h:mm A')} - ${overlapEnd.format('h:mm A')}`
      };
    };

    // Check each new instance for conflicts
    for (const newInst of newInstances) {
      // 1. Check teacher availability conflicts
      const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === newTeacherId);
      
      if (teacherAvailabilities.length > 0) {
        // Convert day index to moment day (0=Sunday in availability, 1=Monday in moment)
        const newInstDayOfWeek = newInst.dayOfWeek === 0 ? 7 : newInst.dayOfWeek; // Convert Sunday from 0 to 7
        const availableOnDay = teacherAvailabilities.some(av => {
          const avDayOfWeek = av.day_of_week;
          if (avDayOfWeek !== newInstDayOfWeek) return false;
          
          const [avStartHour, avStartMin] = av.start_time.split(':').map(Number);
          const [avEndHour, avEndMin] = av.end_time.split(':').map(Number);
          
          const avStart = moment(newInst.start).clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
          const avEnd = moment(newInst.start).clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });
          
          // Check if new class time is within availability window
          return newInst.start.isSameOrAfter(avStart) && newInst.end.isSameOrBefore(avEnd);
        });
        
        if (!availableOnDay) {
          availabilityConflicts.push(`📅 Availability Conflict: ${newTeacherName} is not available on ${newInst.start.format('dddd')} from ${newInst.start.format('h:mm A')} to ${newInst.end.format('h:mm A')}.`);
        }
      }

      // 2. Check for overlaps with existing classes
      for (const inst of allInstances) {
        if (isOverlap(newInst.start, newInst.end, inst.start, inst.end) && newInst.start.day() === inst.start.day()) {
          const conflictDetails = getConflictDetails(newInst, inst);
          
          // Teacher double-booking conflict
          if (inst.teacher && inst.teacher === newTeacherName) {
            conflictMessages.push(`👨‍🏫 Teacher Conflict: ${newTeacherName} is already teaching another class on ${newInst.start.format('dddd')} (${conflictDetails.overlapMinutes} min overlap: ${conflictDetails.overlapTimeRange}).`);
          }
          
          // Room conflict - flag even minimal overlaps
          if (inst.room && inst.room === newInst.room) {
            const existingClass = inst.subject ? `${inst.subject} (${inst.grade})` : 'Another class';
            conflictMessages.push(`🏫 Room Conflict: Room ${newInst.room} is already booked for ${existingClass} on ${newInst.start.format('dddd')} (${conflictDetails.overlapMinutes} min overlap: ${conflictDetails.overlapTimeRange}).`);
          }
          
          // Class duplication conflict (same grade/subject in different rooms)
          if (inst.grade && inst.grade === newInst.grade && inst.subject && inst.subject === newInst.subject && inst.room !== newInst.room) {
            conflictMessages.push(`📚 Class Duplication: ${newInst.subject} for grade ${newInst.grade} is already scheduled in room ${inst.room} on ${newInst.start.format('dddd')} (${conflictDetails.overlapMinutes} min overlap: ${conflictDetails.overlapTimeRange}).`);
          }
        }
      }
    }

    // Combine all conflict messages
    const allConflicts = [...availabilityConflicts, ...conflictMessages];

    // If there are conflicts, show the conflict modal
    if (allConflicts.length > 0) {
      // Mark which days have conflicts for visual indication
      let hasConflictDays = [];
      if (newRecurringDays.length > 0) {
        for (let i = 0; i < newInstances.length; i++) {
          const newInst = newInstances[i];
          let hasConflict = false;
          
          // Check availability conflicts
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
            if (!availableOnDay) hasConflict = true;
          }
          
          // Check overlap conflicts
          for (const inst of allInstances) {
            const sameDay = newInst.start.day() === inst.start.day();
            if (sameDay && isOverlap(newInst.start, newInst.end, inst.start, inst.end)) {
              if ((inst.teacher && inst.teacher === newTeacherName) ||
                  (inst.room && inst.room === newInst.room) ||
                  (inst.grade && inst.grade === newInst.grade && inst.subject && inst.subject === newInst.subject && inst.room !== newInst.room)) {
                hasConflict = true;
                break;
              }
            }
          }
          
          if (hasConflict) {
            hasConflictDays.push(newInst.start.day());
          }
        }
      } else {
        // Single event conflict checking
        let hasConflict = false;
        
        // Check availability
        const teacherAvailabilities = allAvailabilities.filter(av => av.teacher_id === newTeacherId);
        if (teacherAvailabilities.length > 0) {
          const newInstDayOfWeek = newStart.day() === 0 ? 7 : newStart.day();
          const availableOnDay = teacherAvailabilities.some(av => {
            if (av.day_of_week !== newInstDayOfWeek) return false;
            const [avStartHour, avStartMin] = av.start_time.split(':').map(Number);
            const [avEndHour, avEndMin] = av.end_time.split(':').map(Number);
            const avStart = moment(newStart).clone().set({ hour: avStartHour, minute: avStartMin, second: 0 });
            const avEnd = moment(newStart).clone().set({ hour: avEndHour, minute: avEndMin, second: 0 });
            return newStart.isSameOrAfter(avStart) && newEnd.isSameOrBefore(avEnd);
          });
          if (!availableOnDay) hasConflict = true;
        }
        
        // Check overlaps
        if (!hasConflict) {
          for (const inst of allInstances) {
            const sameDay = newStart.day() === inst.start.day();
            if (sameDay && isOverlap(newStart, newEnd, inst.start, inst.end)) {
              if ((inst.teacher && inst.teacher === newTeacherName) ||
                  (inst.room && inst.room === newRoom) ||
                  (inst.grade && inst.grade === newGrade && inst.subject && inst.subject === newSubject && inst.room !== newRoom)) {
                hasConflict = true;
                break;
              }
            }
          }
        }
        
        hasConflictDays = hasConflict ? [newStart.day()] : [];
      }
      
      // Prepare the event object for 'Add Anyway'
      const eventObj = {
        id: editMode && editingEventId ? editingEventId : Math.random().toString(36).substr(2, 9),
        title: `${details.subject}`,
        start: selectedSlot.start,
        end: selectedSlot.end,
        teacher: newTeacherName,
        grade: showCustomGrade ? details.customGrade : details.grade,
        subject: details.subject,
        room: details.room,
        recurringDays: details.recurringDays || [],
        abDay: details.abDay || "",
        hasConflictDays, // array of weekday numbers (1=Mon, ... 5=Fri)
        hasOverlaps: true // flag for red outline
      };
      
      setConflictModal({ open: true, messages: allConflicts, pendingEvent: eventObj });
      return;
    }

    // No conflicts - proceed with normal event creation/editing
    const eventToSave = {
      id: editMode && editingEventId ? editingEventId : Math.random().toString(36).substr(2, 9),
      title: `${details.subject}`,
      start: selectedSlot.start,
      end: selectedSlot.end,
      teacher: newTeacherName,
      grade: showCustomGrade ? details.customGrade : details.grade,
      subject: details.subject,
      room: details.room,
      recurringDays: details.recurringDays || [],
      abDay: details.abDay || "",
      hasOverlaps: false
    };

    if (editMode && editingEventId) {
      setEvents(evts =>
        evts.map(ev => ev.id === editingEventId ? eventToSave : ev)
      );
    } else {
      setEvents(evts => [...evts, eventToSave]);
    }
    
    // Reset form
    setModalOpen(false);
    setSelectedSlot(null);
    setDetails({ teacherId: "", grade: "", customGrade: "", subject: "", room: "", startTime: "", endTime: "", recurringDays: [], abDay: "", dayType: "" });
    setEditMode(false);
    setEditingEventId(null);
  };
  // Conflict modal UI
  const renderConflictModal = () => (
    conflictModal.open && (
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
              onMouseEnter={e => e.target.style.background = "#4a5568"}
              onMouseLeave={e => e.target.style.background = "#718096"}
            >
              Cancel & Fix Conflicts
            </button>
            {conflictModal.pendingEvent && (
              <button
                type="button"
                onClick={() => {
                  if (editMode && editingEventId) {
                    setEvents(evts =>
                      evts.map(ev =>
                        ev.id === editingEventId
                          ? { ...conflictModal.pendingEvent }
                          : ev
                      )
                    );
                  } else {
                    setEvents(evts => [
                      ...evts,
                      { ...conflictModal.pendingEvent }
                    ]);
                  }
                  setModalOpen(false);
                  setSelectedSlot(null);
                  setDetails({ teacherId: "", grade: "", customGrade: "", subject: "", room: "", startTime: "", endTime: "", recurringDays: [], abDay: "", dayType: "" });
                  setEditMode(false);
                  setEditingEventId(null);
                  setConflictModal({ open: false, messages: [], pendingEvent: null });
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
                onMouseEnter={e => e.target.style.background = "#c53030"}
                onMouseLeave={e => e.target.style.background = "#e53e3e"}
              >
                ⚠️ Add Anyway
              </button>
            )}
          </div>
        </div>
      </div>
    )
  );

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
      endTime: moment(event.end).format("h:mm A"),
      recurringDays: event.recurringDays || [],
      abDay: event.abDay || "",
      dayType: event.abDay || "" // Also set dayType for the form
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
    // Delete events whose base IDs are in selectedToDelete
    setEvents(evts => evts.filter(ev => {
      const baseId = (typeof ev.id === 'string' && ev.id.includes('-recurring-')) ? ev.id.split('-recurring-')[0] : ev.id;
      return !selectedToDelete.includes(baseId);
    }));
    setDeleteMode(false);
    setSelectedToDelete([]);
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
          
          // Flag for same room conflicts (this is the main addition)
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

  // Helper: expand recurring events for calendar
  const getCalendarEvents = () => {
    const expanded = [];
    for (const ev of events) {
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
          const newStart = dayStart.set({
            hour: baseStart.hour(),
            minute: baseStart.minute(),
            second: 0
          });
          const newEnd = newStart.clone().add(duration, 'minutes');
          
          const instanceId = `${ev.id}-recurring-${recurDay}`;
          
          expanded.push({ 
            ...ev, 
            start: newStart.toDate(), 
            end: newEnd.toDate(), 
            _recurringInstance: recurDay,
            id: instanceId,
            isDragging: draggingEventId === instanceId
          });
        }
      } else {
        // Non-recurring event - show as is with drag state
        expanded.push({
          ...ev,
          isDragging: draggingEventId === ev.id
        });
      }
    }
    return expanded;
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {renderConflictModal()}
      <style>{`
        .rbc-header {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          overflow: visible !important;
          height: 60px !important;
        }
        .rbc-time-view .rbc-header {
          border-bottom: none !important;
        }
        .rbc-time-view .rbc-header > * {
          position: relative !important;
          z-index: 1 !important;
        }
        .rbc-time-view {
          border: none !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .rbc-time-content {
          border-top: 1px solid #e9ecef !important;
        }
        .rbc-today {
          background-color: transparent !important;
        }
        .rbc-time-column .rbc-today {
          background-color: transparent !important;
        }
        .rbc-day-bg.rbc-today {
          background-color: transparent !important;
        }
        .rbc-event-availability {
          cursor: default !important;
        }
        .rbc-event:not(.rbc-event-availability) {
          cursor: move !important;
        }
        .rbc-drag-preview {
          opacity: 0.9 !important;
          background-color: #26bedd !important;
          border: 2px solid #1abc9c !important;
          box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4) !important;
          border-radius: 8px !important;
          z-index: 1000 !important;
          pointer-events: none !important;
        }
        .rbc-addons-dnd-dragging {
          opacity: 0.6 !important;
        }
        .rbc-addons-dnd-drag-source {
          opacity: 0.6 !important;
        }
        .rbc-addons-dnd-over {
          background-color: rgba(26, 188, 156, 0.1) !important;
        }
        .rbc-event {
          cursor: move !important;
        }
        .rbc-event.rbc-event-availability {
          cursor: default !important;
          pointer-events: none !important;
        }
      `}</style>
      <Sidebar />
      
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
          zIndex: 1000
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
                <span style={{ fontWeight: 700, color: "#e74c3c" }}>⚠️ Room or teacher conflicts detected. Please review highlighted events in the calendar.</span>
              </div>
            )}
          </div>
          <div style={{ background: "#ffffff", borderRadius: 8, padding: 0, maxWidth: 900, minWidth: 0, width: "100%", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: "1px solid #e9ecef" }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={[
                ...getCalendarEvents(),
                ...selectedAvailabilities
              ]}
              startAccessor="start"
              endAccessor="end"
              style={{ 
                height: 700, 
                width: "100%", 
                minWidth: 0, 
                maxWidth: 700, 
                margin: "0 auto", 
                position: "relative",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                overflow: "hidden"
              }}
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
                if (event.availability) {
                  return {
                    style: {
                      backgroundColor: event.color || "#27ae60",
                      color: "white",
                      opacity: 0.2,
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
                      height: "100%",
                      pointerEvents: "none" // Disable dragging for availability blocks
                    },
                    className: 'rbc-event-availability' // Add class to identify availability blocks
                  };
                }
                
                // Check for overlaps using original event ID
                const originalId = (typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id;
                const overlappingIds = getOverlappingEventIds();
                const isOverlapping = overlappingIds.includes(originalId);
                const isDragging = event.isDragging;
                const hasOverlaps = event.hasOverlaps;
                
                // Recurring instance: flag only if its day is in hasConflictDays
                let hasConflict = false;
                if (event.hasConflictDays && event._recurringInstance !== undefined) {
                  // _recurringInstance is 0=Mon, ... 4=Fri; moment().day() is 1=Mon, ... 5=Fri
                  hasConflict = event.hasConflictDays.includes(event._recurringInstance + 1);
                } else if (event.hasConflictDays) {
                  // Single event
                  hasConflict = event.hasConflictDays.length > 0;
                }
                
                // Determine styling based on conflict state
                let backgroundColor = "#26bedd";
                let borderColor = "#26bedd";
                let borderWidth = "1px";
                let boxShadow = "0 2px 4px rgba(38, 190, 221, 0.2)";
                
                if (hasOverlaps || hasConflict) {
                  backgroundColor = "#26bedd";
                  borderColor = "#e53e3e";
                  borderWidth = "2px";
                  boxShadow = "0 2px 8px rgba(229, 62, 62, 0.4)";
                } else if (isOverlapping) {
                  backgroundColor = "#fff5f5";
                  borderColor = "#fc8181";
                  borderWidth = "2px";
                  boxShadow = "0 2px 8px rgba(229, 62, 62, 0.3)";
                }
                
                return {
                  style: {
                    backgroundColor,
                    color: (isOverlapping && !hasOverlaps && !hasConflict) ? "#e53e3e" : "white",
                    borderRadius: 8,
                    fontWeight: 600,
                    border: `${borderWidth} solid ${borderColor}`,
                    boxShadow,
                    cursor: deleteMode && !event.availability ? "pointer" : (event.availability ? "default" : "move"),
                    transition: "all 0.2s ease",
                    opacity: isDragging ? 0.6 : 1
                  }
                };
              }}
              components={{
                header: CustomHeader,
                event: ({ event }) => {
                  const baseId = (typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id;
                  const isSelected = selectedToDelete && selectedToDelete.includes(baseId);
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
                          // For recurring events, use the base ID
                          const baseId = (typeof event.id === 'string' && event.id.includes('-recurring-')) ? event.id.split('-recurring-')[0] : event.id;
                          setSelectedToDelete(sel =>
                            sel.includes(baseId)
                              ? sel.filter(id => id !== baseId)
                              : [...sel, baseId]
                          );
                        } else {
                          setEventDetailsModal({ open: true, event });
                        }
                      }}
                    >
                      <span style={{ fontSize: 18, marginBottom: 2 }}>📘</span>
                      <span style={{
                    fontWeight: 700,
                      fontSize: 12, // smaller so it fits
                        color: "#222",
                      textAlign: "center",
                    whiteSpace: "normal",   // allow wrapping
                    wordBreak: "break-word",// break long words if needed
                    lineHeight: "1.1",
                      padding: "0 2px"
                      }}>
                    {event.title}
                      </span>
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
      marginTop: 105, 
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
          <form onSubmit={handleSaveEvent} style={{ background: "#fff", padding: "24px 16px 24px 16px", borderRadius: 16, minWidth: 300, maxWidth: 340, boxShadow: "0 8px 32px rgba(38,190,221,0.18)", width: 340, boxSizing: "border-box" }}>
            <h2 style={{ marginBottom: 10, fontWeight: 700, fontSize: 22 }}>{editMode ? "Edit Schedule Details" : "Add Schedule Details"}</h2>
            
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
                  zIndex: 1000,
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
            <select name="grade" value={details.grade} onChange={handleDetailChange} required style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: showCustomGrade ? 6 : 12, fontSize: 15, boxSizing: "border-box" }}>
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
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 12, fontSize: 15, boxSizing: "border-box" }}
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
            <input name="subject" value={details.subject} onChange={handleDetailChange} required placeholder="Enter subject..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 12, fontSize: 15, boxSizing: "border-box" }} />
            <label style={{ fontWeight: 600, marginBottom: 4, display: "block", marginLeft: 2 }}>Room Number</label>
            <input
              name="room"
              value={details.room}
              onChange={handleDetailChange}
              required
              placeholder="Enter room number..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #e1e8ed", marginBottom: 12, fontSize: 15, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => { setModalOpen(false); setEditMode(false); setEditingEventId(null); setDetails({ teacherId: "", grade: "", customGrade: "", subject: "", room: "", startTime: "", endTime: "", recurringDays: [], abDay: "", dayType: "" }); }} style={{ background: "#95a5a6", color: "white", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ background: "#26bedd", color: "white", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>{editMode ? "Save Changes" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
      </div>
    </div>
  );
}
export default CreateSchedule;