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

function App() {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
            Node + MongoDB
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
                <UploadIcon />
              </div>
              <h2>Upload PDF documents</h2>
              <p>Drop files here or choose individual and bulk PDFs from your device.</p>
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
                      className="icon-button"
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      x
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
                <div className="document-row" key={document._id}>
                  <FileIcon />
                  <strong>{document.originalName}</strong>
                  <span>{bytesToSize(document.size)}</span>
                  <span className="tag">{document.uploadType}</span>
                  <span className="tag blue">{document.status}</span>
                  <time>{formatDate(document.createdAt)}</time>
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
