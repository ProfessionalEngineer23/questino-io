// src/surveyApi.js
import { ID, Query } from "appwrite";
import { account, databases } from "./lib/appwrite";
import { APPWRITE_CONFIG } from "./config/appwrite";
import { resolveSurveyNameConflict } from "./utils/surveyNameResolver";

const DB_ID = APPWRITE_CONFIG.DATABASE_ID;
const SURVEYS_ID = APPWRITE_CONFIG.COLLECTIONS.SURVEYS;
const QUESTIONS_ID = APPWRITE_CONFIG.COLLECTIONS.QUESTIONS;
const RESPONSES_ID = APPWRITE_CONFIG.COLLECTIONS.RESPONSES;
const ANALYSIS_ID = APPWRITE_CONFIG.COLLECTIONS.ANALYSIS;

export async function ensureSession() {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
}

/* ----------------- surveys ----------------- */

export async function createSurvey({
  title,
  description,
  allowAnonymous = true,
  isPublic = true,
}) {
  await ensureSession();

  const user = await account.get();

  // Check for name conflicts
  const existing = await databases.listDocuments(DB_ID, SURVEYS_ID, [
    Query.equal("ownerId", [user.$id]),
    Query.limit(100),
  ]);
  const resolvedTitle = resolveSurveyNameConflict(title, existing.documents);

  const slugBase = (resolvedTitle || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;

  const surveyData = {
    ownerId: user.$id,
    title: resolvedTitle,
    description: String(description ?? ""),
    slug,
    allowAnonymous: !!allowAnonymous,
    isPublic: !!isPublic,
  };

  return databases.createDocument(DB_ID, SURVEYS_ID, ID.unique(), surveyData);
}

function normalizeType(t) {
  if (!t) return "text";
  const x = String(t).toLowerCase();
  if (x === "open" || x === "text") return "text";
  if (x === "scale") return "scale";
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

  return databases.createDocument(DB_ID, QUESTIONS_ID, ID.unique(), payload);
}

export async function getQuestionsForSurvey(surveyId) {
  await ensureSession();
  const res = await databases.listDocuments(DB_ID, QUESTIONS_ID, [
    Query.equal("questionnaireId", [surveyId]),
    Query.orderAsc("order"),
    Query.limit(100),
  ]);

  return res.documents.map((d) => {
    let options = [];
    try {
      options = Array.isArray(d.options) ? d.options : JSON.parse(d.options || "[]");
    } catch {
      options = [];
    }
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
  const res = await databases.listDocuments(DB_ID, SURVEYS_ID, [
    Query.equal("slug", [slug]),
    Query.limit(1),
  ]);
  return res.total ? res.documents[0] : null;
}

export async function getMySurveys() {
  await ensureSession();
  const me = await account.get();
  const res = await databases.listDocuments(DB_ID, SURVEYS_ID, [
    Query.equal("ownerId", [me.$id]),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function getSurveyById(id) {
  await ensureSession();
  return databases.getDocument(DB_ID, SURVEYS_ID, id);
}

export async function updateSurvey(id, data) {
  await ensureSession();

  // Only send fields the collection actually has
  const body = {};
  if ("title" in data) body.title = String(data.title ?? "").trim() || "Untitled survey";
  if ("description" in data) body.description = String(data.description ?? "");
  if ("isPublic" in data) body.isPublic = Boolean(data.isPublic);
  if ("statsPublic" in data) body.statsPublic = Boolean(data.statsPublic);

  // Resolve title conflict if we’re changing it
  if ("title" in body) {
    const me = await account.get();
    const existing = await databases.listDocuments(DB_ID, SURVEYS_ID, [
      Query.equal("ownerId", [me.$id]),
      Query.notEqual("$id", [id]),
      Query.limit(100),
    ]);
    body.title = resolveSurveyNameConflict(body.title, existing.documents);
  }

  return databases.updateDocument(DB_ID, SURVEYS_ID, id, body);
}

export async function deleteSurveys(ids = []) {
  await ensureSession();
  return Promise.allSettled(ids.map((id) => databases.deleteDocument(DB_ID, SURVEYS_ID, id)));
}

export async function deleteQuestion(questionId) {
  await ensureSession();
  return databases.deleteDocument(DB_ID, QUESTIONS_ID, questionId);
}

/* ----------------- responses & analysis ----------------- */

export async function listResponsesBySurvey(surveyId) {
  await ensureSession();
  const res = await databases.listDocuments(DB_ID, RESPONSES_ID, [
    Query.equal("questionnaireId", [surveyId]),
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ]);
  return res.documents;
}

/** Join analysis by responseId when analysis docs don’t store surveyId */
export async function listAnalysisJoinedBySurvey(surveyId) {
  await ensureSession();

  const responses = await databases.listDocuments(DB_ID, RESPONSES_ID, [
    Query.equal("questionnaireId", [surveyId]),
    Query.limit(200),
  ]);

  const ids = responses.documents.map((r) => r.$id);
  if (ids.length === 0) return { responses: [], analysis: [] };

  const analysis = await databases.listDocuments(DB_ID, ANALYSIS_ID, [
    Query.equal("responseId", ids),
    Query.limit(500),
  ]);

  return { responses: responses.documents, analysis: analysis.documents };
}

export async function listAnalysisBySurvey(surveyId) {
  await ensureSession();
  const res = await databases.listDocuments(DB_ID, ANALYSIS_ID, [
    Query.equal("surveyId", [surveyId]),
    Query.limit(500),
  ]);
  return res.documents;
}
