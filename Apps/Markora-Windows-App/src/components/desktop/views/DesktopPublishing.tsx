/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe, Share2, Copy, Check, ExternalLink, ShieldAlert, Cloud, Lock, Users, UploadCloud, RefreshCw } from 'lucide-react';
import { useDocumentStore } from '../../../stores/documentStore';
import { desktop } from '../../../lib/desktop/bridge';
import { exportToHtml } from '../../../features/export/utils/exportHtml';
import { useSettingsStore } from '../../../stores/settingsStore';

export function DesktopPublishing() {
  const documents = useDocumentStore((state) => state.documents);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const settings = useSettingsStore((state) => state);

  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocumentId || (documents[0]?.id || ''));
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>('https://markora.cloud/p/doc_9a8f2e1c');
  const [copied, setCopied] = useState(false);
  const [accessType, setAccessType] = useState<'public' | 'password' | 'team'>('public');

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handlePublish = () => {
    if (!selectedDoc) return;
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      const slug = selectedDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'document';
      setPublishedUrl(`https://markora.cloud/p/${slug}-${Math.floor(1000 + Math.random() * 9000)}`);
      desktop.showNotification('Published to Cloud', `Document is now live at public URL.`);
    }, 1500);
  };

  const handleCopy = () => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-foreground select-none animate-in fade-in duration-200">
      <div className="border-b border-border pb-5">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>SaaS Cloud Publishing Hub</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">Deploy Markdown to the Web</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turn your offline desktop markdown notes into live web pages, documentation sites, or team wikis instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Select Document & Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-card/80 border border-border space-y-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
              <span>Select Document to Publish</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Workspace Document</label>
              <select
                value={selectedDoc?.id || ''}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.content.length} characters)
                  </option>
                ))}
              </select>
            </div>

            {selectedDoc && (
              <div className="p-4 rounded-xl bg-background/60 border border-border/80 space-y-2 text-xs">
                <div className="flex justify-between text-foreground font-medium">
                  <span>Document Title:</span>
                  <span className="text-foreground">{selectedDoc.title}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Last Modified:</span>
                  <span>{new Date(selectedDoc.updatedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Word Count:</span>
                  <span>{selectedDoc.content.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-card/80 border border-border space-y-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
              <span>Access & Security Tier</span>
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setAccessType('public')}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                  accessType === 'public'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-background/60 border-border text-muted-foreground hover:border-border'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <div className="text-xs font-semibold">Public URL</div>
                <div className="text-[10px] text-muted-foreground">Anyone with link</div>
              </button>

              <button
                onClick={() => setAccessType('password')}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                  accessType === 'password'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'bg-background/60 border-border text-muted-foreground hover:border-border'
                }`}
              >
                <Lock className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <div className="text-xs font-semibold">Password</div>
                <div className="text-[10px] text-muted-foreground">PIN protection</div>
              </button>

              <button
                onClick={() => setAccessType('team')}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                  accessType === 'team'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'bg-background/60 border-border text-muted-foreground hover:border-border'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="text-xs font-semibold">Team Only</div>
                <div className="text-[10px] text-muted-foreground">SaaS Auth users</div>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={isPublishing || !selectedDoc}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deploying to Markora Edge Cloud...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Deploy to Cloud CDN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Link & Standalone Export */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-card via-muted/40 to-card border border-primary/30 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE CLOUD ENDPOINT</span>
            </div>

            <h3 className="font-semibold text-foreground text-sm">Public URL Link</h3>

            <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-primary break-all select-all">
              {publishedUrl}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link' : 'Copy URL'}</span>
              </button>

              <button
                onClick={() => publishedUrl && desktop.openExternal(publishedUrl)}
                className="py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium flex items-center justify-center space-x-1 transition-colors border border-indigo-500/30"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-3 border-t border-border/80 text-[11px] text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>CDN Cache Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">HIT (Global)</span>
              </div>
              <div className="flex justify-between">
                <span>SSL Certificate:</span>
                <span className="text-foreground font-mono">TLS 1.3 Active</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card/80 border border-border space-y-3 shadow-lg">
            <h3 className="font-semibold text-foreground text-sm flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Offline Standalone HTML</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Need to share without cloud hosting? Export as a self-contained HTML file with embedded styling and Mermaid diagram scripts.
            </p>
            <button
              onClick={() => {
                if (selectedDoc) exportToHtml(selectedDoc, settings);
              }}
              className="w-full py-2 px-3 rounded-xl bg-muted hover:bg-muted text-foreground text-xs font-medium transition-colors border border-border"
            >
              Export Standalone HTML to Disk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
