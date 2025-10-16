# Visual Guide - Custom Event Modal

## 📱 Modal Layout

### Full Modal View:
```
╔════════════════════════════════════════════════════════════════╗
║                  [Dark Semi-Transparent Overlay]               ║
║                                                                ║
║      ┌──────────────────────────────────────────────┐         ║
║      │  Add Personal Event                          │         ║
║      ├──────────────────────────────────────────────┤         ║
║      │                                              │         ║
║      │  ┌────────────────────────────────────────┐ │         ║
║      │  │ 📅 Wednesday, October 16, 2025        │ │         ║
║      │  │ 🕒 2:00 PM - 3:00 PM                  │ │         ║
║      │  └────────────────────────────────────────┘ │         ║
║      │                                              │         ║
║      │  Event Title *                               │         ║
║      │  ┌────────────────────────────────────────┐ │         ║
║      │  │ e.g., Department Meeting              │ │         ║
║      │  └────────────────────────────────────────┘ │         ║
║      │                                              │         ║
║      │  Event Type                                  │         ║
║      │  ┌────────────────────────────────────────┐ │         ║
║      │  │ Meeting                             ▼ │ │         ║
║      │  └────────────────────────────────────────┘ │         ║
║      │  [🟦] Event color                           │         ║
║      │                                              │         ║
║      │  Location                                    │         ║
║      │  ┌────────────────────────────────────────┐ │         ║
║      │  │ e.g., Conference Room A               │ │         ║
║      │  └────────────────────────────────────────┘ │         ║
║      │                                              │         ║
║      │  Description                                 │         ║
║      │  ┌────────────────────────────────────────┐ │         ║
║      │  │ Add any notes or details...           │ │         ║
║      │  │                                       │ │         ║
║      │  │                                       │ │         ║
║      │  └────────────────────────────────────────┘ │         ║
║      │                                              │         ║
║      │                    [Cancel]  [Add Event]    │         ║
║      └──────────────────────────────────────────────┘         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Color Coding System

### Teacher Event Types:

```
┌─────────────────────────────────────────────────────────────┐
│  Personal        [🟪 Purple]  #9b59b6                       │
│  Meeting         [🟦 Blue]    #3498db                       │
│  Preparation     [🟢 Green]   #2ecc71                       │
│  Office Hours    [🟧 Orange]  #f39c12                       │
│  Other           [⚫ Gray]    #95a5a6                       │
└─────────────────────────────────────────────────────────────┘
```

### Student Event Types:

```
┌─────────────────────────────────────────────────────────────┐
│  Study Session   [🟪 Purple]  #9b59b6                       │
│  Homework        [🟦 Blue]    #3498db                       │
│  Project Work    [🟢 Green]   #2ecc71                       │
│  Club Activity   [🟧 Orange]  #f39c12                       │
│  Tutoring        [🟥 Red]     #e74c3c                       │
│  Other           [⚫ Gray]    #95a5a6                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖱️ Interactive States

### Input Field States:

#### Default:
```
┌────────────────────────────────────┐
│ e.g., Department Meeting           │ ← Gray border (#e1e8ed)
└────────────────────────────────────┘
```

#### Focused:
```
┌────────────────────────────────────┐
│ Department Meeting█                │ ← Blue border (#3498db)
└────────────────────────────────────┘
```

#### Filled:
```
┌────────────────────────────────────┐
│ Department Meeting                 │ ← Gray border, text visible
└────────────────────────────────────┘
```

---

### Button States:

#### Cancel Button:

**Default:**
```
┌─────────┐
│ Cancel  │ ← White bg, gray text
└─────────┘
```

**Hover:**
```
┌─────────┐
│ Cancel  │ ← Light gray bg (#f8f9fa)
└─────────┘
```

#### Add Event Button (Teacher):

**Default:**
```
┌────────────┐
│ Add Event  │ ← Blue bg (#3498db)
└────────────┘
```

