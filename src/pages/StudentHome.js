import React, { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';

export default function StudentHome() {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [nextBreak, setNextBreak] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && user.id) {
      fetchTodaySchedule();
    }
  }, [user, currentTime]);

  const fetchTodaySchedule = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/${user.id}/classes`);
      const data = await res.json();
      
      const today = moment().format('ddd').toUpperCase();
      const isADay = getABDay() === 'A';
      
      // Filter classes for today
      const todaysClasses = data.filter(cls => {
        if (!cls.recurring_days) return false;
        const days = cls.recurring_days.split(',').map(d => d.trim().toUpperCase());
        
        // Check if class is scheduled for today
        if (days.includes(today)) return true;
        
        // Check for A/B day patterns
        if (isADay && days.includes('A')) return true;
        if (!isADay && days.includes('B')) return true;
        
        return false;
      });

      // Parse and sort by time
      const classesWithTime = todaysClasses.map(cls => {
        const startTime = cls.start_time ? moment(cls.start_time) : null;
        const endTime = cls.end_time ? moment(cls.end_time) : null;
        return { ...cls, startTime, endTime };
      }).filter(cls => cls.startTime && cls.endTime)
        .sort((a, b) => a.startTime - b.startTime);

      setTodayClasses(classesWithTime);

      // Find next class and next break
      const now = moment();
      let foundNext = null;
      let foundBreak = null;

      for (let i = 0; i < classesWithTime.length; i++) {
        const cls = classesWithTime[i];
        
        // Check if class is happening now or upcoming
        if (cls.endTime.isAfter(now)) {
          if (!foundNext && cls.startTime.isAfter(now)) {
            foundNext = cls;
          }
          
          // Check for break after this class
          if (i < classesWithTime.length - 1) {
            const nextCls = classesWithTime[i + 1];
            const breakDuration = moment.duration(nextCls.startTime.diff(cls.endTime)).asMinutes();
            
            if (breakDuration > 5 && cls.endTime.isAfter(now)) {
              foundBreak = {
                start: cls.endTime,
                end: nextCls.startTime,
                duration: breakDuration
              };
              break;
            }
          }
        }
      }

      setNextClass(foundNext);
      setNextBreak(foundBreak);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setLoading(false);
    }
  };

  const getABDay = () => {
    const startDate = moment('2024-08-14');
    const today = moment().startOf('day');
    const daysSinceStart = today.diff(startDate, 'days');
    return daysSinceStart % 2 === 0 ? 'A' : 'B';
  };

  const formatTime = (time) => {
    return moment(time).format('h:mm A');
  };

  const getCurrentStatus = (cls) => {
    const now = moment();
    if (now.isBefore(cls.startTime)) {
      const minutesUntil = moment.duration(cls.startTime.diff(now)).asMinutes();
      if (minutesUntil < 60) {
        return { text: `Starts in ${Math.round(minutesUntil)} minutes`, color: '#f39c12' };
      }
      return { text: 'Upcoming', color: '#3498db' };
    } else if (now.isBetween(cls.startTime, cls.endTime)) {
      const minutesLeft = moment.duration(cls.endTime.diff(now)).asMinutes();
      return { text: `In Progress - ${Math.round(minutesLeft)} min left`, color: '#27ae60' };
    } else {
      return { text: 'Completed', color: '#95a5a6' };
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
            Welcome back, {user?.first_name}!
          </h1>
          <p style={{ fontSize: '18px', color: '#7f8c8d' }}>
            {moment().format('dddd, MMMM D, YYYY')} • {getABDay()} Day
          </p>
        </div>

        {/* Quick Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {/* Next Class Card */}
          {nextClass && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '600' }}>
                NEXT CLASS
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {nextClass.class_name}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.95, marginBottom: '8px' }}>
                {formatTime(nextClass.startTime)} - {formatTime(nextClass.endTime)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                📍 Room {nextClass.room_number || 'TBA'}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                👨‍🏫 {nextClass.teacher_name || 'Teacher TBA'}
              </div>
            </div>
          )}

          {/* Next Break Card */}
          {nextBreak && (
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '600' }}>
                NEXT BREAK
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {Math.round(nextBreak.duration)} minutes
              </div>
              <div style={{ fontSize: '16px', opacity: 0.95, marginBottom: '8px' }}>
                {formatTime(nextBreak.start)} - {formatTime(nextBreak.end)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                ☕ Time to recharge
              </div>
            </div>
          )}

          {/* Classes Today Card */}
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '600' }}>
              CLASSES TODAY
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              {todayClasses.length}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              📚 Scheduled for {getABDay()} Day
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '24px' }}>
            Today's Schedule
          </h2>

          {todayClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <p style={{ fontSize: '18px' }}>No classes scheduled for today</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Enjoy your day off! 🎉</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {todayClasses.map((cls, index) => {
                const status = getCurrentStatus(cls);
                const now = moment();
                const isActive = now.isBetween(cls.startTime, cls.endTime);

                return (
                  <div
                    key={index}
                    style={{
                      border: isActive ? '2px solid #27ae60' : '1px solid #e1e8ed',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: isActive ? '#f0f9f4' : 'white',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '4px',
                        height: '100%',
                        backgroundColor: '#27ae60'
                      }} />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingLeft: isActive ? '16px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                            {cls.class_name}
                          </h3>
                          <span style={{
                            backgroundColor: status.color,
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {status.text}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7f8c8d' }}>
                            <span style={{ fontSize: '18px' }}>🕒</span>
                            <span style={{ fontSize: '15px' }}>
                              {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7f8c8d' }}>
                            <span style={{ fontSize: '18px' }}>📍</span>
                            <span style={{ fontSize: '15px' }}>
                              Room {cls.room_number || 'TBA'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7f8c8d' }}>
                            <span style={{ fontSize: '18px' }}>👨‍🏫</span>
                            <span style={{ fontSize: '15px' }}>
                              {cls.teacher_name || 'Teacher TBA'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#bdc3c7',
                        minWidth: '80px',
                        textAlign: 'right'
                      }}>
                        {formatTime(cls.startTime).split(' ')[0]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
