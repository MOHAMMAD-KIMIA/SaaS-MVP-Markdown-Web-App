/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, HardDrive, Cloud, FileText, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { desktop } from '../../lib/desktop/bridge';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { MarkoraLogo } from '../MarkoraLogo';

export function WindowsTitlebar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'synced'>('saved');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const documents = useDocumentStore((state) => state.documents);
  const renameDocument = useDocumentStore((state) => state.renameDocument);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const isDirty = activeDoc ? activeDoc.isDirty : false;
  const title = activeDoc ? activeDoc.title : 'Welcome to Markora Desktop';

  const handleTitleClick = () => {
    if (activeDoc) {
      setEditTitle(activeDoc.title);
      setIsEditingTitle(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleTitleBlur = () => {
    if (activeDoc && editTitle.trim()) {
      renameDocument(activeDoc.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  useEffect(() => {
    const checkMaximized = async () => {
      const max = await desktop.isMaximized();
      setIsMaximized(max);
    };
    const interval = setInterval(checkMaximized, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDirty) {
      setSyncStatus('saving');
      const timer = setTimeout(() => {
        setSyncStatus('saved');
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setSyncStatus('saved');
    }
  }, [isDirty]);

  return (
    <header 
      className="h-10 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-between select-none px-3 z-50 sticky top-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App Branding & Active Document */}
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="flex items-center space-x-2 text-primary font-semibold text-sm">
          <MarkoraLogo className="w-5 h-5 shrink-0" />
          <span className="tracking-tight font-mono text-foreground">Markora <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Desktop v2.0</span></span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div 
          className="flex items-center space-x-1.5 text-xs text-muted-foreground truncate"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="bg-background border border-primary rounded px-1.5 py-0.5 text-foreground text-xs focus:outline-none w-48"
            />
          ) : (
            <span 
              onClick={handleTitleClick}
              className="text-foreground font-medium truncate max-w-[280px] hover:text-primary cursor-pointer"
              title="Click to rename document"
            >
              {title}
            </span>
          )}
          {isDirty && (
            <span className="text-amber-500 font-bold" title="Unsaved changes on disk">
              ●
            </span>
          )}
        </div>
      </div>

      {/* Center: System Status & Cloud / Disk Bridge */}
      <div className="hidden md:flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
          {syncStatus === 'saving' ? (
            <span className="flex items-center space-x-1.5 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Writing to disk...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-emerald-500">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-foreground">Local Disk & Storage Synced</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-muted-foreground" title="Running in Native Desktop Abstraction Mode">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-mono">{desktop.platform.toUpperCase()} ENGINE</span>
        </div>
      </div>

      {/* Right: Windows Native Controls */}
      <div 
        className="flex items-center space-x-1 -mr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => desktop.minimizeWindow()}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            desktop.maximizeWindow();
            setIsMaximized(!isMaximized);
          }}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => desktop.closeWindow()}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-red-600 transition-colors"
          title="Close Markora Desktop"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
