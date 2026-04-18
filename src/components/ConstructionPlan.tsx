import { useEffect, useState } from 'react';
import type { Plan, PlanStep, ViewType } from '../types';
import { VIEW_OPTIONS } from '../types';

type Props = {
  plan: Plan;
  onPlanChange: (plan: Plan) => void;
  imagePrompt: string;
  onPromptChange: (prompt: string) => void;
  interiorPrompt: string;
  onInteriorPromptChange: (prompt: string) => void;
  selectedViews: ViewType[];
  onViewsChange: (views: ViewType[]) => void;
  interiorDescription: string;
  onInteriorDescriptionChange: (desc: string) => void;
  onGenerateImage: () => void;
  loading: boolean;
};

export function ConstructionPlan({ plan, onPlanChange, imagePrompt, onPromptChange, interiorPrompt, onInteriorPromptChange, selectedViews, onViewsChange, interiorDescription, onInteriorDescriptionChange, onGenerateImage, loading }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Plan>(plan);

  useEffect(() => {
    if (!editing) setDraft(plan);
  }, [plan, editing]);

  if (editing) {
    const save = () => {
      const cleaned: Plan = {
        materials: draft.materials.map(m => m.trim()).filter(Boolean),
        steps: draft.steps
          .map(s => ({ title: s.title.trim(), detail: s.detail.trim() }))
          .filter(s => s.title || s.detail),
        cautions: draft.cautions.map(c => c.trim()).filter(Boolean),
      };
      onPlanChange(cleaned);
      setEditing(false);
    };
    const cancel = () => {
      setDraft(plan);
      setEditing(false);
    };

    return (
      <section className="card">
        <h2>Edit plan</h2>
        <p className="muted">
          Adjust materials, steps, or cautions. Blank entries are removed on save.
        </p>

        <EditableList
          label="Materials"
          items={draft.materials}
          onChange={items => setDraft({ ...draft, materials: items })}
          placeholder="e.g. OPC 53-grade cement (Union Cement Company)"
        />

        <EditableSteps
          steps={draft.steps}
          onChange={steps => setDraft({ ...draft, steps })}
        />

        <EditableList
          label="UAE climate cautions"
          items={draft.cautions}
          warn
          onChange={items => setDraft({ ...draft, cautions: items })}
          placeholder="e.g. Schedule pours before 6:00 AM in summer months"
        />

        <div className="actions">
          <button className="btn ghost" onClick={cancel}>Cancel</button>
          <button className="btn primary" onClick={save}>Save changes</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="plan-header">
        <div>
          <h2>Construction plan</h2>
          <p className="muted">
            Drafted by Claude for UAE climate and materials. Review — or edit — before generating the visual.
          </p>
        </div>
        <button className="btn ghost small" onClick={() => setEditing(true)} disabled={loading}>
          Edit plan
        </button>
      </div>

      <div className="plan-section">
        <h3>Materials</h3>
        <ul className="bullets">
          {plan.materials.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>

      <div className="plan-section">
        <h3>Build steps</h3>
        <ol className="steps-list">
          {plan.steps.map((s, i) => (
            <li key={i}>
              <strong>{s.title}</strong>
              <p>{s.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="plan-section warn">
        <h3>UAE climate cautions</h3>
        <ul className="bullets">
          {plan.cautions.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>

      <PromptPreview
        label="Exterior image prompt"
        prompt={imagePrompt}
        onChange={onPromptChange}
        disabled={loading}
      />

      {selectedViews.includes('interior') && interiorPrompt && (
        <PromptPreview
          label="Interior image prompt"
          prompt={interiorPrompt}
          onChange={onInteriorPromptChange}
          disabled={loading}
        />
      )}

      <ViewSelector
        selected={selectedViews}
        onChange={onViewsChange}
        interiorDescription={interiorDescription}
        onInteriorDescriptionChange={onInteriorDescriptionChange}
        disabled={loading}
      />

      <div className="actions">
        <button className="btn primary" onClick={onGenerateImage} disabled={loading || selectedViews.length === 0}>
          {loading ? 'Generating design…' : `Generate design visual${selectedViews.length > 1 ? ` (${selectedViews.length} views)` : ''}`}
        </button>
      </div>
    </section>
  );
}

type EditableListProps = {
  label: string;
  items: string[];
  placeholder?: string;
  warn?: boolean;
  onChange: (items: string[]) => void;
};

function EditableList({ label, items, placeholder, warn, onChange }: EditableListProps) {
  const add = () => onChange([...items, '']);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const edit = (i: number, val: string) =>
    onChange(items.map((it, idx) => (idx === i ? val : it)));

  return (
    <div className={'plan-section' + (warn ? ' warn' : '')}>
      <h3>{label}</h3>
      <ul className="editable-list">
        {items.map((it, i) => (
          <li key={i}>
            <textarea
              value={it}
              onChange={e => edit(i, e.target.value)}
              rows={2}
              placeholder={placeholder}
            />
            <button
              type="button"
              className="btn-remove"
              onClick={() => remove(i)}
              aria-label={`Remove ${label.toLowerCase()} item ${i + 1}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn ghost small" onClick={add}>
        + Add {label.toLowerCase().replace(/s$/, '')}
      </button>
    </div>
  );
}

type EditableStepsProps = {
  steps: PlanStep[];
  onChange: (steps: PlanStep[]) => void;
};

function EditableSteps({ steps, onChange }: EditableStepsProps) {
  const add = () => onChange([...steps, { title: '', detail: '' }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const edit = (i: number, field: keyof PlanStep, val: string) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const arr = [...steps];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };

  return (
    <div className="plan-section">
      <h3>Build steps</h3>
      <ol className="editable-steps">
        {steps.map((s, i) => (
          <li key={i}>
            <input
              value={s.title}
              onChange={e => edit(i, 'title', e.target.value)}
              placeholder="Step title"
            />
            <textarea
              value={s.detail}
              onChange={e => edit(i, 'detail', e.target.value)}
              rows={3}
              placeholder="What happens in this step"
            />
            <div className="step-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="btn-remove" onClick={() => remove(i)}>× Remove step</button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn ghost small" onClick={add}>+ Add step</button>
    </div>
  );
}

type ViewSelectorProps = {
  selected: ViewType[];
  onChange: (views: ViewType[]) => void;
  interiorDescription: string;
  onInteriorDescriptionChange: (desc: string) => void;
  disabled: boolean;
};

function ViewSelector({ selected, onChange, interiorDescription, onInteriorDescriptionChange, disabled }: ViewSelectorProps) {
  const toggle = (key: ViewType) => {
    if (selected.includes(key)) {
      onChange(selected.filter(v => v !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="plan-section view-selector">
      <h3>Render views</h3>
      <p className="muted">
        Choose which angles to generate. Exterior uses your site photo as background; other views are generated from the plan description.
      </p>
      <div className="view-checkboxes">
        {VIEW_OPTIONS.map(opt => (
          <label key={opt.key} className="view-checkbox">
            <input
              type="checkbox"
              checked={selected.includes(opt.key)}
              onChange={() => toggle(opt.key)}
              disabled={disabled}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {selected.includes('interior') && (
        <div className="interior-desc">
          <label htmlFor="interior-desc">Describe the interior (optional — leave empty for AI to decide)</label>
          <textarea
            id="interior-desc"
            value={interiorDescription}
            onChange={e => onInteriorDescriptionChange(e.target.value)}
            rows={3}
            placeholder="e.g. Open-plan living area with traditional Emirati arches, polished concrete floor, warm lighting"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

type PromptPreviewProps = {
  label?: string;
  prompt: string;
  onChange: (prompt: string) => void;
  disabled: boolean;
};

function PromptPreview({ label = 'Image prompt', prompt, onChange, disabled }: PromptPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prompt);

  useEffect(() => {
    if (!editing) setDraft(prompt);
  }, [prompt, editing]);

  const save = () => {
    onChange(draft.trim());
    setEditing(false);
  };

  return (
    <div className="plan-section prompt-preview">
      <h3>{label}</h3>
      <p className="muted">
        This prompt will be sent to the image generator. Review and edit if needed before generating.
      </p>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={6}
            disabled={disabled}
          />
          <div className="actions">
            <button
              className="btn ghost small"
              onClick={() => { setDraft(prompt); setEditing(false); }}
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              className="btn primary small"
              onClick={save}
              disabled={disabled || !draft.trim()}
            >
              Save prompt
            </button>
          </div>
        </>
      ) : (
        <>
          <pre className="prompt-text">{prompt}</pre>
          <button
            className="btn ghost small"
            onClick={() => setEditing(true)}
            disabled={disabled}
          >
            Edit prompt
          </button>
        </>
      )}
    </div>
  );
}
