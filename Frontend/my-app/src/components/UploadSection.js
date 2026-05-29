import FileQueue from './FileQueue';
import UploadPanel from './UploadPanel';

function UploadSection({
  inputRef,
  selectedFiles,
  totalSize,
  uploadProgress,
  isUploading,
  notice,
  error,
  onAddFiles,
  onUploadDocuments,
  onPreviewFile,
  onRemoveFile
}) {
  return (
    <section className="upload-layout">
      <UploadPanel
        inputRef={inputRef}
        selectedFiles={selectedFiles}
        totalSize={totalSize}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        notice={notice}
        error={error}
        onAddFiles={onAddFiles}
        onUploadDocuments={onUploadDocuments}
      />
      <FileQueue
        selectedFiles={selectedFiles}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onPreviewFile={onPreviewFile}
        onRemoveFile={onRemoveFile}
      />
    </section>
  );
}

export default UploadSection;
