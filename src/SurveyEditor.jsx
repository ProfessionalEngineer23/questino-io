import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { db } from "./lib/appwrite";
import { addQuestion, getQuestionsForSurvey } from "./surveyApi";
import { ID } from "appwrite";

const DB_ID = "68b10a4800298b059cf0";
const SURVEYS_ID = "surveys";

export default function SurveyEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [qs, setQs] = useState([]);
  const [addingType, setAddingType] = useState(null); // which type is being created
  const [questionText, setQuestionText] = useState("");

  useEffect(() => {
    (async () => {
      const s = await db.getDocument(DB_ID, SURVEYS_ID, id);
      setSurvey(s);
      setTitle(s.title || "");
      setDescription(s.description || "");
      setQs(await getQuestionsForSurvey(id));
    })();
  }, [id]);

  const saveMeta = async () => {
    const updated = await db.updateDocument(DB_ID, SURVEYS_ID, id, { title, description });
    setSurvey(updated);
  };

  const startAdd = (type) => {
    setAddingType(type);
    setQuestionText("");
  };

  const commitAdd = async () => {
    if (!addingType || !questionText.trim()) return;
    const order = (qs[qs.length - 1]?.order ?? 0) + 1;
    const newDoc = await addQuestion(id, {
      text: questionText.trim(),
      type: addingType,
      required: false,
      order,
      ...(addingType === "scale" ? { scaleMin: 1, scaleMax: 5 } : {}),
    });
    setQs((prev) => [...prev, newDoc]);
    setAddingType(null);
    setQuestionText("");
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit survey</h1>
        <Link to="/" className="btn btn-ghost">← Back</Link>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-sm text-neutral-600">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl2 border border-neutral-300 bg-white px-3 py-2"
              placeholder="Untitled survey"
            />
          </label>
          <label className="block md:col-span-2">
            <div className="text-sm text-neutral-600">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl2 border border-neutral-300 bg-white px-3 py-2"
              placeholder="What is this survey about?"
              rows={3}
            />
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary" onClick={saveMeta}>Save</button>
          <button className="btn btn-ghost" onClick={() => window.open(`/s/${survey?.slug}`, "_blank")}>Preview public page</button>
        </div>
      </div>

      {/* Add question */}
      <div className="mt-6">
        <div className="mb-2 text-sm text-neutral-600">Add question:</div>
        <div className="flex flex-wrap gap-2">
          {["open","single","multiple","yesno","dichotomous","scale"].map((t) => (
            <button key={t} className="btn btn-ghost" onClick={() => startAdd(t)}>
              + {labelFor(t)}
            </button>
          ))}
        </div>

        {addingType && (
          <div className="card mt-3 animate-fade-in p-4">
            <div className="mb-2 text-sm text-neutral-600">New {labelFor(addingType)}</div>
            <input
              autoFocus
              className="w-full rounded-xl2 border border-neutral-300 px-3 py-2"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Write the question…"
            />
            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary" onClick={commitAdd}>Add</button>
              <button className="btn btn-ghost" onClick={() => setAddingType(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Stack of questions */}
      <div className="mt-6 space-y-3">
        {qs.map((q) => (
          <div key={q.$id} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-neutral-500">[{labelFor(q.type)}]</div>
                <div className="font-medium">{q.text}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => alert("Edit coming soon")}>⋯</button>
                <button className="btn btn-ghost" onClick={() => alert("Delete coming soon")}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {qs.length === 0 && (
          <div className="text-sm text-neutral-500">No questions yet. Use the buttons above to add your first one.</div>
        )}
      </div>
    </div>
  );
}

function labelFor(t) {
  switch (t) {
    case "open": return "Open question";
    case "single": return "Single choice";
    case "multiple": return "Multiple choice";
    case "yesno": return "Yes / No";
    case "dichotomous": return "Dichotomous";
    case "scale": return "Scale";
    default: return t;
  }
}
