import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { ProjectDescription } from './components/ProjectDescription';
import { ClarifyingQuestions } from './components/ClarifyingQuestions';
import { ConstructionPlan } from './components/ConstructionPlan';
import { GeneratedImage } from './components/GeneratedImage';
import { NotesPanel } from './components/NotesPanel';
import { SavedView } from './components/SavedView';
import { LoadingIndicator, type LoadingStage } from './components/LoadingIndicator';
import type { DescribeSubmit } from './components/ProjectDescription';
import { api } from './api/n8n';
import type { Plan, ProjectStatus, Question, Sketch, SitePhoto, Step, ViewImage, ViewType } from './types';

const BASELINE_QUESTIONS: Question[] = [
  {
    id: '_budget',
    label: 'Budget range (AED)',
    type: 'select',
    options: [
      'Under 5,000',
      '5,000 – 15,000',
      '15,000 – 40,000',
      '40,000 – 100,000',
      '100,000+',
    ],
  },
  {
    id: '_timeline',
    label: 'Expected timeline',
    type: 'select',
    options: [
      'Less than 1 week',
      '1 – 2 weeks',
      '2 – 4 weeks',
      '1 – 3 months',
      'No rush / flexible',
    ],
  },
  {
    id: '_location',
    label: 'Site location',
    type: 'select',
    options: [
      'Indoor',
      'Outdoor – shaded',
      'Outdoor – direct sun',
      'Both indoor & outdoor',
    ],
  },
  {
    id: '_scale',
    label: 'Approximate project area',
    type: 'text',
    placeholder: 'e.g. 3m × 2m wall, 20 sqm courtyard',
  },
  {
    id: '_style',
    label: 'Preferred style',
    type: 'select',
    options: [
      'Traditional Emirati / Arabic',
      'Modern minimalist',
      'Rustic natural',
      'Mixed / fusion',
    ],
  },
];

function mergeQuestions(baseline: Question[], dynamic: Question[]): Question[] {
  const baselineIds = new Set(baseline.map(q => q.id));
  const dedupedDynamic = dynamic.filter(q => !baselineIds.has(q.id));
  return [...baseline, ...dedupedDynamic];
}

const DRAFT_KEY = 'nomads-design-studio:draft:v1';

type Draft = {
  step: Step;
  name: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  siteLocation: string;
  sitePhotos: SitePhoto[];
  sketches: Sketch[];
  questions: Question[];
  answers: Record<string, string>;
  plan: Plan | null;
  imagePrompt: string;
  interiorPrompt: string;
  imageUrl: string;
  selectedViews: ViewType[];
  interiorDescription: string;
  viewImages: ViewImage[];
  driveLink: string;
};

function loadDraft(): Partial<Draft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Partial<Draft>;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  const attempt = (value: Draft) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  };
  try {
    attempt(draft);
  } catch {
    try {
      attempt({ ...draft, sitePhotos: [] });
    } catch {
      // quota still exceeded without photos — give up silently
    }
  }
}

