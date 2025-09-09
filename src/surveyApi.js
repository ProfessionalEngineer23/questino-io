// src/surveyApi.js
import { ID, Query } from "appwrite";
import { account, db } from "./lib/appwrite";
import { APPWRITE_CONFIG } from "./config/appwrite";

const DB_ID = APPWRITE_CONFIG.DATABASE_ID;
const SURVEYS_ID = APPWRITE_CONFIG.COLLECTIONS.SURVEYS;
const QUESTIONS_ID = APPWRITE_CONFIG.COLLECTIONS.QUESTIONS;
const RESPONSES_ID = APPWRITE_CONFIG.COLLECTIONS.RESPONSES;
const ANALYSIS_ID = APPWRITE_CONFIG.COLLECTIONS.ANALYSIS;

export async function ensureSession() {
  try { 
    await account.get(); 
    console.log("Session exists");
  }
  catch (error) { 
    console.log("No session, creating anonymous session:", error.message);
    try {
      await account.createAnonymousSession();
      console.log("Anonymous session created successfully");
    } catch (anonError) {
      console.error("Failed to create anonymous session:", anonError);
      throw anonError;
    }
  }
}

/* ----------------- surveys ----------------- */

export async function createSurvey({
  title,
  description,
  allowAnonymous = true,
  isPublic = true,
}) {
  console.log("createSurvey called with:", { title, description, allowAnonymous, isPublic });
  console.log("Database config:", { DB_ID, SURVEYS_ID });
  
  await ensureSession();
  console.log("Session ensured");
  
  let user;
  try {
    user = await account.get();
    console.log("User retrieved:", user.$id);
  } catch (error) {
    console.log("Failed to get user, creating anonymous session:", error.message);
    // If not authenticated, create anonymous session and try again
    await account.createAnonymousSession();
    user = await account.get();
    console.log("Anonymous user created:", user.$id);
  }

  const slugBase = (title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;
  console.log("Generated slug:", slug);

  const surveyData = {
    ownerId: user.$id,
    title,
    description,
    slug,
    allowAnonymous,
    isPublic,
  };
  console.log("Creating survey with data:", surveyData);

  const result = await db.createDocument(DB_ID, SURVEYS_ID, ID.unique(), surveyData);
  console.log("Survey created successfully:", result);
  return result;
}

/* ----------------- questions ----------------- */

/** map any legacy UI types -> DB enum */
function normalizeType(t) {
  if (!t) return "text";
  const x = String(t).toLowerCase();
  if (x === "open" || x === "text") return "text";
  if (x === "scale") return "scale";
  // treat any choice-like legacy type as mcq
  if (["mcq", "multiple", "single", "yesno", "dichotomous"].includes(x)) return "mcq";
  return "text";
}

export async function addQuestion(surveyId, q) {
  await ensureSession();
  const type = normalizeType(q.type);

  const payload = {
    questionnaireId: surveyId,
    text: q.text ?? "",
    type, // 'text' | 'mcq' | 'scale'
    options:
      type === "mcq"
        ? JSON.stringify(
            (Array.isArray(q.options) ? q.options : [])
              .map((s) => String(s).trim())
              .filter(Boolean)
          )
        : null,
    required: !!q.required,
    order: Number.isFinite(Number(q.order)) ? Number(q.order) : 1,
    scaleMin: type === "scale" ? Number(q.scaleMin ?? 1) : null,
    scaleMax: type === "scale" ? Number(q.scaleMax ?? 5) : null,
  };

  return db.createDocument(DB_ID, QUESTIONS_ID, ID.unique(), payload);
}

export async function getQuestionsForSurvey(surveyId) {
  await ensureSession();
  const res = await db.listDocuments(DB_ID, QUESTIONS_ID, [
    Query.equal("questionnaireId", [surveyId]),
    Query.orderAsc("order"),
    Query.limit(100),
  ]);

  // parse options JSON & normalize types so UI always gets the same shape
  return res.documents.map((d) => {
    let options = [];
    try {
      options = Array.isArray(d.options) ? d.options : JSON.parse(d.options || "[]");
    } catch { options = []; }

    return {
      ...d,
      type: normalizeType(d.type),
      options,
      scaleMin: d.scaleMin != null ? Number(d.scaleMin) : null,
      scaleMax: d.scaleMax != null ? Number(d.scaleMax) : null,
    };
  });
}

/* ----------------- lookups ----------------- */

export async function getSurveyBySlug(slug) {
  await ensureSession();
  const res = await db.listDocuments(DB_ID, SURVEYS_ID, [
    Query.equal("slug", [slug]),
    Query.limit(1),
  ]);
  return res.total ? res.documents[0] : null;
}

export async function getMySurveys() {
  await ensureSession();
  const me = await account.get();
  const res = await db.listDocuments(DB_ID, SURVEYS_ID, [
    Query.equal("ownerId", [me.$id]),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function getSurveyById(id) {
  await ensureSession();
  return db.getDocument(DB_ID, SURVEYS_ID, id);
}

export async function updateSurvey(id, data) {
  await ensureSession();
  return db.updateDocument(DB_ID, SURVEYS_ID, id, data);
}

export async function deleteSurveys(ids = []) {
  await ensureSession();
  return Promise.allSettled(ids.map((id) => db.deleteDocument(DB_ID, SURVEYS_ID, id)));
}

export async function deleteQuestion(questionId) {
  await ensureSession();
  return db.deleteDocument(DB_ID, QUESTIONS_ID, questionId);
}

/* ----------------- responses & analysis ----------------- */

export async function listResponsesBySurvey(surveyId) {
  await ensureSession();
  const res = await db.listDocuments(DB_ID, RESPONSES_ID, [
    Query.equal("questionnaireId", [surveyId]),
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ]);
  return res.documents;
}

/**
 * Useful when ANALYSIS docs do not store surveyId.
 * Joins by responseId.
 */
export async function listAnalysisJoinedBySurvey(surveyId) {
  await ensureSession();

  const responses = await db.listDocuments(DB_ID, RESPONSES_ID, [
    Query.equal("questionnaireId", [surveyId]),
    Query.limit(200),
  ]);

  const ids = responses.documents.map((r) => r.$id);
  if (ids.length === 0) return { responses: [], analysis: [] };

  const analysis = await db.listDocuments(DB_ID, ANALYSIS_ID, [
    Query.equal("responseId", ids),
    Query.limit(500),
  ]);

  return { responses: responses.documents, analysis: analysis.documents };
}

/* If your ANALYSIS docs already store surveyId, you can use this instead. */
export async function listAnalysisBySurvey(surveyId) {
  await ensureSession();
  const res = await db.listDocuments(DB_ID, ANALYSIS_ID, [
    Query.equal("surveyId", [surveyId]),
    Query.limit(500),
  ]);
  return res.documents;
}
