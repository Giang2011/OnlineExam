export interface DownloadBlobOptions {
  blob: Blob;
  fileName: string;
}

export const downloadBlob = ({ blob, fileName }: DownloadBlobOptions): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

export default downloadBlob;
