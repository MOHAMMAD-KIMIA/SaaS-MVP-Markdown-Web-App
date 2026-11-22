export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  location?: string;
  status?: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  location?: string;
}

export async function listCalendarEvents(accessToken: string, timeMin?: string): Promise<CalendarEvent[]> {
  const minTime = timeMin || new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    minTime
  )}&maxResults=25&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list Google Calendar events: ${response.statusText} (${errText})`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  input: CreateEventInput
): Promise<CalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const body = {
    summary: input.summary,
    description: input.description || 'Created from Markora Markdown Editor',
    start: {
      dateTime: input.startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: input.endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: input.location,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${response.statusText} (${errText})`);
  }

  return await response.json();
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 410) {
    const errText = await response.text();
    throw new Error(`Failed to delete Google Calendar event: ${response.statusText} (${errText})`);
  }
}
