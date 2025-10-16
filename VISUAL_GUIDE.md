# Visual Guide - Calendar Updates

## 📅 Calendar Header - A/B Day Display

### What You'll See:

```
┌─────────────────────────────────────────────────────────────────┐
│  Monday         Tuesday        Wednesday      Thursday    Friday │
│  ┌─────┐       ┌─────┐        ┌─────┐        ┌─────┐    ┌─────┐│
│  │A Day│       │B Day│        │A Day│        │B Day│    │A Day││
│  └─────┘       └─────┘        └─────┘        └─────┘    └─────┘│
│   Blue           Red            Blue           Red        Blue  │
└─────────────────────────────────────────────────────────────────┘
```

### Color Coding:
- **🟦 A Day** = Blue badge (#3498db)
- **🟥 B Day** = Red badge (#e74c3c)

---

## ⏰ Time Range - Before & After

### Before Update:
```
Calendar View: 12:00 AM ────────────────────────► 11:59 PM
               ↑                                      ↑
            Midnight                              Midnight
            
Shows: Full 24-hour day (including 12 AM - 6 AM)
```

### After Update:
```
Calendar View: 6:30 AM ──────────────► 4:00 PM
               ↑                          ↑
           School Start              School End
            
Shows: Only school hours (10 hours of relevant time)
```

---

## 📆 View Options - Before & After

### Before Update:
```
Available Views: [Month] [Week] [Day]
                   ↓       ↓      ↓
                Includes  Shows   Shows
                weekends  Sat/Sun single day
```

### After Update:
```
Available Views: [Week] [Day]
                   ↓      ↓
                Mon-Fri  Single
                 only   weekday
```

---

## 🎨 Event Colors - Student Schedule

### Class Events (From Database):
```
┌────────────────────────┐
│ 🟦 Math - Room 101     │ ← Blue (#3498db)
│ 9:00 AM - 10:00 AM     │
└────────────────────────┘
```

### Personal Events (User Added):
```
┌────────────────────────┐
│ 🟪 Study Group         │ ← Purple (#9b59b6)
│ 3:00 PM - 4:00 PM      │
└────────────────────────┘
```

---

## 🖱️ Adding Personal Events

### Step-by-Step:

```
1. Click empty time slot
   ┌────────────────┐
   │   [Click]      │
   │   10:00 AM     │
   └────────────────┘

2. Prompt appears
   ┌──────────────────────────┐
   │ Add personal event:      │
   │ [________________]       │
   │         [OK] [Cancel]    │
   └──────────────────────────┘

3. Event appears
   ┌────────────────────────┐
   │ 🟪 Study Session       │
   │ 10:00 AM - 11:00 AM    │
   └────────────────────────┘
```

---

## 📊 Week View Example (Teacher)

```
┌─────────────────────────────────────────────────────────────────────┐
│              WEEK OF OCTOBER 14-18, 2025                            │
├─────────────────────────────────────────────────────────────────────┤
│       Mon        Tue        Wed        Thu        Fri               │
│     [A Day]    [B Day]    [A Day]    [B Day]    [A Day]            │
├─────────────────────────────────────────────────────────────────────┤
│ 6:30 ┌─────────────────────────────────────────────────┐            │
│ 7:00 │                                                 │            │
│ 7:30 │              [Empty - Click to Add]             │            │
│ 8:00 │                                                 │            │
│ 8:30 └─────────────────────────────────────────────────┘            │
│ 9:00 ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│      │Math 101  │ │Science   │ │Math 101  │                        │
│ 9:30 │Room 205  │ │Lab 3     │ │Room 205  │                        │
│10:00 └──────────┘ └──────────┘ └──────────┘                        │
│10:30 ┌──────────────────────────────────────┐                      │
│11:00 │   Planning Period (Personal Event)   │                      │
│11:30 └──────────────────────────────────────┘                      │
│12:00 ┌──────────┐            ┌──────────┐                          │
│      │History   │            │English   │                          │
│12:30 │Room 310  │            │Room 108  │                          │
│ 1:00 └──────────┘            └──────────┘                          │
│ 1:30                                                                │
│ 2:00 ┌──────────────────────────────────────┐                      │
│      │   Faculty Meeting (Personal Event)   │                      │
│ 2:30 └──────────────────────────────────────┘                      │
│ 3:00                                                                │
│ 3:30 ┌──────────────────┐                                          │
│ 4:00 │ Office Hours     │                                          │
└──────┴──────────────────┴──────────────────────────────────────────┘
```

---

## 📱 Day View Example (Student)

```
┌────────────────────────────────────────────┐
│         WEDNESDAY, OCTOBER 16              │
│              [A Day]                       │
├────────────────────────────────────────────┤
│ 6:30 AM                                    │
│ 7:00 AM  ┌──────────────────────┐          │
│ 7:30 AM  │                      │          │
│ 8:00 AM  │  🟪 Morning Study    │          │
│ 8:30 AM  │  (Personal)          │          │
│ 9:00 AM  └──────────────────────┘          │
│ 9:30 AM  ┌──────────────────────┐          │
│10:00 AM  │  🟦 Algebra II       │          │
│10:30 AM  │  Room 204            │          │
│11:00 AM  │  Ms. Johnson         │          │
│11:30 AM  └──────────────────────┘          │
│12:00 PM  ┌──────────────────────┐          │
│12:30 PM  │  🟦 Lunch            │          │
│ 1:00 PM  └──────────────────────┘          │
│ 1:30 PM  ┌──────────────────────┐          │
│ 2:00 PM  │  🟦 Chemistry        │          │
│ 2:30 PM  │  Lab 5               │          │
│ 3:00 PM  │  Mr. Smith           │          │
│ 3:30 PM  └──────────────────────┘          │
│ 4:00 PM                                    │
└────────────────────────────────────────────┘
```

---

## 🎯 Key Features Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Time Range** | 12 AM - 12 AM | 6:30 AM - 4:00 PM |
| **Weekend Display** | Yes (Sat/Sun) | No (Mon-Fri only) |
| **A/B Day Badges** | ❌ Not visible | ✅ Color-coded badges |
| **Month View** | ✅ Available | ❌ Removed |
| **Week View** | ✅ With weekends | ✅ Weekdays only |
| **Day View** | ✅ Full 24 hours | ✅ School hours |
| **Personal Events** | ❌ Not allowed | ✅ Click to add |
| **Event Colors** | Blue only | Blue + Purple |

---

## 🏫 Teacher Availability Calendar

### Before Update:
```
Time Range: 6:00 AM ──────────────────────► 7:00 PM
            (13 hours displayed)
```

### After Update:
```
Time Range: 6:30 AM ──────────► 4:00 PM
            (9.5 hours displayed)
            
Time Slots: 30-minute intervals (was 60-minute)
           More precise scheduling
```

---

## 🎨 Color Legend

### Status Colors:
- 🟦 **Blue (#3498db)** - Class events / A Day
- 🟥 **Red (#e74c3c)** - B Day badge
- 🟪 **Purple (#9b59b6)** - Personal events (students)
- 🟩 **Green** - Availability blocks (teachers)

---

## 📋 User Experience Flow

### Teacher Adding Personal Event:
```
1. View Schedule → 2. Click Time Slot → 3. Enter Title → 4. Event Added
      ↓                    ↓                   ↓               ↓
   Week View          10:00-11:00         "Planning"    Shows on calendar
```

### Student Adding Personal Event:
```
1. View Schedule → 2. Click Time Slot → 3. Enter Title → 4. Event Added (Purple)
      ↓                    ↓                   ↓               ↓
   Week View          3:00-4:00           "Study"       Purple color distinguishes
                                                         from classes
```

---

## 💡 Quick Tips

### For Best Experience:

1. **Use Week View** for weekly planning
   - See all 5 days at once
   - A/B day patterns visible
   - Easy to spot free time

2. **Use Day View** for daily focus
   - Detailed single-day schedule
   - See exact times clearly
   - Less overwhelming

3. **Add Personal Events** for:
   - Study sessions
   - Club meetings
   - Office hours
   - Appointments
   - Break reminders

4. **Check A/B Day Badge** to know:
   - Which day type it is
   - Plan accordingly
   - Avoid confusion

---

## 🔧 Technical Notes

### Calendar Settings Applied:

```javascript
// Time constraints
min: moment('2024-01-01 06:30:00').toDate()
max: moment('2024-01-01 16:00:00').toDate()

// Views
views: ['week', 'day']  // No month view

// Time format
formats: {
  timeGutterFormat: 'h:mm A'  // 12-hour format
}

// A/B Day calculation
const startDate = moment('2024-08-14');
const daysSinceStart = currentDate.diff(startDate, 'days');
const isADay = daysSinceStart % 2 === 0;
```

---

## ✅ Quality Checklist

- [x] Clean, focused time range
- [x] Weekday-only display
- [x] A/B day indicators visible
- [x] Personal event capability
- [x] Color-coded event types
- [x] Consistent across all calendars
- [x] No compilation errors
- [x] Responsive design maintained

---

Last Updated: October 16, 2025
Version: 2.1
