// Removed from client/src/api/client.js when the calendar feature was stripped (2026-08-15).

// ---- Calendars ----
export function useCalendars() {
  return useQuery({ queryKey: ['calendars'], queryFn: () => api.get('/calendars') });
}

// ---- Events ----
export function useEvents(from, to) {
  return useQuery({
    queryKey: ['events', from, to],
    queryFn: () => api.get(`/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    enabled: Boolean(from && to),
  });
}
