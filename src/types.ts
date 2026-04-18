export type Question = {
  id: string;
  label: string;
  type: 'text' | 'select';
  options?: string[];
  placeholder?: string;
};

export type PlanStep = {
  title: string;
  detail: string;
};

export type Plan = {
  materials: string[];
  steps: PlanStep[];
  cautions: string[];
};

export type SitePhoto = {
  base64: string;
  mimeType: string;
  fileName: string;
};

export type Sketch = {
  base64: string;
  mimeType: string;
  fileName: string;
  isCad: boolean;
};

export type ViewType = 'exterior' | 'interior' | 'sideProfile' | 'birdsEye';

export const VIEW_OPTIONS: { key: ViewType; label: string }[] = [
  { key: 'exterior', label: 'Exterior' },
  { key: 'interior', label: 'Interior' },
  { key: 'sideProfile', label: 'Side profile' },
  { key: 'birdsEye', label: "Bird's eye" },
];

export type ViewImage = {
  view: ViewType;
  url: string;
  prompt: string;
};

export type Step = 'describe' | 'clarify' | 'plan' | 'image' | 'notes' | 'saved';

export const PROJECT_STATUSES = [
  'Lead',
  'Quoted',
  'Approved',
  'In progress',
  'Completed',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
