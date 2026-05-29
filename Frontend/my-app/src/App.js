import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import BulkUploadBanner from './components/BulkUploadBanner';
import DemoCallout from './components/DemoCallout';
import DocumentsList from './components/DocumentsList';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import { API_BASE_URL, MIN_UPLOAD_LOADER_MS } from './utils/config';

function App() {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalSize = useMemo(
    () => selectedFiles.reduce((total, file) => total + file.size, 0),
    [selectedFiles]
  );
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const showBulkUploadBanner = selectedFiles.length > 3 || (isUploading && selectedFiles.length > 3);

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

  useEffect(() => {
    fetch(`${API_BASE_URL}/notifications`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load notifications.');
        return response.json();
      })
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
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
    const uploadStartedAt = Date.now();
    request.open('POST', `${API_BASE_URL}/documents/upload`);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setUploadProgress(Math.round((event.loaded * 100) / event.total));
    };

    request.onload = () => {
      const data = JSON.parse(request.responseText || '{}');
      const remainingLoaderTime = Math.max(0, MIN_UPLOAD_LOADER_MS - (Date.now() - uploadStartedAt));

      window.setTimeout(() => {
        setIsUploading(false);

        if (request.status >= 200 && request.status < 300) {
          setDocuments((current) => [...(data.documents || []), ...current]);
          setNotifications((current) => [...(data.notifications || []), ...current]);
          setSelectedFiles([]);
          setUploadProgress(100);
          setNotice(data.message || 'Upload complete.');
          return;
        }

        setError(data.message || 'Upload failed. Please try again.');
      }, remainingLoaderTime);
    };

    request.onerror = () => {
      const remainingLoaderTime = Math.max(0, MIN_UPLOAD_LOADER_MS - (Date.now() - uploadStartedAt));

      window.setTimeout(() => {
        setIsUploading(false);
        setError('Upload failed. Check that the backend is running.');
      }, remainingLoaderTime);
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
    window.open(`${API_BASE_URL}/documents/${document.docId}/preview`, '_blank');
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
      if (data.notification) {
        setNotifications((current) => [data.notification, ...current]);
      }
      setNotice(data.message || 'Document deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.message || 'Delete failed. Please try again.');
    } finally {
      setDeletingDocId('');
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    setIsNotificationOpen(false);

    try {
      await fetch(`${API_BASE_URL}/notifications`, { method: 'DELETE' });
    } catch {
      // The UI has already cleared; a future refresh will sync with the backend.
    }
  };

  const markAllRead = async () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read`, { method: 'PATCH' });
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch {
      // Local read state is already updated.
    }
  };

  return (
    <main className="app-shell">
      {showBulkUploadBanner && <BulkUploadBanner selectedFileCount={selectedFiles.length} />}
      <section className="workspace">
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          isNotificationOpen={isNotificationOpen}
          onToggleNotifications={() => setIsNotificationOpen((isOpen) => !isOpen)}
          onMarkAllRead={markAllRead}
          onClearNotifications={clearNotifications}
        />
        <DemoCallout />
        <UploadSection
          inputRef={inputRef}
          selectedFiles={selectedFiles}
          totalSize={totalSize}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          notice={notice}
          error={error}
          onAddFiles={addFiles}
          onUploadDocuments={uploadDocuments}
          onPreviewFile={previewSelectedFile}
          onRemoveFile={removeFile}
        />
        <DocumentsList
          documents={documents}
          isLoading={isLoading}
          deletingDocId={deletingDocId}
          onPreviewDocument={previewUploadedDocument}
          onDownloadDocument={downloadDocument}
          onDeleteDocument={deleteDocument}
        />
      </section>
    </main>
  );
}

export default App;
