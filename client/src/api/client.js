import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      message = (await res.json()).error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};

// Local YYYY-MM-DD (never UTC) so day-based data matches what the user sees.
export function localDate(d = new Date()) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

// ---- Members ----
export function useMembers() {
  return useQuery({ queryKey: ['members'], queryFn: () => api.get('/members') });
}

// ---- Chores ----
export function useChores(date) {
  return useQuery({
    queryKey: ['chores', date],
    queryFn: () => api.get(`/chores?date=${date}`),
  });
}

// ---- Routines ----
export function useRoutines(date) {
  return useQuery({
    queryKey: ['routines', date],
    queryFn: () => api.get(`/routines?date=${date}`),
  });
}

// ---- Settings ----
export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });
}

// ---- Reports ----
export function useReports() {
  return useQuery({ queryKey: ['reports'], queryFn: () => api.get('/reports') });
}

// ---- Progress ----
export function useProgress(from, to) {
  return useQuery({
    queryKey: ['progress', from, to],
    queryFn: () => api.get(`/progress?from=${from}&to=${to}`),
  });
}

// Generic mutation helper that invalidates the given query keys on success.
export function useApiMutation(mutationFn, invalidate = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] })),
  });
}
