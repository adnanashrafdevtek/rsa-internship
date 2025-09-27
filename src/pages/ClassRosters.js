import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useParams } from 'react-router-dom';

export default function ClassRosters() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [newStudentId, setNewStudentId] = useState('');

  // Format datetime to readable string with 12hr time
  const formatDateTime = (dt) => {
    if (!dt) return '';
    const dateObj = new Date(dt);
    if (isNaN(dateObj)) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    let dateStr = dateObj.toLocaleDateString(undefined, options);

    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    return `${dateStr} at ${timeStr}`;
  };

  useEffect(() => {
    if (!classId) return;

    // Fetch class details
    fetch(`http://localhost:3000/api/classes/${classId}`)
      .then(res => res.json())
      .then(data => setClassInfo(data))
      .catch(err => console.error('Failed to load class info:', err));

    // Fetch students in this class
    fetch(`http://localhost:3000/api/classes/${classId}/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error('Failed to load students:', err));

    // Fetch all students for adding new ones
    fetch('http://localhost:3000/api/students')
      .then(res => res.json())
      .then(data => setAllStudents(data))
      .catch(err => console.error('Failed to load all students:', err));
  }, [classId]);

  const handleAddStudent = () => {
    if (!newStudentId) return;

    fetch(`http://localhost:3000/api/classes/${classId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: newStudentId }), // <-- fixed key here
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add student');
        setNewStudentId('');
        return fetch(`http://localhost:3000/api/classes/${classId}/students`);
      })
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => alert(err.message));
  };

  const handleRemoveStudent = (studentId) => {
    fetch(`http://localhost:3000/api/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to remove student');
        setStudents(prev => prev.filter(s => s.id !== studentId));
      })
      .catch(err => alert(err.message));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: 24, maxWidth: 900, margin: 'auto' }}>
        <h1 style={{ marginBottom: 16, color: '#333' }}>
          {classInfo ? classInfo.name : 'Loading...'}
        </h1>

        {classInfo && (
          <section
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 20, color: '#444' }}>
              Class Details
            </h2>
            <p><strong>Grade Level:</strong> {classInfo.grade_level}</p>
            <p>
              <strong>Teacher:</strong>{' '}
              {classInfo.teacher_first_name && classInfo.teacher_last_name
                ? `${classInfo.teacher_first_name} ${classInfo.teacher_last_name}`
                : 'N/A'}
            </p>
            <p>
              <strong>Start Time:</strong> {formatDateTime(classInfo.start_time) || 'N/A'}
            </p>
            <p>
              <strong>End Time:</strong> {formatDateTime(classInfo.end_time) || 'N/A'}
            </p>
            <p>
              <strong>Recurring Days:</strong>{' '}
              {classInfo.recurring_days ? classInfo.recurring_days.split(',').join(', ') : 'None'}
            </p>
          </section>
        )}

        <section>
          <h2 style={{ fontSize: 20, marginBottom: 12, color: '#444' }}>
            Students ({students.length})
          </h2>

          {students.length === 0 ? (
            <p>No students enrolled yet.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              <thead style={{ backgroundColor: '#1976d2', color: '#fff' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: 100 }}>Grade</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {student.first_name} {student.last_name}
                    </td>
                    <td style={{ padding: '12px 16px', width: 100 }}>
                      {student.grade_level || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        style={{
                          backgroundColor: '#f44336',
                          border: 'none',
                          borderRadius: 4,
                          color: '#fff',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: 13,
                          transition: 'background-color 0.2s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f44336')}
                        aria-label={`Remove ${student.first_name} ${student.last_name}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div
            style={{
              backgroundColor: '#fff',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)',
              maxWidth: 400,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, color: '#444' }}>
              Add Student
            </h3>
            <select
              value={newStudentId}
              onChange={(e) => setNewStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                fontSize: 16,
                borderRadius: 4,
                border: '1px solid #ccc',
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select a student</option>
              {allStudents
                .filter(s => !students.find(stu => stu.id === s.id)) // avoid duplicates
                .map(student => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddStudent}
              disabled={!newStudentId}
              style={{
                width: '100%',
                padding: 10,
                backgroundColor: newStudentId ? '#1976d2' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 16,
                cursor: newStudentId ? 'pointer' : 'default',
              }}
            >
              Add Student
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
