import { UploadIcon } from './Icons';
import { bytesToSize } from '../utils/formatters';

function UploadPanel({
  inputRef,
  selectedFiles,
  totalSize,
  uploadProgress,
  isUploading,
  notice,
  error,
  onAddFiles,
  onUploadDocuments
}) {
  return (
    <div className="upload-panel">
      <div
        className={`dropzone ${isUploading ? 'is-busy' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onAddFiles(event.dataTransfer.files);
        }}
      >
        <div className="hero-icon">
          {isUploading ? <span className="upload-loader" /> : <UploadIcon />}
        </div>
        <h2>{isUploading ? 'Uploading documents' : 'Upload PDF documents'}</h2>
        <p>
          {isUploading
            ? 'Keep this page open while your PDFs are sent to the document hub.'
            : 'Drop files here or choose individual and bulk PDFs from your device.'}
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <UploadIcon />
          Choose PDFs
        </button>
        <div className="upload-mode-pills">
          <span>Single file</span>
          <span>Bulk upload</span>
          <strong>Try 4+ files to trigger notifications</strong>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(event) => onAddFiles(event.target.files)}
          hidden
        />
      </div>

      <div className="selection-bar">
        <div>
          <strong>{selectedFiles.length}</strong> selected
          <span>{bytesToSize(totalSize)}</span>
        </div>
        <button
          className="primary-button compact"
          type="button"
          onClick={onUploadDocuments}
          disabled={isUploading || !selectedFiles.length}
        >
          {isUploading ? <span className="spinner" /> : <UploadIcon />}
          Upload now
        </button>
      </div>

      {isUploading && (
        <div className="progress-wrap" aria-label="Upload progress">
          <div className="progress-label">
            <span>Uploading files</span>
            <strong>{uploadProgress}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {(notice || error) && <div className={`notice ${error ? 'error' : 'success'}`}>{error || notice}</div>}
    </div>
  );
}

export default UploadPanel;
