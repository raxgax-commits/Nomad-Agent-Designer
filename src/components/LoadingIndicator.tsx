import { useEffect, useState } from 'react';

export type LoadingStage = 'questions' | 'plan' | 'image' | 'save';

const MESSAGES: Record<LoadingStage, string[]> = {
  questions: [
    'Reading your project description…',
    'Studying the site photos…',
    'Drafting clarifying questions…',
  ],
  plan: [
    'Analyzing site photos…',
    'Estimating material quantities…',
    'Drafting the materials list…',
    'Writing ordered build steps…',
    'Adding UAE climate cautions…',
    'Validating the plan…',
  ],
  image: [
    'Sending prompt to Flux…',
    'Generating visual…',
    'Polling for the finished image…',
  ],
  save: [
    'Packaging project files…',
    'Creating Google Drive folder…',
    'Uploading everything…',
  ],
};

export function LoadingIndicator({ stage }: { stage: LoadingStage }) {
  const messages = MESSAGES[stage];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const t = setInterval(() => {
      setIndex(i => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(t);
  }, [stage, messages.length]);

  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{messages[index]}</span>
    </div>
  );
}
