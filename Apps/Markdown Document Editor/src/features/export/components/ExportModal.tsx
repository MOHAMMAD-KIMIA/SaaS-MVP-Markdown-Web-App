import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  AlertCircle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Check,
  Download,
  FileCode2,
  FileSliders,
  FileText,
  FileType2,
  HardDrive,
  Hash,
  PanelBottom,
  PanelTop,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Code2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Card } from '../../../app/components/ui/card';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Switch } from '../../../app/components/ui/switch';
import { Textarea } from '../../../app/components/ui/textarea';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import type {
  Alignment,
  AppSettings,
  BoxSpacing,
  ExportThemePreset,
  Orientation,
  PageSize,
} from '../../../types/common.types';
import {
  exportToHtml,
  exportToMarkdown,
  exportToPlainText,
} from '../utils/exportService';
import { exportPreviewToPdf } from '../utils/exportPreviewToPdf';
import { buildExportHtml } from '../utils/buildExportHtml';
import { buildScreenHeaderFooterParts, resolveExportLayout } from '../utils/exportLayoutHelpers';
import { EXPORT_THEME_PRESETS } from '../utils/exportThemePresets';
import { desktop } from '../../../lib/desktop/bridge';

type ExportType = 'html' | 'pdf' | 'md' | 'txt' | null;
type ExportStep = 'choice' | 'customize' | 'formats';

interface ExportLayoutDraft {
  pageSize: PageSize;
  orientation: Orientation;
  margins: BoxSpacing;
  padding: BoxSpacing;
  headerEnabled: boolean;
  headerText: string;
  headerAlignment: Alignment;
  footerEnabled: boolean;
  footerText: string;
  footerAlignment: Alignment;
  pageNumberEnabled: boolean;
  pageNumberFormat: string;
  pageNumberPosition: 'header' | 'footer';
  pageNumberAlignment: Alignment;
  themePreset: ExportThemePreset;
  customCss: string;
}

interface ExportModalProps {
  previewRef?: RefObject<HTMLDivElement | null>;
}

const MARGIN_PRESETS: Array<{ label: string; value: BoxSpacing }> = [
  { label: 'Narrow (36px)', value: { top: 36, right: 36, bottom: 36, left: 36 } },
  { label: 'Normal (72px)', value: { top: 72, right: 72, bottom: 72, left: 72 } },
  { label: 'Wide (96px)', value: { top: 96, right: 96, bottom: 96, left: 96 } },
];

const PADDING_PRESETS: Array<{ label: string; value: BoxSpacing }> = [
  { label: 'None (0px)', value: { top: 0, right: 0, bottom: 0, left: 0 } },
  { label: 'Compact (12px)', value: { top: 12, right: 12, bottom: 12, left: 12 } },
  { label: 'Comfortable (24px)', value: { top: 24, right: 24, bottom: 24, left: 24 } },
  { label: 'Spacious (40px)', value: { top: 40, right: 40, bottom: 40, left: 40 } },
];

const PAGE_NUMBER_FORMATS = [
  { label: 'Page 1 of 5', value: 'Page {{page}} of {{total}}' },
  { label: '1 / 5', value: '{{page}} / {{total}}' },
  { label: 'Page 1', value: 'Page {{page}}' },
  { label: '1', value: '{{page}}' },
];

function createDraftFromSettings(settings: AppSettings): ExportLayoutDraft {
  return {
    pageSize: settings.page.pageSize,
    orientation: settings.page.orientation,
    margins: { ...settings.page.margins },
    padding: { ...(settings.page.padding || { top: 24, right: 24, bottom: 24, left: 24 }) },
    headerEnabled: settings.headerFooter.headerEnabled,
    headerText: settings.headerFooter.headerText || '{{title}}',
    headerAlignment: settings.headerFooter.headerAlignment,
    footerEnabled: settings.headerFooter.footerEnabled,
    footerText: settings.headerFooter.footerText || '{{date}}',
    footerAlignment: settings.headerFooter.footerAlignment,
    pageNumberEnabled: settings.headerFooter.pageNumberEnabled ?? false,
    pageNumberFormat: settings.headerFooter.pageNumberFormat || 'Page {{page}} of {{total}}',
    pageNumberPosition: settings.headerFooter.pageNumberPosition || 'footer',
    pageNumberAlignment: settings.headerFooter.pageNumberAlignment || 'center',
    themePreset: settings.exportStyle?.themePreset || 'default',
    customCss: settings.exportStyle?.customCss || '',
  };
}

