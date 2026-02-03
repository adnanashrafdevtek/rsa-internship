import React, { useEffect, useRef, useState } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const flowId = '3fd40497-ce2c-4d71-ac65-208bba9e3839';
  const apiKey = 'sk-Fc1IxA_guUpPwB-gR8r77JvV_JB92TBrDj26LYd1DBM';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
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
      {/* Chat trigger button */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#3498db',
          border: 'none',
          boxShadow: '0 4px 12px rgba(52,152,219,0.3)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title="Open Chat"
      >
        💬
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '340px',
            height: '420px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            backgroundColor: 'white',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#3498db',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Master Flow</h3>
            <button
              onClick={toggleChat}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              backgroundColor: '#f5f5f5',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '20px' }}>
                <p>👋 Welcome to Master Flow!</p>
                <p style={{ fontSize: '14px' }}>Ask about schedules...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 15px',
                      borderRadius: '12px',
                      backgroundColor: msg.type === 'user' ? '#3498db' : msg.type === 'error' ? '#e74c3c' : 'white',
                      color: msg.type === 'user' || msg.type === 'error' ? 'white' : '#333',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
                <span>typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              padding: '15px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: 'white',
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
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputValue.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: loading || !inputValue.trim() ? '#ccc' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
