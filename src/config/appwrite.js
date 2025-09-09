// Appwrite configuration
export const APPWRITE_CONFIG = {
  // Database and collection IDs
  DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID || "68b10a4800298b059cf0",
  COLLECTIONS: {
    SURVEYS: import.meta.env.VITE_APPWRITE_SURVEYS_COLLECTION || "surveys",
    QUESTIONS: import.meta.env.VITE_APPWRITE_QUESTIONS_COLLECTION || "questions", 
    RESPONSES: import.meta.env.VITE_APPWRITE_RESPONSES_COLLECTION || "responses",
    ANALYSIS: import.meta.env.VITE_APPWRITE_ANALYSIS_COLLECTION || "analysis",
  },
  // Function IDs
  FUNCTIONS: {
    WATSON_NLU: import.meta.env.VITE_APPWRITE_WATSON_FUNCTION_ID || "68b2b9fe0008a37d0428",
  },
  // Other settings
  SETTINGS: {
    MAX_QUESTIONS_PER_SURVEY: 50,
    MAX_RESPONSES_PER_SURVEY: 1000,
    MAX_ANALYSIS_RETRIES: 3,
    ANALYSIS_TIMEOUT_MS: 15000,
  }
};

// Helper function to get collection ID
export function getCollectionId(collectionName) {
  return APPWRITE_CONFIG.COLLECTIONS[collectionName.toUpperCase()];
}

// Helper function to get database ID
export function getDatabaseId() {
  return APPWRITE_CONFIG.DATABASE_ID;
}
