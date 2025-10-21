# Backend Endpoint to Add

Add this endpoint to your `index.js` file in the appropriate section (after the other student/class routes):

```javascript
// GET /api/students/:studentId/classes — Get classes for a specific student
app.get('/api/students/:studentId/classes', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const query = `
      SELECT 
        c.id,
        c.name,
        c.grade_level,
        c.start_time,
        c.end_time,
        c.recurring_days,
        u.id AS teacher_id,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        c.name AS subject
      FROM class c
      INNER JOIN student_class sc ON sc.class_id = c.id
      LEFT JOIN user u ON c.teacher_id = u.id
      WHERE sc.user_id = ?
      ORDER BY c.start_time
    `;
    
    const [classes] = await db.query(query, [studentId]);
    
    // Transform class data to match the frontend's expected format
    const formatted = classes.map(cls => ({
      id: cls.id,
      class_id: cls.id,
      subject: cls.subject || cls.name,
      event_title: cls.subject || cls.name,
      grade: cls.grade_level,
      grade_level: cls.grade_level,
      start_time: cls.start_time,
      end_time: cls.end_time,
      recurring_days: cls.recurring_days ? JSON.parse(cls.recurring_days) : [],
      recurringDays: cls.recurring_days ? JSON.parse(cls.recurring_days) : [],
      teacher_id: cls.teacher_id,
      teacher_name: cls.teacher_name,
      teacher: cls.teacher_name,
      teacher_first_name: cls.teacher_first_name,
      teacher_last_name: cls.teacher_last_name,
      room: cls.room || '',
      room_number: cls.room || ''
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student classes' });
  }
});
```

## Where to Add It

Add this endpoint after the existing student/class routes, around line 280-350 in your index.js file, before the `/api/teacher-availabilities` routes.

## What It Does

1. Fetches all classes a student is enrolled in via the `student_class` junction table
2. Joins with the `class` and `user` (teacher) tables to get full class details
3. Returns the data in the format that the frontend expects (with both snake_case and camelCase field names for compatibility)
4. Handles `recurring_days` JSON parsing to convert to arrays
5. Maps field names to match what `generateRecurringEvents()` expects in the frontend

## Database Requirements

Your database needs:
- `class` table with: `id`, `name`, `grade_level`, `start_time`, `end_time`, `recurring_days`, `teacher_id`
- `student_class` table with: `class_id`, `user_id`
- `user` table (already exists)

## Testing

Once you add this endpoint, the student schedule should display their actual classes when they're selected in the Student Schedules tab.
