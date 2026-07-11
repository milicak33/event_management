export const API = "http://localhost:8080";

export async function request(path, options = {}) {
  const token = sessionStorage.getItem("token");
  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Došlo je do greške.");
  }
  return data;
}
