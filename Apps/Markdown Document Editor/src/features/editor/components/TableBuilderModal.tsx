import { useEffect, useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardPaste,
  Columns3,
  Copy,
  Plus,
  Rows3,
  Sparkles,
  Table as TableIcon,
  Trash2,
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
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Textarea } from '../../../app/components/ui/textarea';
import { useUIStore } from '../../../stores/uiStore';
import { useDocumentStore } from '../../../stores/documentStore';
import {
  formatMarkdownTable,
  parseMarkdownTableAtCursor,
  parseSpreadsheetPaste,
  type TableColumnAlign,
} from '../../../lib/markdown/tables';
import { copyToClipboard } from '../../../lib/utils/clipboard';

interface TableBuilderModalProps {
  getCursorPosition?: () => number;
  onApplyTable: (
    markdownTable: string,
    replaceRange?: { start: number; end: number }
  ) => void;
}

function buildEmptyGrid(dataRows: number, cols: number): {
  rows: string[][];
  alignments: TableColumnAlign[];
} {
  const safeCols = Math.max(1, Math.min(12, cols));
  const safeRows = Math.max(1, Math.min(30, dataRows));

  const header = Array.from({ length: safeCols }, (_, c) => `Header ${c + 1}`);
  const body = Array.from({ length: safeRows }, (_, r) =>
    Array.from({ length: safeCols }, (_, c) => `Cell ${r + 1}-${c + 1}`)
  );

  return {
    rows: [header, ...body],
    alignments: Array.from({ length: safeCols }, () => 'left'),
  };
}

