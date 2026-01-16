import React, { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
const API_BASE_URL = "http://3.143.57.120:4000";
// Custom Event Modal Component
const EventModal = ({ isOpen, onClose, onSave, slotInfo }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'personal',
    color: '#9b59b6'
  });

  const eventTypes = [
    { value: 'personal', label: 'Personal', color: '#9b59b6' },
    { value: 'meeting', label: 'Meeting', color: '#3498db' },
    { value: 'preparation', label: 'Preparation', color: '#2ecc71' },
    { value: 'office-hours', label: 'Office Hours', color: '#f39c12' },
    { value: 'other', label: 'Other', color: '#95a5a6' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && { color: eventTypes.find(t => t.value === value)?.color || '#9b59b6' })
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
      setFormData({ title: '', description: '', location: '', type: 'personal', color: '#9b59b6' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <h2 style={{ margin: '0 0 24px 0', color: '#2c3e50', fontSize: '24px' }}>
          Add Personal Event
        </h2>
        
        {slotInfo && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#7f8c8d'
          }}>
            <strong>📅 {moment(slotInfo.start).format('dddd, MMMM D, YYYY')}</strong>
            <br />
            <strong>🕒 {moment(slotInfo.start).format('h:mm A')} - {moment(slotInfo.end).format('h:mm A')}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Department Meeting"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Event Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: formData.color
              }} />
              <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Event color</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Conference Room A"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any notes or details..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#7f8c8d',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#3498db',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (user && user.id) {
      fetchSchedule();
    }
  }, [user]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/teachers/${user.id}/schedules`);
      const data = await res.json();
      
      // Map database calendar events directly to calendar format
      const formattedEvents = data.map((item) => {
        // Parse datetime strings
        const startTime = new Date(item.start_time);
        const endTime = new Date(item.end_time);
        
        return {
          id: item.idcalendar,
          title: item.event_title || item.subject || 'Class',
          start: startTime,
          end: endTime,
          resource: {
            subject: item.subject,
            grade: item.grade,
            room: item.room,
            description: item.description,
            teacher_name: `${item.first_name} ${item.last_name}`,
            color: '#3498db'
          },
        };
      });
      
      setEvents(formattedEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setLoading(false);
    }
  };

  const CustomHeader = ({ date, label }) => {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{label}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading schedule...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '32px' }}>
          My Schedule
        </h1>

        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: 'calc(100vh - 200px)'
        }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['week', 'day']}
            defaultView="week"
            min={moment('2024-01-01 06:30:00').toDate()}
            max={moment('2024-01-01 16:00:00').toDate()}
            formats={{
              timeGutterFormat: 'h:mm A',
            }}
            components={{
              week: {
                header: CustomHeader,
              },
              day: {
                header: CustomHeader,
              },
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.resource?.color || '#3498db',
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                fontSize: '13px',
              },
            })}
            selectable
            onSelectSlot={(slotInfo) => {
              setSelectedSlot(slotInfo);
              setShowModal(true);
            }}
          />
        </div>

        <EventModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSlot(null);
          }}
          onSave={(formData) => {
            const newEvent = {
              id: `personal-${Date.now()}`,
              title: formData.title,
              start: selectedSlot.start,
              end: selectedSlot.end,
              resource: {
                isPersonal: true,
                description: formData.description,
                location: formData.location,
                type: formData.type,
                color: formData.color
              }
            };
            setEvents([...events, newEvent]);
          }}
          slotInfo={selectedSlot}
        />
      </div>
    </SidebarLayout>
  );
}
