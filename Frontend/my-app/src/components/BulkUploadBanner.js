function BulkUploadBanner({ selectedFileCount }) {
  return (
    <div className="bulk-upload-banner">
      <span className="spinner light" />
      <strong>Upload in progress</strong>
      <span>processing {selectedFileCount} files in the background...</span>
    </div>
  );
}

export default BulkUploadBanner;
