import { useState } from 'react';
import { PROJECT_STATUSES, type ProjectStatus } from '../types';

const KB_CATEGORIES = [
  'Mud Work',
  'Rock Art',
  'Wood Art Cement',
  'Interior Work',
  'General',
  'Suppliers & Pricing',
  'Seasonal Rules',
  'Signature Techniques',
] as const;

type Props = {
  onSave: (notes: string, status: ProjectStatus, targetStart: string, targetCompletion: string, corrections: string, correctionCategory: string) => void;
  onBack: () => void;
  loading: boolean;
};

export function NotesPanel({ onSave, onBack, loading }: Props) {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Lead');
  const [targetStart, setTargetStart] = useState('');
  const [targetCompletion, setTargetCompletion] = useState('');
  const [corrections, setCorrections] = useState('');
  const [correctionCategory, setCorrectionCategory] = useState<string>(KB_CATEGORIES[0]);

  return (
    <section className="card">
      <h2>Notes & status</h2>
      <p className="muted">
        Anything we should remember — client preferences, site quirks, things to change next
        time. Saved alongside the plan and image in Google Drive.
      </p>

      <label className="field">
        <span>Project status</span>
        <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Target start date <span className="muted-inline">(optional)</span></span>
          <input type="date" value={targetStart} onChange={e => setTargetStart(e.target.value)} />
        </label>
        <label className="field">
          <span>Target completion date <span className="muted-inline">(optional)</span></span>
          <input type="date" value={targetCompletion} onChange={e => setTargetCompletion(e.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          rows={5}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Client prefers darker earthy tones. Site is coastal — use salt-resistant mix."
        />
      </label>

      <div className="field">
        <span>Corrections for the knowledge base <span className="muted-inline">(optional — teaches the AI for future projects)</span></span>
        <textarea
          rows={3}
          value={corrections}
          onChange={e => setCorrections(e.target.value)}
          placeholder="e.g. Blocks should use straw and mud only, not sand. Base coat needs to be 3cm not 2cm."
        />
        {corrections.trim() && (
          <label className="field" style={{ marginTop: '0.5rem' }}>
            <span>Category</span>
            <select value={correctionCategory} onChange={e => setCorrectionCategory(e.target.value)}>
              {KB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack} disabled={loading}>Back</button>
        <button className="btn primary" onClick={() => onSave(notes, status, targetStart, targetCompletion, corrections.trim(), correctionCategory)} disabled={loading}>
          {loading ? 'Saving to Drive…' : 'Save project'}
        </button>
      </div>
    </section>
  );
}