function buildSettingsSnapshot(base: AppSettings, draft: ExportLayoutDraft): AppSettings {
  return {
    ...base,
    page: {
      pageSize: draft.pageSize,
      orientation: draft.orientation,
      margins: { ...draft.margins },
      padding: { ...draft.padding },
    },
    headerFooter: {
      headerEnabled: draft.headerEnabled,
      headerText: draft.headerText,
      headerAlignment: draft.headerAlignment,
      footerEnabled: draft.footerEnabled,
      footerText: draft.footerText,
      footerAlignment: draft.footerAlignment,
      pageNumberEnabled: draft.pageNumberEnabled,
      pageNumberFormat: draft.pageNumberFormat,
      pageNumberPosition: draft.pageNumberPosition,
      pageNumberAlignment: draft.pageNumberAlignment,
    },
    exportStyle: {
      themePreset: draft.themePreset,
      customCss: draft.customCss,
    },
  };
}

export function ExportModal({ previewRef }: ExportModalProps) {
  const { isExportModalOpen, closeExportModal, openDriveModal } = useUIStore();
  const { getActiveDocument } = useDocumentStore();
  const settings = useSettingsStore();

  const [step, setStep] = useState<ExportStep>('choice');
  const [applyCustomLayout, setApplyCustomLayout] = useState(false);
  const [draft, setDraft] = useState<ExportLayoutDraft>(() => createDraftFromSettings(settings));
  const [showCustomCssEditor, setShowCustomCssEditor] = useState(false);
  const [customSnapshot, setCustomSnapshot] = useState<AppSettings | null>(null);
  const [loadingType, setLoadingType] = useState<ExportType>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeDoc = getActiveDocument();

  useEffect(() => {
    if (isExportModalOpen) {
      setStep('choice');
      setApplyCustomLayout(false);
      setCustomSnapshot(null);
      const nextDraft = createDraftFromSettings(settings);
      setDraft(nextDraft);
      setShowCustomCssEditor(Boolean(nextDraft.customCss.trim()));
      setLoadingType(null);
      setExportError(null);
    }
    // Reset only when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExportModalOpen]);

  const effectiveSettings = useMemo<AppSettings>(() => {
    if (applyCustomLayout && customSnapshot) {
      return customSnapshot;
    }
    return settings;
  }, [applyCustomLayout, customSnapshot, settings]);

  const previewParts = useMemo(() => {
    const previewSettings = buildSettingsSnapshot(settings, draft);
    const resolved = resolveExportLayout(previewSettings, { applyLayout: true });
    return buildScreenHeaderFooterParts(resolved, activeDoc?.title || 'Untitled Document');
  }, [activeDoc?.title, draft, settings]);

  const handleChooseWithoutChanges = () => {
    setApplyCustomLayout(false);
    setCustomSnapshot(null);
    setExportError(null);
    setStep('formats');
  };

  const handleChooseCustomize = () => {
    const nextDraft = createDraftFromSettings(settings);
    setDraft(nextDraft);
    setShowCustomCssEditor(Boolean(nextDraft.customCss.trim()));
    setExportError(null);
    setStep('customize');
  };

  const handleConfirmCustomization = () => {
    settings.updatePageSize(draft.pageSize);
    settings.updateOrientation(draft.orientation);
    settings.updateMargins({ ...draft.margins });
    settings.updatePadding({ ...draft.padding });
    settings.updateHeaderEnabled(draft.headerEnabled);
    settings.updateHeaderText(draft.headerText);
    settings.updateHeaderAlignment(draft.headerAlignment);
    settings.updateFooterEnabled(draft.footerEnabled);
    settings.updateFooterText(draft.footerText);
    settings.updateFooterAlignment(draft.footerAlignment);
    settings.updatePageNumbers({
      pageNumberEnabled: draft.pageNumberEnabled,
      pageNumberFormat: draft.pageNumberFormat,
      pageNumberPosition: draft.pageNumberPosition,
      pageNumberAlignment: draft.pageNumberAlignment,
    });
    settings.updateExportStyle({
      themePreset: draft.themePreset,
      customCss: draft.customCss,
    });

    setCustomSnapshot(buildSettingsSnapshot(settings, draft));
    setApplyCustomLayout(true);
    setExportError(null);
    setStep('formats');
  };

  const handleExport = async (type: Exclude<ExportType, null>) => {
    if (!activeDoc) return;

    setLoadingType(type);
    setExportError(null);
    const layoutOptions = { applyLayout: applyCustomLayout };

    try {
      switch (type) {
        case 'html':
          await exportToHtml(activeDoc, effectiveSettings, layoutOptions);
          break;

        case 'pdf':
          if (previewRef?.current) {
            await exportPreviewToPdf(
              previewRef.current,
              effectiveSettings,
              activeDoc.title || 'document',
              layoutOptions
            );
          } else {
            const html = await buildExportHtml(activeDoc, effectiveSettings, layoutOptions);
            await desktop.exportPdf(html, `${activeDoc.title || 'document'}.pdf`);
          }
          break;

        case 'md':
          exportToMarkdown(activeDoc, effectiveSettings, layoutOptions);
          break;

        case 'txt':
          exportToPlainText(activeDoc, effectiveSettings, layoutOptions);
          break;
      }

      closeExportModal();
    } catch (error) {
      console.error(`Export ${type} failed:`, error);
      setExportError(
        type === 'pdf'
          ? 'PDF export failed. Make sure the preview is visible or popup blocker is disabled, then try again.'
          : 'Export failed. Please try again.'
      );
    } finally {
      setLoadingType(null);
    }
  };

  const updateBoxField = (
    boxKey: 'margins' | 'padding',
    side: keyof BoxSpacing,
    rawValue: string
  ) => {
    const numeric = Math.max(0, Math.min(300, Number(rawValue) || 0));
    setDraft((prev) => ({
      ...prev,
      [boxKey]: {
        ...prev[boxKey],
        [side]: numeric,
      },
    }));
  };

  const appendToken = (field: 'headerText' | 'footerText', token: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]} ${token}` : token,
    }));
  };

  const isBusy = loadingType !== null;
  const dialogWidthClass = step === 'customize' ? 'sm:max-w-2xl' : 'sm:max-w-lg';

  return (
    <Dialog
      open={isExportModalOpen}
      onOpenChange={(open) => {
        if (!open) closeExportModal();
      }}
    >
      <DialogContent className={`${dialogWidthClass} max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'choice' && (
              <>
                <Download className="h-5 w-5 text-primary" />
                <span>Export Document</span>
              </>
            )}
            {step === 'customize' && (
              <>
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <span>Customize Export Page Layout</span>
              </>
            )}
            {step === 'formats' && (
              <>
                <FileSliders className="h-5 w-5 text-primary" />
                <span>Choose Export Format</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'choice' &&
              `Before selecting a file format for "${activeDoc?.title || 'your document'}", choose whether to export as-is or configure page layout options.`}
            {step === 'customize' &&
              'Configure page numbers, padding, margins, header, and footer. Click OK to continue and apply these settings to your export.'}
            {step === 'formats' &&
              `Select the file format to save "${activeDoc?.title || 'your document'}".`}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: PRE-EXPORT CHOICE MENU */}
        {step === 'choice' && (
          <div className="grid gap-4 py-3">
            <Card
              className="p-4 cursor-pointer transition-all hover:bg-accent hover:border-primary/50 group"
              onClick={handleChooseWithoutChanges}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/60 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Export Without Changes</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep your document exactly as it is without adding page numbers, custom padding, margins, header, or footer.
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer transition-all hover:bg-accent hover:border-primary/50 group"
              onClick={handleChooseCustomize}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/15 p-3 group-hover:scale-105 transition-transform">
                  <SlidersHorizontal className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    Add Page Number, Padding, Margin, Header &amp; Footer
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Open the page layout customizer to configure spacing, page numbering, headers, and footers before choosing the file type.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: PAGE LAYOUT CUSTOMIZATION PAGE */}
        {step === 'customize' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 py-2">
            {/* Live Compact Page Preview */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Live Page Layout Preview ({draft.pageSize} • {draft.orientation})
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Margin {draft.margins.top}/{draft.margins.right}/{draft.margins.bottom}/{draft.margins.left}px • Padding {draft.padding.top}/{draft.padding.right}/{draft.padding.bottom}/{draft.padding.left}px
                </span>
              </div>
              <div className="mx-auto max-w-md rounded border bg-background shadow-xs text-[11px] overflow-hidden">
                {/* Simulated outer margin box */}
                <div
                  className="bg-amber-50/40 dark:bg-amber-950/20 border border-dashed border-amber-400/50"
                  style={{
                    paddingTop: `${Math.min(20, Math.max(4, Math.round(draft.margins.top / 6)))}px`,
                    paddingRight: `${Math.min(24, Math.max(6, Math.round(draft.margins.right / 5)))}px`,
                    paddingBottom: `${Math.min(20, Math.max(4, Math.round(draft.margins.bottom / 6)))}px`,
                    paddingLeft: `${Math.min(24, Math.max(6, Math.round(draft.margins.left / 5)))}px`,
                  }}
                >
                  {previewParts.hasHeader && (
                    <div className="grid grid-cols-3 gap-1 pb-1.5 mb-1.5 border-b border-border/60 text-[10px] text-muted-foreground">
                      <span className="truncate text-left">{previewParts.headerSlots.left}</span>
                      <span className="truncate text-center">{previewParts.headerSlots.center}</span>
                      <span className="truncate text-right">{previewParts.headerSlots.right}</span>
                    </div>
                  )}

                  {/* Simulated content padding box */}
                  <div
                    className="rounded-xs bg-sky-50/40 dark:bg-sky-950/20 border border-dashed border-sky-400/50"
                    style={{
                      paddingTop: `${Math.min(18, Math.round(draft.padding.top / 4))}px`,
                      paddingRight: `${Math.min(20, Math.round(draft.padding.right / 4))}px`,
                      paddingBottom: `${Math.min(18, Math.round(draft.padding.bottom / 4))}px`,
                      paddingLeft: `${Math.min(20, Math.round(draft.padding.left / 4))}px`,
                    }}
                  >
                    <div className="font-semibold text-foreground truncate">
                      {activeDoc?.title || 'Document Title'}
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-0.5 line-clamp-2">
                      Document content renders inside the inner padding area while margins &amp; page headers/footers frame the page.
                    </div>
                  </div>

                  {previewParts.hasFooter && (
                    <div className="grid grid-cols-3 gap-1 pt-1.5 mt-1.5 border-t border-border/60 text-[10px] text-muted-foreground">
                      <span className="truncate text-left">{previewParts.footerSlots.left}</span>
                      <span className="truncate text-center">{previewParts.footerSlots.center}</span>
                      <span className="truncate text-right">{previewParts.footerSlots.right}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Size & Orientation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-3.5">
              <div>
                <Label className="text-xs font-semibold mb-2 block">Page Size</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['A4', 'Letter', 'Legal'] as PageSize[]).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant={draft.pageSize === size ? 'default' : 'outline'}
                      onClick={() => setDraft((p) => ({ ...p, pageSize: size }))}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-2 block">Orientation</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['portrait', 'landscape'] as Orientation[]).map((orient) => (
                    <Button
                      key={orient}
                      type="button"
                      size="sm"
                      variant={draft.orientation === orient ? 'default' : 'outline'}
                      className="capitalize"
                      onClick={() => setDraft((p) => ({ ...p, orientation: orient }))}
                    >
                      {orient}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Numbers Section */}
            <div className="rounded-lg border p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="text-sm font-semibold">Page Numbers</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically number exported pages
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.pageNumberEnabled}
                  onCheckedChange={(checked) =>
                    setDraft((p) => ({ ...p, pageNumberEnabled: checked }))
                  }
                />
              </div>

              {draft.pageNumberEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="sm:col-span-3">
                    <Label className="text-xs font-medium mb-1.5 block">Number Format</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PAGE_NUMBER_FORMATS.map((fmt) => (
                        <Button
                          key={fmt.value}
                          type="button"
                          size="sm"
                          variant={draft.pageNumberFormat === fmt.value ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          onClick={() =>
                            setDraft((p) => ({ ...p, pageNumberFormat: fmt.value }))
                          }
                        >
                          {fmt.label}
                        </Button>
                      ))}
                    </div>
                    <Input
                      value={draft.pageNumberFormat}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, pageNumberFormat: e.target.value }))
                      }
                      placeholder="Page {{page}} of {{total}}"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Position</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['header', 'footer'] as const).map((pos) => (
                        <Button
                          key={pos}
                          type="button"
                          size="sm"
                          variant={draft.pageNumberPosition === pos ? 'default' : 'outline'}
                          className="h-8 text-xs capitalize"
                          onClick={() =>
                            setDraft((p) => ({ ...p, pageNumberPosition: pos }))
                          }
                        >
                          {pos}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium mb-1.5 block">Alignment</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'left', icon: AlignLeft, label: 'Left' },
                          { id: 'center', icon: AlignCenter, label: 'Center' },
                          { id: 'right', icon: AlignRight, label: 'Right' },
                        ] as const
                      ).map(({ id, icon: Icon, label }) => (
                        <Button
                          key={id}
                          type="button"
                          size="sm"
                          variant={draft.pageNumberAlignment === id ? 'default' : 'outline'}
                          className="h-8 text-xs gap-1"
                          onClick={() =>
                            setDraft((p) => ({ ...p, pageNumberAlignment: id }))
                          }
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Margins & Padding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Page Margins */}
              <div className="rounded-lg border p-3.5 space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Page Margins (px)</Label>
                  <p className="text-xs text-muted-foreground">
                    Outer page spacing around content
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {MARGIN_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[11px]"
                      onClick={() =>
                        setDraft((p) => ({ ...p, margins: { ...preset.value } }))
                      }
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <div key={side} className="space-y-1">
                      <Label className="text-[11px] capitalize text-muted-foreground">
                        {side}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={300}
                        value={draft.margins[side]}
                        onChange={(e) => updateBoxField('margins', side, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Padding */}
              <div className="rounded-lg border p-3.5 space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Content Padding (px)</Label>
                  <p className="text-xs text-muted-foreground">
                    Inner spacing inside the document body
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PADDING_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[11px]"
                      onClick={() =>
                        setDraft((p) => ({ ...p, padding: { ...preset.value } }))
                      }
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <div key={side} className="space-y-1">
                      <Label className="text-[11px] capitalize text-muted-foreground">
                        {side}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={300}
                        value={draft.padding[side]}
                        onChange={(e) => updateBoxField('padding', side, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Header Section */}
            <div className="rounded-lg border p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PanelTop className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="text-sm font-semibold">Header</Label>
                    <p className="text-xs text-muted-foreground">
                      Display custom text at the top of each page
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.headerEnabled}
                  onCheckedChange={(checked) =>
                    setDraft((p) => ({ ...p, headerEnabled: checked }))
                  }
                />
              </div>

              {draft.headerEnabled && (
                <div className="space-y-2.5 pt-2 border-t">
                  <Input
                    value={draft.headerText}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, headerText: e.target.value }))
                    }
                    placeholder="Enter header text (e.g. {{title}})"
                    className="h-8 text-xs"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {['{{title}}', '{{date}}', '{{page}}', '{{total}}'].map((token) => (
                        <Button
                          key={token}
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2 text-[11px] font-mono"
                          onClick={() => appendToken('headerText', token)}
                        >
                          +{token}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {(
                        [
                          { id: 'left', icon: AlignLeft },
                          { id: 'center', icon: AlignCenter },
                          { id: 'right', icon: AlignRight },
                        ] as const
                      ).map(({ id, icon: Icon }) => (
                        <Button
                          key={id}
                          type="button"
                          size="sm"
                          variant={draft.headerAlignment === id ? 'default' : 'outline'}
                          className="h-7 w-8 p-0"
                          onClick={() =>
                            setDraft((p) => ({ ...p, headerAlignment: id }))
                          }
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="rounded-lg border p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PanelBottom className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="text-sm font-semibold">Footer</Label>
                    <p className="text-xs text-muted-foreground">
                      Display custom text at the bottom of each page
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.footerEnabled}
                  onCheckedChange={(checked) =>
                    setDraft((p) => ({ ...p, footerEnabled: checked }))
                  }
                />
              </div>

              {draft.footerEnabled && (
                <div className="space-y-2.5 pt-2 border-t">
                  <Input
                    value={draft.footerText}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, footerText: e.target.value }))
                    }
                    placeholder="Enter footer text (e.g. Confidential • {{date}})"
                    className="h-8 text-xs"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {['{{title}}', '{{date}}', '{{page}}', '{{total}}'].map((token) => (
                        <Button
                          key={token}
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2 text-[11px] font-mono"
                          onClick={() => appendToken('footerText', token)}
                        >
                          +{token}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {(
                        [
                          { id: 'left', icon: AlignLeft },
                          { id: 'center', icon: AlignCenter },
                          { id: 'right', icon: AlignRight },
                        ] as const
                      ).map(({ id, icon: Icon }) => (
                        <Button
                          key={id}
                          type="button"
                          size="sm"
                          variant={draft.footerAlignment === id ? 'default' : 'outline'}
                          className="h-7 w-8 p-0"
                          onClick={() =>
                            setDraft((p) => ({ ...p, footerAlignment: id }))
                          }
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Print Theme Preset & Custom CSS */}
            <div className="rounded-lg border p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="text-sm font-semibold">Print Theme Preset &amp; Custom CSS</Label>
                    <p className="text-xs text-muted-foreground">
                      Style HTML &amp; PDF exports with curated editorial themes or custom CSS rules
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={showCustomCssEditor ? 'secondary' : 'outline'}
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setShowCustomCssEditor((v) => !v)}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>{showCustomCssEditor ? 'Hide CSS' : 'Custom CSS'}</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXPORT_THEME_PRESETS.map((preset) => {
                  const isSelected = draft.themePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, themePreset: preset.id }))}
                      className={`text-left rounded-md border p-2.5 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border hover:bg-accent/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {showCustomCssEditor && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Custom Export CSS</Label>
                    {draft.customCss.trim() && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-muted-foreground"
                        onClick={() => setDraft((p) => ({ ...p, customCss: '' }))}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={draft.customCss}
                    onChange={(e) => setDraft((p) => ({ ...p, customCss: e.target.value }))}
                    placeholder={`.export-document h1, .markdown-preview-export-root h1 {\n  color: #1d4ed8;\n}`}
                    className="font-mono text-xs min-h-[96px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Applied to both standalone HTML and PDF exports.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: EXPORT FORMAT LIST */}
        {step === 'formats' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-2">
            {/* Active mode status bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    applyCustomLayout ? 'bg-primary' : 'bg-emerald-500'
                  }`}
                />
                {applyCustomLayout ? (
                  <span className="text-foreground font-medium">
                    Custom layout active ({draft.pageSize} {draft.orientation}
                    {draft.themePreset !== 'default'
                      ? ` • ${EXPORT_THEME_PRESETS.find((t) => t.id === draft.themePreset)?.name}`
                      : ''}
                    {draft.customCss.trim() ? ' • Custom CSS' : ''}
                    {draft.pageNumberEnabled ? ' • Page #s' : ''}
                    {draft.headerEnabled ? ' • Header' : ''}
                    {draft.footerEnabled ? ' • Footer' : ''})
                  </span>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    Standard export (no layout changes applied)
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-primary"
                onClick={() => setStep('customize')}
              >
                {applyCustomLayout ? 'Edit Layout' : 'Customize Instead'}
              </Button>
            </div>

            {exportError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{exportError}</span>
              </div>
            )}

            <div className="grid gap-3">
              <Card
                className={`p-4 transition-colors ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
                }`}
                onClick={() => {
                  if (!isBusy) {
                    closeExportModal();
                    openDriveModal();
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                    <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Save to Google Drive</h4>
                    <p className="text-sm text-muted-foreground">
                      Save or update this Markdown file directly in your Google Drive storage
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 transition-colors ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
                }`}
                onClick={() => !isBusy && handleExport('html')}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                    <FileCode2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Export as HTML</h4>
                    <p className="text-sm text-muted-foreground">
                      {applyCustomLayout
                        ? 'Download standalone HTML with your margins, padding, header, footer & page numbers'
                        : 'Download a standalone HTML file with embedded styles'}
                    </p>
                    {loadingType === 'html' && (
                      <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Preparing HTML export...
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 transition-colors ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
                }`}
                onClick={() => !isBusy && handleExport('pdf')}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
                    <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Export as PDF</h4>
                    <p className="text-sm text-muted-foreground">
                      {applyCustomLayout
                        ? 'Print & save as PDF with your configured margins, padding, headers, footers & page numbers'
                        : 'Print the current preview and save it as PDF'}
                    </p>
                    {loadingType === 'pdf' && (
                      <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                        Preparing PDF export...
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 transition-colors ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
                }`}
                onClick={() => !isBusy && handleExport('md')}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900">
                    <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Export as Markdown (.md)</h4>
                    <p className="text-sm text-muted-foreground">
                      {applyCustomLayout
                        ? 'Download Markdown with your header, footer, page number & layout metadata included'
                        : 'Download the original markdown source exactly as written'}
                    </p>
                    {loadingType === 'md' && (
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        Preparing Markdown export...
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 transition-colors ${
                  isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent'
                }`}
                onClick={() => !isBusy && handleExport('txt')}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900">
                    <FileType2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Export as Plain Text (.txt)</h4>
                    <p className="text-sm text-muted-foreground">
                      {applyCustomLayout
                        ? 'Download plain text formatted with your margins, padding, header, footer & page numbers'
                        : 'Download a simplified readable text version of the document'}
                    </p>
                    {loadingType === 'txt' && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Preparing Plain Text export...
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t flex-row justify-between sm:justify-between gap-2">
          <div>
            {step === 'customize' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('choice')}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {step === 'formats' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(applyCustomLayout ? 'customize' : 'choice')}
                disabled={isBusy}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={closeExportModal} disabled={isBusy}>
              Cancel
            </Button>
            {step === 'customize' && (
              <Button type="button" onClick={handleConfirmCustomization} className="gap-1.5">
                <Check className="h-4 w-4" />
                OK — Choose Export Format
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
