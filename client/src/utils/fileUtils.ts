import JSZip from 'jszip';

interface FileEntry {
  name: string;
  content: string | Blob;
}

/**
 * Creates a ZIP file from an array of files
 * @param files Array of file entries to include in the ZIP
 * @returns Promise resolving to a Blob containing the ZIP file
 */
export async function createZipFile(files: FileEntry[]): Promise<Blob> {
  const zip = new JSZip();
  
  // Add each file to the ZIP
  files.forEach(file => {
    const parts = file.name.split('/');
    let folder = zip;
    
    // Create nested folders if needed
    if (parts.length > 1) {
      const folderPath = parts.slice(0, -1).join('/');
      folder = zip.folder(folderPath) || zip;
    }
    
    // Add the file to the ZIP
    const fileName = parts[parts.length - 1];
    folder.file(fileName, file.content);
  });
  
  // Generate the ZIP file
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Helper to convert a data URL to a Blob
 * @param dataUrl The data URL to convert
 * @returns Blob representation of the data URL
 */
export function dataURLToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Helper to convert text content to a downloadable link
 * @param content Text content
 * @param fileName Name of the file
 * @returns URL to download the file
 */
export function createDownloadLink(content: string, fileName: string): string {
  const blob = new Blob([content], { type: 'text/plain' });
  return URL.createObjectURL(blob);
}
