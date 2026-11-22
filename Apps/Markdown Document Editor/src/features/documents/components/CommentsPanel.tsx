import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  CornerDownRight,
  Edit2,
  MessageSquare,
  MessageSquarePlus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  type CommentFilter,
  matchesCommentSearch,
  useCommentStore,
} from '../../../stores/commentStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Textarea } from '../../../app/components/ui/textarea';
import { ScrollArea } from '../../../app/components/ui/scroll-area';
import { formatRelativeTime } from '../../../lib/utils/dates';
import { cn } from '../../../lib/utils/cn';

interface CommentsPanelProps {
  className?: string;
  onJumpToRange?: () => void;
}

export function CommentsPanel({ className, onJumpToRange }: CommentsPanelProps) {
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const documents = useDocumentStore((s) => s.documents);
  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  const comments = useCommentStore((s) => s.comments);
  const pendingDraft = useCommentStore((s) => s.pendingDraft);
  const authorName = useCommentStore((s) => s.authorName);
  const filter = useCommentStore((s) => s.filter);
  const searchQuery = useCommentStore((s) => s.searchQuery);
  const lastAddedCommentId = useCommentStore((s) => s.lastAddedCommentId);
  const lastAddedReplyId = useCommentStore((s) => s.lastAddedReplyId);
  const setAuthorName = useCommentStore((s) => s.setAuthorName);
  const setFilter = useCommentStore((s) => s.setFilter);
  const setSearchQuery = useCommentStore((s) => s.setSearchQuery);
  const addComment = useCommentStore((s) => s.addComment);
  const updateComment = useCommentStore((s) => s.updateComment);
  const addReply = useCommentStore((s) => s.addReply);
  const deleteReply = useCommentStore((s) => s.deleteReply);
  const toggleResolved = useCommentStore((s) => s.toggleResolved);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const setPendingDraft = useCommentStore((s) => s.setPendingDraft);

  const [newCommentText, setNewCommentText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pendingDraft && pendingDraft.documentId !== activeDocumentId) {
      setPendingDraft(null);
    }
  }, [activeDocumentId, pendingDraft, setPendingDraft]);

  const docComments = useMemo(() => {
    if (!activeDocumentId) return [];
    return comments.filter((c) => c.documentId === activeDocumentId);
  }, [comments, activeDocumentId]);

  const searchedComments = useMemo(() => {
    if (!searchQuery.trim()) return docComments;
    return docComments.filter((c) => matchesCommentSearch(c, searchQuery));
  }, [docComments, searchQuery]);

  const unresolvedCount = searchedComments.filter((c) => !c.resolved).length;
  const resolvedCount = searchedComments.filter((c) => Boolean(c.resolved)).length;

  const filteredComments = useMemo(() => {
    if (filter === 'unresolved') return searchedComments.filter((c) => !c.resolved);
    if (filter === 'resolved') return searchedComments.filter((c) => Boolean(c.resolved));
    return searchedComments;
  }, [searchedComments, filter]);

  const hasPendingSelection = Boolean(
    pendingDraft &&
      pendingDraft.documentId === activeDocumentId &&
      pendingDraft.quotedText.trim()
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeDocumentId || !hasPendingSelection || !pendingDraft || !newCommentText.trim()) {
      return;
    }

    addComment({
      documentId: activeDocumentId,
      text: newCommentText,
      author: authorName,
      quotedText: pendingDraft.quotedText,
      range: pendingDraft.range,
    });
    setNewCommentText('');
  };

  const handleSendReply = (commentId: string) => {
    const draft = (replyDrafts[commentId] || '').trim();
    if (!draft) return;
    addReply(commentId, draft, authorName);
    setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
  };

  const handleJump = (range?: { start: number; end: number }) => {
    if (!range) return;
    window.dispatchEvent(
      new CustomEvent('editor-jump-range', {
        detail: { start: range.start, end: range.end },
      })
    );
    onJumpToRange?.();
  };

  if (!activeDoc) {
    return (
      <div className={cn('p-4 text-xs text-muted-foreground text-center', className)}>
        Select a document to view selection comments and replies.
      </div>
    );
  }

  const filterTabs: Array<{ id: CommentFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: searchedComments.length },
    { id: 'unresolved', label: 'Unresolved', count: unresolvedCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
  ];

  return (
    <div className={cn('flex flex-col h-full min-h-0 overflow-hidden', className)}>
      {/* Selection-anchored composer (only shown when text is selected for commenting) */}
      {hasPendingSelection && pendingDraft ? (
        <form onSubmit={handleSubmit} className="border-b p-3 space-y-2 shrink-0 bg-primary/5 animate-comment-enter">
          <div className="rounded-md border border-primary/30 bg-background px-2.5 py-1.5 text-[11px] flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-primary text-[10px] uppercase tracking-wider">
                Selected Text
              </div>
              <p className="italic text-foreground/85 line-clamp-2 break-words">
                &ldquo;{pendingDraft.quotedText}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingDraft(null)}
              className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
              title="Cancel selection comment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <Textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a review comment for this selection..."
            className="min-h-[68px] text-xs resize-none bg-background"
            autoFocus
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <div className="flex items-center gap-2">
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Author"
              className="h-7 text-xs flex-1 bg-background"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newCommentText.trim()}
              className="h-7 px-2.5 text-xs gap-1 shrink-0"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>Add</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="border-b px-3 py-2 shrink-0 bg-muted/15 flex items-center justify-between gap-2 text-xs leading-snug text-muted-foreground">
          <span>Highlight text in the editor to comment or reply inline.</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="border-b px-2.5 py-2 space-y-2 shrink-0 bg-muted/20">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && searchQuery) {
                e.preventDefault();
                setSearchQuery('');
              }
            }}
            placeholder="Search text, author, or status..."
            aria-label="Search comments by content, author, or status"
            className="h-8 pl-8 pr-7 text-xs bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear comment search"
              title="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 w-full rounded-lg bg-muted/80 p-0.5 border border-border/60">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                aria-pressed={isActive}
                className={cn(
                  'flex-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] leading-none whitespace-nowrap transition-all tracking-tight',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground font-medium hover:text-foreground hover:bg-background/60'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'tabular-nums text-[10px] font-semibold px-1 py-0.5 rounded-full leading-none',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background/80 text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments & Replies List */}
      <ScrollArea className="flex-1 min-h-0">
        <div key={filter} className="p-2.5 space-y-2.5 animate-comment-view">
          {filteredComments.length === 0 ? (
            <div className="py-10 px-3 text-center space-y-2">
              <MessageSquare className="h-7 w-7 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-medium text-foreground/80">
                {docComments.length === 0
                  ? 'No selection comments yet'
                  : searchQuery.trim()
                    ? 'No matching comment threads'
                    : filter === 'resolved'
                      ? 'No resolved comments'
                      : filter === 'unresolved'
                        ? 'No unresolved comments'
                        : 'No comments'}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {searchQuery.trim() && docComments.length > 0
                  ? 'Try searching by different comment text, reply, author name, or status (resolved / unresolved).'
                  : 'Select any text in the editor and click the comment icon on the floating bar to add a comment and reply thread.'}
              </p>
              {searchQuery.trim() && docComments.length > 0 && (
                <div className="pt-1 flex items-center justify-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[11px]"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                  {filter !== 'all' && searchedComments.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5 text-[11px]"
                      onClick={() => setFilter('all')}
                    >
                      Show all ({searchedComments.length})
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            filteredComments.map((comment) => {
              const isEditing = editingId === comment.id;
              const replies = comment.replies || [];
              const isReplyOpen = activeReplyId === comment.id || replies.length > 0;
              const replyDraft = replyDrafts[comment.id] || '';
              const isNewlyAddedComment = lastAddedCommentId === comment.id;

              return (
                <div
                  key={comment.id}
                  className={cn(
                    'rounded-lg border p-2.5 text-xs space-y-2 transition-colors animate-comment-enter',
                    isNewlyAddedComment && 'ring-1 ring-primary/40',
                    comment.resolved
                      ? 'bg-muted/30 border-border/50 opacity-85'
                      : 'bg-card border-border shadow-2xs'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-foreground truncate">
                        {comment.author || 'Reviewer'}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        • {formatRelativeTime(comment.createdAt)}
                      </span>
                      {comment.resolved && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-semibold shrink-0">
                          Resolved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleResolved(comment.id)}
                        title={comment.resolved ? 'Reopen as unresolved' : 'Mark as resolved'}
                        className={cn(
                          'p-1 rounded hover:bg-muted transition-colors',
                          comment.resolved
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground hover:text-emerald-600'
                        )}
                      >
                        {comment.resolved ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.text);
                        }}
                        title="Edit comment"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteComment(comment.id)}
                        title="Delete comment"
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {comment.quotedText && (
                    <button
                      type="button"
                      onClick={() => handleJump(comment.range)}
                      disabled={!comment.range}
                      className={cn(
                        'w-full text-left rounded border-l-2 border-amber-500/80 bg-amber-500/10 px-2 py-1 text-[11px] italic text-foreground/80 line-clamp-2',
                        comment.range && 'hover:bg-amber-500/20 hover:text-foreground cursor-pointer'
                      )}
                      title={comment.range ? 'Jump to commented text in editor' : undefined}
                    >
                      &ldquo;{comment.quotedText}&rdquo;
                    </button>
                  )}

                  {isEditing ? (
                    <div className="space-y-1.5">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[56px] text-xs"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 px-2 text-[11px] gap-1"
                          onClick={() => {
                            updateComment(comment.id, editText);
                            setEditingId(null);
                          }}
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        'text-foreground/90 whitespace-pre-wrap break-words leading-relaxed',
                        comment.resolved && 'line-through text-muted-foreground'
                      )}
                    >
                      {comment.text}
                    </p>
                  )}

                  {/* Replies Thread */}
                  {replies.length > 0 && (
                    <div className="space-y-1.5 border-l-2 border-border pl-2.5 pt-1">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={cn(
                            'group/reply text-[11px] space-y-0.5 animate-reply-enter rounded px-1 py-0.5 transition-colors',
                            lastAddedReplyId === reply.id && 'bg-primary/5'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-semibold text-foreground truncate">
                                {reply.author}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                • {formatRelativeTime(reply.createdAt)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteReply(comment.id, reply.id)}
                              title="Delete reply"
                              className="opacity-0 group-hover/reply:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-foreground/85 whitespace-pre-wrap break-words pl-4">
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Trigger or Inline Reply Composer */}
                  {isReplyOpen ? (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                      <Input
                        value={replyDraft}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [comment.id]: e.target.value,
                          }))
                        }
                        placeholder="Write a reply..."
                        className="h-7 text-xs flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(comment.id);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!replyDraft.trim()}
                        onClick={() => handleSendReply(comment.id)}
                        className="h-7 w-7 p-0 shrink-0"
                        title="Send reply"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(comment.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        <CornerDownRight className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
