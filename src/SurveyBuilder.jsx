// src/SurveyBuilder.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ensureSession,
  getSurveyById,
  updateSurvey,
  addQuestion as addQuestionApi,
  getQuestionsForSurvey,
  createSurvey as createSurveyApi,
} from "./surveyApi";
import { useToast } from "./components/Toast.jsx";

// only: 'text' | 'mcq' | 'scale' | 'slider' | 'section'
const NEW_Q = (type = "text") => ({
  $id: `new-${crypto.randomUUID()}`,
  _new: true,
  text: "",
  type,
  options: type === "mcq" ? ["Option 1", "Option 2"] : [],
  required: false,
  scaleMin: type === "scale" ? 1 : (type === "slider" ? 0 : null),
  scaleMax: type === "scale" ? 5 : (type === "slider" ? 10 : null),
  order: 1,
  sectionTitle: type === "section" ? "New Section" : null,
  sectionDescription: type === "section" ? "" : null,
});

export default function SurveyBuilder() {
  const { id } = useParams();
  const nav = useNavigate();
  const { push } = useToast();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureSession();
      if (!id) {
        const doc = await createSurveyApi({
          title: "Untitled survey",
          description: "",
          allowAnonymous: true,
          isPublic: true,       // default public
          statsPublic: true,    // default public
        });
        nav(`/edit/${doc.$id}`, { replace: true });
        return;
      }
      try {
        const s = await getSurveyById(id);
        const qs = await getQuestionsForSurvey(id);
        setSurvey(s);
        setQuestions(qs);
      } catch (e) {
        console.error(e);
        push("Failed to load survey", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, nav, push]);

  const addQuestion = (type) => {
    setQuestions((qs) => {
      const next = [...qs, NEW_Q(type)];
      next.forEach((q, i) => (q.order = i + 1));
      return next;
    });
  };

  const removeQuestion = (qid) => {
    setQuestions((qs) => qs.filter((q) => q.$id !== qid));
  };

  const updateQ = (qid, patch) => {
    setQuestions((qs) => qs.map((q) => (q.$id === qid ? { ...q, ...patch } : q)));
  };

  const onSave = async () => {
    try {
      await updateSurvey(survey.$id, {
        title: survey.title?.trim() || "Untitled survey",
        description: survey.description?.trim() || "",
        isPublic: !!survey.isPublic,
        statsPublic: !!survey.statsPublic,
      });

      for (const [i, q] of questions.entries()) {
        if (!q._new) continue;
        await addQuestionApi(survey.$id, {
          text: q.text || "New question",
          type: q.type,
          required: !!q.required,
          order: i + 1,
          options: q.type === "mcq" ? (Array.isArray(q.options) ? q.options : []) : undefined,
          scaleMin: q.type === "scale" ? Number(q.scaleMin ?? 1) : undefined,
          scaleMax: q.type === "scale" ? Number(q.scaleMax ?? 5) : undefined,
        });
        q._new = false;
      }

      push("Survey saved");
      nav("/", { replace: true });
    } catch (e) {
      console.error(e);
      push(e?.message || "Failed to save", "error");
    }
  };

  if (loading || !survey) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-brand-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button className="btn btn-ghost" onClick={() => nav(-1)}>
              <span className="icon-arrow-left" /> Back
            </button>
            <div className="text-lg font-semibold text-gray-900">Edit Survey</div>
            <button className="btn btn-primary" onClick={onSave}>
              Save Changes
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="card p-6 animate-in fade-in-up border-l-4 border-l-brand-500 shadow-lg">
          <label className="mb-1 block text-sm text-gray-600">Title</label>
          <input
            className="w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={survey.title ?? ""}
            onChange={(e) => setSurvey((s) => ({ ...s, title: e.target.value }))}
            placeholder="Untitled survey"
          />

          <label className="mb-1 mt-4 block text-sm text-gray-600">Description</label>
          <textarea
            className="h-24 w-full resize-none rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={survey.description ?? ""}
            onChange={(e) => setSurvey((s) => ({ ...s, description: e.target.value }))}
            placeholder="What is this survey about?"
          />

          {/* Visibility toggles */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="card flex items-center justify-between p-3">
              <div>
                <div className="text-sm font-medium">Public survey</div>
                <div className="text-xs text-gray-500">Anyone with the link can answer.</div>
              </div>
              <Switch
                checked={!!survey.isPublic}
                onChange={(v) => setSurvey((s) => ({ ...s, isPublic: v }))}
              />
            </label>

            <label className="card flex items-center justify-between p-3">
              <div>
                <div className="text-sm font-medium">Public stats</div>
                <div className="text-xs text-gray-500">Allow anyone to view the stats page.</div>
              </div>
              <Switch
                checked={!!survey.statsPublic}
                onChange={(v) => setSurvey((s) => ({ ...s, statsPublic: v }))}
              />
            </label>
          </div>
        </div>

        {/* Add question row */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            className="btn btn-ghost interactive" 
            onClick={() => addQuestion("text")}
            title="Add an open-ended text question"
          >
            <span className="icon-message-square" /> Open question
          </button>
          <button 
            className="btn btn-ghost interactive" 
            onClick={() => addQuestion("mcq")}
            title="Add a multiple choice question"
          >
            <span className="icon-check-square" /> Multiple choice
          </button>
          <button 
            className="btn btn-ghost interactive" 
            onClick={() => addQuestion("scale")}
            title="Add a rating scale question"
          >
            <span className="icon-bar-chart-3" /> Scale
          </button>
          <button 
            className="btn btn-ghost interactive" 
            onClick={() => addQuestion("slider")}
            title="Add a slider question (0-10 scale)"
          >
            <span className="icon-sliders" /> Slider
          </button>
          <button 
            className="btn btn-ghost interactive" 
            onClick={() => addQuestion("section")}
            title="Add a section divider"
          >
            <span className="icon-folder" /> Section
          </button>
        </div>

        {/* Question list */}
        <div className="mt-4 space-y-3">
          {questions.length === 0 ? (
            <div className="card p-8 text-center text-sm text-gray-500">
              <div className="mb-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="icon-plus text-2xl text-gray-400" />
                </div>
              </div>
              <p className="text-gray-600 font-medium mb-2">No questions yet</p>
              <p>Use the buttons above to add your first question and start building your survey.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={q.$id} className="card p-6 animate-in fade-in-up hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {idx + 1}. type:&nbsp;<span className="font-medium">{q.type}</span>
                    {q.type === "scale" && (
                      <span className="ml-1 opacity-70">
                        (min {q.scaleMin ?? 1} – max {q.scaleMax ?? 5})
                      </span>
                    )}
                    {q.type === "slider" && (
                      <span className="ml-1 opacity-70">
                        (min {q.scaleMin ?? 0} – max {q.scaleMax ?? 10})
                      </span>
                    )}
                    {q.type === "section" && (
                      <span className="ml-1 opacity-70">
                        (section divider)
                      </span>
                    )}
                  </div>
                  <button className="btn btn-ghost text-red-600" onClick={() => removeQuestion(q.$id)}>
                    Delete
                  </button>
                </div>

                {q.type === "section" ? (
                  <div className="mt-2 space-y-3">
                    <input
                      className="w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                      value={q.sectionTitle || ""}
                      onChange={(e) => updateQ(q.$id, { sectionTitle: e.target.value })}
                      placeholder="Section title…"
                    />
                    <textarea
                      className="w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={q.sectionDescription || ""}
                      onChange={(e) => updateQ(q.$id, { sectionDescription: e.target.value })}
                      placeholder="Section description (optional)…"
                      rows={2}
                    />
                  </div>
                ) : (
                  <input
                    className="mt-2 w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={q.text}
                    onChange={(e) => updateQ(q.$id, { text: e.target.value })}
                    placeholder="Write the question…"
                  />
                )}

                {/* MCQ options */}
                {q.type === "mcq" && (
                  <div className="mt-3 space-y-2">
                    {(q.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-400 icon-dot" />
                        <input
                          className="flex-1 rounded-xl2 border border-gray-200 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={opt}
                          onChange={(e) =>
                            updateQ(q.$id, {
                              options: q.options.map((x, ix) => (ix === i ? e.target.value : x)),
                            })
                          }
                        />
                        <button
                          className="btn btn-ghost text-red-600"
                          onClick={() =>
                            updateQ(q.$id, { options: q.options.filter((_, ix) => ix !== i) })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        updateQ(q.$id, {
                          options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`],
                        })
                      }
                    >
                      Add option
                    </button>
                  </div>
                )}

                {/* Scale controls */}
                {q.type === "scale" && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-600">min</span>
                    <input
                      type="number"
                      className="w-16 rounded-xl2 border border-gray-200 px-2 py-1"
                      value={q.scaleMin ?? 1}
                      onChange={(e) => updateQ(q.$id, { scaleMin: Number(e.target.value || 1) })}
                    />
                    <span className="text-gray-600">max</span>
                    <input
                      type="number"
                      className="w-16 rounded-xl2 border border-gray-200 px-2 py-1"
                      value={q.scaleMax ?? 5}
                      onChange={(e) => updateQ(q.$id, { scaleMax: Number(e.target.value || 5) })}
                    />
                  </div>
                )}

                {/* Slider controls */}
                {q.type === "slider" && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-600">min</span>
                    <input
                      type="number"
                      className="w-16 rounded-xl2 border border-gray-200 px-2 py-1"
                      value={q.scaleMin ?? 0}
                      onChange={(e) => updateQ(q.$id, { scaleMin: Number(e.target.value || 0) })}
                    />
                    <span className="text-gray-600">max</span>
                    <input
                      type="number"
                      className="w-16 rounded-xl2 border border-gray-200 px-2 py-1"
                      value={q.scaleMax ?? 10}
                      onChange={(e) => updateQ(q.$id, { scaleMax: Number(e.target.value || 10) })}
                    />
                  </div>
                )}

                {q.type !== "section" && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={!!q.required}
                      onChange={(e) => updateQ(q.$id, { required: e.target.checked })}
                    />
                    Required
                  </label>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

/** Tiny switch component that matches your pill buttons */
function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200
        ${checked ? "bg-brand-500" : "bg-gray-300"}`}
      aria-pressed={checked}
      aria-label="Toggle"
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow
          transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
