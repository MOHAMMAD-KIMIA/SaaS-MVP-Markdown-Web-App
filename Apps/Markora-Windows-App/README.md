# Markora Desktop

> A distraction-free Markdown editor and SaaS suite built with React 18, TypeScript, Tailwind CSS, and full support for bi-directional text (RTL/LTR), GitHub Flavored Markdown, KaTeX math, Mermaid diagrams, and writing productivity targets.

---

## 🌟 Highlights & Features

- **Distraction-Free Markdown Editor**: Custom line numbers, syntax highlight styles, live cursor tracking, and seamless keyboard formatting shortcuts.
- **Bi-Directional Text Support (RTL & LTR)**: Native auto-detection and manual toggle for Right-to-Left languages (Arabic, Hebrew, Persian) and Left-to-Right languages.
- **Real-Time Live Preview**:
  - **GitHub Flavored Markdown (GFM)**: Tables, task lists, strikethroughs, and footnotes.
  - **Mermaid.js Diagrams**: High-performance memoized rendering for sequence, flowchart, and class diagrams.
  - **KaTeX Math Rendering**: Fast inline ($...$) and block ($$...$$) LaTeX math expressions.
  - **Syntax-Highlighted Code Blocks**: Built-in copy buttons and code language tags.
- **Daily Word Count Goals**: Set target word counts per document with interactive progress bars and completion achievements.
- **Top Reading & Scroll Progress**: Subtle, non-flickering top progress bar tracking document reading depth.
- **Export & Sharing**: One-click HTML document export, formatted clipboard copy, and full document persistence.
- **Cross-Platform Bridge**: Ready for desktop packaging with native IPC/electron bridge integration.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Markdown Pipeline**: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-raw`
- **Diagrams**: Mermaid.js
- **State Management**: Zustand
- **UI Components**: Radix UI primitives with custom accessible dialogs and dropdown menus

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ 
- **npm**: v9+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/markora-desktop.git
   cd markora-desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📄 License

MIT License — free for personal and commercial use.
