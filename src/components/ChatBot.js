import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChatBot() {
  const { user } = useAuth();
  const [chatScriptLoaded, setChatScriptLoaded] = useState(false);
  
  // Inject Langflow embedded chat script once
  useEffect(() => {
    // Only load script if user is admin
    if (!user || user.role !== 'admin') return;
    
    const existing = document.querySelector('script[data-langflow-embed="global-chat"]');
    if (existing) {
      setChatScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/logspace-ai/langflow-embedded-chat@v1.0.7/dist/build/static/js/bundle.min.js';
    script.async = true;
    script.defer = true;
    script.dataset.langflowEmbed = 'global-chat';
    script.onload = () => setChatScriptLoaded(true);
    script.onerror = () => console.error('Failed to load Langflow chat script');
    document.body.appendChild(script);
    
    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.querySelector('script[data-langflow-embed="global-chat"]');
      if (scriptToRemove) {
        document.body.removeChild(scriptToRemove);
      }
    };
  }, [user]);

  // Only show for admin users - check after all hooks
  const isAdmin = user?.role === 'admin';
  
  if (!user || !isAdmin) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999 // Very high z-index to appear above everything
    }}>
      <langflow-chat
        window_title="Scheduling Assistant"
        flow_id="e0180ab6-2505-45db-a008-8b06dae8318e"
        host_url="http://127.0.0.1:7860"
        api_key="sk-Fc1IxA_guUpPwB-gR8r77JvV_JB92TBrDj26LYd1DBM"
        chat_position="top-left"
        width="340"
        height="420"
        placeholder="Ask about schedules..."
        chat_trigger_style='{"width":"54px","height":"54px","borderRadius":"50%","backgroundColor":"#3498db","boxShadow":"0 4px 12px rgba(52,152,219,0.3)"}'
        chat_window_style='{"borderRadius":"12px","boxShadow":"0 8px 32px rgba(0,0,0,0.15)"}'
      ></langflow-chat>
    </div>
  );
}
