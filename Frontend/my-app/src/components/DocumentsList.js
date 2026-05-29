import { DownloadIcon, EyeIcon, FileIcon, TrashIcon } from './Icons';
import { bytesToSize, formatDate } from '../utils/formatters';

function DocumentsList({
  documents,
  isLoading,
  deletingDocId,
  onPreviewDocument,
  onDownloadDocument,
  onDeleteDocument
}) {
  return (
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
              <span className="tag blue">{document.uploadMode || 'single'}</span>
              <time>{formatDate(document.uploadDate)}</time>
              <div className="document-actions">
                <button
                  className="icon-button preview"
                  type="button"
                  aria-label={`Preview ${document.name}`}
                  title="Preview"
                  onClick={() => onPreviewDocument(document)}
                >
                  <EyeIcon />
                </button>
                <button
                  className="icon-button download"
                  type="button"
                  aria-label={`Download ${document.name}`}
                  title="Download"
                  onClick={() => onDownloadDocument(document)}
                >
                  <DownloadIcon />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  aria-label={`Delete ${document.name}`}
                  title="Delete"
                  onClick={() => onDeleteDocument(document)}
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
  );
}

export default DocumentsList;
