// src/lib/markdown/diff.ts

export type DiffRowKind = 'equal' | 'added' | 'removed' | 'modified';

export interface DiffRow {
  kind: DiffRowKind;
  oldLineNum: number | null;
  newLineNum: number | null;
  oldText: string;
  newText: string;
}

export interface WordDiffSegment {
  text: string;
  type: 'equal' | 'added' | 'removed';
}

export interface DiffHunk {
  id: string;
  index: number;
  oldStartLine: number; // 0-based line index in snapshot
  oldEndLine: number;   // exclusive
  newStartLine: number; // 0-based line index in current
  newEndLine: number;   // exclusive
  addedCount: number;
  removedCount: number;
  rows: DiffRow[];
}

interface RawOp {
  type: 'equal' | 'remove' | 'add';
  oldLineNum: number | null;
  newLineNum: number | null;
  text: string;
}

/**
 * Computes line-level LCS ops from `snapshotText` (old) to `currentText` (new).
 */
function computeLineOps(snapshotText: string, currentText: string): RawOp[] {
  const oldLines = snapshotText.replace(/\r\n/g, '\n').split('\n');
  const newLines = currentText.replace(/\r\n/g, '\n').split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  // Trim common prefix & suffix for speed on large documents
  let prefix = 0;
  while (prefix < m && prefix < n && oldLines[prefix] === newLines[prefix]) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < m - prefix &&
    suffix < n - prefix &&
    oldLines[m - 1 - suffix] === newLines[n - 1 - suffix]
  ) {
    suffix++;
  }

  const ops: RawOp[] = [];
  for (let i = 0; i < prefix; i++) {
    ops.push({ type: 'equal', oldLineNum: i + 1, newLineNum: i + 1, text: oldLines[i] });
  }

  const midOld = oldLines.slice(prefix, m - suffix);
  const midNew = newLines.slice(prefix, n - suffix);
  const mo = midOld.length;
  const mn = midNew.length;

  if (mo === 0 && mn > 0) {
    for (let j = 0; j < mn; j++) {
      ops.push({ type: 'add', oldLineNum: null, newLineNum: prefix + j + 1, text: midNew[j] });
    }
  } else if (mn === 0 && mo > 0) {
    for (let i = 0; i < mo; i++) {
      ops.push({ type: 'remove', oldLineNum: prefix + i + 1, newLineNum: null, text: midOld[i] });
    }
  } else if (mo > 0 && mn > 0) {
    // Guard memory for huge edits (fallback to direct replace hunk if > 1800x1800)
    if (mo * mn > 2_500_000) {
      for (let i = 0; i < mo; i++) {
        ops.push({ type: 'remove', oldLineNum: prefix + i + 1, newLineNum: null, text: midOld[i] });
      }
      for (let j = 0; j < mn; j++) {
        ops.push({ type: 'add', oldLineNum: null, newLineNum: prefix + j + 1, text: midNew[j] });
      }
    } else {
      const dp = new Int32Array((mo + 1) * (mn + 1));
      const stride = mn + 1;
      for (let i = mo - 1; i >= 0; i--) {
        for (let j = mn - 1; j >= 0; j--) {
          if (midOld[i] === midNew[j]) {
            dp[i * stride + j] = dp[(i + 1) * stride + (j + 1)] + 1;
          } else {
            const down = dp[(i + 1) * stride + j];
            const right = dp[i * stride + (j + 1)];
            dp[i * stride + j] = down >= right ? down : right;
          }
        }
      }

      let i = 0;
      let j = 0;
      while (i < mo && j < mn) {
        if (midOld[i] === midNew[j]) {
          ops.push({
            type: 'equal',
            oldLineNum: prefix + i + 1,
            newLineNum: prefix + j + 1,
            text: midOld[i],
          });
          i++;
          j++;
        } else if (dp[(i + 1) * stride + j] >= dp[i * stride + (j + 1)]) {
          ops.push({
            type: 'remove',
            oldLineNum: prefix + i + 1,
            newLineNum: null,
            text: midOld[i],
          });
          i++;
        } else {
          ops.push({
            type: 'add',
            oldLineNum: null,
            newLineNum: prefix + j + 1,
            text: midNew[j],
          });
          j++;
        }
      }
      while (i < mo) {
        ops.push({ type: 'remove', oldLineNum: prefix + i + 1, newLineNum: null, text: midOld[i] });
        i++;
      }
      while (j < mn) {
        ops.push({ type: 'add', oldLineNum: null, newLineNum: prefix + j + 1, text: midNew[j] });
        j++;
      }
    }
  }

  for (let s = 0; s < suffix; s++) {
    const oi = m - suffix + s;
    const ni = n - suffix + s;
    ops.push({ type: 'equal', oldLineNum: oi + 1, newLineNum: ni + 1, text: oldLines[oi] });
  }

  return ops;
}

/**
 * Aligns consecutive remove+add pairs into `modified` rows for side-by-side comparison.
 */
