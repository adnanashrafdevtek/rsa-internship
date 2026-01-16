import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ClassRosters() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [newStudentId, setNewStudentId] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const { user } = useAuth();
  const API_BASE_URL = "http://3.143.57.120:3000";
  // Helper: format only time in 12-hour format
  const formatTimeOnly = (dt) => {
    if (!dt) return '';
    const time24 = dt.slice(11, 16);
    if (!time24) return '';
    const [hourStr, min] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${min} ${ampm}`;
  };

  // Helper: format date and time for admin/teacher view
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
    fetch(`${API_BASE_URL}/api/classes/${classId}`)
      .then(res => res.json())
      .then(data => setClassInfo(data))
      .catch(err => console.error('Failed to load class info:', err));

    // Fetch students in this class
    fetch(`${API_BASE_URL}/api/classes/${classId}/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error('Failed to load students:', err));

    // Fetch all students for adding new ones (admin/teacher only)
    fetch('${API_BASE_URL}/api/students')
      .then(res => res.json())
      .then(data => setAllStudents(data))
      .catch(err => console.error('Failed to load all students:', err));
  }, [classId]);

  // Student UI
  if (user && user.role === 'student') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f6f8fa' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 40, maxWidth: 900, margin: 'auto', marginLeft: 300 }}>
          <h1 style={{ marginBottom: 28, color: '#1a237e', fontWeight: 800, letterSpacing: 0.5 }}>
            {classInfo ? classInfo.name : 'Loading...'}
          </h1>
          {classInfo && (
            <div
              style={{
                background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9fb 100%)',
                borderRadius: 16,
                boxShadow: '0 4px 18px 0 rgba(30, 64, 175, 0.08)',
                padding: '32px 36px 26px 36px',
                marginBottom: 32,
                border: '1px solid #e3e8f0',
                position: 'relative',
                maxWidth: 500,
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#3949ab' }}>Teacher:</span>{' '}
                {classInfo.teacher_first_name && classInfo.teacher_last_name
                  ? `${classInfo.teacher_first_name} ${classInfo.teacher_last_name}`
                  : 'N/A'}
              </div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#3949ab' }}>Grade Level:</span>{' '}
                {classInfo.grade_level}
              </div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#3949ab' }}>Time:</span>{' '}
                <span style={{ color: '#1976d2', fontWeight: 700 }}>
                  {formatTimeOnly(classInfo.start_time)}
                </span>
                {' '}<span style={{ color: '#b0bec5' }}>to</span>{' '}
                <span style={{ color: '#1976d2', fontWeight: 700 }}>
                  {formatTimeOnly(classInfo.end_time)}
                </span>
              </div>
              <div style={{ fontSize: 16 }}>
                <span style={{ fontWeight: 600, color: '#3949ab' }}>Recurring:</span>{' '}
                {classInfo.recurring_days
                  ? (
                    <span>
                      {classInfo.recurring_days.split(',').map(day => (
                        <span
                          key={day}
                          style={{
                            display: 'inline-block',
                            background: '#e8f5e9',
                            color: '#388e3c',
                            borderRadius: 8,
                            padding: '3px 13px',
                            marginRight: 7,
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            boxShadow: '0 1px 3px 0 rgba(56,142,60,0.07)'
                          }}
                        >
                          {day}
                        </span>
                      ))}
                    </span>
                  )
                  : <span style={{ color: '#b0bec5' }}>—</span>
                }
              </div>
            </div>
          )}

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 18px 0 rgba(30, 64, 175, 0.08)',
              padding: '28px 32px 22px 32px',
              maxWidth: 600,
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: '#3949ab', marginBottom: 18 }}>
              Students ({students.length})
            </div>
            {students.length === 0 ? (
              <div style={{ fontSize: 16, color: '#888' }}>No students enrolled yet.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                {students.map(student => (
                  <div
                    key={student.id}
                    style={{
                      background: '#e3f0ff',
                      borderRadius: 10,
                      padding: '12px 18px',
                      fontSize: 16,
                      color: '#263238',
                      fontWeight: 600,
                      minWidth: 180,
                      marginBottom: 8,
                      boxShadow: '0 1px 4px 0 rgba(30, 64, 175, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span>
                      {student.first_name} {student.last_name}
                    </span>
                    <span style={{ fontSize: 14, color: '#607d8b', fontWeight: 400 }}>
                      Grade {student.grade_level || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Admin/teacher UI: improved, user-friendly card layout with "Add Student" button
  // Define handlers here so they're available for JSX
  const handleRemoveStudent = (studentId) => {
    fetch(`${API_BASE_URL}/api/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to remove student');
        setStudents(prev => prev.filter(s => s.id !== studentId));
      })
      .catch(err => alert(err.message));
  };

  const handleAddStudent = () => {
    if (!newStudentId) return;

    fetch(`${API_BASE_URL}/api/classes/${classId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: newStudentId }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add student');
        setNewStudentId('');
        return fetch(`${API_BASE_URL}/api/classes/${classId}/students`);
      })
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => alert(err.message));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(120deg, #f6f8fa 60%, #e3f0ff 100%)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, maxWidth: 900, margin: 'auto', marginLeft: 300 }}>
        <h1 style={{
          marginBottom: 28,
          color: '#1a237e',
          fontWeight: 900,
          letterSpacing: 0.5,
          fontSize: 32,
          textShadow: '0 2px 8px rgba(30,64,175,0.06)'
        }}>
          {classInfo ? classInfo.name : 'Loading...'}
        </h1>
        {classInfo && (
          <div
            style={{
              background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9fb 100%)',
              borderRadius: 18,
              boxShadow: '0 6px 24px 0 rgba(30, 64, 175, 0.10)',
              padding: '32px 36px 26px 36px',
              marginBottom: 36,
              border: '1px solid #e3e8f0',
              position: 'relative',
              maxWidth: 540,
              transition: 'box-shadow 0.2s',
            }}
          >
            <div style={{ fontSize: 17, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#3949ab' }}>Teacher:</span>{' '}
              <span style={{ color: '#263238', fontWeight: 600 }}>
                {classInfo.teacher_first_name && classInfo.teacher_last_name
                  ? `${classInfo.teacher_first_name} ${classInfo.teacher_last_name}`
                  : 'N/A'}
              </span>
            </div>
            <div style={{ fontSize: 17, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#3949ab' }}>Grade Level:</span>{' '}
              <span style={{ color: '#263238', fontWeight: 600 }}>{classInfo.grade_level}</span>
            </div>
            <div style={{ fontSize: 17, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#3949ab' }}>Time:</span>{' '}
              <span style={{ color: '#1976d2', fontWeight: 700 }}>
                {formatTimeOnly(classInfo.start_time)}
              </span>
              {' '}<span style={{ color: '#b0bec5' }}>to</span>{' '}
              <span style={{ color: '#1976d2', fontWeight: 700 }}>
                {formatTimeOnly(classInfo.end_time)}
              </span>
            </div>
            <div style={{ fontSize: 17 }}>
              <span style={{ fontWeight: 700, color: '#3949ab' }}>Recurring:</span>{' '}
              {classInfo.recurring_days
                ? (
                  <span>
                    {classInfo.recurring_days.split(',').map(day => (
                      <span
                        key={day}
                        style={{
                          display: 'inline-block',
                          background: '#e8f5e9',
                          color: '#388e3c',
                          borderRadius: 8,
                          padding: '3px 13px',
                          marginRight: 7,
                          fontSize: 15,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          boxShadow: '0 1px 3px 0 rgba(56,142,60,0.07)'
                        }}
                      >
                        {day}
                      </span>
                    ))}
                  </span>
                )
                : <span style={{ color: '#b0bec5' }}>—</span>
              }
            </div>
          </div>
        )}

        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 6px 24px 0 rgba(30, 64, 175, 0.10)',
            padding: '32px 36px 80px 36px', // increase bottom padding for button space
            maxWidth: 700,
            marginBottom: 36,
            transition: 'box-shadow 0.2s',
            position: 'relative'
          }}
        >
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#3949ab',
            marginBottom: 22,
            letterSpacing: 0.5
          }}>
            Students ({students.length})
          </div>
          {students.length === 0 ? (
            <div style={{ fontSize: 17, color: '#888', marginBottom: 18 }}>No students enrolled yet.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {students.map(student => (
                <div
                  key={student.id}
                  style={{
                    background: '#e3f0ff',
                    borderRadius: 12,
                    padding: '16px 22px 14px 22px',
                    fontSize: 17,
                    color: '#263238',
                    fontWeight: 700,
                    minWidth: 200,
                    marginBottom: 8,
                    boxShadow: '0 2px 8px 0 rgba(30, 64, 175, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    transition: 'box-shadow 0.18s, transform 0.18s',
                  }}
                >
                  <span>
                    {student.first_name} {student.last_name}
                  </span>
                  <span style={{ fontSize: 15, color: '#607d8b', fontWeight: 500 }}>
                    Grade {student.grade_level || 'N/A'}
                  </span>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      style={{
                        backgroundColor: '#f44336',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        padding: '4px 14px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: 14,
                        boxShadow: '0 1px 4px 0 rgba(244,67,54,0.08)',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                      onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f44336')}
                      aria-label={`Remove ${student.first_name} ${student.last_name}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Student Button and Form */}
          {!showAddStudent ? (
            <div style={{
              position: 'absolute',
              left: 36,
              bottom: 24, // move button lower
              textAlign: 'left'
            }}>
              <button
                onClick={() => setShowAddStudent(true)}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px 0 rgba(25,118,210,0.08)',
                  letterSpacing: 0.5
                }}
              >
                + Add Student
              </button>
            </div>
          ) : (
            <div
              style={{
                background: '#f6f8fa',
                padding: 18,
                borderRadius: 10,
                boxShadow: '0 1px 4px rgb(30 64 175 / 0.06)',
                maxWidth: 420,
                marginTop: 32,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 18, color: '#3949ab', fontWeight: 700 }}>
                Add Student
              </h3>
              <select
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 16,
                  borderRadius: 6,
                  border: '1px solid #b0bec5',
                  marginBottom: 14,
                  boxSizing: 'border-box',
                  background: '#fff'
                }}
              >
                <option value="">Select a student</option>
                {allStudents
                  .filter(s => !students.find(stu => stu.id === s.id))
                  .map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
              </select>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleAddStudent}
                  disabled={!newStudentId}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: newStudentId ? '#1976d2' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: newStudentId ? 'pointer' : 'default',
                    boxShadow: newStudentId ? '0 2px 8px 0 rgba(25,118,210,0.08)' : 'none',
                    letterSpacing: 0.5
                  }}
                >
                  Add Student
                </button>
                <button
                  onClick={() => { setShowAddStudent(false); setNewStudentId(''); }}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: '#b0bec5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: 0.5
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
