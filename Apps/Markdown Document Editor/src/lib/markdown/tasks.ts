// src/lib/markdown/tasks.ts

/**
 * Toggles the N-th task checkbox item in a markdown document.
 * Matches:
 *  - [ ] task
 *  - [x] task
 *  * [ ] task
 *  1. [ ] task
 * preserves indentation and list bullet format.
 */
export function toggleMarkdownTask(content: string, targetIndex: number): string {
  // Regex matches task list item at the beginning of a line
  const taskRegex = /^([ \t]*(?:[-*+]|\d+\.)[ \t]+\[)([ xX])(\][ \t]*)/gm;
  let currentIndex = 0;

  return content.replace(taskRegex, (match, prefix, checkState, suffix) => {
    if (currentIndex === targetIndex) {
      currentIndex++;
      const isCurrentlyChecked = checkState.toLowerCase() === 'x';
      const newCheckState = isCurrentlyChecked ? ' ' : 'x';
      return `${prefix}${newCheckState}${suffix}`;
    }
    currentIndex++;
    return match;
  });
}

/**
 * Counts total task items and completed tasks in a markdown document.
 */
export function countMarkdownTasks(content: string): { total: number; completed: number } {
  const taskRegex = /^[ \t]*(?:[-*+]|\d+\.)[ \t]+\[([ xX])\][ \t]*/gm;
  let total = 0;
  let completed = 0;
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    total++;
    if (match[1].toLowerCase() === 'x') {
      completed++;
    }
  }

  return { total, completed };
}
