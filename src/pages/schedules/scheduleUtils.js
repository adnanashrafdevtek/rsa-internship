import moment from "moment";

const DAY_NAME_TO_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

export function normalizeDayOfWeek(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed in DAY_NAME_TO_INDEX) return DAY_NAME_TO_INDEX[trimmed];
    const asNum = parseInt(trimmed, 10);
    if (!Number.isNaN(asNum)) return normalizeDayOfWeek(asNum);
    return null;
  }
  if (typeof value === "number") {
    if (value >= 0 && value <= 6) return value;
    // Legacy 1-7 where 7=Sunday
    if (value >= 1 && value <= 7) return value === 7 ? 0 : value;
  }
  return null;
}

// recurring_day uses 0=Mon..4=Fri (frontend convention)
export function recurringDayToJsDay(recurringDay) {
  if (recurringDay === null || recurringDay === undefined) return null;
  const n = parseInt(recurringDay, 10);
  if (Number.isNaN(n)) return null;
  return n + 1; // 0->Mon(1) ... 4->Fri(5)
}

export function getABDay(date) {
  // Simple alternating week logic (even = A, odd = B) – adjust to real rules as needed
  return moment(date).week() % 2 === 0 ? "A" : "B";
}

// Header-specific label logic: Mon/Wed = A, Tue/Thu = B, Friday depends on parity
export function getABLabelForHeader(date) {
  const m = moment(date);
  const day = m.day(); // 0=Sun .. 6=Sat
  if (day === 1 || day === 3) return "A";       // Mon / Wed
  if (day === 2 || day === 4) return "B";       // Tue / Thu
  if (day === 5) return m.week() % 2 === 0 ? "A" : "B"; // Friday parity by week number
  return "";                                     // Weekend (hidden)
}

// Turn a class record (with recurring_days, start_time/end_time) into recurring events for the current week
export function generateRecurringEvents(cls) {
  if (!cls) return [];
  const recurring = Array.isArray(cls.recurring_days) ? cls.recurring_days : (Array.isArray(cls.recurringDays) ? cls.recurringDays : []);
  const startTime = cls.start_time || cls.startTime; // expected HH:mm:ss
  const endTime = cls.end_time || cls.endTime;
  if (!startTime || !endTime) return [];
  return recurring.map(dayIdx => {
    // dayIdx expected 0..4 (Mon..Fri) in our UI; moment weekday: 1..5
    const weekday = dayIdx + 1; // Monday=1
    const base = moment().startOf("week").day(weekday);
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = base.clone().set({ hour: sh, minute: sm || 0, second: 0 });
    const end = base.clone().set({ hour: eh, minute: em || 0, second: 0 });
    return {
      id: `${cls.id || cls.class_id || Date.now()}-${dayIdx}`,
      title: cls.event_title || cls.subject || "Class",
      subject: cls.subject || cls.event_title || "Class",
      teacher: cls.teacher || cls.teacher_name || cls.teacher_full_name || "",
      teacherId: cls.teacher_id || cls.user_id,
      grade: cls.grade || "",
      room: cls.room || cls.room_number || "",
      start: start.toDate(),
      end: end.toDate(),
      recurringDays: recurring,
      abDay: cls.abDay || "",
      isClass: true,
      description: cls.description || ""
    };
  });
}

// Helper function to merge overlapping availability blocks for the same teacher on the same day
export function mergeOverlappingAvailabilities(availabilities) {
  if (!availabilities || availabilities.length === 0) return [];

  // Group by teacher and day
  const grouped = {};
  availabilities.forEach(av => {
    const key = `${av.teacher_id}-${av.day_of_week}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(av);
  });

  // Merge overlapping times within each group
  const merged = [];
  Object.values(grouped).forEach(group => {
    // Sort by start time
    const sorted = group.sort((a, b) => {
      const timeA = moment(a.start_time, "HH:mm:ss").toDate();
      const timeB = moment(b.start_time, "HH:mm:ss").toDate();
      return timeA - timeB;
    });

    // Merge overlapping intervals
    let current = { ...sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentEnd = moment(current.end_time, "HH:mm:ss");
      const nextStart = moment(next.start_time, "HH:mm:ss");

      // If current end is >= next start, they overlap or are adjacent
      if (currentEnd.isSameOrAfter(nextStart)) {
        // Merge: extend current end if needed
        const nextEnd = moment(next.end_time, "HH:mm:ss");
        if (nextEnd.isAfter(currentEnd)) {
          current.end_time = nextEnd.format("HH:mm:ss");
        }
      } else {
        // No overlap, push current and move to next
        merged.push(current);
        current = { ...next };
      }
    }
    // Don't forget the last one
    merged.push(current);
  });

  return merged;
}

// Generate time options for dropdown (6:30 AM - 4:00 PM in 5-minute intervals)
export function generateTimeOptions() {
  const times = [];
  const start = moment().set({ hour: 6, minute: 30, second: 0 });
  const end = moment().set({ hour: 16, minute: 0, second: 0 });

  while (start.isSameOrBefore(end)) {
    times.push(start.format("h:mm A"));
    start.add(5, "minutes");
  }
  return times;
}

export function getTeacherColor(teacherId) {
  const teacherColors = [
    "#3498db", // Blue
    "#e74c3c", // Red
    "#f39c12", // Orange
    "#27ae60", // Green
    "#8e44ad", // Purple
    "#e67e22", // Dark Orange
    "#16a085", // Teal
    "#2c3e50", // Dark Blue
    "#c0392b", // Dark Red
    "#d35400", // Burnt Orange
    "#9b59b6", // Light Purple
    "#1abc9c", // Turquoise
    "#34495e", // Dark Gray
    "#f1c40f", // Yellow
    "#e8950f"  // Amber
  ];

  // Ensure teacherId is a number for consistent color assignment
  const numericId = parseInt(teacherId, 10) || 0;
  const colorIndex = numericId % teacherColors.length;
  return teacherColors[colorIndex];
}

export function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
