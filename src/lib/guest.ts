import { account } from './appwrite';

const DEVICE_KEY = 'questino_device_key';
const GUEST_SURVEYS = 'questino_guest_surveys'; // JSON array of survey IDs

/**
 * Get or create a unique device key for this browser/device
 */
export function getDeviceKey(): string {
  let key = localStorage.getItem(DEVICE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, key);
  }
  return key;
}

/**
 * Add a survey ID to the guest's local index
 */
export function addGuestSurveyId(id: string): void {
  try {
    const arr = JSON.parse(localStorage.getItem(GUEST_SURVEYS) || '[]');
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(GUEST_SURVEYS, JSON.stringify(arr));
    }
  } catch (error) {
    console.error('Failed to add guest survey ID:', error);
  }
}

/**
 * Get all survey IDs created by this guest device
 */
export function getGuestSurveyIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_SURVEYS) || '[]');
  } catch (error) {
    console.error('Failed to get guest survey IDs:', error);
    return [];
  }
}

/**
 * Remove a survey ID from the guest's local index
 */
export function removeGuestSurveyId(id: string): void {
  try {
    const arr = JSON.parse(localStorage.getItem(GUEST_SURVEYS) || '[]');
    const filtered = arr.filter((surveyId: string) => surveyId !== id);
    localStorage.setItem(GUEST_SURVEYS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove guest survey ID:', error);
  }
}

/**
 * Ensure we have a guest session (anonymous session)
 * Returns true if session exists or was created successfully
 */
export async function ensureGuestSession(): Promise<boolean> {
  try {
    // Check if we already have a valid session
    await account.get();
    return true;
  } catch (error) {
    // No valid session, try to create anonymous session
    try {
      await account.createAnonymousSession();
      return true;
    } catch (createError) {
      console.error('Failed to create anonymous session:', createError);
      return false;
    }
  }
}

/**
 * End the current session but keep guest data in localStorage
 * This allows guests to sign out without losing their surveys
 */
export async function endSessionButKeepGuestIndex(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
  // Keep localStorage keys (deviceKey & guest survey IDs) - don't clear them
}

/**
 * Check if the current user is a guest (anonymous session)
 */
export async function isGuestUser(): Promise<boolean> {
  try {
    const user = await account.get();
    return user.$id.startsWith('anonymous_') || user.email === '';
  } catch (error) {
    return false;
  }
}

/**
 * Get guest surveys with their data
 * This fetches the actual survey documents for the guest's survey IDs
 */
export async function getGuestSurveys(): Promise<any[]> {
  const surveyIds = getGuestSurveyIds();
  if (surveyIds.length === 0) return [];

  try {
    // Import the survey API functions
    const { getSurveyById } = await import('../surveyApi');
    const surveys = [];
    
    for (const id of surveyIds) {
      try {
        const survey = await getSurveyById(id);
        if (survey) {
          surveys.push(survey);
        }
      } catch (error) {
        // Survey might have been deleted, remove from index
        removeGuestSurveyId(id);
      }
    }
    
    return surveys;
  } catch (error) {
    console.error('Failed to fetch guest surveys:', error);
    return [];
  }
}
