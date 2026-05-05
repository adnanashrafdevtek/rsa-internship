const DEFAULT_API_BASE = "http://3.143.57.120:4000";
const DEFAULT_LANGFLOW_BASE = "http://3.143.57.120:7860";
const DEFAULT_LANGFLOW_REQUEST_BASE = "http://3.143.57.120:4001";
const DEFAULT_LANGFLOW_FLOW_ID = "866d5686-560c-47ad-83b8-a1373cb7f94f";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const normalizeLangflowRequestBase = (value) => {
	const raw = trimTrailingSlash(value);
	try {
		const parsed = new URL(raw);
		if (parsed.port === "5001") {
			parsed.port = "4001";
			const corrected = trimTrailingSlash(parsed.toString());
			console.warn(`Corrected Langflow request base from ${raw} to ${corrected}. Use REACT_APP_LANGFLOW_REQUEST_BASE_URL for chatbot traffic.`);
			return corrected;
		}
	} catch (error) {
		// Keep raw value when URL parsing fails.
	}
	return raw;
};

// REACT_APP_API_BASE takes priority when set; this is only a fallback.
export const apiUrl = trimTrailingSlash(process.env.REACT_APP_API_BASE || DEFAULT_API_BASE);
export const uiUrl = trimTrailingSlash(process.env.REACT_APP_UI_BASE_URL);
export const langflowBaseUrl = trimTrailingSlash(process.env.REACT_APP_LANGFLOW_BASE_URL || DEFAULT_LANGFLOW_BASE);
export const langflowRequestBaseUrl = normalizeLangflowRequestBase(
	process.env.REACT_APP_LANGFLOW_REQUEST_BASE_URL || process.env.REACT_APP_LANGFLOW_BASE_URL || DEFAULT_LANGFLOW_REQUEST_BASE
);
export const langflowFlowId = process.env.REACT_APP_LANGFLOW_FLOW_ID || DEFAULT_LANGFLOW_FLOW_ID;
export const langflowApiKey = process.env.REACT_APP_LANGFLOW_API_KEY || "";