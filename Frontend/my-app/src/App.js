import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const bytesToSize = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent ? 1 : 0)} ${units[exponent]}`;
};

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M20 16.5v1.75A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25V16.5" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="m19 6-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);

function App() {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalSize = useMemo(
    () => selectedFiles.reduce((total, file) => total + file.size, 0),
    [selectedFiles]
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/documents`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load documents.');
        return response.json();
      })
      .then((data) => setDocuments(data.documents || []))
      .catch(() => setError('Unable to load existing documents. Start the backend and try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const pdfs = incoming.filter((file) => file.type === 'application/pdf');

    setError(pdfs.length === incoming.length ? '' : 'Only PDF files can be uploaded.');
    setNotice('');
    setSelectedFiles((current) => {
      const known = new Set(current.map((file) => `${file.name}-${file.size}`));
      const next = pdfs.filter((file) => !known.has(`${file.name}-${file.size}`));
      return [...current, ...next].slice(0, 20);
    });
  };

  const uploadDocuments = () => {
    if (!selectedFiles.length) {
      setError('Select one or more PDF files first.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('documents', file));

    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE_URL}/documents/upload`);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setUploadProgress(Math.round((event.loaded * 100) / event.total));
    };

    request.onload = () => {
      const data = JSON.parse(request.responseText || '{}');
      setIsUploading(false);

      if (request.status >= 200 && request.status < 300) {
        setDocuments((current) => [...(data.documents || []), ...current]);
        setSelectedFiles([]);
        setUploadProgress(100);
        setNotice(data.message || 'Upload complete.');
        return;
      }

      setError(data.message || 'Upload failed. Please try again.');
    };

    request.onerror = () => {
      setIsUploading(false);
      setError('Upload failed. Check that the backend is running.');
    };

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setNotice('');
    request.send(formData);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((files) => files.filter((_, index) => index !== indexToRemove));
  };

  const previewSelectedFile = (file) => {
    const previewUrl = URL.createObjectURL(file);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 30000);
  };

  const previewUploadedDocument = (document) => {
    window.open(`${API_BASE_URL}/documents/${document.docId}/preview`, '_blank', 'noopener,noreferrer');
  };

  const downloadDocument = (document) => {
    const link = window.document.createElement('a');
    link.href = `${API_BASE_URL}/documents/${document.docId}/download`;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const deleteDocument = async (document) => {
    const shouldDelete = window.confirm(`Delete ${document.name}?`);

    if (!shouldDelete) return;

    setDeletingDocId(document.docId);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${document.docId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Delete failed.');
      }

      setDocuments((current) => current.filter((item) => item.docId !== document.docId));
      setNotice(data.message || 'Document deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.message || 'Delete failed. Please try again.');
    } finally {
      setDeletingDocId('');
    }
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">SWSAI Document Hub</p>
            <h1>Company PDF uploads</h1>
          </div>
          <div className="status-pill">
            <span />
            Upload service
          </div>
        </header>

        <section className="upload-layout">
          <div className="upload-panel">
            <div
              className={`dropzone ${isUploading ? 'is-busy' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
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
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={(event) => addFiles(event.target.files)}
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
                onClick={uploadDocuments}
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

            {(notice || error) && (
              <div className={`notice ${error ? 'error' : 'success'}`}>{error || notice}</div>
            )}
          </div>

          <aside className="file-panel">
            <div className="panel-heading">
              <h2>Ready queue</h2>
              <span>Max 20 PDFs</span>
            </div>

            {selectedFiles.length ? (
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div className="file-row" key={`${file.name}-${file.size}-${index}`}>
                    <FileIcon />
                    <div>
                      <strong>{file.name}</strong>
                      <span>{bytesToSize(file.size)}</span>
                    </div>
                    <button
                      className="icon-button preview"
                      type="button"
                      aria-label={`Preview ${file.name}`}
                      title="Preview"
                      onClick={() => previewSelectedFile(file)}
                      disabled={isUploading}
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      title="Remove"
                      onClick={() => removeFile(index)}
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
        </section>

        <section className="documents-band">
          <div className="panel-heading">
            <h2>Uploaded documents</h2>
            <span>{documents.length} total</span>
          </div>

          {isLoading ? (
            <div className="loading-row">
              <span className="spinner" />
              Loading documents
            </div>
          ) : documents.length ? (
            <div className="document-table">
              {documents.map((document) => (
                <div className="document-row" key={document.docId}>
                  <FileIcon />
                  <strong>{document.name}</strong>
                  <span>{bytesToSize(document.size)}</span>
                  <span className="tag">{document.type}</span>
                  <time>{formatDate(document.uploadDate)}</time>
                  <div className="document-actions">
                    <button
                      className="icon-button preview"
                      type="button"
                      aria-label={`Preview ${document.name}`}
                      title="Preview"
                      onClick={() => previewUploadedDocument(document)}
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className="icon-button download"
                      type="button"
                      aria-label={`Download ${document.name}`}
                      title="Download"
                      onClick={() => downloadDocument(document)}
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label={`Delete ${document.name}`}
                      title="Delete"
                      onClick={() => deleteDocument(document)}
                      disabled={deletingDocId === document.docId}
                    >
                      {deletingDocId === document.docId ? <span className="spinner tiny" /> : <TrashIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state wide">No documents uploaded yet.</div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
