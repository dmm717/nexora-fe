export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFile(selectedFile: { type: string; size: number }): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
    return { valid: false, error: 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.' };
  }
  if (selectedFile.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Ảnh tối đa 5 MB.' };
  }
  return { valid: true };
}
