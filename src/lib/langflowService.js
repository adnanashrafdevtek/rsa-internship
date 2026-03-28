// src/lib/langflowService.js

const FLOW_ID = '2e8b9f3e-10dd-41f6-be28-fd312fc66592';
const LANGFLOW_URL = `http://127.0.0.1:7860/api/v1/run/${FLOW_ID}`;
const API_KEY = 'sk-Fc1IxA_guUpPwB-gR8r77JvV_JB92TBrDj26LYd1DBM';

export async function sendMessage(userMessage) {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    return { ok: false, error: 'Auth token missing. Please log in.' };
  }

  try {
    console.log("Sending Tweak:", { "jwt_token": token });

    const response = await fetch(LANGFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        input_value: userMessage,
        output_type: 'chat',
        input_type: 'chat',
        tweaks: {
          "jwt_token": { value: token },
          "Get All Teachers-jwt_token": { value: token },
          "Change Schedules-jwt_token": { value: token },
          "Get Teacher ID-jwt_token": { value: token }
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || `API Error: ${response.status}`);
    }

    const text = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;

    return {
      ok: true,
      text: text || "The agent processed your request but returned no text.",
      raw: data,
    };

  } catch (error) {
    console.error("Langflow Request Failed:", error);
    throw error;
  }
}