export default function App() {
  const saved = useRef<Partial<Draft> | null>(loadDraft()).current;

  const [step, setStep] = useState<Step>(saved?.step ?? 'describe');
  const [name, setName] = useState(saved?.name ?? '');
  const [description, setDescription] = useState(saved?.description ?? '');
  const [customerName, setCustomerName] = useState(saved?.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(saved?.customerPhone ?? '');
  const [customerEmail, setCustomerEmail] = useState(saved?.customerEmail ?? '');
  const [siteLocation, setSiteLocation] = useState(saved?.siteLocation ?? '');
  const [sitePhotos, setSitePhotos] = useState<SitePhoto[]>(saved?.sitePhotos ?? []);
  const [sketches, setSketches] = useState<Sketch[]>(saved?.sketches ?? []);
  const [questions, setQuestions] = useState<Question[]>(saved?.questions ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [plan, setPlan] = useState<Plan | null>(saved?.plan ?? null);
  const [imagePrompt, setImagePrompt] = useState(saved?.imagePrompt ?? '');
  const [interiorPrompt, setInteriorPrompt] = useState(saved?.interiorPrompt ?? '');
  const [imageUrl, setImageUrl] = useState(saved?.imageUrl ?? '');
  const [selectedViews, setSelectedViews] = useState<ViewType[]>(saved?.selectedViews ?? ['exterior']);
  const [interiorDescription, setInteriorDescription] = useState(saved?.interiorDescription ?? '');
  const [viewImages, setViewImages] = useState<ViewImage[]>(saved?.viewImages ?? []);
  const [driveLink, setDriveLink] = useState(saved?.driveLink ?? '');

  const [loadingStage, setLoadingStage] = useState<LoadingStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [photoUploadError, setPhotoUploadError] = useState<string | undefined>();

  useEffect(() => {
    saveDraft({
      step, name, description, customerName, customerPhone, customerEmail, siteLocation,
      sitePhotos, sketches, questions, answers, plan, imagePrompt, interiorPrompt, imageUrl,
      selectedViews, interiorDescription, viewImages, driveLink,
    });
  }, [step, name, description, customerName, customerPhone, customerEmail, siteLocation, sitePhotos, sketches, questions, answers, plan, imagePrompt, interiorPrompt, imageUrl, selectedViews, interiorDescription, viewImages, driveLink]);

  async function run<T>(stage: LoadingStage, task: () => Promise<T>): Promise<T | null> {
    setError(null);
    setRetryFn(null);
    setLoadingStage(stage);
    try {
      return await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoadingStage(null);
    }
  }

  const handleDescribe = async (data: DescribeSubmit) => {
    setName(data.name);
    setDescription(data.description);
    setCustomerName(data.customerName);
    setCustomerPhone(data.customerPhone);
    setCustomerEmail(data.customerEmail);
    setSiteLocation(data.siteLocation);
    setSitePhotos(data.photos);
    setSketches(data.sketches);
    const attempt = async () => {
      const res = await run('questions', () => api.askQuestions(data.description, data.photos));
      if (res) {
        setQuestions(mergeQuestions(BASELINE_QUESTIONS, res.questions));
        setStep('clarify');
      } else {
        setRetryFn(() => attempt);
      }
    };
    await attempt();
  };

  const handleClarify = async (a: Record<string, string>) => {
    setAnswers(a);
    const attempt = async () => {
      const imageSketches = sketches.filter(s => !s.isCad);
      const res = await run('plan', () =>
        api.generatePlan({
          description,
          answers: a,
          ...(siteLocation ? { siteLocation } : {}),
          sitePhotos: sitePhotos.slice(0, 2).filter(p => !p.base64 || p.base64.length <= 500000),
          hasSitePhotos: sitePhotos.length > 0,
          hasSketches: imageSketches.length > 0,
          sketches: imageSketches.slice(0, 2).filter(s => s.base64.length <= 500000),
          hasInterior: true,
        }),
      );
      if (res) {
        setPlan(res.plan);
        setImagePrompt(res.imagePrompt);
        if (res.interiorPrompt) setInteriorPrompt(res.interiorPrompt);
        setStep('plan');
      } else {
        setRetryFn(() => attempt);
      }
    };
    await attempt();
  };

  const firstImageSketch = sketches.find(s => !s.isCad);
  const fluxInputImage = firstImageSketch?.base64 ?? (sitePhotos.length > 0 ? sitePhotos[0].base64 : undefined);

  const buildViewPrompt = (view: ViewType) => {
    if (view === 'exterior') return imagePrompt;

    if (view === 'interior' && interiorPrompt) return interiorPrompt;

    const designDesc = imagePrompt
      .replace(/Keep the entire existing photo exactly unchanged[^.]*\./i, '')
      .replace(/all background, sky, ground, and surroundings must remain identical\.\s*/i, '')
      .replace(/^\s+/, '');

    const viewInstructions: Record<ViewType, string> = {
      exterior: '',
      interior: 'Interior view of this building showing the inside rooms, walls, ceiling, and floor details. The building features: ',
      sideProfile: 'Side profile architectural view showing the full width and height of the building from the side. The building features: ',
      birdsEye: "Aerial bird's eye view looking straight down at the building and surrounding area. The building features: ",
    };

    return viewInstructions[view] + designDesc;
  };

  const generateViews = async (views: ViewType[]): Promise<ViewImage[] | null> => {
    const results: ViewImage[] = [];
    for (const view of views) {
      const prompt = buildViewPrompt(view);
      const inputImage = view === 'exterior' ? fluxInputImage : undefined;
      const res = await api.generateImage(prompt, inputImage);
      results.push({ view, url: res.imageUrl, prompt });
    }
    return results;
  };

  const handleImage = async () => {
    const attempt = async () => {
      const res = await run('image', async () => {
        const imgs = await generateViews(selectedViews);
        return imgs;
      });
      if (res) {
        setViewImages(res);
        setImageUrl(res[0]?.url ?? '');
        setStep('image');
      } else {
        setRetryFn(() => attempt);
      }
    };
    await attempt();
  };

  const handleRegenerateImage = async () => {
    const attempt = async () => {
      const res = await run('image', async () => {
        const imgs = await generateViews(selectedViews);
        return imgs;
      });
      if (res) {
        setViewImages(res);
        setImageUrl(res[0]?.url ?? '');
      } else {
        setRetryFn(() => attempt);
      }
    };
    await attempt();
  };

  const handleRegenerateSingleView = async (view: ViewType) => {
    const attempt = async () => {
      const prompt = buildViewPrompt(view);
      const inputImage = view === 'exterior' ? fluxInputImage : undefined;
      const res = await run('image', () => api.generateImage(prompt, inputImage));
      if (res) {
        setViewImages(prev =>
          prev.map(vi => vi.view === view ? { view, url: res.imageUrl, prompt } : vi),
        );
        if (viewImages.length > 0 && viewImages[0].view === view) {
          setImageUrl(res.imageUrl);
        }
      } else {
        setRetryFn(() => attempt);
      }
    };
    await attempt();
  };

  const uploadPhotos = async (folderId: string) => {
    setPhotoUploadStatus('uploading');
    setPhotoUploadError(undefined);
    try {
      await api.uploadSitePhotos(folderId, sitePhotos);
      setPhotoUploadStatus('done');
    } catch (e) {
      setPhotoUploadError(e instanceof Error ? e.message : String(e));
      setPhotoUploadStatus('error');
    }
  };

  const photosFolderIdRef = useRef<string>('');

  const handleSave = async (notes: string, status: ProjectStatus, targetStart: string, targetCompletion: string, corrections: string, correctionCategory: string) => {
    if (!plan) return;
    const attempt = async () => {
      const res = await run('save', () =>
        api.saveProject({
          name,
          description,
          clientContact: {
            name: customerName,
            ...(customerPhone ? { whatsapp: customerPhone } : {}),
            ...(customerEmail ? { email: customerEmail } : {}),
            ...(siteLocation ? { siteAddress: siteLocation } : {}),
          },
          timeline: {
            ...(targetStart ? { targetStart } : {}),
            ...(targetCompletion ? { targetCompletion } : {}),
          },
          status,
          answers,
          plan,
          imagePrompt,
          imageUrl,
          viewImages: viewImages.map(vi => ({ view: vi.view, url: vi.url })),
          notes,
          ...(corrections ? { corrections, correctionCategory } : {}),
        }),
      );
      if (res) {
        setDriveLink(res.driveLink);
        setStep('saved');
        if (sitePhotos.length > 0 && res.photosFolderId) {
          photosFolderIdRef.current = res.photosFolderId;
          uploadPhotos(res.photosFolderId);
        }
      } else {
        setRetryFn(() => attempt);
      }
    };
    await attempt();
  };

  const reset = () => {
    setStep('describe');
    setName('');
    setDescription('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSiteLocation('');
    setSitePhotos([]);
    setSketches([]);
    setQuestions([]);
    setAnswers({});
    setPlan(null);
    setImagePrompt('');
    setInteriorPrompt('');
    setImageUrl('');
    setSelectedViews(['exterior']);
    setInteriorDescription('');
    setViewImages([]);
    setDriveLink('');
    setError(null);
    setRetryFn(null);
    setPhotoUploadStatus('idle');
    setPhotoUploadError(undefined);
    photosFolderIdRef.current = '';
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const loading = loadingStage !== null;

  return (
    <div className="app">
      <Header />
      <main className="main">
        {step !== 'saved' && <StepIndicator current={step} onNavigate={setStep} />}

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            {retryFn && (
              <button
                className="btn-retry"
                onClick={() => { const fn = retryFn; setRetryFn(null); fn(); }}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {loadingStage && <LoadingIndicator stage={loadingStage} />}

        {step === 'describe' && (
          <ProjectDescription onSubmit={handleDescribe} loading={loading} />
        )}

        {step === 'clarify' && (
          <ClarifyingQuestions
            questions={questions}
            onSubmit={handleClarify}
            onBack={() => setStep('describe')}
            loading={loading}
          />
        )}

        {step === 'plan' && plan && (
          <ConstructionPlan
            plan={plan}
            onPlanChange={setPlan}
            imagePrompt={imagePrompt}
            onPromptChange={setImagePrompt}
            interiorPrompt={interiorPrompt}
            onInteriorPromptChange={setInteriorPrompt}
            selectedViews={selectedViews}
            onViewsChange={setSelectedViews}
            interiorDescription={interiorDescription}
            onInteriorDescriptionChange={setInteriorDescription}
            onGenerateImage={handleImage}
            loading={loading}
          />
        )}

        {step === 'image' && viewImages.length > 0 && (
          <GeneratedImage
            viewImages={viewImages}
            onRegenerateAll={handleRegenerateImage}
            onRegenerateView={handleRegenerateSingleView}
            onContinue={() => setStep('notes')}
            loading={loading}
          />
        )}

        {step === 'notes' && (
          <NotesPanel
            onSave={handleSave}
            onBack={() => setStep('image')}
            loading={loading}
          />
        )}

        {step === 'saved' && (
          <SavedView
            driveLink={driveLink}
            projectName={name}
            photoUploadStatus={photoUploadStatus}
            photoUploadError={photoUploadError}
            onRetryPhotos={photosFolderIdRef.current ? () => uploadPhotos(photosFolderIdRef.current) : undefined}
            onNew={reset}
          />
        )}
      </main>
      <footer className="footer">Crafted by The Nomads · United Arab Emirates</footer>
    </div>
  );
}
