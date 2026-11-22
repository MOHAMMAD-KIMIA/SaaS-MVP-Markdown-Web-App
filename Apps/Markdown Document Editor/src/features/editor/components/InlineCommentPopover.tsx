// src/features/editor/components/InlineCommentPopover.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  CornerDownRight,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftOpen,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { Comment } from '../../../types/common.types';
import { useCommentStore } from '../../../stores/commentStore';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Textarea } from '../../../app/components/ui/textarea';
import { formatRelativeTime } from '../../../lib/utils/dates';
import { cn } from '../../../lib/utils/cn';

interface InlineCommentPopoverProps {
  documentId: string;
  position: { top: number; left: number };
  selectionRange?: { start: number; end: number };
  quotedText?: string;
  overlappingComments: Comment[];
  onOpenAllComments: () => void;
  onClose: () => void;
}

export function InlineCommentPopover({
  documentId,
  position,
  selectionRange,
  quotedText,
  overlappingComments,
  onOpenAllComments,
  onClose,
}: InlineCommentPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const authorName = useCommentStore((s) => s.authorName);
  const setAuthorName = useCommentStore((s) => s.setAuthorName);
  const addComment = useCommentStore((s) => s.addComment);
  const addReply = useCommentStore((s) => s.addReply);
  const deleteReply = useCommentStore((s) => s.deleteReply);
  const toggleResolved = useCommentStore((s) => s.toggleResolved);
  const deleteComment = useCommentStore((s) => s.deleteComment);

  const [newCommentText, setNewCommentText] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [showNewForm, setShowNewForm] = useState(
    overlappingComments.length === 0 && Boolean(quotedText?.trim())
  );

  useEffect(() => {
    if (overlappingComments.length === 0 && quotedText?.trim()) {
      setShowNewForm(true);
    } else if (overlappingComments.length > 0 && !newCommentText) {
      setShowNewForm(false);
    }
  }, [overlappingComments.length, quotedText, newCommentText]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const safeTop = Math.max(
    16,
    Math.min(position.top + 26, typeof window !== 'undefined' ? window.innerHeight - 360 : position.top + 26)
  );
  const safeLeft = Math.max(
    16,
    Math.min(position.left, typeof window !== 'undefined' ? window.innerWidth - 348 : position.left)
  );

  const hasValidSelection =
    Boolean(quotedText?.trim()) &&
    Boolean(selectionRange && selectionRange.end > selectionRange.start);

  const handleCreateComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasValidSelection || !selectionRange || !quotedText?.trim() || !newCommentText.trim()) {
      return;
    }
    addComment({
      documentId,
      text: newCommentText,
      author: authorName,
      quotedText: quotedText.trim().slice(0, 280),
      range: selectionRange,
    });
    setNewCommentText('');
    setShowNewForm(false);
  };

  const handleSendReply = (commentId: string) => {
    const draft = (replyDrafts[commentId] || '').trim();
    if (!draft) return;
    addReply(commentId, draft, authorName);
    setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
  };

  return (
    <div
      ref={popoverRef}
      style={{ top: `${safeTop}px`, left: `${safeLeft}px` }}
      className="fixed z-50 w-80 max-w-[92vw] max-h-[70vh] flex flex-col rounded-xl border border-border bg-popover/98 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2 shrink-0 bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span>
            {overlappingComments.length > 0
              ? `Review Thread (${overlappingComments.length})`
              : 'Comment on Selection'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAllComments();
            }}
            title="Show all comments & replies in sidebar"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <PanelLeftOpen className="h-3 w-3" />
            <span>All</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Existing overlapping threads */}
        {overlappingComments.map((comment) => {
          const replies = comment.replies || [];
          const replyDraft = replyDrafts[comment.id] || '';
          return (
            <div
              key={comment.id}
              className={cn(
                'rounded-lg border p-2.5 text-xs space-y-2 animate-comment-enter',
                comment.resolved
                  ? 'bg-muted/30 border-border/60 opacity-80'
                  : 'bg-card border-border shadow-2xs'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold truncate">{comment.author || 'Reviewer'}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    • {formatRelativeTime(comment.createdAt)}
                  </span>
                  {comment.resolved && (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-semibold">
                      Resolved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleResolved(comment.id)}
                    title={comment.resolved ? 'Reopen as unresolved' : 'Mark resolved'}
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
                    onClick={() => deleteComment(comment.id)}
                    title="Delete comment"
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {comment.quotedText && (
                <div className="rounded border-l-2 border-amber-500/80 bg-amber-500/10 px-2 py-1 text-[11px] italic text-foreground/80 line-clamp-2">
                  &ldquo;{comment.quotedText}&rdquo;
                </div>
              )}

              <p
                className={cn(
                  'text-foreground/95 whitespace-pre-wrap break-words leading-relaxed',
                  comment.resolved && 'line-through text-muted-foreground'
                )}
              >
                {comment.text}
              </p>

              {/* Replies */}
              {replies.length > 0 && (
                <div className="space-y-1.5 border-l-2 border-border pl-2.5 pt-1">
                  {replies.map((reply) => (
                    <div key={reply.id} className="group/reply text-[11px] space-y-0.5 animate-reply-enter">
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

              {/* Inline Reply Input */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                <Input
                  value={replyDraft}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [comment.id]: e.target.value }))
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
            </div>
          );
        })}

        {/* Option to add another comment if threads already exist & text is selected */}
        {overlappingComments.length > 0 && hasValidSelection && !showNewForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewForm(true)}
            className="w-full h-7 text-xs gap-1.5"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
            <span>Add New Comment on Selection</span>
          </Button>
        )}

        {/* New Selection Comment Composer */}
        {showNewForm && hasValidSelection && (
          <form onSubmit={handleCreateComment} className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
            <div className="rounded border-l-2 border-primary bg-background/80 px-2 py-1 text-[11px] italic text-foreground/80 line-clamp-2">
              &ldquo;{quotedText?.trim()}&rdquo;
            </div>

            <Textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a review comment for this selection..."
              className="min-h-[64px] text-xs resize-none bg-background"
              autoFocus
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateComment();
                }
              }}
            />

            <div className="flex items-center gap-1.5">
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="h-7 text-xs flex-1 bg-background"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newCommentText.trim()}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>Comment</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
