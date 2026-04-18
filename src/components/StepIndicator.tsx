import type { Step } from '../types';

const STEPS: { key: Step; label: string }[] = [
  { key: 'describe', label: 'Describe' },
  { key: 'clarify', label: 'Clarify' },
  { key: 'plan', label: 'Plan' },
  { key: 'image', label: 'Design' },
  { key: 'notes', label: 'Refine' },
];

type Props = {
  current: Step;
  onNavigate?: (step: Step) => void;
};

export function StepIndicator({ current, onNavigate }: Props) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <ol className="steps" aria-label="Progress">
      {STEPS.map((s, i) => {
        const clickable = onNavigate && i < idx;
        return (
          <li
            key={s.key}
            className={`step ${i <= idx ? 'active' : ''} ${i === idx ? 'current' : ''} ${clickable ? 'clickable' : ''}`}
            onClick={clickable ? () => onNavigate(s.key) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(s.key); } : undefined}
          >
            <span className="step-num">{i + 1}</span>
            <span className="step-label">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