**Hover:**
```
┌────────────┐
│ Add Event  │ ← Darker blue (#2980b9)
└────────────┘
```

#### Add Event Button (Student):

**Default:**
```
┌────────────┐
│ Add Event  │ ← Purple bg (#9b59b6)
└────────────┘
```

**Hover:**
```
┌────────────┐
│ Add Event  │ ← Darker purple (#8e44ad)
└────────────┘
```

---

## 📋 Form Example - Teacher

### Filled Form:
```
╔════════════════════════════════════════════════════════╗
║  Add Personal Event                                    ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 📅 Thursday, October 17, 2025                    │ ║
║  │ 🕒 10:00 AM - 11:00 AM                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Event Title *                                         ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Parent-Teacher Conferences                       │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Event Type                                            ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Meeting                                       ▼  │ ║
║  └──────────────────────────────────────────────────┘ ║
║  [🟦] Event color                                     ║
║                                                        ║
║  Location                                              ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Room 205                                         │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Description                                           ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Meeting with parents to discuss student         │ ║
║  │ progress and upcoming projects. Bring grade     │ ║
║  │ reports and portfolio samples.                  │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║                          [Cancel]  [Add Event]        ║
╚════════════════════════════════════════════════════════╝
```

---

## 📋 Form Example - Student

### Filled Form:
```
╔════════════════════════════════════════════════════════╗
║  Add Personal Event                                    ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ 📅 Friday, October 18, 2025                      │ ║
║  │ 🕒 3:00 PM - 4:00 PM                            │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Event Title *                                         ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Math Study Group                                 │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Event Type                                            ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Study Session                                 ▼  │ ║
║  └──────────────────────────────────────────────────┘ ║
║  [🟪] Event color                                     ║
║                                                        ║
║  Location                                              ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Library                                          │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Description                                           ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │ Prepare for calculus test next week. Review     │ ║
║  │ chapters 5-7, practice problems, and work on    │ ║
║  │ study guide together.                           │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║                          [Cancel]  [Add Event]        ║
╚════════════════════════════════════════════════════════╝
```

---

## 📊 Event Type Dropdown

### Teacher Dropdown Expanded:
```
┌────────────────────────────────────┐
│ Personal                           │
├────────────────────────────────────┤
│ Meeting            ✓               │ ← Selected
├────────────────────────────────────┤
│ Preparation                        │
├────────────────────────────────────┤
│ Office Hours                       │
├────────────────────────────────────┤
│ Other                              │
└────────────────────────────────────┘
```

### Student Dropdown Expanded:
```
┌────────────────────────────────────┐
│ Study Session      ✓               │ ← Selected
├────────────────────────────────────┤
│ Homework                           │
├────────────────────────────────────┤
│ Project Work                       │
├────────────────────────────────────┤
│ Club Activity                      │
├────────────────────────────────────┤
│ Tutoring                           │
├────────────────────────────────────┤
│ Other                              │
└────────────────────────────────────┘
```

---

## 🎯 Calendar Event Display

### After Adding Event:

#### Teacher Calendar:
```
┌─────────────────────────────────────────────────────────┐
│  Thursday, Oct 17, 2025    [A Day]                      │
├─────────────────────────────────────────────────────────┤
│ 9:00 AM  ┌──────────────────────────┐                   │
│          │ 🟦 Algebra II            │ ← Class (Blue)    │
│10:00 AM  │ Room 204                 │                   │
│          └──────────────────────────┘                   │
│10:00 AM  ┌──────────────────────────┐                   │
│          │ 🟦 Parent-Teacher        │ ← Personal Event  │
│11:00 AM  │ Conferences              │    (Blue Meeting) │
│          │ Room 205                 │                   │
│          └──────────────────────────┘                   │
│12:00 PM  ┌──────────────────────────┐                   │
│          │ 🟢 Lesson Planning       │ ← Preparation     │
│ 1:00 PM  │                          │    (Green)        │
│          └──────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

#### Student Calendar:
```
┌─────────────────────────────────────────────────────────┐
│  Friday, Oct 18, 2025    [B Day]                        │
├─────────────────────────────────────────────────────────┤
│ 1:00 PM  ┌──────────────────────────┐                   │
│          │ 🟦 Chemistry Lab         │ ← Class (Blue)    │
│ 2:00 PM  │ Lab 5                    │                   │
│          └──────────────────────────┘                   │
│ 3:00 PM  ┌──────────────────────────┐                   │
│          │ 🟪 Math Study Group      │ ← Personal Event  │
│ 4:00 PM  │ Library                  │    (Purple Study) │
│          └──────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow Diagram

