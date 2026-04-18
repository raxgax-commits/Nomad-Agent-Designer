import { useRef, useState } from 'react';
import type { Sketch, SitePhoto } from '../types';

export type DescribeSubmit = {
  name: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  siteLocation: string;
  photos: SitePhoto[];
  sketches: Sketch[];
};

type Props = {
  onSubmit: (data: DescribeSubmit) => void;
  loading: boolean;
};

const MAX_PHOTOS = 5;
const MAX_SKETCHES = 5;
const MAX_SIZE_MB = 10;
const CAD_EXTENSIONS = ['.dwg', '.dxf'];

const MAX_DIMENSION = 1536;
const JPEG_QUALITY = 0.8;

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

function fileToSitePhoto(file: File): Promise<SitePhoto> {
  return compressImage(file).then(({ base64, mimeType }) => ({
    base64,
    mimeType,
    fileName: file.name,
  }));
}

function fileToSketch(file: File): Promise<Sketch> {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  const isCad = CAD_EXTENSIONS.includes(ext);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type || 'application/octet-stream', fileName: file.name, isCad });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function ProjectDescription({ onSubmit, loading }: Props) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [sketchPreviews, setSketchPreviews] = useState<string[]>([]);
  const [sketchError, setSketchError] = useState<string | null>(null);
  const sketchRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    name.trim().length > 0 &&
    customerName.trim().length > 0 &&
    desc.trim().length > 10 &&
    !loading;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setPhotoError(null);

    const incoming = Array.from(files);
    if (photos.length + incoming.length > MAX_PHOTOS) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    const tooBig = incoming.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setPhotoError(`"${tooBig.name}" exceeds ${MAX_SIZE_MB} MB.`);
      return;
    }

    const newPhotos = await Promise.all(incoming.map(fileToSitePhoto));
    const newPreviews = incoming.map(f => URL.createObjectURL(f));

    setPhotos(prev => [...prev, ...newPhotos]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleSketchFiles = async (files: FileList | null) => {
    if (!files) return;
    setSketchError(null);

    const incoming = Array.from(files);
    if (sketches.length + incoming.length > MAX_SKETCHES) {
      setSketchError(`Maximum ${MAX_SKETCHES} sketches allowed.`);
      return;
    }

    const tooBig = incoming.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setSketchError(`"${tooBig.name}" exceeds ${MAX_SIZE_MB} MB.`);
      return;
    }

    const newSketches = await Promise.all(incoming.map(fileToSketch));
    const newPreviews = incoming.map(f => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
      return CAD_EXTENSIONS.includes(ext) ? '' : URL.createObjectURL(f);
    });

    setSketches(prev => [...prev, ...newSketches]);
    setSketchPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSketch = (index: number) => {
    if (sketchPreviews[index]) URL.revokeObjectURL(sketchPreviews[index]);
    setSketches(prev => prev.filter((_, i) => i !== index));
    setSketchPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSketchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleSketchFiles(e.dataTransfer.files);
  };

  const submit = () => onSubmit({
    name: name.trim(),
    description: desc.trim(),
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail.trim(),
    siteLocation: siteLocation.trim(),
    photos,
    sketches,
  });

  return (
    <section className="card">
      <h2>Start a new project</h2>
      <p className="muted">
        Tell us what you want to build. Feature walls, seating, mud walls, courtyard art —
        anything rooted in our craft and the UAE landscape.
      </p>

      <div className="field-row">
        <label className="field">
          <span>Customer name</span>
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Ahmed Al Maktoum"
          />
        </label>

        <label className="field">
          <span>Customer phone / WhatsApp <span className="muted-inline">(optional)</span></span>
          <input
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            placeholder="+971 50 123 4567"
            inputMode="tel"
          />
        </label>

        <label className="field">
          <span>Customer email <span className="muted-inline">(optional)</span></span>
          <input
            type="email"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
            placeholder="ahmed@example.com"
          />
        </label>
      </div>

      <label className="field">
        <span>Project name</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Majlis courtyard feature wall"
        />
      </label>

      <label className="field">
        <span>Site location <span className="muted-inline">(optional — area, emirate, or address)</span></span>
        <input
          value={siteLocation}
          onChange={e => setSiteLocation(e.target.value)}
          placeholder="Al Ain, near Hili Archaeological Park"
        />
      </label>

      <label className="field">
        <span>Describe your project</span>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={6}
          placeholder="A 3m x 2m outdoor wall in cement rock art with Emirati motifs for a private majlis. Client wants warm desert tones and traditional patterns — palm, dune, and falcon silhouettes."
        />
      </label>

      <div className="field">
        <span>Site photos <span className="muted-inline">(optional — helps AI understand your space)</span></span>
        <div
          className={`photo-drop ${photos.length >= MAX_PHOTOS ? 'disabled' : ''}`}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => photos.length < MAX_PHOTOS && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
          />
          {photos.length === 0 ? (
            <div className="photo-drop-text">
              <span className="photo-drop-icon">📷</span>
              <span>Drop photos here or click to browse</span>
              <span className="muted-inline">Up to {MAX_PHOTOS} photos · {MAX_SIZE_MB} MB each</span>
            </div>
          ) : (
            <div className="photo-grid">
              {previews.map((src, i) => (
                <div key={i} className="photo-thumb">
                  <img src={src} alt={photos[i].fileName} />
                  <button
                    className="photo-remove"
                    onClick={e => { e.stopPropagation(); removePhoto(i); }}
                    title="Remove"
                  >×</button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <div className="photo-add-more">+ Add</div>
              )}
            </div>
          )}
        </div>
        {photoError && <span className="photo-error">{photoError}</span>}
      </div>

      <div className="field">
        <span>Sketches & drawings <span className="muted-inline">(optional — pencil sketches, 3D renders, AutoCAD .dwg/.dxf)</span></span>
        <div
          className={`photo-drop ${sketches.length >= MAX_SKETCHES ? 'disabled' : ''}`}
          onDragOver={e => e.preventDefault()}
          onDrop={handleSketchDrop}
          onClick={() => sketches.length < MAX_SKETCHES && sketchRef.current?.click()}
        >
          <input
            ref={sketchRef}
            type="file"
            accept="image/*,.dwg,.dxf"
            multiple
            hidden
            onChange={e => { handleSketchFiles(e.target.files); e.target.value = ''; }}
          />
          {sketches.length === 0 ? (
            <div className="photo-drop-text">
              <span className="photo-drop-icon">✏️</span>
              <span>Drop sketches here or click to browse</span>
              <span className="muted-inline">Images, .dwg, .dxf · Up to {MAX_SKETCHES} files · {MAX_SIZE_MB} MB each</span>
            </div>
          ) : (
            <div className="photo-grid">
              {sketchPreviews.map((src, i) => (
                <div key={i} className="photo-thumb">
                  {src ? (
                    <img src={src} alt={sketches[i].fileName} />
                  ) : (
                    <div className="cad-thumb">{sketches[i].fileName.split('.').pop()?.toUpperCase()}</div>
                  )}
                  <button
                    className="photo-remove"
                    onClick={e => { e.stopPropagation(); removeSketch(i); }}
                    title="Remove"
                  >×</button>
                </div>
              ))}
              {sketches.length < MAX_SKETCHES && (
                <div className="photo-add-more">+ Add</div>
              )}
            </div>
          )}
        </div>
        {sketchError && <span className="photo-error">{sketchError}</span>}
      </div>

      <div className="actions">
        <button className="btn primary" disabled={!canSubmit} onClick={submit}>
          {loading ? 'Thinking…' : 'Continue'}
        </button>
      </div>
    </section>
  );
}
