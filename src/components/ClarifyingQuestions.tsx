import { useState } from 'react';
import type { Question } from '../types';

type Props = {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  onBack: () => void;
  loading: boolean;
};

const OTHER_VALUE = '__other__';

export function ClarifyingQuestions({ questions, onSubmit, onBack, loading }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [usingCustom, setUsingCustom] = useState<Record<string, boolean>>({});

  const getEffectiveAnswer = (qId: string) =>
    usingCustom[qId] ? (customInputs[qId] ?? '') : (answers[qId] ?? '');

  const allAnswered = questions.every(q => getEffectiveAnswer(q.id).trim().length > 0);

  const handleSelectChange = (id: string, value: string) => {
    if (value === OTHER_VALUE) {
      setUsingCustom(prev => ({ ...prev, [id]: true }));
      setAnswers(prev => ({ ...prev, [id]: OTHER_VALUE }));
    } else {
      setUsingCustom(prev => ({ ...prev, [id]: false }));
      setAnswers(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleCustomInput = (id: string, value: string) =>
    setCustomInputs(prev => ({ ...prev, [id]: value }));

  const handleSubmit = () => {
    const finalAnswers: Record<string, string> = {};
    for (const q of questions) {
      finalAnswers[q.id] = getEffectiveAnswer(q.id);
    }
    onSubmit(finalAnswers);
  };

  return (
    <section className="card">
      <h2>A few clarifying questions</h2>
      <p className="muted">
        These help us plan materials and steps that fit UAE heat, humidity, and local supply.
      </p>

      {questions.map(q => (
        <label key={q.id} className="field">
          <span>{q.label}</span>
          {q.type === 'select' && q.options ? (
            <>
              <select
                value={usingCustom[q.id] ? OTHER_VALUE : (answers[q.id] ?? '')}
                onChange={e => handleSelectChange(q.id, e.target.value)}
              >
                <option value="">Select…</option>
                {q.options.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
                <option value={OTHER_VALUE}>Other (describe below)</option>
              </select>
              {usingCustom[q.id] && (
                <input
                  className="custom-input"
                  value={customInputs[q.id] ?? ''}
                  placeholder="Describe your specific requirement…"
                  onChange={e => handleCustomInput(q.id, e.target.value)}
                  autoFocus
                />
              )}
            </>
          ) : (
            <input
              value={answers[q.id] ?? ''}
              placeholder={q.placeholder}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            />
          )}
        </label>
      ))}

      <div className="actions">
        <button className="btn ghost" onClick={onBack} disabled={loading}>Back</button>
        <button
          className="btn primary"
          disabled={!allAnswered || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Planning…' : 'Generate plan'}
        </button>
      </div>
    </section>
  );
}
