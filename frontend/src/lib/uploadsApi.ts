const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function uploadImage(accessToken: string, file: File) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_BASE}/uploads-api`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // DO NOT set Content-Type manually for FormData
    },
    credentials: "include",
    body: form,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);

  return data as { url: string };
}