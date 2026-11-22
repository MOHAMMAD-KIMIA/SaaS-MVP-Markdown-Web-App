// src/lib/markdown/samplePresentation.ts

export const SAMPLE_PRESENTATION_TITLE = 'Sample Presentation Deck';

export const SAMPLE_PRESENTATION_CONTENT = `# Markora Slide Deck Mode

Turn any Markdown document into a **full-screen presentation** using horizontal rules (\`---\`).

> [!TIP] Quick Controls
> Click the **Present** button in the top bar (or press **Alt + P**) to launch full-screen slides.

???
Welcome everyone!
- Press **Arrow Right / Space** to advance slides.
- Press **N** to toggle these Speaker Notes.
- Press **G** to view the Slide Overview Grid.

---

## Built for Focused Writing & Presenting

Three tools working together in one workspace:

- **Document Outline & Minimap** — Jump across \`H1–H6\` sections or drag to reorder
- **Focus & Typewriter Mode** — Dim surrounding paragraphs and center the active line
- **Slide Deck Mode** — Present directly from Markdown with live theme matching

<!-- notes: Highlight that slides automatically inherit Light, Dark, or Sepia themes and can be switched live during the talk. -->

---

## Workspace Architecture

\`\`\`mermaid
flowchart LR
    A[Write Markdown] --> B[Organize via Outline]
    B --> C[Review with Inline Comments]
    C --> D[Present as Slides]
\`\`\`

> [!NOTE] Code Fences Safe
> Horizontal rules inside frontmatter or code blocks never split your slides accidentally.

???
Point out that Mermaid diagrams, Callouts, and KaTeX math render live inside every slide card.

---

## Structured Data & Code

| Feature | Shortcut | Best Used For |
| --- | --- | --- |
| Command Palette | \`Ctrl / Cmd + K\` | Instant navigation |
| Presentation Mode | \`Alt + P\` | Full-screen decks |
| Focus Mode | \`F11\` | Distraction-free drafting |
| Code Block Fold | \`Ctrl + Shift + [\` | Long technical docs |

\`\`\`typescript
export function greetAudience(slideCount: number): string {
  return \`Presenting \${slideCount} Markdown slides live!\`;
}
\`\`\`

???
Walk through the table first, then mention how code blocks keep syntax formatting cleanly inside slides.

---

## Math, Highlights & Takeaways

Markora supports inline math like $E = mc^2$ and block equations:

$$
\\text{Clarity} = \\frac{\\text{Signal}}{\\text{Noise}}
$$

- Use ==yellow==, ==green:emerald==, or ==blue:sky== highlights to emphasize key points
- Add speaker notes using \`???\` or \`<!-- notes: ... -->\`

???
Remember to pause here and ask the audience if they have any questions about formulas or formatting.

---

# Thank You!

### Try It Live Now

1. Press **N** to view or hide **Speaker Notes**
2. Press **G** to open the **Slide Grid Overview**
3. Switch between **Light**, **Sepia**, and **Dark** themes in the top bar
4. Press **Esc** when you're ready to return to editing

???
Closing slide — wrap up and invite questions!
`;
