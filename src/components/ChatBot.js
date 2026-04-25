import React, { useEffect, useRef, useState } from 'react';
import { sendMessage as sendLangflowMessage } from '../lib/langflowService';
import { getToken } from '../lib/jwt';
import { apiUrl } from '../constants/apiConstants';

const ChatBot = () => {
  const defaultPanelWidth = 280;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const resizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(defaultPanelWidth);

  const scheduleApiBases = [
    process.env.REACT_APP_API_BASE,
    apiUrl,
    'http://localhost:5001',
  ].filter(Boolean);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingRef.current) return;
      const delta = resizeStartXRef.current - e.clientX;
      const nextWidth = Math.min(520, Math.max(280, resizeStartWidthRef.current + delta));
      setPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (e) => {
    resizingRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const appendBotMessage = (type, text) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === type && String(last.text || '').trim() === String(text || '').trim()) {
        return prev;
      }
      return [...prev, { type, text }];
    });
  };

  const isScheduleListRequest = (text) => {
    const normalized = text.toLowerCase();
    return (
      normalized.includes('show all schedules') ||
      normalized.includes('all schedules') ||
      normalized.includes('show schedules') ||
      normalized.includes('view schedules') ||
      normalized.includes('schedule') ||
      normalized.includes('schedules') ||
      normalized.includes('conflict') ||
      normalized.includes('conflicts') ||
      normalized.includes('availability') ||
      normalized.includes('calendar') ||
      normalized === 'schedules' ||
      normalized === 'schedule'
    );
  };

  const isConflictRequest = (text) => {
    const normalized = text.toLowerCase();
    return (
      normalized.includes('conflict') ||
      normalized.includes('conflicts') ||
      normalized.includes('overlap') ||
      normalized.includes('double book') ||
      normalized.includes('double-book') ||
      normalized.includes('scheduling issue')
    );
  };

  const isAuthFollowUpForScheduleRequest = (text) => {
    const normalized = text.toLowerCase();
    const authWords = ['authorization', 'unauthorized', 'login', 'log in', 'logged in', 'token', 'session'];
    return authWords.some((word) => normalized.includes(word));
  };

  const getLastUserMessage = () => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.type === 'user') {
        return String(messages[index].text || '');
      }
    }
    return '';
  };

  const shouldUseDirectScheduleLookup = (text) => {
    if (isScheduleListRequest(text)) {
      return true;
    }

    if (isAuthFollowUpForScheduleRequest(text)) {
      return isScheduleListRequest(getLastUserMessage());
    }

    return false;
  };

  const shouldUseDirectConflictLookup = (text) => {
    if (isConflictRequest(text)) {
      return true;
    }

    if (isAuthFollowUpForScheduleRequest(text)) {
      return isConflictRequest(getLastUserMessage());
    }

    return false;
  };

  const formatScheduleEntry = (item, index) => {
    const title = item.event_title || item.title || item.subject || 'Untitled';
    const teacherName = item.first_name && item.last_name
      ? `${item.first_name} ${item.last_name}`
      : item.teacher || item.teacher_name || (item.user_id ? `Teacher #${item.user_id}` : 'Teacher unknown');
    const room = item.room || item.room_number || 'TBA';
    const grade = item.grade || 'N/A';
    const start = item.start_time || item.start || '';
    const end = item.end_time || item.end || '';
    const timeRange = start && end ? `${start} - ${end}` : 'Time unavailable';

    return `${index + 1}. ${title}\n   Teacher: ${teacherName}\n   Room: ${room}\n   Grade: ${grade}\n   Time: ${timeRange}`;
  };

  const fetchSchedulesData = async () => {
    const token = getToken();
    if (!token) {
      return { ok: false, error: 'Auth token missing. Please log in again.' };
    }

    for (const baseUrl of scheduleApiBases) {
      try {
        const response = await fetch(`${baseUrl}/api/schedules`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        return {
          ok: true,
          schedules: Array.isArray(data) ? data : [],
        };
      } catch (error) {
        continue;
      }
    }

    return { ok: false, error: 'Unable to load schedules right now. Please try again.' };
  };

  const fetchAllSchedules = async () => {
    const result = await fetchSchedulesData();
    if (!result.ok) {
      return result;
    }

    const lines = result.schedules.map((item, index) => formatScheduleEntry(item, index));
    return {
      ok: true,
      text: lines.length
        ? `I found ${lines.length} schedule${lines.length === 1 ? '' : 's'}:\n\n${lines.join('\n\n')}`
        : 'No schedules were found.',
    };
  };

  const detectConflicts = (rawSchedules) => {
    const normalized = rawSchedules
      .map((item) => {
        const start = new Date(item.start_time || item.start);
        const end = new Date(item.end_time || item.end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return null;
        }

        const recurringDay = item.recurring_day !== undefined && item.recurring_day !== null
          ? Number(item.recurring_day)
          : null;

        return {
          id: item.idcalendar || item.id,
          title: item.event_title || item.title || item.subject || 'Untitled',
          teacherId: item.user_id || item.teacher_id || item.teacherId || null,
          teacherName: item.first_name && item.last_name
            ? `${item.first_name} ${item.last_name}`
            : item.teacher || item.teacher_name || 'Unknown teacher',
          room: String(item.room || item.room_number || '').trim(),
          start,
          end,
          dayKey: recurringDay !== null && !Number.isNaN(recurringDay) ? recurringDay : start.getDay(),
        };
      })
      .filter(Boolean);

    const overlaps = (a, b) => a.start < b.end && b.start < a.end;
    const conflicts = [];

    for (let i = 0; i < normalized.length; i += 1) {
      for (let j = i + 1; j < normalized.length; j += 1) {
        const first = normalized[i];
        const second = normalized[j];
        if (first.dayKey !== second.dayKey) continue;
        if (!overlaps(first, second)) continue;

        if (first.teacherId && second.teacherId && String(first.teacherId) === String(second.teacherId)) {
          conflicts.push({
            type: 'Teacher',
            subject: first.teacherName,
            a: first,
            b: second,
          });
        }

        if (first.room && second.room && first.room.toLowerCase() === second.room.toLowerCase()) {
          conflicts.push({
            type: 'Room',
            subject: first.room,
            a: first,
            b: second,
          });
        }
      }
    }

    return conflicts;
  };

  const formatConflictResponse = (conflicts) => {
    if (!conflicts.length) {
      return 'I checked all schedules and found no conflicts.';
    }

    const preview = conflicts.slice(0, 20).map((conflict, index) => {
      const aStart = conflict.a.start.toLocaleString();
      const aEnd = conflict.a.end.toLocaleString();
      const bStart = conflict.b.start.toLocaleString();
      const bEnd = conflict.b.end.toLocaleString();
      return `${index + 1}. ${conflict.type} conflict (${conflict.subject})\n   A: ${conflict.a.title} (${aStart} - ${aEnd})\n   B: ${conflict.b.title} (${bStart} - ${bEnd})`;
    });

    const suffix = conflicts.length > 20 ? `\n\nShowing first 20 of ${conflicts.length} conflicts.` : '';
    return `I found ${conflicts.length} scheduling conflict${conflicts.length === 1 ? '' : 's'}:\n\n${preview.join('\n\n')}${suffix}`;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);

    setLoading(true);

    try {
      if (shouldUseDirectConflictLookup(userMessage)) {
        const result = await fetchSchedulesData();
        if (!result.ok) {
          appendBotMessage('error', result.error || 'Unable to check conflicts right now.');
          return;
        }

        const conflicts = detectConflicts(result.schedules);
        appendBotMessage('bot', formatConflictResponse(conflicts));
        return;
      }

      if (shouldUseDirectScheduleLookup(userMessage)) {
        const scheduleResult = await fetchAllSchedules();
        if (!scheduleResult.ok) {
          appendBotMessage('error', scheduleResult.error || 'Unable to load schedules right now.');
          return;
        }

        appendBotMessage('bot', scheduleResult.text);
        return;
      }

      const result = await sendLangflowMessage(userMessage);

      if (!result.ok) {
        const isAuthError = String(result.error || '').toLowerCase().includes('authorization');
        if (isAuthError && isConflictRequest(getLastUserMessage())) {
          const directConflict = await fetchSchedulesData();
          if (directConflict.ok) {
            const conflicts = detectConflicts(directConflict.schedules);
            appendBotMessage('bot', formatConflictResponse(conflicts));
            return;
          }
        }
        if (isAuthError && isScheduleListRequest(getLastUserMessage())) {
          const scheduleResult = await fetchAllSchedules();
          if (scheduleResult.ok) {
            appendBotMessage('bot', scheduleResult.text);
            return;
          }
        }
        appendBotMessage('error', result.error || 'Unable to send message to Langflow.');
        return;
      }
      appendBotMessage('bot', result.text);
    } catch (err) {
      console.error('Error sending message:', err);
      appendBotMessage('error', `Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat sidebar */}
      <div
        style={{
          width: isCollapsed ? '72px' : `${panelWidth}px`,
          background: '#ffffff',
          color: '#1f2937',
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '12px 8px' : '12px 16px',
            backgroundColor: '#ffffff',
            color: '#111827',
            gap: '8px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>◆</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.02em' }}>ScheduloGPT</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Schedules + planning</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              style={{
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#111827',
                borderRadius: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? '⟵' : '⟶'}
            </button>
          </div>
        </div>

        {isCollapsed ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              style={{
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#111827',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
              }}
              title="Open chat"
            >
              ◆
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Assistant</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>AI chat</div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                background: '#f9fafb',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '24px' }}>
                  <p style={{ margin: 0, fontSize: '15px' }}>Hello. Need help?</p>
                  <p style={{ fontSize: '13px', marginTop: '6px', color: '#9ca3af' }}>
                    Ask about schedules, rooms, or teachers.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: msg.type === 'user' ? '#111827' : msg.type === 'error' ? '#b91c1c' : '#ffffff',
                        color: msg.type === 'user' || msg.type === 'error' ? '#ffffff' : '#111827',
                        border: '1px solid #e5e7eb',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        fontSize: '13px',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                  <span>typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: '16px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                display: 'flex',
                gap: '10px',
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about schedules..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#111827',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputValue.trim()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: loading || !inputValue.trim() ? '#e5e7eb' : '#111827',
                  color: loading || !inputValue.trim() ? '#9ca3af' : '#ffffff',
                  border: '1px solid #111827',
                  borderRadius: '12px',
                  cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Send
              </button>
            </div>
          </>
        )}

        {!isCollapsed && (
          <div
            onMouseDown={startResize}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '6px',
              height: '100%',
              cursor: 'col-resize',
              background: 'linear-gradient(90deg, rgba(17, 24, 39, 0.08), rgba(17, 24, 39, 0))',
            }}
            title="Drag to resize"
          />
        )}
      </div>
    </>
  );
};

export default ChatBot;
