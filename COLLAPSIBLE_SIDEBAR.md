# Collapsible & Resizable Filters Sidebar

## Overview
The Master Schedule filters sidebar is now **collapsible** and **resizable**, giving users full control over their workspace layout.

## Features

### 1. **Collapse/Expand Sidebar**
- **Collapse Button**: Click the ✕ button in the top-right corner of the sidebar to collapse it
- **Expand Button**: When collapsed, a compact ☰ button appears on the right side - click it to expand the sidebar
- The main calendar automatically adjusts its width when the sidebar is collapsed/expanded

### 2. **Resize Sidebar**
- **Drag to Resize**: Hover over the left edge of the sidebar - the cursor changes to a resize cursor (↔)
- **Wide Drag Area**: 12px wide clickable area on the left edge makes it easy to grab
- **Visual Feedback**: Blue border and light background appear when hovering over the resize handle
- **Min/Max Width**: The sidebar can be resized between 200px and 600px wide
- **Smooth Transition**: The resize is smooth and responsive with real-time updates
- **Calendar Auto-Adjusts**: The main calendar view automatically adjusts its size as you resize the sidebar

### 3. **User Preferences**
- The sidebar width and collapsed state persist during your session
- Customize your workspace layout based on how much screen space you need for filters vs. calendar

## Visual Indicators

### Resize Handle
- **Location**: Left edge of the sidebar (12px wide area)
- **Hover State**: Blue border (3px) and light blue background (10% opacity) when you hover over it
- **Cursor**: Changes to ↔ (east-west resize) cursor
- **Positioning**: Extends 3px outside the sidebar for easy grabbing

### Collapse Button
- **Location**: Top-right corner of the sidebar
- **Icon**: ✕ (close/collapse icon)
- **Tooltip**: "Collapse sidebar"

### Expand Button (when collapsed)
- **Location**: Appears where the sidebar was, on the right side
- **Icon**: ☰ (menu/hamburger icon)
- **Hover Effect**: Blue background when hovered
- **Tooltip**: "Expand filters"

## Usage Tips

### Best Practices
1. **Large Screens**: Keep sidebar expanded at default width (320px) for easy access to all filters
2. **Small Screens**: Collapse the sidebar when you need maximum calendar visibility
3. **Custom Width**: Resize to your preferred width - narrow if you only need to see a few filters, wider if you want to see more teacher details and availability

### Workflow Suggestions
- **Filtering Phase**: Keep sidebar expanded while selecting teachers, grades, and rooms
- **Viewing Phase**: Collapse sidebar once filters are set to maximize calendar view
- **Quick Adjustments**: Use the resize handle to fine-tune the balance between filters and calendar

## Technical Details

### State Management
- `sidebarWidth`: Controls the width of the sidebar (default: 320px)
- `sidebarCollapsed`: Boolean flag for collapsed state
- `isResizing`: Tracks when user is actively resizing the sidebar

### Responsive Behavior
- The calendar container uses flexbox to automatically fill remaining space
- Smooth transitions when collapsing/expanding (0.2s ease)
- No transition during active resize for better performance

### Constraints
- **Minimum Width**: 200px (prevents sidebar from being too narrow)
- **Maximum Width**: 600px (prevents sidebar from taking too much space)
- **Resize Area**: 12px wide strip on the left edge of sidebar (extends 3px beyond edge for easier grabbing)
- **Smart Positioning**: Dynamically calculates position based on actual container layout

## Browser Compatibility
Works in all modern browsers that support:
- CSS Flexbox
- Mouse events (mousedown, mousemove, mouseup)
- CSS transitions

## Future Enhancements
Potential improvements for future versions:
- Save collapsed state and width to localStorage for persistence across sessions
- Keyboard shortcuts (e.g., Ctrl+B to toggle sidebar)
- Touch/mobile support for resize on tablets
- Preset width buttons (Small, Medium, Large)