export function TableBuilderModal({
  getCursorPosition,
  onApplyTable,
}: TableBuilderModalProps) {
  const isTableBuilderOpen = useUIStore((s) => s.isTableBuilderOpen);
  const closeTableBuilder = useUIStore((s) => s.closeTableBuilder);
  const getActiveDocument = useDocumentStore((s) => s.getActiveDocument);

  const [rows, setRows] = useState<string[][]>(() => buildEmptyGrid(2, 3).rows);
  const [alignments, setAlignments] = useState<TableColumnAlign[]>(
    () => buildEmptyGrid(2, 3).alignments
  );
  const [editRange, setEditRange] = useState<{ start: number; end: number } | null>(
    null
  );
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  useEffect(() => {
    if (!isTableBuilderOpen) return;

    setShowPasteBox(false);
    setPasteInput('');
    setPasteError(null);
    setCopiedPreview(false);

    const activeDoc = getActiveDocument();
    const cursorPos = getCursorPosition ? getCursorPosition() : 0;

    if (activeDoc?.content) {
      const parsed = parseMarkdownTableAtCursor(activeDoc.content, cursorPos);
      if (parsed) {
        setRows(parsed.rows.map((r) => [...r]));
        setAlignments([...parsed.alignments]);
        setEditRange({ start: parsed.startOffset, end: parsed.endOffset });
        return;
      }
    }

    const fresh = buildEmptyGrid(2, 3);
    setRows(fresh.rows);
    setAlignments(fresh.alignments);
    setEditRange(null);
  }, [isTableBuilderOpen, getActiveDocument, getCursorPosition]);

  const colCount = rows[0]?.length || 1;
  const formattedMarkdown = useMemo(
    () => formatMarkdownTable(rows, alignments),
    [rows, alignments]
  );

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    setRows((prev) =>
      prev.map((row, r) =>
        r === rowIdx ? row.map((cell, c) => (c === colIdx ? value : cell)) : row
      )
    );
  };

  const handleSetAlign = (colIdx: number, align: TableColumnAlign) => {
    setAlignments((prev) => prev.map((a, i) => (i === colIdx ? align : a)));
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      Array.from({ length: colCount }, () => ''),
    ]);
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (rowIdx === 0 || rows.length <= 2) return;
    setRows((prev) => prev.filter((_, idx) => idx !== rowIdx));
  };

  const handleMoveRow = (rowIdx: number, direction: -1 | 1) => {
    const targetIdx = rowIdx + direction;
    if (rowIdx < 1 || targetIdx < 1 || targetIdx >= rows.length) return;
    setRows((prev) => {
      const copy = prev.map((r) => [...r]);
      const temp = copy[rowIdx];
      copy[rowIdx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleAddColumn = () => {
    setRows((prev) =>
      prev.map((row, rIdx) => [...row, rIdx === 0 ? `Header ${colCount + 1}` : ''])
    );
    setAlignments((prev) => [...prev, 'left']);
  };

  const handleDeleteColumn = (colIdx: number) => {
    if (colCount <= 1) return;
    setRows((prev) => prev.map((row) => row.filter((_, c) => c !== colIdx)));
    setAlignments((prev) => prev.filter((_, c) => c !== colIdx));
  };

  const handleApplyPreset = (dataRows: number, cols: number) => {
    const preset = buildEmptyGrid(dataRows, cols);
    setRows(preset.rows);
    setAlignments(preset.alignments);
  };

  const handleImportPaste = () => {
    const parsed = parseSpreadsheetPaste(pasteInput);
    if (!parsed) {
      setPasteError('Paste CSV or tab-separated spreadsheet rows first.');
      return;
    }
    setRows(parsed.rows);
    setAlignments(parsed.alignments);
    setPasteError(null);
    setShowPasteBox(false);
    setPasteInput('');
  };

  const handleCopyMarkdown = async () => {
    const ok = await copyToClipboard(formattedMarkdown);
    if (ok) {
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 1800);
    }
  };

  const handleConfirm = () => {
    onApplyTable(formattedMarkdown, editRange || undefined);
    closeTableBuilder();
  };

  return (
    <Dialog
      open={isTableBuilderOpen}
      onOpenChange={(open) => {
        if (!open) closeTableBuilder();
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            <span>
              {editRange ? 'Edit & Format Markdown Table' : 'Visual Table Builder'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {editRange
              ? 'Editing the Markdown table at your cursor. Adjust cells, columns, rows, and alignment, then update.'
              : 'Build a clean Markdown table visually, paste CSV/Excel cells, and set per-column alignment.'}
          </DialogDescription>
        </DialogHeader>

        {/* Action & Preset Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAddRow}
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <Rows3 className="h-3.5 w-3.5" />
              <span>Add Row</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAddColumn}
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <Columns3 className="h-3.5 w-3.5" />
              <span>Add Column</span>
            </Button>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            <Button
              type="button"
              size="sm"
              variant={showPasteBox ? 'default' : 'outline'}
              onClick={() => setShowPasteBox((v) => !v)}
              className="h-7 text-xs gap-1"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              <span>Paste CSV / Excel</span>
            </Button>
          </div>

          {!editRange && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground mr-1 hidden sm:inline">Preset:</span>
              {[
                { label: '2×3', r: 2, c: 3 },
                { label: '3×3', r: 3, c: 3 },
                { label: '4×4', r: 4, c: 4 },
                { label: '5×4', r: 5, c: 4 },
              ].map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs font-mono"
                  onClick={() => handleApplyPreset(p.r, p.c)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Optional CSV / TSV Paste Box */}
        {showPasteBox && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <Label className="text-xs font-semibold">
              Paste CSV or Excel / Google Sheets Cells
            </Label>
            <Textarea
              value={pasteInput}
              onChange={(e) => {
                setPasteInput(e.target.value);
                setPasteError(null);
              }}
              placeholder={'Name, Role, Status\nAlice, Engineer, Active\nBob, Designer, Review'}
              rows={3}
              className="font-mono text-xs bg-background"
            />
            {pasteError && <p className="text-xs text-destructive">{pasteError}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowPasteBox(false)}
                className="h-7 text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImportPaste}
                className="h-7 text-xs gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Populate Grid
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Visual Grid */}
        <div className="flex-1 overflow-auto space-y-4 py-1">
          <div className="rounded-lg border overflow-x-auto bg-background">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="w-20 p-2 text-left text-[11px] font-medium text-muted-foreground border-r">
                    Columns
                  </th>
                  {Array.from({ length: colCount }, (_, colIdx) => (
                    <th key={colIdx} className="min-w-[140px] p-1.5 border-r last:border-r-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="inline-flex rounded border bg-background p-0.5">
                          {(
                            [
                              { align: 'left', icon: AlignLeft, title: 'Align Left' },
                              { align: 'center', icon: AlignCenter, title: 'Align Center' },
                              { align: 'right', icon: AlignRight, title: 'Align Right' },
                            ] as const
                          ).map(({ align, icon: Icon, title }) => {
                            const active =
                              alignments[colIdx] === align ||
                              (align === 'left' && alignments[colIdx] === 'none');
                            return (
                              <button
                                key={align}
                                type="button"
                                title={title}
                                onClick={() => handleSetAlign(colIdx, align)}
                                className={`p-1 rounded transition-colors ${
                                  active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          title="Delete column"
                          disabled={colCount <= 1}
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const isHeader = rowIdx === 0;
                  return (
                    <tr
                      key={rowIdx}
                      className={`border-b last:border-b-0 ${
                        isHeader ? 'bg-primary/5' : 'hover:bg-muted/20'
                      }`}
                    >
                      <td className="p-1.5 border-r text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                        {isHeader ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold">
                            Header
                          </span>
                        ) : (
                          <div className="flex items-center justify-between gap-0.5">
                            <span className="font-mono text-[10px] px-1">R{rowIdx}</span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                title="Move row up"
                                disabled={rowIdx <= 1}
                                onClick={() => handleMoveRow(rowIdx, -1)}
                                className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                title="Move row down"
                                disabled={rowIdx >= rows.length - 1}
                                onClick={() => handleMoveRow(rowIdx, 1)}
                                className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                title="Delete row"
                                disabled={rows.length <= 2}
                                onClick={() => handleDeleteRow(rowIdx)}
                                className="p-0.5 rounded hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="p-1 border-r last:border-r-0">
                          <Input
                            value={cell}
                            onChange={(e) =>
                              handleCellChange(rowIdx, colIdx, e.target.value)
                            }
                            placeholder={isHeader ? `Header ${colIdx + 1}` : 'Value'}
                            className={`h-8 text-xs border-transparent focus:border-primary shadow-none ${
                              isHeader ? 'font-semibold bg-background/80' : 'bg-transparent'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formatted Markdown Preview */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Formatted Markdown Output ({rows.length - 1} data rows × {colCount} cols)
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyMarkdown}
                className="h-6 px-2 text-xs gap-1"
              >
                {copiedPreview ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </Button>
            </div>
            <pre className="text-[11px] font-mono overflow-x-auto p-2 rounded bg-background border text-foreground/90 leading-relaxed">
              {formattedMarkdown}
            </pre>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t gap-2">
          <Button type="button" variant="outline" onClick={closeTableBuilder}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} className="gap-1.5">
            <Check className="h-4 w-4" />
            {editRange ? 'Update Table in Document' : 'Insert Formatted Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
