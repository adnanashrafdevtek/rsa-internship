# How to Resize the Filters Sidebar

## Quick Guide

### Step-by-Step Instructions

1. **Locate the Resize Handle**
   - Look at the **left edge** of the filters sidebar (where it says "Teachers & Availability")
   - The resize area is a 12px wide strip along the entire left edge

2. **Hover Over the Handle**
   - Move your mouse to the left edge of the sidebar
   - When positioned correctly, you'll see:
     - ✅ Cursor changes to **↔** (resize cursor)
     - ✅ Blue border (3px) appears on the left edge
     - ✅ Light blue background appears

3. **Click and Drag**
   - **Click** on the left edge where you see the blue border
   - **Hold the mouse button down**
   - **Drag LEFT** to make the sidebar WIDER
   - **Drag RIGHT** to make the sidebar NARROWER
   - Release when you reach your desired width

## Visual Guide

```
┌─────────────────────────────────────────────────┐
│              Calendar View                      │
│                                                 │
│   [Mon]  [Tue]  [Wed]  [Thu]  [Fri]            │
│    A      B      A      B     A/B              │
│                                                 │
│   ┌──────┬──────┬──────┬──────┬──────┐         │
│   │      │      │      │      │      │         │
│   │Class │Class │      │Class │      │         │
│   │      │      │      │      │      │         │
│   └──────┴──────┴──────┴──────┴──────┘         │
└─────────────────────────────────────────────────┘
         ║
         ║ <- RESIZE HANDLE (12px wide)
         ║    Drag LEFT/RIGHT here
         ║
┌────────╨─────────────────┐
│ ✕   Teachers & Avail.    │ <- Collapse button (top-right)
│                           │
│ [Search teachers...]      │
│                           │
│ ▼ Filter by Grade         │
│   ☐ PreK                  │
│   ☑ K                     │
│   ☐ 1                     │
│                           │
│ ▶ Filter by Room          │
│                           │
│ ▼ Select Teachers         │
│   ☐ Teacher Name          │
│   └─ Availability         │
└───────────────────────────┘
```

## Important Details

### Width Constraints
- **Minimum Width**: 200px (prevents sidebar from being too small)
- **Maximum Width**: 600px (prevents sidebar from taking too much space)
- **Default Width**: 320px (when first opened)

### Drag Direction
- **Drag LEFT** (←) = Make sidebar WIDER (increase width)
- **Drag RIGHT** (→) = Make sidebar NARROWER (decrease width)

### Visual Feedback
When hovering over the resize handle:
- **Border**: Solid blue line (3px) on the left edge
- **Background**: Light blue (10% opacity)
- **Cursor**: ↔ (horizontal resize arrows)

### Tips for Success

1. **Start Small**: Make small movements first to get a feel for the resize
2. **Look for Blue**: The blue highlight shows where to grab
3. **Smooth Movement**: You can drag as slowly or quickly as you want
4. **Release Anywhere**: You can release the mouse button at any point

## Troubleshooting

### "I don't see the resize cursor"
- ✓ Make sure you're hovering over the **left edge** of the sidebar
- ✓ Look for the blue border to appear - that's your target
- ✓ The resize area is 12px wide, so there's a good amount of space to grab

### "The sidebar isn't resizing"
- ✓ Make sure you **click and hold** the mouse button down
- ✓ While holding, drag left or right
- ✓ Don't release until you've moved to your desired width

### "It stops resizing"
- ✓ You've hit the minimum (200px) or maximum (600px) width limit
- ✓ This is by design to keep the layout functional

### "The calendar doesn't adjust"
- ✓ It should! The calendar uses flexbox and auto-adjusts
- ✓ Try refreshing the page if you notice any issues

## Alternative: Collapse Sidebar

If you need maximum calendar space:
1. Click the **✕** button in the top-right corner of the sidebar
2. The sidebar collapses to a small button
3. Click the **☰** button to expand it again

This gives you full control over your workspace layout!
