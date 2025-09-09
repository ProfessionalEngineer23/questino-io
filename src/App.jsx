import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import { client, db, ID, account } from "./lib/appwrite";
import { Functions, AppwriteException, Query } from "appwrite";
import {
  createSurvey,
  addQuestion,
  getSurveyBySlug,
  getQuestionsForSurvey,
} from "./surveyApi";

// === IDs (update these to match your Appwrite console) =======================
import { APPWRITE_CONFIG } from "./config/appwrite";
const DB_ID = APPWRITE_CONFIG.DATABASE_ID;
const RESPONSES = APPWRITE_CONFIG.COLLECTIONS.RESPONSES;
const ANALYSIS = APPWRITE_CONFIG.COLLECTIONS.ANALYSIS;
const FN_ID = APPWRITE_CONFIG.FUNCTIONS.WATSON_NLU;
// ============================================================================

const fx = new Functions(client);

// --- Helpers -----------------------------------------------------------------
async function ensureSession() {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForAnalysis(responseId, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const list = await db.listDocuments(DB_ID, ANALYSIS, [
      Query.equal("responseId", [responseId]),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    if (list.total > 0) return list.documents[0];
    await sleep(1000);
  }
  throw new Error("Timed out waiting for analysis");
}

export default function App() {
  const [detailHeight, setDetailHeight] = useState(55);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [showLogs, setShowLogs] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // remember last-created survey
  const [lastSurveyId, setLastSurveyId] = useState(null);
  const [lastSurveySlug, setLastSurveySlug] = useState(null);

  // preview state
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const detailsRef = useRef(null);

  const updateHeight = useCallback(() => {
    if (detailsRef.current) setDetailHeight(detailsRef.current.clientHeight);
  }, []);

  useEffect(() => {
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [updateHeight]);

  useEffect(() => {
    if (!detailsRef.current) return;
    const el = detailsRef.current;
    el.addEventListener("toggle", updateHeight);
    return () => el.removeEventListener("toggle", updateHeight);
  }, [updateHeight]);

  // --- Handlers --------------------------------------------------------------
  const sendPing = useCallback(async () => {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const result = await client.ping();
      setLogs((prev) => [
        {
          date: new Date(),
          method: "GET",
          path: "/v1/ping",
          status: 200,
          response: JSON.stringify(result),
        },
        ...prev,
      ]);
      setStatus("success");
    } catch (err) {
      setLogs((prev) => [
        {
          date: new Date(),
          method: "GET",
          path: "/v1/ping",
          status: err instanceof AppwriteException ? err.code : 500,
          response:
            err instanceof AppwriteException ? err.message : "Something went wrong",
        },
        ...prev,
      ]);
      setStatus("error");
    }
    setShowLogs(true);
  }, [status]);

  const handleCreateSurvey = useCallback(async () => {
    try {
      await ensureSession();
      const doc = await createSurvey({
        title: "My First Survey (from UI)",
        description: "Created via App.jsx test button",
        allowAnonymous: true,
        isPublic: true,
      });
      console.log("Created survey:", doc);
      setLastSurveyId(doc.$id);
      setLastSurveySlug(doc.slug);
      setPreviewQuestions([]); // reset preview list
      alert(`Survey created!\nID: ${doc.$id}\nSlug: ${doc.slug}`);
    } catch (err) {
      console.error("Create survey failed:", err);
      alert("Create survey failed. Check console for details.");
    }
  }, []);

  const handleCopyPublicLink = useCallback(async () => {
    if (!lastSurveySlug) {
      alert("Create a survey first.");
      return;
    }
    const url = `${window.location.origin}/s/${lastSurveySlug}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // fallback
        const el = document.createElement("textarea");
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      alert("Public link copied to clipboard:\n" + url);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed. Here’s the link:\n" + url);
    }
  }, [lastSurveySlug]);

  const handleCreateQuestion = useCallback(async () => {
    try {
      if (!lastSurveyId) {
        alert("Create a survey first, then add a question.");
        return;
      }
      await ensureSession();
      await addQuestion(lastSurveyId, {
        text: "How satisfied are you with this test?",
        type: "scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        order: 1,
      });
      alert("Question created for this survey!");
    } catch (err) {
      console.error("Create question failed:", err);
      alert("Create question failed. Check console for details.");
    }
  }, [lastSurveyId]);

  const handlePreviewSurvey = useCallback(async () => {
    try {
      if (!lastSurveySlug) {
        alert("Create a survey first.");
        return;
      }
      setPreviewLoading(true);
      const survey = await getSurveyBySlug(lastSurveySlug);
      if (!survey) {
        alert("Survey not found by slug.");
        return;
      }
      const qs = await getQuestionsForSurvey(survey.$id);
      setPreviewQuestions(qs);
    } catch (err) {
      console.error("Preview failed:", err);
      alert("Preview failed. Check console for details.");
    } finally {
      setPreviewLoading(false);
    }
  }, [lastSurveySlug]);

  const runAnalysisTest = useCallback(async () => {
    try {
      setAnalysis(null);
      setAnalysisLoading(true);
      await ensureSession();

      // 1) Create a Responses document
      const response = await db.createDocument(DB_ID, RESPONSES, ID.unique(), {
        questionnaireId: "demo",
        participantId: null,
        answers: JSON.stringify({ Q1: "Yes", Q2: 5 }),
        freeText: "I am very happy and excited to finish this assignment.",
        submittedAt: new Date().toISOString(),
      });

      // 2) Invoke the function
      await fx.createExecution(
        FN_ID,
        JSON.stringify({ responseId: response.$id, text: response.freeText })
      );

      // 3) Poll for the analysis row
      const doc = await waitForAnalysis(response.$id);
      setAnalysis({
        joy: doc.joy,
        sadness: doc.sadness,
        anger: doc.anger,
        fear: doc.fear,
        disgust: doc.disgust,
        model: doc.model,
        createdAt: doc.createdAt || doc.$createdAt,
      });
    } catch (e) {
      console.error(e);
      alert("Failed: " + (e.message || e));
    } finally {
      setAnalysisLoading(false);
      setShowLogs(true);
    }
  }, []);

  // --- UI --------------------------------------------------------------------
  return (
    <main
      className="checker-background flex flex-col items-center p-5"
      style={{ marginBottom: `${detailHeight}px` }}
    >
      <div className="mt-25 flex w-full max-w-[40em] items-center justify-center lg:mt-34">
        <div className="rounded-[25%] border border-[#19191C0A] bg-[#F9F9FA] p-3 shadow-[0px_9.36px_9.36px_0px_hsla(0,0%,0%,0.04)]">
          <div className="rounded-[25%] border border-[#FAFAFB] bg-white p-5 shadow-[0px_2px_12px_0px_hsla(0,0%,0%,0.03)] lg:p-9">
            <img alt="React logo" src="/react.svg" className="h-14 w-14" width={56} height={56} />
          </div>
        </div>
        <div
          className={`flex w-38 items-center transition-opacity duration-2500 ${
            status === "success" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="to-[rgba(253, 54, 110, 0.15)] h-[1px] flex-1 bg-gradient-to-l from-[#f02e65]"></div>
          <div className="icon-check flex h-5 w-5 items-center justify-center rounded-full border border-[#FD366E52] bg-[#FD366E14] text-[#FD366E]"></div>
          <div className="to-[rgba(253, 54, 110, 0.15)] h-[1px] flex-1 bg-gradient-to-r from-[#f02e65]"></div>
        </div>
        <div className="rounded-[25%] border border-[#19191C0A] bg-[#F9F9FA] p-3 shadow-[0px_9.36px_9.36px_0px_hsla(0,0%,0%,0.04)]">
          <div className="rounded-[25%] border border-[#FAFAFB] bg-white p-5 shadow-[0px_2px_12px_0px_hsla(0,0%,0%,0.03)] lg:p-9">
            <img alt="Appwrite logo" src="/appwrite.svg" className="h-14 w-14" width={56} height={56} />
          </div>
        </div>
      </div>

      <section className="mt-12 flex min-h-52 flex-col items-center">
        {status === "loading" ? (
          <div className="flex flex-row gap-4">
            <div role="status">
              <svg
                aria-hidden="true"
                className="h-5 w-5 animate-spin fill-[#FD366E] text-gray-200 dark:text-gray-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M100 50.59C100 78.21 77.61 100.59 50 100.59S0 78.21 0 50.59 22.39.59 50 .59 100 22.98 100 50.59Z" fill="currentColor" />
                <path d="M93.97 39.04c2.43-.64 3.9-3.13 3.05-5.49-1.71-4.73-4.13-9.19-7.19-13.21C85.85 15.12 80.88 10.72 75.21 7.41 69.54 4.1 63.28 1.94 56.77 1.05 51.77.37 46.7.45 41.73 1.28c-2.47.41-3.91 2.9-3.07 5.26.64 1.78 2.54 2.84 4.35 2.51 4-.72 8.31-.63 12.32.99 5.32 2.05 10.28 5.4 14.24 9.77 3.36 3.73 6.15 8.05 8.1 12.7.87 2.35 3.36 3.79 5.7 3.53Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <span>Waiting for connection...</span>
          </div>
        ) : status === "success" ? (
          <h1 className="font-[Poppins] text-2xl font-light text-[#2D2D31]">Congratulations!</h1>
        ) : (
          <h1 className="font-[Poppins] text-2xl font-light text-[#2D2D31]">Check connection</h1>
        )}

        <p className="mt-2 mb-8">
          {status === "success" ? (
            <span>You connected your app successfully.</span>
          ) : (
            <span>Send a ping to verify the connection</span>
          )}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={sendPing}
            className={`cursor-pointer rounded-md bg-[#FD366E] px-2.5 py-1.5 text-white ${
              status === "loading" ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Send a ping
          </button>

          <button
            onClick={runAnalysisTest}
            className="cursor-pointer rounded-md bg-black px-2.5 py-1.5 text-white disabled:opacity-50"
            disabled={analysisLoading}
            title={analysisLoading ? "Running..." : "Run analysis"}
          >
            {analysisLoading ? "Running..." : "Run analysis test"}
          </button>

          <button
            onClick={handleCreateSurvey}
            className="cursor-pointer rounded-md bg-[#2D2D31] px-2.5 py-1.5 text-white"
          >
            Create Test Survey
          </button>

          <button
            onClick={handleCreateQuestion}
            className="cursor-pointer rounded-md bg-[#2D2D31] px-2.5 py-1.5 text-white disabled:opacity-50"
            disabled={!lastSurveyId}
            title={!lastSurveyId ? "Create a survey first" : "Add a test question"}
          >
            Create Test Question
          </button>

          <button
            onClick={handlePreviewSurvey}
            className="cursor-pointer rounded-md bg-[#2D2D31] px-2.5 py-1.5 text-white disabled:opacity-50"
            disabled={!lastSurveySlug}
            title={!lastSurveySlug ? "Create a survey first" : "Preview survey"}
          >
            Preview Survey (questions)
          </button>

          <button
            onClick={handleCopyPublicLink}
            className="cursor-pointer rounded-md bg-[#2D2D31] px-2.5 py-1.5 text-white disabled:opacity-50"
            disabled={!lastSurveySlug}
            title={!lastSurveySlug ? "Create a survey first" : "Copy public link"}
          >
            Copy Public Link
          </button>

          {lastSurveySlug && (
            <p className="text-xs text-[#555]">
              Last survey slug:{" "}
              <code>{lastSurveySlug}</code>{" "}
              (<a
                className="underline"
                href={`/s/${lastSurveySlug}`}
                target="_blank"
                rel="noreferrer"
              >
                open
              </a>)
            </p>
          )}
        </div>

        {previewLoading && <p className="mt-2 text-sm">Loading questions…</p>}

        {previewQuestions.length > 0 && (
          <div className="mt-4 w-full max-w-[28rem] rounded-md border border-[#EDEDF0] bg-white p-4 text-sm">
            <div className="mb-2 font-semibold">Questions</div>
            <ol className="list-decimal pl-5 space-y-2">
              {previewQuestions.map((q) => (
                <li key={q.$id}>
                  <div className="font-medium">{q.text}</div>
                  <div className="text-xs text-[#666]">
                    type: {q.type}
                    {q.type === "scale" && ` (min ${q.scaleMin} – max ${q.scaleMax})`}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {analysis && (
          <div className="mt-4 w-full max-w-[28rem] rounded-md border border-[#EDEDF0] bg-white p-4 text-sm">
            <div className="mb-2 font-semibold">Emotion analysis ({analysis.model})</div>
            <ul className="space-y-1">
              <li>Joy: {Number(analysis.joy).toFixed(3)}</li>
              <li>Sadness: {Number(analysis.sadness).toFixed(3)}</li>
              <li>Anger: {Number(analysis.anger).toFixed(3)}</li>
              <li>Fear: {Number(analysis.fear).toFixed(3)}</li>
              <li>Disgust: {Number(analysis.disgust).toFixed(3)}</li>
            </ul>
          </div>
        )}
      </section>

      <div className="grid grid-rows-3 gap-7 lg:grid-cols-3 lg:grid-rows-none">
        <div className="flex h-full w-72 flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4">
          <h2 className="text-xl font-light text-[#2D2D31]">Edit your app</h2>
          <p>
            Edit <code className="rounded-sm bg-[#EDEDF0] p-1">app/page.js</code> to get started with building your app.
          </p>
        </div>

        <a href="https://cloud.appwrite.io" target="_blank" rel="noopener noreferrer">
          <div className="flex h-full w-72 flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-light text-[#2D2D31]">Go to console</h2>
              <span className="icon-arrow-right text-[#D8D8DB]"></span>
            </div>
            <p>Navigate to the console to control and oversee the Appwrite services.</p>
          </div>
        </a>

        <a href="https://appwrite.io/docs" target="_blank" rel="noopener noreferrer">
          <div className="flex h-full w-72 flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-light text-[#2D2D31]">Explore docs</h2>
              <span className="icon-arrow-right text-[#D8D8DB]"></span>
            </div>
            <p>Discover the full power of Appwrite by diving into our documentation.</p>
          </div>
        </a>
      </div>

      <aside className="fixed bottom-0 flex w-full cursor-pointer border-t border-[#EDEDF0] bg-white">
        <details open={showLogs} ref={detailsRef} className="w-full">
          <summary className="flex w-full flex-row justify-between p-4 marker:content-none">
            <div className="flex gap-2">
              <span className="font-semibold">Logs</span>
              {logs.length > 0 && (
                <div className="flex items-center rounded-md bg-[#E6E6E6] px-2">
                  <span className="font-semibold">{logs.length}</span>
                </div>
              )}
            </div>
            <div className="icon">
              <span className="icon-cheveron-down" aria-hidden="true"></span>
            </div>
          </summary>

          <div className="flex w-full flex-col lg:flex-row">
            <div className="flex flex-col border-r border-[#EDEDF0]">
              <div className="border-y border-[#EDEDF0] bg-[#FAFAFB] px-4 py-2 text-[#97979B]">Project</div>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div className="flex flex-col">
                  <span className="text-[#97979B]">Endpoint</span>
                  <span className="truncate">{import.meta.env.VITE_APPWRITE_ENDPOINT}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#97979B]">Project-ID</span>
                  <span className="truncate">{import.meta.env.VITE_APPWRITE_PROJECT_ID}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#97979B]">Project name</span>
                  <span className="truncate">{import.meta.env.VITE_APPWRITE_PROJECT_NAME}</span>
                </div>
              </div>
            </div>

            <div className="flex-grow">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[#EDEDF0] bg-[#FAFAFB] text-[#97979B]">
                    {logs.length > 0 ? (
                      <>
                        <td className="w-52 py-2 pl-4">Date</td>
                        <td>Status</td>
                        <td>Method</td>
                        <td className="hidden lg:table-cell">Path</td>
                        <td className="hidden lg:table-cell">Response</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pl-4">Logs</td>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log, i) => (
                      <tr key={i}>
                        <td className="py-2 pl-4 font-[Fira_Code]">
                          {log.date.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          {log.status > 400 ? (
                            <div className="w-fit rounded-sm bg-[#FF453A3D] px-1 text-[#B31212]">{log.status}</div>
                          ) : (
                            <div className="w-fit rounded-sm bg-[#10B9813D] px-1 text-[#0A714F]">{log.status}</div>
                          )}
                        </td>
                        <td>{log.method}</td>
                        <td className="hidden lg:table-cell">{log.path}</td>
                        <td className="hidden font-[Fira_Code] lg:table-cell">{log.response}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 pl-4 font-[Fira_Code]">There are no logs to show</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </aside>
    </main>
  );
}
