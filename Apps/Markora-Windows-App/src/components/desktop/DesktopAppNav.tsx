/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Edit3, LayoutDashboard, Globe, ShieldCheck, BookOpen, HardDrive, Cpu, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { desktop } from '../../lib/desktop/bridge';
import { useUIStore } from '../../stores/uiStore';
import { MarkoraLogo } from '../MarkoraLogo';

interface DesktopAppNavProps {
  currentView: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation';
  onNavigate: (view: 'editor' | 'dashboard' | 'publishing' | 'account' | 'documentation') => void;
}

export function DesktopAppNav({ currentView, onNavigate }: DesktopAppNavProps) {
  const isAppNavOpen = useUIStore((state) => state.isAppNavOpen);
  const toggleAppNav = useUIStore((state) => state.toggleAppNav);

  const navItems = [
    {
      id: 'editor',
      label: 'Pro Editor',
      icon: Edit3,
      badge: 'Active',
      description: 'Split-pane markdown studio'
    },
    {
      id: 'dashboard',
      label: 'SaaS Dashboard',
      icon: LayoutDashboard,
      badge: 'Cloud',
      description: 'Analytics & file storage'
    },
    {
      id: 'publishing',
      label: 'Publishing Hub',
      icon: Globe,
      badge: 'Web',
      description: 'Deploy docs to public links'
    },
    {
      id: 'account',
      label: 'Pro License',
      icon: ShieldCheck,
      badge: 'Activated',
      description: 'Windows Desktop Pro v2'
    },
    {
      id: 'documentation',
      label: 'Help & Docs',
      icon: BookOpen,
      badge: 'Offline',
      description: 'Syntax & shortcuts manual'
    }
  ] as const;

  return (
    <div className={`${isAppNavOpen ? 'w-60' : 'w-14'} bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 select-none text-sidebar-foreground transition-all duration-200`}>
      <div className={`p-4 border-b border-sidebar-border flex items-center ${isAppNavOpen ? 'justify-between' : 'justify-center p-3'}`}>
        {isAppNavOpen ? (
          <>
            <div className="flex items-center space-x-2 overflow-hidden">
              <MarkoraLogo className="w-8 h-8 shrink-0" />
              <div className="truncate">
                <h1 className="font-bold text-foreground text-sm tracking-tight leading-none truncate">Markora Suite</h1>
                <span className="text-[10px] text-primary font-medium truncate">Windows Desktop v2.0</span>
              </div>
            </div>
            <button
              onClick={toggleAppNav}
              title="Collapse Workspace Navigation (Ctrl+Shift+B)"
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-1 flex items-center justify-center"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleAppNav}
            title="Expand Workspace Navigation (Ctrl+Shift+B)"
            className="p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          >
            <PanelLeftOpen className="w-5 h-5 text-primary" />
          </button>
        )}
      </div>

      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {isAppNavOpen && (
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          if (!isAppNavOpen) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={`${item.label} (${item.badge})`}
                className={`w-full p-2.5 rounded-lg flex items-center justify-center transition-all group ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md font-medium' 
                    : 'hover:bg-sidebar-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                }`} />
              </button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-all group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-md font-medium' 
                  : 'hover:bg-sidebar-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                }`} />
                <div className="overflow-hidden">
                  <div className="text-sm leading-tight truncate">{item.label}</div>
                  <div className={`text-[11px] truncate leading-tight mt-0.5 ${
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1 ${
                  isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30' 
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {isAppNavOpen ? (
          <>
            <div className="pt-6 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System Storage & Memory
            </div>

            <div className="mx-1 p-3 rounded-lg bg-sidebar-accent/40 border border-sidebar-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-foreground">
                <span className="flex items-center space-x-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-primary" />
                  <span>Local Disk Cache</span>
                </span>
                <span className="text-emerald-500 font-mono text-[11px]">Active</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-3/4 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>24.8 MB used</span>
                <span>100 GB avail</span>
              </div>
            </div>
          </>
        ) : (
          <div className="pt-4 flex justify-center">
            <div 
              className="p-2 rounded-lg bg-sidebar-accent/40 border border-sidebar-border text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
              title="Local Disk Cache: Active (24.8 MB used / 100 GB avail)"
            >
              <HardDrive className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className={`p-3 border-t border-sidebar-border bg-sidebar-accent/20 flex items-center ${isAppNavOpen ? 'justify-between' : 'justify-center'} text-xs text-muted-foreground`}>
        {isAppNavOpen ? (
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] text-foreground truncate">Windows 11 Native</span>
          </div>
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 cursor-help" title="Windows 11 Native Edition" />
        )}
        {isAppNavOpen && (
          <button 
            onClick={() => desktop.openExternal('https://github.com/MOHAMMAD-KIMIA/SaaS-MVP-Markdown-Web-App')}
            className="text-muted-foreground hover:text-primary transition-colors shrink-0 ml-1"
            title="Open Repository"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
