# Quick Start Guide - New Dashboard System

## Overview
The dashboard has been redesigned to provide a focused home page showing today's schedule, with full calendar and class management accessible through the sidebar.

---

## For Teachers

### Home Page (`/teacher-dashboard`)
**What you'll see:**
- **Welcome header** with today's date and A/B day
- **Next Class card** - Shows your upcoming class with:
  - Class name
  - Time
  - Room number
- **Next Break card** - Shows your next break with:
  - Duration
  - Start/end time
- **Classes Today card** - Total count of classes scheduled
- **Today's Schedule section** - Detailed list of all classes today with:
  - Real-time status (Upcoming/In Progress/Completed)
  - Time, room, grade level
  - Active class highlighted in green

### Schedule Page (`/teacher-schedule`)
**What you'll see:**
- Full calendar with month/week/day views
- All your recurring classes displayed
- A/B day indicators on calendar headers
- Click events to see details

### Classes Page (`/class`)
**What you can do:**
- View all your assigned classes
- Click on a class to see the roster
- Edit student rosters (add/remove students)
- ❌ **Cannot** create or delete classes (admin only)

### Navigation
```
Sidebar → Home       → Today's focused view
Sidebar → Schedule   → Full calendar
Sidebar → Classes    → Manage rosters
Sidebar → Availability → Set your availability
```

---

## For Students

### Home Page (`/student-dashboard`)
**What you'll see:**
- **Welcome header** with today's date and A/B day
- **Next Class card** - Shows your upcoming class with:
  - Class name
  - Time
  - Room number
  - Teacher name
- **Next Break card** - Shows your next break duration
- **Classes Today card** - Total count of your classes
- **Today's Schedule section** - All your classes today with:
  - Real-time status
  - Time, room, teacher info
  - Active class highlighted

### Schedule Page (`/student-schedule`)
**What you'll see:**
- Full calendar showing only your enrolled classes
- Week/month/day views available
- A/B day indicators

### Classes Page (`/class`)
**What you can do:**
- View all your enrolled classes
- Click on a class to see classmates
- ❌ **Cannot** edit rosters or add/remove classes

### Navigation
```
Sidebar → Home      → Today's focused view
Sidebar → Schedule  → Full calendar
Sidebar → Classes   → View enrolled classes
```

---

## For Admins

### Navigation (Unchanged)
```
Sidebar → Home      → Dashboard with stats
Sidebar → Classes   → Manage all classes (create/edit/delete)
Sidebar → Schedule  → Master schedule view
Sidebar → Users     → Manage users
Sidebar → Add User  → Create new user
```

**Full Control:**
- Create, edit, and delete classes
- Manage all users
- Access all schedule data
- No restrictions

---

## Status Indicators

### Class Status Colors
- 🟦 **Blue (Upcoming)** - Class starts in more than 1 hour
- 🟧 **Orange (Starting Soon)** - Class starts within 60 minutes
- 🟩 **Green (In Progress)** - Class is currently happening
- ⚫ **Gray (Completed)** - Class has ended

### Active Class Highlighting
When a class is currently in progress:
- Green left border
- Light green background
- Status shows time remaining

---

## A/B Day System

### How it works:
- Start date: **August 14, 2024**
- Even days from start = **A Day** (blue badge)
- Odd days from start = **B Day** (red badge)

### Where you'll see it:
- Home page header
- Calendar day headers
- Class schedule displays

---

## Tips & Tricks

### For Teachers
1. **Check Home first** - Quickly see what's happening today
2. **Next Break card** - Plan your day with break times
3. **Click Schedule** - See the full week/month ahead
4. **Manage Rosters** - Go to Classes → Click class → Edit roster

### For Students
1. **Next Class card** - Know where to go next
2. **Active Class** - Green highlighted = you should be in class now
3. **Schedule View** - Plan your week with full calendar
4. **Classmates** - Go to Classes → Click class → View roster

### For Everyone
1. **Status Updates** - Page updates every minute automatically
2. **Time Display** - 12-hour format with AM/PM
3. **Mobile Friendly** - Responsive design works on all devices
4. **Sidebar Collapsible** - Click arrow to expand/collapse sidebar

---

## Keyboard Shortcuts (Calendar Pages)

- **Left/Right Arrow** - Navigate between time periods
- **Alt + T** - Go to today
- **Alt + V** - Change view (day/week/month)

---

## Common Questions

**Q: Why don't I see any classes today?**
A: Either no classes are scheduled for today's A/B day, or it's a day off. Check the Schedule page to see the full week.

**Q: How do I know if it's A or B day?**
A: Look at the header on your Home page - it shows the current A/B day.

**Q: Can teachers create new classes?**
A: No, only admins can create or delete classes. Teachers can only edit rosters of their assigned classes.

**Q: Can students see who's in their classes?**
A: Yes! Go to Classes → Click any class → View the full roster (read-only).

**Q: How accurate are the status indicators?**
A: They update every minute based on your system clock. Make sure your computer time is correct!

---

## Need Help?

If you encounter any issues:
1. Try refreshing the page
2. Clear your browser cache
3. Verify you're logged in with the correct account
4. Contact your administrator

---

## Version
Dashboard Restructure v2.0 - October 2025
