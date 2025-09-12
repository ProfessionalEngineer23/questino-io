import { useState } from 'react';
import styles from './AICreateModal.module.css';
import { functions, databases, account } from '../lib/appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite';

const DB_ID = APPWRITE_CONFIG.DATABASE_ID;
const COL_QUESTIONS = APPWRITE_CONFIG.COLLECTIONS.QUESTIONS;
const COL_SURVEYS = APPWRITE_CONFIG.COLLECTIONS.SURVEYS;

export default function AICreateModal({ onClose, onSurveyCreated }) {
  const [desc, setDesc] = useState('');
  const [count, setCount] = useState(8);
  const [audience, setAudience] = useState('general');
  const [customAudience, setCustomAudience] = useState('');
  const [stylePref, setStylePref] = useState('mix'); // mix | scale | mcq
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function generate() {
    setErr(''); 
    if (!desc.trim()) { 
      setErr('Please describe what you want to assess.'); 
      return; 
    }
    setLoading(true);
    try {
      const functionId = import.meta.env.VITE_SURVEY_GEN_FUNCTION_ID || 'survey-gen';
      console.log('Calling function:', functionId);
      
      const finalAudience = audience === 'other' ? customAudience.trim() : audience;
      const exec = await functions.createExecution(
        functionId,
        JSON.stringify({ desc, count, audience: finalAudience, style: stylePref })
      );
      
      console.log('Function response:', exec);
      const data = JSON.parse(exec.responseBody || '{}');
      
      if (!data?.questions?.length) {
        throw new Error('No questions returned from AI function');
      }
      setDraft(data);
    } catch (error) {
      console.error('AI generation error:', error);
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('Function with the requested ID could not be found')) {
        // Fallback to demo mode
        console.log('Function not found, using demo mode');
        const finalAudience = audience === 'other' ? customAudience.trim() : audience;
        const demoData = createDemoQuestions(desc, count, finalAudience, stylePref);
        setDraft(demoData);
      } else if (error.message?.includes('403') || error.message?.includes('permission')) {
        setErr('Permission denied. Please check your Appwrite function permissions.');
      } else {
        setErr(`AI generation failed: ${error.message || 'Unknown error'}`);
      }
    } finally { 
      setLoading(false); 
    }
  }

  function createDemoQuestions(desc, count, audience, style) {
    const baseTitle = desc.trim() || 'AI Generated Survey';
    const questions = [];
    
    // Enhanced context detection
    const descLower = desc.toLowerCase();
    const isStressRelated = descLower.includes('stress') || descLower.includes('stressful') || descLower.includes('anxiety');
    const isFightRelated = descLower.includes('fight') || descLower.includes('fighter') || descLower.includes('mma') || descLower.includes('combat');
    const isExamRelated = descLower.includes('exam') || descLower.includes('assignment') || descLower.includes('test');
    const isStudentRelated = audience === 'students' || descLower.includes('student');
    const isEmployeeRelated = audience === 'employees' || descLower.includes('employee') || descLower.includes('work');
    const isProfessionalRelated = descLower.includes('professional') || descLower.includes('career');
    
    // Generate context-specific questions
    const questionTemplates = [];
    
    // Stress/Performance questions
    if (isStressRelated) {
      if (isFightRelated) {
        questionTemplates.push(
          {
            text: `On a scale of 1-10, how would you rate your pre-fight stress level?`,
            type: 'scale',
            scaleMin: 1,
            scaleMax: 10,
            required: true
          },
          {
            text: `What was your primary source of pre-fight stress?`,
            type: 'mcq',
            options: ['Opponent analysis', 'Weight cut', 'Training preparation', 'Performance expectations', 'Injury concerns', 'Other'],
            required: true
          },
          {
            text: `How did you manage your stress before the fight?`,
            type: 'mcq',
            options: ['Meditation', 'Visualization', 'Music', 'Team support', 'Routine preparation', 'Other'],
            required: true
          }
        );
      } else if (isExamRelated) {
        questionTemplates.push(
          {
            text: `On a scale of 1-5, how would you rate your exam stress level?`,
            type: 'scale',
            scaleMin: 1,
            scaleMax: 5,
            required: true
          },
          {
            text: `What was your primary source of exam stress?`,
            type: 'mcq',
            options: ['Time pressure', 'Content difficulty', 'Performance expectations', 'Preparation time', 'Other'],
            required: true
          }
        );
      } else {
        questionTemplates.push(
          {
            text: `On a scale of 1-5, how would you rate your stress level?`,
            type: 'scale',
            scaleMin: 1,
            scaleMax: 5,
            required: true
          },
          {
            text: `What is your primary source of stress?`,
            type: 'mcq',
            options: ['Workload', 'Time management', 'Performance pressure', 'Personal issues', 'Other'],
            required: true
          }
        );
      }
    }
    
    // Performance/Experience questions
    if (isFightRelated) {
      questionTemplates.push(
        {
          text: `How confident did you feel going into the fight? (1-10)`,
          type: 'scale',
          scaleMin: 1,
          scaleMax: 10,
          required: true
        },
        {
          text: `Which aspect of your preparation was most effective?`,
          type: 'mcq',
          options: ['Physical training', 'Mental preparation', 'Strategy planning', 'Team support', 'Nutrition', 'Other'],
          required: true
        },
        {
          text: `Describe your mental state during the fight:`,
          type: 'text',
          required: false
        }
      );
    } else if (isExamRelated) {
      questionTemplates.push(
        {
          text: `How confident did you feel about your preparation? (1-10)`,
          type: 'scale',
          scaleMin: 1,
          scaleMax: 10,
          required: true
        },
        {
          text: `Which study method was most effective for you?`,
          type: 'mcq',
          options: ['Reading notes', 'Practice problems', 'Group study', 'Visual aids', 'Flashcards', 'Other'],
          required: true
        }
      );
    } else if (isEmployeeRelated) {
      questionTemplates.push(
        {
          text: `How satisfied are you with your work performance? (1-10)`,
          type: 'scale',
          scaleMin: 1,
          scaleMax: 10,
          required: true
        },
        {
          text: `What is your biggest workplace challenge?`,
          type: 'mcq',
          options: ['Workload', 'Communication', 'Deadlines', 'Team dynamics', 'Skill development', 'Other'],
          required: true
        }
      );
    }
    
    // General questions based on style preference
    if (style === 'scale' || style === 'mix') {
      questionTemplates.push(
        {
          text: `Rate your overall experience (1-10):`,
          type: 'scale',
          scaleMin: 1,
          scaleMax: 10,
          required: true
        }
      );
    }
    
    if (style === 'mcq' || style === 'mix') {
      questionTemplates.push(
        {
          text: `What would you improve for next time?`,
          type: 'mcq',
          options: ['Preparation', 'Time management', 'Strategy', 'Support system', 'Mindset', 'Other'],
          required: true
        }
      );
    }
    
    // Always add a text question for detailed feedback
    questionTemplates.push(
      {
        text: `Please provide any additional comments or insights:`,
        type: 'text',
        required: false
      }
    );
    
    // Select questions based on count, avoiding duplicates
    const selectedQuestions = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < Math.min(count, questionTemplates.length); i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * questionTemplates.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < questionTemplates.length);
      
      usedIndices.add(randomIndex);
      selectedQuestions.push(questionTemplates[randomIndex]);
    }
    
    // If we need more questions, add generic ones
    while (selectedQuestions.length < count) {
      const genericQuestions = [
        {
          text: `How would you rate this experience overall? (1-10)`,
          type: 'scale',
          scaleMin: 1,
          scaleMax: 10,
          required: true
        },
        {
          text: `What was the most challenging aspect?`,
          type: 'mcq',
          options: ['Time management', 'Preparation', 'Execution', 'External factors', 'Other'],
          required: true
        },
        {
          text: `What would you do differently next time?`,
          type: 'text',
          required: false
        }
      ];
      
      const randomGeneric = genericQuestions[Math.floor(Math.random() * genericQuestions.length)];
      selectedQuestions.push(randomGeneric);
    }
    
    return {
      title: baseTitle,
      description: `AI-generated survey based on: ${desc}`,
      questions: selectedQuestions.slice(0, count)
    };
  }

  async function save() {
    if (!draft) return;
    setLoading(true);
    try {
      let ownerId = null;
      try { 
        ownerId = (await account.get()).$id; 
      } catch (error) {
        console.log('No authenticated user, using null ownerId');
      }
      
      console.log('Creating survey...');
      // 1) Create survey first
      const slug = (draft.title || 'ai-survey')
        .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
        + '-' + Math.random().toString(36).slice(2,6);

      const survey = await databases.createDocument(DB_ID, COL_SURVEYS, 'unique()', {
        title: draft.title || 'AI Survey',
        description: draft.description || 'Generated by AI',
        slug,
        ownerId,
        allowAnonymous: true,
        isPublic: true,
        statsPublic: true
      });
      
      console.log('Creating questions...', draft.questions.length);
      // 2) Create questions linked to the survey
      for (let i = 0; i < draft.questions.length; i++) {
        const q = draft.questions[i];
        await databases.createDocument(DB_ID, COL_QUESTIONS, 'unique()', {
          questionnaireId: survey.$id, // Link to survey
          text: q.text,
          type: q.type,
          options: q.options ? JSON.stringify(q.options) : null,
          order: i,
          required: !!q.required,
          scaleMin: q.scaleMin ?? null,
          scaleMax: q.scaleMax ?? null
        });
      }

      console.log('Survey created successfully:', survey.$id);
      
      // Trigger dashboard refresh and animation
      if (onSurveyCreated) {
        onSurveyCreated();
      }
      
      onClose(); // Close the modal
    } catch (error) {
      console.error('Save error:', error);
      setErr(`Saving failed: ${error.message || 'Unknown error'}`);
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.head}>
          <h3>Start from scratch (AI)</h3>
          <button className={styles.x} onClick={onClose}>✕</button>
        </div>

        {!draft ? (
          <>
            <div className={styles.formSection}>
              <label className={styles.label}>Survey Description</label>
              <textarea 
                className={styles.textarea}
                rows={4}
                placeholder="e.g., Measure stress, resilience and social support for university students near exams."
                value={desc} 
                onChange={e=>setDesc(e.target.value)} 
              />
            </div>
            
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Target Audience</label>
                <select 
                  className={styles.select}
                  value={audience} 
                  onChange={e=>setAudience(e.target.value)}
                >
                  <option value="general">General Public</option>
                  <option value="students">Students</option>
                  <option value="employees">Employees</option>
                  <option value="professionals">Professionals</option>
                  <option value="customers">Customers</option>
                  <option value="other">Other (specify below)</option>
                </select>
                {audience === 'other' && (
                  <input
                    className={styles.customInput}
                    type="text"
                    placeholder="Enter your target audience..."
                    value={customAudience}
                    onChange={e=>setCustomAudience(e.target.value)}
                  />
                )}
              </div>
              
              <div className={styles.formField}>
                <label className={styles.label}>Number of Questions</label>
                <input 
                  className={styles.numberInput}
                  type="number" 
                  min={4} 
                  max={15} 
                  value={count} 
                  onChange={e=>setCount(Number(e.target.value))}
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.label}>Question Style</label>
                <select 
                  className={styles.select}
                  value={stylePref} 
                  onChange={e=>setStylePref(e.target.value)}
                >
                  <option value="mix">Mixed Types</option>
                  <option value="scale">Mostly Rating Scales</option>
                  <option value="mcq">Mostly Multiple Choice</option>
                </select>
              </div>
            </div>
            
            {err && <div className={styles.err}>{err}</div>}
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button 
                className={styles.generateBtn} 
                onClick={generate} 
                disabled={loading || (audience === 'other' && !customAudience.trim())}
              >
                {loading ? 'Generating…' : 'Generate Survey'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h4>Preview</h4>
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <h5 className={styles.surveyTitle}>{draft.title}</h5>
                <p className={styles.surveyDescription}>{draft.description}</p>
              </div>
              <div className={styles.questionsContainer}>
                <ol className={styles.questionsList}>
                  {draft.questions.map((q,i)=>(
                    <li key={i} className={styles.questionItem}>
                      <div className={styles.questionText}>
                        {q.text} {q.required && <span className={styles.required}>*</span>}
                      </div>
                      <div className={styles.questionMeta}>
                        <span className={styles.questionType}>{q.type}</span>
                        {q.scaleMin!=null && (
                          <span className={styles.scaleRange}>[{q.scaleMin}-{q.scaleMax}]</span>
                        )}
                      </div>
                      {Array.isArray(q.options)&&q.options.length>0 && (
                        <ul className={styles.optionsList}>
                          {q.options.map((o,ix)=><li key={ix} className={styles.optionItem}>{o}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            {err && <div className={styles.err}>{err}</div>}
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={()=>setDraft(null)}>Back</button>
              <button className={styles.saveBtn} onClick={save} disabled={loading}>
                {loading?'Saving…':'Save survey'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
