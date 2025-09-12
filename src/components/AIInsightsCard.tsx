import { useMemo, useState } from 'react';
import styles from './AIInsightsCard.module.css';
import { askInsights } from '../lib/insights';
import { computeQuestionSummaries } from '../utils/computeStats';

export default function AIInsightsCard({ survey, stats, emotions, weekSummary, questions, responses, className }: any) {
  const [messages, setMessages] = useState<{role:'user'|'assistant',content:string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const totalResponses = responses?.length || 0;
    const joy = emotions?.joy?.toFixed?.(3);
    const sad = emotions?.sadness?.toFixed?.(3);
    
    if (totalResponses === 0) {
      return 'No responses yet. Start collecting data to see insights.';
    }
    
    const avgJoy = joy ? (parseFloat(joy) * 100).toFixed(1) : '0';
    const avgSadness = sad ? (parseFloat(sad) * 100).toFixed(1) : '0';
    
    return `Survey has ${totalResponses} response${totalResponses !== 1 ? 's' : ''}. Average Joy: ${avgJoy}%, Sadness: ${avgSadness}%.`;
  }, [emotions, responses]);

  const questionSummaries = useMemo(() => {
    return computeQuestionSummaries(questions, responses, stats);
  }, [questions, responses, stats]);

  function renderAssistant(text: string) {
    const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
    return (
      <ul className={styles.list}>
        {lines.map((l, i) => {
          let icon = '•';
          if (l.toLowerCase().startsWith('overview')) icon = '💡';
          else if (l.toLowerCase().startsWith('patterns')) icon = '🔎';
          else if (l.toLowerCase().startsWith('risks')) icon = '⚠️';
          else if (l.toLowerCase().startsWith('recommendations')) icon = '✅';
          return <li key={i}><span className={styles.ico}>{icon}</span>{l}</li>;
        })}
      </ul>
    );
  }

  async function ask() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: 'user', content: input.trim() }];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const payload = {
        surveyId: survey?.$id,
        messages: next,
        context: {
          totalResponses: responses?.length || 0,
          emotions,
          weekSummary,
          questions: questionSummaries
        }
      };
      const data = await askInsights(payload);
      setMessages(m => [...m, { role: 'assistant', content: data.answer || 'AI unavailable right now.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'AI unavailable right now.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>AI Insights</div>
      <div className={styles.initial}>{summary}</div>
      <div className={styles.chat}>
        {messages.slice(-3).map((m,i)=>(
          <div key={i} className={m.role==='assistant'?styles.assistant:styles.user}>
            {m.role === 'assistant' ? renderAssistant(m.content) : m.content}
          </div>
        ))}
        {loading && (
          <div className={styles.assistant}>
            <div className={styles.typingIndicator}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
          </div>
        )}
      </div>
      <div className={styles.promptBar}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask questions to gain insight" onKeyDown={(e)=> e.key==='Enter' && ask()} />
        <button onClick={ask} disabled={loading || !input.trim()}>Ask</button>
      </div>
    </div>
  );
}
