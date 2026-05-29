import { EyeIcon, FileIcon, TrashIcon } from './Icons';
import { bytesToSize } from '../utils/formatters';

function FileQueue({ selectedFiles, uploadProgress, isUploading, onPreviewFile, onRemoveFile }) {
  return (
    <aside className="file-panel">
      <div className="panel-heading">
        <h2>Upload Queue</h2>
        <span>
          {isUploading && <span className="spinner inline" />}
          {selectedFiles.length ? `${selectedFiles.length} ${isUploading ? 'uploading' : 'queued'}` : 'Max 20 PDFs'}
        </span>
      </div>

      {selectedFiles.length ? (
        <div className="file-list">
          {selectedFiles.map((file, index) => (
            <div className={`file-row ${isUploading ? 'is-uploading' : ''}`} key={`${file.name}-${file.size}-${index}`}>
              <span className="queue-file-icon">
                <FileIcon />
              </span>
              <div className="queue-file-main">
                <div className="queue-file-title">
                  <strong>{file.name}</strong>
                  <span>{bytesToSize(file.size)}</span>
                </div>
                <div className="queue-progress-track">
                  <div
                    className="queue-progress-fill"
                    style={{ width: `${isUploading ? Math.max(uploadProgress, 8) : 0}%` }}
                  />
                </div>
              </div>
              {isUploading && <strong className="queue-progress-value">{Math.max(uploadProgress, 8)}%</strong>}
              <button
                className="icon-button preview"
                type="button"
                aria-label={`Preview ${file.name}`}
                title="Preview"
                onClick={() => onPreviewFile(file)}
                disabled={isUploading}
              >
                <EyeIcon />
              </button>
              <button
                className="icon-button danger"
                type="button"
                aria-label={`Remove ${file.name}`}
                title="Remove"
                onClick={() => onRemoveFile(index)}
                disabled={isUploading}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">Selected PDFs will appear here before upload.</div>
      )}
    </aside>
  );
}

export default FileQueue;
