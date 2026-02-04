import React, { useEffect, useRef, useState } from 'react';

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

  const flowId = '3fd40497-ce2c-4d71-ac65-208bba9e3839';
  const apiKey = 'sk-Fc1IxA_guUpPwB-gR8r77JvV_JB92TBrDj26LYd1DBM';

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

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:7860/api/v1/run/${flowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          input_value: userMessage,
          output_type: 'chat',
          input_type: 'chat',
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const botMessage = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text || 
                         data?.outputs?.[0]?.outputs?.[0]?.results?.text?.text ||
                         data?.result || 
                         'No response received';

      setMessages(prev => [...prev, { type: 'bot', text: botMessage }]);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, { 
        type: 'error', 
        text: `Error: ${err.message}\n\nPlease check:\n• Langflow is running on port 7860\n• The flow ID exists and is correct\n• The API key is valid\n• The flow is properly configured` 
      }]);
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
          background: '#0d0e10',
          color: '#e5e7eb',
          borderLeft: '1px solid #1f2933',
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
            backgroundColor: '#111214',
            color: '#f8fafc',
            gap: '8px',
            borderBottom: '1px solid #1f2933',
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
                border: '1px solid #2a2f35',
                background: '#15171a',
                color: '#e5e7eb',
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
                border: '1px solid #2a2f35',
                background: '#15171a',
                color: '#e5e7eb',
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
                borderBottom: '1px solid #1f2933',
                backgroundColor: '#0f1113',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Assistant</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>AI chat</div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                background: '#0b0c0e',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '24px' }}>
                  <p style={{ margin: 0, fontSize: '15px' }}>Hello. Need help?</p>
                  <p style={{ fontSize: '13px', marginTop: '6px', color: '#64748b' }}>
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
                        backgroundColor: msg.type === 'user' ? '#f8fafc' : msg.type === 'error' ? '#b91c1c' : '#1a1d22',
                        color: msg.type === 'user' ? '#0f172a' : '#e5e7eb',
                        border: '1px solid #22262c',
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
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  <span>typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: '16px',
                borderTop: '1px solid #1f2933',
                backgroundColor: '#0f1113',
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
                  border: '1px solid #2a2f35',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '13px',
                  background: '#0b0c0e',
                  color: '#e5e7eb',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputValue.trim()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: loading || !inputValue.trim() ? '#2a2f35' : '#f8fafc',
                  color: loading || !inputValue.trim() ? '#94a3b8' : '#0f172a',
                  border: '1px solid #2a2f35',
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
              background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0))',
            }}
            title="Drag to resize"
          />
        )}
      </div>
    </>
  );
};

export default ChatBot;
