import { functions } from './appwrite';

const INSIGHTS_FN_ID =
  import.meta.env.VITE_INSIGHTS_FUNCTION_ID || 'insights-chat';

export async function askInsights(payload) {
  const exec = await functions.createExecution(
    INSIGHTS_FN_ID,
    JSON.stringify(payload)
  );
  try {
    return JSON.parse(exec.responseBody || '{}');
  } catch {
    return { answer: 'AI unavailable right now.' };
  }
}
