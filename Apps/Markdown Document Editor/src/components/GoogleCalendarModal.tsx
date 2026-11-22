import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../app/components/ui/dialog';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Textarea } from '../app/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../app/components/ui/tabs';
import { useUIStore } from '../stores/uiStore';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEvent,
} from '../lib/calendar/calendarService';
import { Calendar, Plus, RefreshCw, Clock, Trash2, ExternalLink, CalendarDays, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function GoogleCalendarModal() {
  const { isCalendarModalOpen, closeCalendarModal } = useUIStore();
  const { getActiveDocument, updateDocumentContent } = useDocumentStore();
  const { accessToken, signIn, loading: authLoading } = useAuthStore();

  const activeDoc = getActiveDocument();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'create'>('upcoming');

  // Form State for creating a new calendar event
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [submitting, setSubmitting] = useState(false);

  // Confirmation state for deleting event
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isCalendarModalOpen && activeDoc) {
      setSummary(`Writing Session: ${activeDoc.title}`);
      setDescription(`Writing session for document "${activeDoc.title}".\n\nDaily goal: ${activeDoc.dailyWordGoal || 'None'}`);
    }
  }, [isCalendarModalOpen, activeDoc]);

  const fetchEvents = async () => {
    if (!accessToken) return;
    setLoadingEvents(true);
    try {
      const items = await listCalendarEvents(accessToken);
      setEvents(items);
    } catch (err: any) {
      console.error('Failed to load Google Calendar events:', err);
      toast.error(err.message || 'Failed to load Google Calendar events');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isCalendarModalOpen && accessToken) {
      fetchEvents();
    }
  }, [isCalendarModalOpen, accessToken]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!summary.trim()) {
      toast.error('Event summary/title is required');
      return;
    }

    setSubmitting(true);
    try {
      const startDateTimeStr = `${eventDate}T${startTime}:00`;
      const startDate = new Date(startDateTimeStr);
      const endDate = new Date(startDate.getTime() + parseInt(durationMinutes, 10) * 60000);

      const created = await createCalendarEvent(accessToken, {
        summary: summary.trim(),
        description: description.trim(),
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
      });

      toast.success(`Scheduled "${created.summary}" on Google Calendar!`);
      fetchEvents();
      setActiveTab('upcoming');
    } catch (err: any) {
      console.error('Create event error:', err);
      toast.error(err.message || 'Failed to create Google Calendar event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!accessToken || !eventToDelete) return;
    setDeleting(true);
    try {
      await deleteCalendarEvent(accessToken, eventToDelete.id);
      toast.success(`Deleted event "${eventToDelete.summary}" from Google Calendar`);
      setEventToDelete(null);
      fetchEvents();
    } catch (err: any) {
      console.error('Delete event error:', err);
      toast.error(err.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleInsertEventToDoc = (event: CalendarEvent) => {
    if (!activeDoc) return;
    const startStr = event.start.dateTime
      ? new Date(event.start.dateTime).toLocaleString()
      : event.start.date || '';

    const markdownSnippet = `\n\n> 📅 **Calendar Event**: [${event.summary}](${event.htmlLink || '#'})
> **When**: ${startStr}
${event.description ? `> **Notes**: ${event.description}\n` : ''}\n`;

    updateDocumentContent(activeDoc.id, activeDoc.content + markdownSnippet);
    toast.success('Inserted Calendar event into current document!');
  };

  return (
    <Dialog open={isCalendarModalOpen} onOpenChange={(open) => !open && closeCalendarModal()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-500" />
            Google Calendar Integration
          </DialogTitle>
          <DialogDescription>
            Schedule writing sessions, manage deadlines, and insert calendar events into your Markdown documents.
          </DialogDescription>
        </DialogHeader>

        {!accessToken ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <CalendarDays className="h-12 w-12 text-muted-foreground/60 animate-bounce" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Connect Google Calendar</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Sign in with Google to view your schedule and sync your document writing sessions with Google Calendar.
              </p>
            </div>
            <Button
              onClick={() => signIn()}
              disabled={authLoading}
              className="mt-2 bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 shadow-sm gap-2 text-sm font-medium px-4 py-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Upcoming Events
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Schedule Session
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: UPCOMING CALENDAR EVENTS */}
            <TabsContent value="upcoming" className="space-y-4 pt-3">
              {eventToDelete ? (
                <div className="border border-destructive/50 bg-destructive/10 p-4 rounded-md space-y-3">
                  <div className="flex items-start gap-2.5 text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Delete Event Confirmation</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Are you sure you want to delete <strong>"{eventToDelete.summary}"</strong> from your Google Calendar?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEventToDelete(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteConfirmed}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete Event'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Events from your primary Google Calendar
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchEvents}
                      disabled={loadingEvents}
                      className="h-7 text-xs gap-1"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                    {loadingEvents ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        Loading events from Google Calendar...
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground space-y-1">
                        <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p>No upcoming events found on your Google Calendar.</p>
                      </div>
                    ) : (
                      events.map((event) => {
                        const dateFormatted = event.start.dateTime
                          ? new Date(event.start.dateTime).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : event.start.date || 'All Day';

                        return (
                          <div
                            key={event.id}
                            className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{event.summary}</p>
                                <p className="text-[11px] text-muted-foreground">{dateFormatted}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {activeDoc && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleInsertEventToDoc(event)}
                                  title="Insert into document"
                                  className="h-8 w-8 p-0"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {event.htmlLink && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                  className="h-8 w-8 p-0"
                                  title="View on Google Calendar"
                                >
                                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEventToDelete(event)}
                                title="Delete event"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB 2: CREATE / SCHEDULE SESSION */}
            <TabsContent value="create" className="pt-3">
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Event Title</label>
                  <Input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Writing session title"
                    required
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date</label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Start Time</label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Duration</label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Description / Notes</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details or writing goals..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={submitting} className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {submitting ? 'Scheduling...' : 'Schedule Event'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
