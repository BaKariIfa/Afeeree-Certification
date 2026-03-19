import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

export async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string
): Promise<{ url: string; id: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', { uri, type: mimeType, name: filename } as unknown as Blob);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json() as { url?: string; id?: string; filename?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Upload failed');
  return { url: data.url!, id: data.id!, filename: data.filename! };
}
