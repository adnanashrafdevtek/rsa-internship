import React, { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";



export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [studentsForGrade, setStudentsForGrade] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    grade_level: '',
    teacher_id: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    recurring_days: [],
  });
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showEditRecurring, setShowEditRecurring] = useState(false);
  const [showAddStudentsFor, setShowAddStudentsFor] = useState(null);
  const [addStudentsLoading, setAddStudentsLoading] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const navigate = useNavigate();
  const API_BASE_URL = "http://3.143.57.120:3000";
  // Role-based fetch: admin sees all, teacher sees their classes, student sees their classes
  const fetchClasses = () => {
    setLoading(true);
    let url = `${API_BASE_URL}/api/classes`;
    
    // Determine the URL based on user role
    if (user) {
      if (user.role === "student") {
        url = `${API_BASE_URL}/api/students/${user.id}/classes`;
      } else if (user.role === "teacher") {
        url = `${API_BASE_URL}/api/teachers/${user.id}/classes`;
      }
      // For admin, keep the default /api/classes URL
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching classes:', err);
        setLoading(false);
      });
  };

  const fetchTeachers = () => {
    fetch(`${API_BASE_URL}/api/teachers`)
      .then(res => res.json())
      .then(data => {
        setTeachers(data);
      });
  };

  const fetchStudentsByGrade = async (grade) => {
    if (!grade) return setStudentsForGrade([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/grade/${grade}`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudentsForGrade(data);
    } catch {
      setStudentsForGrade([]);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      if (!res.ok) throw new Error();
      setAllStudents(await res.json());
    } catch {
      setAllStudents([]);
    }
  };

  useEffect(() => {
  if (user) {
    fetchClasses();
    fetchTeachers();
    fetchAllStudents();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);

  const startEditing = (cls) => {
    setEditingId(cls.id);
    setEditForm({
      name: cls.name || '',
      grade_level: cls.grade_level || '',
      // Always preserve the teacher_id as a number (never empty string)
      teacher_id: (cls.teacher_id !== undefined && cls.teacher_id !== null) ? cls.teacher_id : (user && user.role === 'teacher' ? user.id : ''),
      start_date: cls.start_time?.slice(0, 10) || '',
      start_time: cls.start_time?.slice(11, 16) || '',
      end_date: cls.end_time?.slice(0, 10) || '',
      end_time: cls.end_time?.slice(11, 16) || '',
      recurring_days: cls.recurring_days ? cls.recurring_days.split(',') : [],
    });
    setShowEditRecurring(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
    setShowEditRecurring(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleAddRecurringDay = (day) => {
    setAddForm(prev => {
      const current = prev.recurring_days;
      if (current.includes(day)) {
        return { ...prev, recurring_days: current.filter(d => d !== day) };
      } else {
        return { ...prev, recurring_days: [...current, day] };
      }
    });
  };

  const toggleEditRecurringDay = (day) => {
    setEditForm(prev => {
      const current = prev.recurring_days;
      if (current.includes(day)) {
        return { ...prev, recurring_days: current.filter(d => d !== day) };
      } else {
        return { ...prev, recurring_days: [...current, day] };
      }
    });
  };

  const combineLocalDatetime = (date, time) => {
    if (!date || !time) return null;
    return `${date} ${time}:00`;
  };

  const to12HourTime = (time24) => {
    if (!time24) return '';
    const [hourStr, min] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${min} ${ampm}`;
  };

  const formatDateTime = (dt) => {
    if (!dt) return '';

    const date = dt.slice(0, 10);
    const time24 = dt.slice(11, 16);

    const isValidDate = date && date !== '0000-00-00' && date !== '1970-01-01';
    const isValidTime = time24 && time24 !== '00:00';

    if (!isValidDate && isValidTime) {
      return to12HourTime(time24);
    }

    if (isValidDate && isValidTime) {
      return `${date} ${to12HourTime(time24)}`;
    }

    if (isValidDate && !isValidTime) {
      return date;
    }

    return '';
  };

  // Helper to format only time in 12-hour format
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

  const saveStudentsToClass = async () => {
    if (!showAddStudentsFor || selectedStudentIds.length === 0) return alert('Select a class and students first');

    try {
      for (const student_id of selectedStudentIds) {
        const res = await fetch(`${API_BASE_URL}/api/classes/${showAddStudentsFor}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to add student');
        }
      }
      alert('Students added successfully');
      setShowAddStudentsFor(null);
      setSelectedStudentIds([]);
      fetchClasses();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      const startDatetime = combineLocalDatetime(editForm.start_date, editForm.start_time);
      const endDatetime = combineLocalDatetime(editForm.end_date, editForm.end_time);
      // Always send a valid teacher_id (never empty string)
      let teacherIdToSend = editForm.teacher_id;
      if (!teacherIdToSend && user && user.role === 'teacher') {
        teacherIdToSend = user.id;
      }
      // If still empty, fallback to original class teacher_id (shouldn't happen)
      if (!teacherIdToSend) {
        const original = classes.find(c => c.id === editingId);
        teacherIdToSend = original ? original.teacher_id : '';
      }
      const res = await fetch(`${API_BASE_URL}/api/classes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          grade_level: editForm.grade_level,
          teacher_id: teacherIdToSend,
          start_time: startDatetime,
          end_time: endDatetime,
          recurring_days: editForm.recurring_days.join(','),
        }),
      });

      if (!res.ok) throw new Error('Failed to update class');
      setEditingId(null);
      fetchClasses();
    } catch (err) {
      alert(err.message);
    }
  };

  const addClass = async () => {
    try {
      const startDatetime = combineLocalDatetime(addForm.start_date, addForm.start_time);
      const endDatetime = combineLocalDatetime(addForm.end_date, addForm.end_time);

      const res = await fetch(`${API_BASE_URL}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          grade_level: addForm.grade_level,
          teacher_id: addForm.teacher_id,
          start_time: startDatetime,
          end_time: endDatetime,
          recurring_days: addForm.recurring_days.join(','),
        }),
      });

      if (!res.ok) throw new Error('Failed to add class');

      setAddForm({
        name: '',
        grade_level: '',
        teacher_id: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        recurring_days: [],
      });
      setShowAddForm(false);
      setShowAddRecurring(false);
      fetchClasses();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/classes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete class');
      setEditingId(null);
      fetchClasses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAddStudents = async (cls) => {
    setAddStudentsLoading(true);
    setSelectedStudentIds([]);
    setShowAllStudents(false);
    fetchStudentsByGrade(cls.grade_level);
    try {
      const res = await fetch(`${API_BASE_URL}/api/classes/${cls.id}/students`);
      let students = [];
      if (res.ok) {
        students = await res.json();
      }
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, students } : c));
    } catch {}
    setShowAddStudentsFor(cls.id);
    setAddStudentsLoading(false);
  };
  const handleToggleShowAllStudents = () => {
    const next = !showAllStudents;
    setShowAllStudents(next);
    setSelectedStudentIds([]);
    if (!next && showAddStudentsFor) {
      const cls = classes.find(c => c.id === showAddStudentsFor);
      if (cls) fetchStudentsByGrade(cls.grade_level);
    }
  };


  // Role helpers (robust to whitespace/case)
  const getRole = u => (u && u.role ? u.role.trim().toLowerCase() : "");
  const isStudent = getRole(user) === "student";
  const isAdmin = getRole(user) === "admin";

  if (!user) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <div style={{ padding: '40px' }}>
          <p>Loading...</p>
        </div>
      </SidebarLayout>
    );
  }

  // Student UI: Card layout (improved look)
  if (isStudent) {
    return (
      <SidebarLayout onLogout={handleLogout}>
        <div style={{
          padding: '32px 16px 32px 16px',
          background: 'linear-gradient(120deg, #e3f0ff 0%, #f9f9fb 100%)',
          minHeight: '100vh',
          marginLeft: 300
        }}>
          <h1 style={{
            marginBottom: 20,
            color: '#1a237e',
            fontWeight: 800,
            letterSpacing: 0.5,
            fontSize: 32
          }}>
            My Classes
          </h1>
          <p style={{
            fontSize: 16,
            color: '#3949ab',
            marginBottom: 24,
            fontWeight: 500
          }}>
            These are your classes. Click a class to see the roster, teacher, and more details.
          </p>
          {loading ? (
            <p>Loading classes...</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 18,
                alignItems: 'stretch',
                justifyItems: 'center',
                width: '100%',
                maxWidth: 1400,
                margin: '0 auto',
              }}
            >
              {classes.length === 0 && (
                <div style={{
                  fontSize: 18,
                  color: '#888',
                  marginTop: 40,
                  textAlign: 'center',
                  gridColumn: '1/-1'
                }}>
                  No classes found.
                </div>
              )}
              {classes.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9fb 100%)',
                    borderRadius: 14,
                    boxShadow: '0 2px 10px 0 rgba(30, 64, 175, 0.10)',
                    padding: '18px 18px 14px 18px',
                    minWidth: 0,
                    width: '100%',
                    maxWidth: 260,
                    marginBottom: 0,
                    border: '1px solid #e3e8f0',
                    position: 'relative',
                    transition: 'box-shadow 0.18s, transform 0.18s',
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                  }}
                  tabIndex={0}
                  onClick={() => navigate(`/rosters/${c.id}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/rosters/${c.id}`);
                    }
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(30, 64, 175, 0.16)';
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.012)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.boxShadow = '0 2px 10px 0 rgba(30, 64, 175, 0.10)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{
                    color: '#1565c0',
                    fontWeight: 800,
                    fontSize: 20,
                    textDecoration: 'none',
                    marginBottom: 6,
                    display: 'inline-block',
                    letterSpacing: 0.2,
                    transition: 'color 0.15s',
                    textShadow: '0 1px 0 #fff',
                    wordBreak: 'break-word',
                  }}>
                    {c.name}
                  </span>
                  <div style={{ margin: '10px 0 0 0', fontSize: 14 }}>
                    <span style={{ fontWeight: 600, color: '#3949ab' }}>Time:</span>{' '}
                    <span style={{ color: '#1976d2', fontWeight: 700 }}>
                      {formatTimeOnly(c.start_time)}
                    </span>
                    {' '}<span style={{ color: '#b0bec5' }}>to</span>{' '}
                    <span style={{ color: '#1976d2', fontWeight: 700 }}>
                      {formatTimeOnly(c.end_time)}
                    </span>
                  </div>
                  <div style={{ margin: '10px 0 0 0', fontSize: 14 }}>
                    <span style={{ fontWeight: 600, color: '#3949ab' }}>Recurring:</span>{' '}
                    {c.recurring_days
                      ? (
                        <span>
                          {c.recurring_days.split(',').map(day => (
                            <span
                              key={day}
                              style={{
                                display: 'inline-block',
                                background: '#e8f5e9',
                                color: '#388e3c',
                                borderRadius: 8,
                                padding: '2px 9px',
                                marginRight: 5,
                                fontSize: 12,
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
                  <div style={{ marginTop: 10, fontSize: 13, color: '#333', fontWeight: 500 }}>
                    <span style={{ color: '#3949ab', fontWeight: 600 }}>Teacher:</span>{' '}
                    {c.teacher_first_name && c.teacher_last_name
                      ? `${c.teacher_first_name} ${c.teacher_last_name}`
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarLayout>
    );
  }

  // Admin and Teacher UI: same permissions, but teacher only sees their classes
  return (
    <SidebarLayout onLogout={handleLogout}>
      <div style={{ padding: '40px' }}>
        <h1 style={{ marginBottom: 20 }}>Class List</h1>
        <p style={{
          fontSize: 17,
          color: '#3949ab',
          marginBottom: 18,
          fontWeight: 500
        }}>
          These are your classes. <b>Click the name of a class</b> to see the roster. You can also edit or manage classes using the buttons in the Actions column.{isAdmin && ' As an admin, you can add new classes.'}
        </p>
        {loading ? (
          <p>Loading classes...</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: '#eee' }}>
                  <th style={thStyle}>Class Name</th>
                  <th style={thStyle}>Grade</th>
                  <th style={thStyle}>Teacher</th>
                  <th style={thStyle}>Start Time</th>
                  <th style={thStyle}>End Time</th>
                  <th style={thStyle}>Recurring Days</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c =>
                  (editingId === c.id) ? (
                    <tr
                      key={c.id}
                      style={{
                        background: 'linear-gradient(90deg, #e3f0ff 0%, #f9f9fb 100%)',
                        borderRadius: 16,
                        boxShadow: '0 2px 12px 0 rgba(30, 64, 175, 0.10)',
                        transition: 'box-shadow 0.18s, transform 0.18s',
                        outline: 'none',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.boxShadow = '0 6px 24px 0 rgba(30, 64, 175, 0.18)';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.012)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.boxShadow = '0 2px 12px 0 rgba(30, 64, 175, 0.10)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        <input name="name" value={editForm.name} onChange={handleEditChange} style={{ ...inputStyle, borderRadius: 8, background: '#fff' }} />
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        <select name="grade_level" value={editForm.grade_level} onChange={handleEditChange} style={{ ...inputStyle, borderRadius: 8, background: '#fff' }}>
                          <option value="">Select Grade</option>
                          <option value="Kindergarten">Kindergarten</option>
                          <option value="1">1st Grade</option>
                          <option value="2">2nd Grade</option>
                          <option value="3">3rd Grade</option>
                          <option value="4">4th Grade</option>
                          <option value="5">5th Grade</option>
                          <option value="6">6th Grade</option>
                          <option value="7">7th Grade</option>
                          <option value="8">8th Grade</option>
                          <option value="9">9th Grade</option>
                          <option value="10">10th Grade</option>
                          <option value="11">11th Grade</option>
                          <option value="12">12th Grade</option>
                        </select>
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        {/* Teacher cannot edit teacher field, admin can */}
                        {isAdmin ? (
                          <select name="teacher_id" value={editForm.teacher_id} onChange={handleEditChange} style={{ ...inputStyle, borderRadius: 8, background: '#fff' }}>
                            <option value="">Select Teacher</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.first_name} {t.last_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={(() => {
                              const t = teachers.find(t => t.id === Number(editForm.teacher_id));
                              return t ? `${t.first_name} ${t.last_name}` : 'N/A';
                            })()}
                            disabled
                            style={{ ...inputStyle, borderRadius: 8, backgroundColor: '#f5f5f5', color: '#888', fontStyle: 'italic' }}
                          />
                        )}
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        <input
                          name="start_date"
                          type="date"
                          value={editForm.start_date}
                          onChange={handleEditChange}
                          style={{ ...inputStyle, borderRadius: 8, marginBottom: 6, background: '#fff' }}
                        />
                        <input
                          name="start_time"
                          type="time"
                          value={editForm.start_time}
                          onChange={handleEditChange}
                          style={{ ...inputStyle, borderRadius: 8, background: '#fff' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        <input
                          name="end_date"
                          type="date"
                          value={editForm.end_date}
                          onChange={handleEditChange}
                          style={{ ...inputStyle, borderRadius: 8, marginBottom: 6, background: '#fff' }}
                        />
                        <input
                          name="end_time"
                          type="time"
                          value={editForm.end_time}
                          onChange={handleEditChange}
                          style={{ ...inputStyle, borderRadius: 8, background: '#fff' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            onClick={() => setShowEditRecurring(prev => (prev === c.id ? false : c.id))}
                            style={{
                              ...editButtonStyle,
                              minWidth: 90,
                              background: '#4caf50',
                              color: '#fff',
                              borderRadius: 8,
                              fontWeight: 600,
                              boxShadow: '0 1px 4px rgba(76,175,80,0.08)',
                              transition: 'all 0.18s',
                              marginBottom: 6
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#388e3c'}
                            onMouseOut={e => e.currentTarget.style.background = '#4caf50'}
                          >
                            {editForm.recurring_days.length > 0
                              ? editForm.recurring_days.join(', ')
                              : 'Select days'}
                          </button>
                          {showEditRecurring === c.id && (
                            <div style={submenuStyle}>
                              {daysOfWeek.map(day => (
                                <label key={day} style={{ display: 'block', cursor: 'pointer', padding: '4px 8px' }}>
                                  <input
                                    type="checkbox"
                                    checked={editForm.recurring_days.includes(day)}
                                    onChange={() => toggleEditRecurringDay(day)}
                                  />{' '}
                                  {day}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent', minWidth: 260 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          <button onClick={saveEdit} style={{ ...saveBtnStyle, borderRadius: 8, fontWeight: 600, boxShadow: '0 1px 4px rgba(33,150,243,0.08)', transition: 'all 0.18s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#1565c0'}
                            onMouseOut={e => e.currentTarget.style.background = '#2196f3'}>
                            Save
                          </button>
                          <button onClick={cancelEditing} style={{ ...cancelBtnStyle, borderRadius: 8, fontWeight: 600, boxShadow: '0 1px 4px rgba(244,67,54,0.08)', transition: 'all 0.18s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#b71c1c'}
                            onMouseOut={e => e.currentTarget.style.background = '#f44336'}>
                            Cancel
                          </button>
                          <button onClick={() => deleteClass(c.id)} style={{ ...deleteBtnStyle, borderRadius: 8, fontWeight: 600, boxShadow: '0 1px 4px rgba(211,47,47,0.08)', transition: 'all 0.18s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#b71c1c'}
                            onMouseOut={e => e.currentTarget.style.background = '#d32f2f'}>
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              if (showAddStudentsFor === c.id) {
                                setShowAddStudentsFor(null);
                              } else {
                                handleOpenAddStudents(c);
                              }
                            }}
                            style={{
                              ...editButtonStyle,
                              backgroundColor: '#ff9800',
                              color: '#fff',
                              borderRadius: 8,
                              fontWeight: 600,
                              boxShadow: '0 1px 4px rgba(255,152,0,0.08)',
                              transition: 'all 0.18s',
                              marginLeft: 0
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#f57c00'}
                            onMouseOut={e => e.currentTarget.style.background = '#ff9800'}
                          >
                            Add Students
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={c.id}
                      style={{
                        background: 'linear-gradient(90deg, #f9f9fb 0%, #e3f0ff 100%)',
                        borderRadius: 16,
                        boxShadow: '0 1px 6px 0 rgba(30, 64, 175, 0.07)',
                        transition: 'box-shadow 0.18s, transform 0.18s',
                        outline: 'none',
                        position: 'relative',
                        zIndex: 1
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.boxShadow = '0 6px 24px 0 rgba(30, 64, 175, 0.13)';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.008)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.boxShadow = '0 1px 6px 0 rgba(30, 64, 175, 0.07)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        <Link to={`/rosters/${c.id}`} style={{ color: '#2196f3', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                          {c.name}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>{c.grade_level}</td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>
                        {c.teacher_first_name && c.teacher_last_name
                          ? `${c.teacher_first_name} ${c.teacher_last_name}`
                          : 'N/A'}
                      </td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>{formatDateTime(c.start_time)}</td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>{formatDateTime(c.end_time)}</td>
                      <td style={{ ...tdStyle, background: 'transparent' }}>{c.recurring_days ? c.recurring_days : '—'}</td>
                      <td style={{ ...tdStyle, background: 'transparent', minWidth: 180 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          <button onClick={() => startEditing(c)} style={{ ...editButtonStyle, borderRadius: 8, fontWeight: 600, boxShadow: '0 1px 4px rgba(76,175,80,0.08)', transition: 'all 0.18s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#1565c0'}
                            onMouseOut={e => e.currentTarget.style.background = '#4caf50'}>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (showAddStudentsFor === c.id) {
                                setShowAddStudentsFor(null);
                              } else {
                                handleOpenAddStudents(c);
                              }
                            }}
                            style={{ ...editButtonStyle, backgroundColor: '#ff9800', borderRadius: 8, fontWeight: 600, boxShadow: '0 1px 4px rgba(255,152,0,0.08)', transition: 'all 0.18s', marginLeft: 0 }}
                            onMouseOver={e => e.currentTarget.style.background = '#f57c00'}
                            onMouseOut={e => e.currentTarget.style.background = '#ff9800'}
                          >
                            Add Students
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}

                {showAddStudentsFor && (
                  <tr>
                    <td colSpan={7} style={{ padding: 12, background: '#fff8e1' }}>
                      {(() => {
                        const currentClass = classes.find(c => c.id === showAddStudentsFor);
                        if (!currentClass || !currentClass.students) {
                          return <div style={{ color: '#888', fontSize: 15, padding: 8 }}>Loading students...</div>;
                        }
                        return (
                          <>
                            <label style={{ display: 'block', marginBottom: 8 }}>
                              <input
                                type="checkbox"
                                checked={showAllStudents}
                                onChange={handleToggleShowAllStudents}
                                style={{ marginRight: 6 }}
                              />
                              Show All Students
                            </label>
                            <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8 }}>
                              {(() => {
                                const alreadyInClassIds = currentClass.students.map(s => s.id);
                                const availableStudents = (showAllStudents ? allStudents : studentsForGrade)
                                  .filter(s => !alreadyInClassIds.includes(s.id));
                                if (availableStudents.length === 0) {
                                  return <div style={{ color: '#888', fontSize: 15, padding: 8 }}>All students are already in this class.</div>;
                                }
                                return availableStudents.map(s => (
                                  <label
                                    key={s.id}
                                    style={{ display: 'block', cursor: 'pointer', padding: '4px 8px' }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedStudentIds.includes(s.id)}
                                      onChange={() => {
                                        setSelectedStudentIds(prev =>
                                          prev.includes(s.id)
                                            ? prev.filter(id => id !== s.id)
                                            : [...prev, s.id]
                                        );
                                      }}
                                      style={{ marginRight: 6 }}
                                    />
                                    {s.first_name} {s.last_name} (Grade {s.grade_level})
                                  </label>
                                ));
                              })()}
                            </div>
                            <div style={{ marginTop: 12 }}>
                              <button onClick={saveStudentsToClass} style={{ ...saveBtnStyle, marginRight: 8 }}>
                                Save Students
                              </button>
                              <button
                                onClick={() => setShowAddStudentsFor(null)}
                                style={cancelBtnStyle}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {isAdmin && (!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} style={addNewBtnStyle}>
                + Add New Class
              </button>
            ) : (
              <div style={addFormContainer}>
                <h3 style={{ marginBottom: 12 }}>Add New Class</h3>
                <div style={formRowStyle}>
                  <label style={{ ...labelStyle, width: 'auto' }}>Name:</label>
                  <input name="name" value={addForm.name} onChange={handleAddChange} type="text" style={inputStyle} />
                </div>
                <div style={formRowStyle}>
                  <label style={{ ...labelStyle, width: 'auto' }}>Grade Level:</label>
                  <select name="grade_level" value={addForm.grade_level} onChange={handleAddChange} style={inputStyle}>
                    <option value="">Select Grade</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                    <option value="4">4th Grade</option>
                    <option value="5">5th Grade</option>
                    <option value="6">6th Grade</option>
                    <option value="7">7th Grade</option>
                    <option value="8">8th Grade</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                  </select>
                </div>
                <div style={formRowStyle}>
                  <label style={{ ...labelStyle, width: 'auto' }}>Teacher:</label>
                  <select name="teacher_id" value={addForm.teacher_id} onChange={handleAddChange} style={inputStyle}>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={formRowStyle}>
                  <label style={{ ...labelStyle, width: 'auto' }}>Start Date/Time:</label>
                  <input name="start_date" type="date" value={addForm.start_date} onChange={handleAddChange} style={inputStyle} />
                  <input name="start_time" type="time" value={addForm.start_time} onChange={handleAddChange} style={inputStyle} />
                </div>
                <div style={formRowStyle}>
                  <label style={{ ...labelStyle, width: 'auto' }}>End Date/Time:</label>
                  <input name="end_date" type="date" value={addForm.end_date} onChange={handleAddChange} style={inputStyle} />
                  <input name="end_time" type="time" value={addForm.end_time} onChange={handleAddChange} style={inputStyle} />
                </div>
                <div style={{ ...formRowStyle, alignItems: 'flex-start' }}>
                  <label style={labelStyle}>Recurring Days:</label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: 4,
                      border: '1px solid #ccc',
                      padding: 4,
                      borderRadius: 4
                    }}
                  >
                    {daysOfWeek.map(day => (
                      <label
                        key={day}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 4,
                          border: '1px solid #aaa',
                          fontSize: 12
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={addForm.recurring_days.includes(day)}
                          onChange={() => toggleAddRecurringDay(day)}
                          style={{ marginRight: 4 }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={addClass} style={saveBtnStyle}>
                    Save Class
                  </button>{' '}
                  <button onClick={() => setShowAddForm(false)} style={cancelBtnStyle}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

// Styles
const thStyle = {
  padding: '10px 6px',
  borderBottom: '2px solid #ccc',
  textAlign: 'left',
};

const tdStyle = {
  padding: '8px 6px',
  borderBottom: '1px solid #eee',
  verticalAlign: 'middle',
};

const inputStyle = {
  width: '100%',
  padding: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};

const editButtonStyle = {
  padding: '6px 10px',
  fontSize: 13,
  cursor: 'pointer',
  backgroundColor: '#4caf50',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
};

const saveBtnStyle = {
  padding: '6px 14px',
  fontSize: 14,
  cursor: 'pointer',
  backgroundColor: '#2196f3',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
};

const cancelBtnStyle = {
  padding: '6px 14px',
  fontSize: 14,
  cursor: 'pointer',
  backgroundColor: '#f44336',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
};

const deleteBtnStyle = {
  padding: '6px 14px',
  fontSize: 14,
  cursor: 'pointer',
  backgroundColor: '#d32f2f',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
};

const addNewBtnStyle = {
  padding: '10px 18px',
  fontSize: 16,
  cursor: 'pointer',
  backgroundColor: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
};

const submenuStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  backgroundColor: '#fff',
  border: '1px solid #ccc',
  borderRadius: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  padding: 8,
  zIndex: 1000,
  width: 120,
};

const addFormContainer = {
  backgroundColor: '#f9f9f9',
  padding: 16,
  borderRadius: 6,
  maxWidth: 500,
};

const formRowStyle = {
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const labelStyle = {
  width: 110,
  fontWeight: 'bold',
  fontSize: 14,
};