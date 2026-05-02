// src/lib/langflowService.js

import { getToken } from './jwt';
import { langflowApiKey, langflowFlowId, langflowRequestBaseUrl } from '../constants/apiConstants';

const LANGFLOW_URL = `${langflowRequestBaseUrl}/api/v1/run/${langflowFlowId}`;
const API_KEY = langflowApiKey;

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
      },
      body: JSON.stringify({
        input_value: userMessage,
        output_type: 'chat',
        input_type: 'chat',
        jwt_token: token,
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