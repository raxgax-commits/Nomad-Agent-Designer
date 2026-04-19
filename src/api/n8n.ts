import type { Plan, ProjectStatus, Question, Sketch, SitePhoto, ViewImage } from '../types';

const BASE = import.meta.env.VITE_N8N_BASE_URL;
const KEY = import.meta.env.VITE_N8N_SHARED_KEY;

if (!BASE) {
  console.warn('VITE_N8N_BASE_URL is not set. Copy .env.example to .env and configure it.');
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!BASE) throw new Error('n8n base URL not configured. Set VITE_N8N_BASE_URL in .env.');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (KEY) headers['X-Nomads-Key'] = KEY;

  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request to "${path}" failed (${res.status}). ${text}`.trim());
  }
  return res.json() as Promise<T>;
}

export type SaveProjectInput = {
  name: string;
  description: string;
  clientContact: {
    name: string;
    whatsapp?: string;
    email?: string;
    siteAddress?: string;
  };
  timeline: {
    targetStart?: string;
    targetCompletion?: string;
  };
  status: ProjectStatus;
  answers: Record<string, string>;
  plan: Plan;
  imagePrompt: string;
  imageUrl: string;
  viewImages?: { view: string; url: string }[];
  notes: string;
  corrections?: string;
  correctionCategory?: string;
  sitePhotos?: SitePhoto[];
};

export const api = {
  askQuestions: (description: string, sitePhotos?: SitePhoto[]) =>
    post<{ questions: Question[] }>('ask-questions', {
      description,
      ...(sitePhotos?.length ? { sitePhotos } : {}),
    }),

  generatePlan: (args: {
    description: string;
    answers: Record<string, string>;
    siteLocation?: string;
    sitePhotos?: SitePhoto[];
    hasSitePhotos?: boolean;
    hasSketches?: boolean;
    sketches?: Sketch[];
    hasInterior?: boolean;
    interiorDescription?: string;
  }) =>
    post<{ plan: Plan; imagePrompt: string; interiorPrompt?: string }>('generate-plan', args),

  generateImageOpenAI: (imagePrompt: string) =>
    post<{ imageUrl: string }>('generate-image-openai', { imagePrompt }),

  generateImageFlux: (imagePrompt: string, sitePhoto: string) =>
    post<{ imageUrl: string }>('generate-image-flux', { imagePrompt, sitePhoto }),

  generateImage: (imagePrompt: string, sitePhoto?: string) =>
    sitePhoto
      ? post<{ imageUrl: string }>('generate-image-flux', { imagePrompt, sitePhoto })
      : post<{ imageUrl: string }>('generate-image-openai', { imagePrompt }),

  saveProject: (input: SaveProjectInput) =>
    post<{ driveLink: string; photosFolderId: string }>('save-project', input),

  uploadSitePhotos: (folderId: string, sitePhotos: SitePhoto[]) =>
    post<{ success: boolean }>('upload-site-photos', { folderId, sitePhotos }),
};