export function computeSideBySideDiff(snapshotText: string, currentText: string): DiffRow[] {
  const ops = computeLineOps(snapshotText, currentText);
  const rows: DiffRow[] = [];

  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === 'equal') {
      rows.push({
        kind: 'equal',
        oldLineNum: ops[i].oldLineNum,
        newLineNum: ops[i].newLineNum,
        oldText: ops[i].text,
        newText: ops[i].text,
      });
      i++;
      continue;
    }

    const removes: RawOp[] = [];
    const adds: RawOp[] = [];
    while (i < ops.length && ops[i].type !== 'equal') {
      if (ops[i].type === 'remove') removes.push(ops[i]);
      else adds.push(ops[i]);
      i++;
    }

    const maxCount = Math.max(removes.length, adds.length);
    for (let k = 0; k < maxCount; k++) {
      const rem = removes[k];
      const add = adds[k];
      if (rem && add) {
        rows.push({
          kind: 'modified',
          oldLineNum: rem.oldLineNum,
          newLineNum: add.newLineNum,
          oldText: rem.text,
          newText: add.text,
        });
      } else if (rem) {
        rows.push({
          kind: 'removed',
          oldLineNum: rem.oldLineNum,
          newLineNum: null,
          oldText: rem.text,
          newText: '',
        });
      } else if (add) {
        rows.push({
          kind: 'added',
          oldLineNum: null,
          newLineNum: add.newLineNum,
          oldText: '',
          newText: add.text,
        });
      }
    }
  }

  return rows;
}

/**
 * Word/token-level diff for modified lines.
 */
export function computeWordDiff(
  oldLine: string,
  newLine: string
): { oldSegments: WordDiffSegment[]; newSegments: WordDiffSegment[] } {
  const tokenize = (s: string) => s.match(/\S+|\s+/g) || [];
  const a = tokenize(oldLine);
  const b = tokenize(newLine);
  const m = a.length;
  const n = b.length;

  if (m * n > 25000) {
    return {
      oldSegments: [{ text: oldLine, type: 'removed' }],
      newSegments: [{ text: newLine, type: 'added' }],
    };
  }

  const dp = new Int32Array((m + 1) * (n + 1));
  const stride = n + 1;
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i * stride + j] = dp[(i + 1) * stride + (j + 1)] + 1;
      } else {
        const down = dp[(i + 1) * stride + j];
        const right = dp[i * stride + (j + 1)];
        dp[i * stride + j] = down >= right ? down : right;
      }
    }
  }

  const oldSegments: WordDiffSegment[] = [];
  const newSegments: WordDiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (a[i] === b[j]) {
      oldSegments.push({ text: a[i], type: 'equal' });
      newSegments.push({ text: b[j], type: 'equal' });
      i++;
      j++;
    } else if (dp[(i + 1) * stride + j] >= dp[i * stride + (j + 1)]) {
      oldSegments.push({ text: a[i], type: 'removed' });
      i++;
    } else {
      newSegments.push({ text: b[j], type: 'added' });
      j++;
    }
  }
  while (i < m) {
    oldSegments.push({ text: a[i], type: 'removed' });
    i++;
  }
  while (j < n) {
    newSegments.push({ text: b[j], type: 'added' });
    j++;
  }

  return { oldSegments, newSegments };
}

/**
 * Groups contiguous changed DiffRows into actionable hunks for selective restore.
 */
export function groupDiffHunks(rows: DiffRow[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let idx = 0;
  let oldCursor = 0;
  let newCursor = 0;

  while (idx < rows.length) {
    const row = rows[idx];
    if (row.kind === 'equal') {
      oldCursor = row.oldLineNum ?? oldCursor;
      newCursor = row.newLineNum ?? newCursor;
      idx++;
      continue;
    }

    const oldStartLine = oldCursor;
    const newStartLine = newCursor;
    const hunkRows: DiffRow[] = [];
    let addedCount = 0;
    let removedCount = 0;

    while (idx < rows.length && rows[idx].kind !== 'equal') {
      const r = rows[idx];
      hunkRows.push(r);
      if (r.kind === 'added') {
        addedCount++;
        newCursor = r.newLineNum ?? newCursor;
      } else if (r.kind === 'removed') {
        removedCount++;
        oldCursor = r.oldLineNum ?? oldCursor;
      } else {
        addedCount++;
        removedCount++;
        oldCursor = r.oldLineNum ?? oldCursor;
        newCursor = r.newLineNum ?? newCursor;
      }
      idx++;
    }

    hunks.push({
      id: `hunk-${hunks.length + 1}-${oldStartLine}-${newStartLine}`,
      index: hunks.length,
      oldStartLine,
      oldEndLine: oldCursor,
      newStartLine,
      newEndLine: newCursor,
      addedCount,
      removedCount,
      rows: hunkRows,
    });
  }

  return hunks;
}

/**
 * Selectively restores a single diff hunk from the snapshot into `currentText`.
 */
export function applyDiffHunkRestore(currentText: string, hunk: DiffHunk): string {
  const currentLines = currentText.replace(/\r\n/g, '\n').split('\n');
  const restoredLines: string[] = [];

  for (const row of hunk.rows) {
    if (row.kind === 'removed' || row.kind === 'modified') {
      restoredLines.push(row.oldText);
    }
  }

  const start = Math.max(0, Math.min(currentLines.length, hunk.newStartLine));
  const deleteCount = Math.max(0, hunk.newEndLine - hunk.newStartLine);

  const nextLines = [
    ...currentLines.slice(0, start),
    ...restoredLines,
    ...currentLines.slice(start + deleteCount),
  ];

  return nextLines.join('\n');
}
