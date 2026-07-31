/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Key, Cpu, HardDrive, CheckCircle2, UserCheck, RefreshCw, Layers, Zap } from 'lucide-react';
import { desktop } from '../../../lib/desktop/bridge';

export function DesktopAccount() {
  const [licenseKey, setLicenseKey] = useState('MKRA-WIN11-PRO-8821-X99Q');
  const [isActivating, setIsActivating] = useState(false);
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('admin');
  const [offlineStorageTier, setOfflineStorageTier] = useState<'10gb' | '50gb' | 'unlimited'>('unlimited');

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      desktop.showNotification('License Activated', 'Markora Desktop Pro v2 is bound to this Windows machine.');
    }, 1200);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-foreground select-none animate-in fade-in duration-200">
      <div className="border-b border-border pb-5">
        <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Windows Desktop Pro v2</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">License & Offline Capabilities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure native Windows desktop permissions, local encryption keys, and hardware acceleration tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Cols: License Activation & Hardware Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-card via-muted/40 to-card border border-primary/30 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Active License Key</h2>
                  <p className="text-xs text-muted-foreground">Lifetime Windows Pro v2 (Offline + SaaS Cloud)</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activated</span>
              </span>
            </div>

            <form onSubmit={handleActivate} className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">Product Key / Hardware ID Bind</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-background border border-border font-mono text-sm text-primary focus:outline-none focus:border-primary transition-colors tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isActivating}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shrink-0 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify Key</span>}
                </button>
              </div>
            </form>

            <div className="pt-2 grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-background/50 border border-border/80">
                <div className="text-muted-foreground">Machine ID:</div>
                <div className="font-mono text-foreground mt-0.5">DESKTOP-WIN11-MKRA</div>
              </div>
              <div className="p-3 rounded-xl bg-background/50 border border-border/80">
                <div className="text-muted-foreground">Edition:</div>
                <div className="font-semibold text-purple-600 dark:text-purple-300 mt-0.5">Enterprise Suite 2026</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card/80 border border-border space-y-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span>Native Windows Hardware Acceleration</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Direct2D Canvas Rendering</div>
                  <div className="text-xs text-muted-foreground">GPU-accelerated smooth scrolling for large 10,000+ line markdown files</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 rounded cursor-pointer" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Local SQLite Search Indexer</div>
                  <div className="text-xs text-muted-foreground">Background indexing for instantaneous full-text regular expression search</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 rounded cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Role & Storage Quota */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card/80 border border-border space-y-4 shadow-lg">
            <h3 className="font-semibold text-foreground text-sm flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>SaaS Workspace Role</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Select your simulated role to preview admin dashboards and team publishing capabilities.
            </p>

            <div className="space-y-2 pt-1">
              {(['admin', 'editor', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    role === r
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-background/60 border-border text-muted-foreground hover:border-border'
                  }`}
                >
                  <span className="capitalize text-xs">{r} Role</span>
                  {role === r && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card/80 border border-border space-y-4 shadow-lg">
            <h3 className="font-semibold text-foreground text-sm flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Local Disk Quota</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Allocate Windows disk space for offline caching of image attachments and cloud assets.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['10gb', '50gb', 'unlimited'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOfflineStorageTier(t)}
                  className={`py-2 px-3 rounded-lg border text-center text-xs font-mono uppercase transition-all ${
                    offlineStorageTier === t
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-background/60 border-border text-muted-foreground hover:border-border'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