```
User Opens Calendar
        ↓
Clicks Empty Time Slot
        ↓
Modal Opens
├─ Date/Time Info Displayed
├─ Form Fields Empty
└─ Title Field Focused
        ↓
User Fills Form
├─ Types Event Title
├─ Selects Event Type
│  └─ Color Updates Automatically
├─ Enters Location (Optional)
└─ Adds Description (Optional)
        ↓
User Clicks "Add Event"
        ↓
Validation Check
├─ Title Required? ✓
└─ Other Fields Optional
        ↓
Event Created
├─ Modal Closes
├─ Form Resets
└─ Event Appears on Calendar
        ↓
Event Displayed
├─ Correct Color
├─ Correct Time
└─ Shows Title
```

---

## 💡 Design Highlights

### Information Hierarchy:
```
1. Modal Title          → Largest (24px)
2. Date/Time Banner     → Medium (14px, in banner)
3. Field Labels         → Medium (weight: 600)
4. Input Text           → Standard (15px)
5. Helper Text          → Small (13px)
```

### Color Usage:
```
Primary Text:    #2c3e50 (Dark blue-gray)
Secondary Text:  #7f8c8d (Medium gray)
Border Default:  #e1e8ed (Light gray)
Border Focus:    #3498db (Blue)
Background:      #ffffff (White)
Overlay:         rgba(0,0,0,0.5) (50% black)
```

### Spacing:
```
Modal Padding:       32px
Field Margin:        20px bottom
Input Padding:       12px
Button Padding:      12px 24px
Gap Between:         12px
```

---

## 📱 Responsive Behavior

### Desktop (>500px):
```
Modal Width: 500px (max)
All fields: Full width
Buttons: Right-aligned
Text: Standard size
```

### Mobile (<500px):
```
Modal Width: 90% of viewport
All fields: Full width
Buttons: Full width or stacked
Text: Slightly smaller
Touch targets: Larger
```

---

## ✨ Animation States

### Modal Open:
```
Backdrop:  Fade in (0 → 0.5 opacity)
Content:   Scale up (0.95 → 1.0)
           Fade in (0 → 1 opacity)
Duration:  200ms ease-out
```

### Button Hover:
```
Transform: Scale (1.0 → 1.02)
Shadow:    Increase depth
Duration:  200ms ease
```

### Input Focus:
```
Border:    Color change (#e1e8ed → #3498db)
Duration:  200ms ease
```

---

## 🎨 Event Color Preview

### Color Badge Display:
```
Default State:
┌────┐
│ 🟪 │ Event color
└────┘
  ↑
20x20px square
4px border radius
Matches selected type
```

### Live Update:
```
User Selects "Meeting"
    ↓
Color Badge Updates
    ↓
┌────┐
│ 🟦 │ Event color  ← Now blue
└────┘
```

---

## 🎯 Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Visual Design** | Plain alert | Modern modal |
| **Information** | Title only | Title + 4 fields |
| **Context** | None | Date/time shown |
| **Categorization** | None | 5-6 types |
| **Colors** | Fixed | Dynamic |
| **Validation** | None | Form validation |
| **UX** | Basic | Professional |
| **Cancelable** | No | Yes |
| **Preview** | No | Color badge |

---

Last Updated: October 16, 2025
