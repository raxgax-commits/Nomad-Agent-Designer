type PhotoUploadStatus = 'idle' | 'uploading' | 'done' | 'error';

type Props = {
  driveLink: string;
  projectName: string;
  photoUploadStatus: PhotoUploadStatus;
  photoUploadError?: string;
  onRetryPhotos?: () => void;
  onNew: () => void;
};

export function SavedView({ driveLink, projectName, photoUploadStatus, photoUploadError, onRetryPhotos, onNew }: Props) {
  return (
    <section className="card saved">
      <h2>Saved</h2>
      <p className="muted">
        <strong>{projectName}</strong> is in your Google Drive — plan, design, and notes together.
      </p>

      {photoUploadStatus === 'uploading' && (
        <p className="photo-upload-status uploading">Uploading site photos…</p>
      )}
      {photoUploadStatus === 'done' && (
        <p className="photo-upload-status done">Site photos uploaded.</p>
      )}
      {photoUploadStatus === 'error' && (
        <div className="photo-upload-status error-status">
          <span>Photo upload failed{photoUploadError ? `: ${photoUploadError}` : '.'}</span>
          {onRetryPhotos && (
            <button className="btn-retry" onClick={onRetryPhotos}>Retry</button>
          )}
        </div>
      )}

      <div className="actions">
        <a className="btn ghost" href={driveLink} target="_blank" rel="noreferrer">
          Open in Google Drive
        </a>
        <button className="btn primary" onClick={onNew}>Start new project</button>
      </div>
    </section>
  );
}
