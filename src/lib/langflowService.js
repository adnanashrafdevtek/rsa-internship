// src/lib/langflowService.js

import { getToken } from './jwt';

const DEFAULT_FLOW_ID = '866d5686-560c-47ad-83b8-a1373cb7f94f';
const LANGFLOW_BASE_URL = process.env.REACT_APP_LANGFLOW_BASE_URL || 'http://3.143.57.120:7860';
const FLOW_ID = process.env.REACT_APP_LANGFLOW_FLOW_ID || DEFAULT_FLOW_ID;
const LANGFLOW_URL = `${LANGFLOW_BASE_URL.replace(/\/$/, '')}/api/v1/run/${FLOW_ID}`;
const API_KEY = process.env.REACT_APP_LANGFLOW_API_KEY || '';

export async function sendMessage(userMessage) {
  const token = getToken();
  
  if (!token) {
    return { ok: false, error: 'Auth token missing. Please log in.' };
  }

  try {
    const response = await fetch(LANGFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        'Authorization': `Bearer ${token}`,
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        input_value: userMessage,
        output_type: 'chat',
        input_type: 'chat',
        jwt_token: token,
        authorization: `Bearer ${token}`,
      }),
    });

    const textResponse = await response.text();
    let data = null;
    try {
      data = textResponse ? JSON.parse(textResponse) : null;
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.detail || textResponse || `API Error: ${response.status}`;
      if (String(detail).toLowerCase().includes('missing authorization header')) {
        return { ok: false, error: 'Your session is not authorized for schedule fetch. Please log out and log in again, then retry.' };
      }
      return { ok: false, error: detail };
    }

    const text = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;

    return {
      ok: true,
      text: text || "The agent processed your request but returned no text.",
      raw: data,
    };

  } catch (error) {
    console.error("Langflow Request Failed:", error);
    return { ok: false, error: error?.message || 'Unable to reach the assistant service.' };
  }
}