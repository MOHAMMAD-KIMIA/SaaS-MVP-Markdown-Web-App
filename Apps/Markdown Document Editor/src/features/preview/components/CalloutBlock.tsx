// src/features/preview/components/CalloutBlock.tsx
import React, { useState } from 'react';
import {
  Info,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  HelpCircle,
  Quote,
  Code2,
  Bug,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import { detectTextDirection } from '../../../lib/markdown/textDirection';

export type CalloutType =
  | 'note'
  | 'info'
  | 'tip'
  | 'hint'
  | 'important'
  | 'warning'
  | 'attention'
  | 'caution'
  | 'danger'
  | 'error'
  | 'success'
  | 'done'
  | 'check'
  | 'question'
  | 'help'
  | 'faq'
  | 'quote'
  | 'cite'
  | 'example'
  | 'bug';

interface CalloutConfig {
  icon: React.ComponentType<{ className?: string }>;
  defaultTitle: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  headerTextColor: string;
  iconColor: string;
}

const CALLOUT_CONFIGS: Record<string, CalloutConfig> = {
  note: {
    icon: Info,
    defaultTitle: 'Note',
    borderColor: 'border-blue-500 dark:border-blue-400',
    bgColor: 'bg-blue-50/80 dark:bg-blue-950/25',
    textColor: 'text-blue-950 dark:text-blue-100',
    headerTextColor: 'text-blue-900 dark:text-blue-300 font-semibold',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  info: {
    icon: Info,
    defaultTitle: 'Info',
    borderColor: 'border-sky-500 dark:border-sky-400',
    bgColor: 'bg-sky-50/80 dark:bg-sky-950/25',
    textColor: 'text-sky-950 dark:text-sky-100',
    headerTextColor: 'text-sky-900 dark:text-sky-300 font-semibold',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  tip: {
    icon: Lightbulb,
    defaultTitle: 'Tip',
    borderColor: 'border-emerald-500 dark:border-emerald-400',
    bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/25',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    headerTextColor: 'text-emerald-900 dark:text-emerald-300 font-semibold',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  hint: {
    icon: Lightbulb,
    defaultTitle: 'Hint',
    borderColor: 'border-teal-500 dark:border-teal-400',
    bgColor: 'bg-teal-50/80 dark:bg-teal-950/25',
    textColor: 'text-teal-950 dark:text-teal-100',
    headerTextColor: 'text-teal-900 dark:text-teal-300 font-semibold',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  important: {
    icon: AlertCircle,
    defaultTitle: 'Important',
    borderColor: 'border-purple-500 dark:border-purple-400',
    bgColor: 'bg-purple-50/80 dark:bg-purple-950/25',
    textColor: 'text-purple-950 dark:text-purple-100',
    headerTextColor: 'text-purple-900 dark:text-purple-300 font-semibold',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: 'Warning',
    borderColor: 'border-amber-500 dark:border-amber-400',
    bgColor: 'bg-amber-50/80 dark:bg-amber-950/25',
    textColor: 'text-amber-950 dark:text-amber-100',
    headerTextColor: 'text-amber-900 dark:text-amber-300 font-semibold',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  attention: {
    icon: AlertTriangle,
    defaultTitle: 'Attention',
    borderColor: 'border-amber-500 dark:border-amber-400',
    bgColor: 'bg-amber-50/80 dark:bg-amber-950/25',
    textColor: 'text-amber-950 dark:text-amber-100',
    headerTextColor: 'text-amber-900 dark:text-amber-300 font-semibold',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  caution: {
    icon: Flame,
    defaultTitle: 'Caution',
    borderColor: 'border-rose-500 dark:border-rose-400',
    bgColor: 'bg-rose-50/80 dark:bg-rose-950/25',
    textColor: 'text-rose-950 dark:text-rose-100',
    headerTextColor: 'text-rose-900 dark:text-rose-300 font-semibold',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  danger: {
    icon: Flame,
    defaultTitle: 'Danger',
    borderColor: 'border-red-600 dark:border-red-500',
    bgColor: 'bg-red-50/80 dark:bg-red-950/25',
    textColor: 'text-red-950 dark:text-red-100',
    headerTextColor: 'text-red-900 dark:text-red-300 font-semibold',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  error: {
    icon: Flame,
    defaultTitle: 'Error',
    borderColor: 'border-red-600 dark:border-red-500',
    bgColor: 'bg-red-50/80 dark:bg-red-950/25',
    textColor: 'text-red-950 dark:text-red-100',
    headerTextColor: 'text-red-900 dark:text-red-300 font-semibold',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  success: {
    icon: CheckCircle2,
    defaultTitle: 'Success',
    borderColor: 'border-green-500 dark:border-green-400',
    bgColor: 'bg-green-50/80 dark:bg-green-950/25',
    textColor: 'text-green-950 dark:text-green-100',
    headerTextColor: 'text-green-900 dark:text-green-300 font-semibold',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  done: {
    icon: CheckCircle2,
    defaultTitle: 'Done',
    borderColor: 'border-green-500 dark:border-green-400',
    bgColor: 'bg-green-50/80 dark:bg-green-950/25',
    textColor: 'text-green-950 dark:text-green-100',
    headerTextColor: 'text-green-900 dark:text-green-300 font-semibold',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  check: {
    icon: CheckCircle2,
    defaultTitle: 'Check',
    borderColor: 'border-green-500 dark:border-green-400',
    bgColor: 'bg-green-50/80 dark:bg-green-950/25',
    textColor: 'text-green-950 dark:text-green-100',
    headerTextColor: 'text-green-900 dark:text-green-300 font-semibold',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  question: {
    icon: HelpCircle,
    defaultTitle: 'Question',
    borderColor: 'border-cyan-500 dark:border-cyan-400',
    bgColor: 'bg-cyan-50/80 dark:bg-cyan-950/25',
    textColor: 'text-cyan-950 dark:text-cyan-100',
    headerTextColor: 'text-cyan-900 dark:text-cyan-300 font-semibold',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  help: {
    icon: HelpCircle,
    defaultTitle: 'Help',
    borderColor: 'border-cyan-500 dark:border-cyan-400',
    bgColor: 'bg-cyan-50/80 dark:bg-cyan-950/25',
    textColor: 'text-cyan-950 dark:text-cyan-100',
    headerTextColor: 'text-cyan-900 dark:text-cyan-300 font-semibold',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  faq: {
    icon: HelpCircle,
    defaultTitle: 'FAQ',
    borderColor: 'border-cyan-500 dark:border-cyan-400',
    bgColor: 'bg-cyan-50/80 dark:bg-cyan-950/25',
    textColor: 'text-cyan-950 dark:text-cyan-100',
    headerTextColor: 'text-cyan-900 dark:text-cyan-300 font-semibold',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  quote: {
    icon: Quote,
    defaultTitle: 'Quote',
    borderColor: 'border-slate-500 dark:border-slate-400',
    bgColor: 'bg-slate-50/80 dark:bg-slate-900/40',
    textColor: 'text-slate-900 dark:text-slate-100',
    headerTextColor: 'text-slate-800 dark:text-slate-300 font-semibold',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
  cite: {
    icon: Quote,
    defaultTitle: 'Citation',
    borderColor: 'border-slate-500 dark:border-slate-400',
    bgColor: 'bg-slate-50/80 dark:bg-slate-900/40',
    textColor: 'text-slate-900 dark:text-slate-100',
    headerTextColor: 'text-slate-800 dark:text-slate-300 font-semibold',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
  example: {
    icon: Code2,
    defaultTitle: 'Example',
    borderColor: 'border-indigo-500 dark:border-indigo-400',
    bgColor: 'bg-indigo-50/80 dark:bg-indigo-950/25',
    textColor: 'text-indigo-950 dark:text-indigo-100',
    headerTextColor: 'text-indigo-900 dark:text-indigo-300 font-semibold',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  bug: {
    icon: Bug,
    defaultTitle: 'Bug',
    borderColor: 'border-rose-500 dark:border-rose-400',
    bgColor: 'bg-rose-50/80 dark:bg-rose-950/25',
    textColor: 'text-rose-950 dark:text-rose-100',
    headerTextColor: 'text-rose-900 dark:text-rose-300 font-semibold',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
};

interface CalloutBlockProps {
  type: string;
  title?: string;
  isFoldable?: boolean;
  defaultFolded?: boolean;
  children: React.ReactNode;
}

export function CalloutBlock({
  type,
  title,
  isFoldable = false,
  defaultFolded = false,
  children,
}: CalloutBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultFolded);
  const normalizedType = (type || 'note').toLowerCase();
  const config = CALLOUT_CONFIGS[normalizedType] || CALLOUT_CONFIGS.note;
  const IconComponent = config.icon;

  const displayTitle = title?.trim() || config.defaultTitle;
  const titleDir = detectTextDirection(displayTitle) ?? 'auto';

  return (
    <div
      className={cn(
        'my-4 rounded-r-lg rounded-l-xs border-l-4 border p-3.5 sm:p-4 text-sm transition-all duration-200 shadow-2xs',
        config.borderColor,
        config.bgColor,
        config.textColor
      )}
      data-callout-type={normalizedType}
      dir="auto"
    >
      <div
        className={cn(
          'flex items-center gap-2 select-none font-medium',
          isFoldable && 'cursor-pointer hover:opacity-80'
        )}
        onClick={isFoldable ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className={cn('shrink-0 flex items-center', config.iconColor)}>
          <IconComponent className="h-4 w-4" />
        </div>

        <div
          dir={titleDir}
          className={cn('flex-1 tracking-tight text-sm', config.headerTextColor)}
        >
          {displayTitle}
        </div>

        {isFoldable && (
          <div className="shrink-0 text-muted-foreground">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {!isCollapsed && React.Children.count(children) > 0 && (
        <div className="mt-2 space-y-2 text-foreground/90 callout-content pl-6 rtl:pl-0 rtl:pr-6 [&>p]:my-0 [&>p+p]:mt-2 [&>ul]:my-1 [&>ol]:my-1">
          {children}
        </div>
      )}
    </div>
  );
}
