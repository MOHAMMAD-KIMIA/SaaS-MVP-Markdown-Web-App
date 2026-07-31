import {
  FileText,
  Eye,
  Sparkles,
  Keyboard,
  Code2,
  Palette,
  Download,
  Languages,
  Zap,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router';

export function EditorPage() {
  const features = [
    {
      icon: FileText,
      title: 'Markdown-first writing',
      description:
        'Write clean Markdown with a focused editor built for speed, clarity, and long-form documentation.',
    },
    {
      icon: Eye,
      title: 'Live preview',
      description:
        'See your formatted document update instantly as you type with a beautiful split-pane preview.',
    },
    {
      icon: Keyboard,
      title: 'Keyboard shortcuts',
      description:
        'Move faster with intuitive shortcuts for headings, lists, links, code blocks, and formatting.',
    },
    {
      icon: Code2,
      title: 'Code-friendly editing',
      description:
        'Create technical documentation with syntax-friendly code blocks, inline code, and developer-focused formatting.',
    },
    {
      icon: Palette,
      title: 'Custom typography',
      description:
        'Adjust font size, line height, spacing, and reading style to make every document feel polished.',
    },
    {
      icon: Languages,
      title: 'Multi-language support',
      description:
        'Write in multiple languages with support for RTL layouts, localized typography, and global content.',
    },
  ];

  const workflow = [
    'Start with Markdown',
    'Preview instantly',
    'Customize the look',
    'Export or publish',
  ];

  return (
    <div className="overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section className="pt-32 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] border border-gray-200/80 dark:border-gray-800 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/60 dark:to-purple-950/60 shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center p-8 sm:p-12 lg:p-16">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-900/70 border border-blue-100 dark:border-blue-900/60 shadow-sm mb-6">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Markly Editor
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
                Write Markdown beautifully.
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                A focused, fast, and elegant Markdown editor with live preview,
                customization tools, and publishing-ready output.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Open Editor
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/docs"
                  className="inline-flex items-center justify-center px-7 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-semibold border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all"
                >
                  View Documentation
                </Link>
              </div>
            </div>

            {/* Editor Preview */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                  editor.md
                </span>
              </div>

              <div className="grid md:grid-cols-2">
                <div className="p-5 border-r border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/40">
                  <div className="text-sm font-mono space-y-3 text-gray-700 dark:text-gray-300">
                    <p className="text-blue-600 dark:text-blue-400"># Product Roadmap</p>
                    <p>Build a better writing flow with:</p>
                    <p>- Live preview</p>
                    <p>- Export options</p>
                    <p>- Custom themes</p>
                    <p>- Team collaboration</p>
                    <p className="text-purple-600 dark:text-purple-400">{'```js'}</p>
<p>publish('markly')</p>
<p className="text-purple-600 dark:text-purple-400">{'```'}</p>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-900">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                    Product Roadmap
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Build a better writing flow with:
                  </p>
                  <ul className="space-y-2 mb-5">
                    {[
                      'Live preview',
                      'Export options',
                      'Custom themes',
                      'Team collaboration',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl bg-gray-950 text-green-300 font-mono text-sm p-4">
                    publish('markly')
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl p-8 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Everything you need to write faster
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Markly Editor gives you a polished writing environment designed
              for creators, developers, and teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl p-6 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] bg-gradient-to-br from-gray-900 to-blue-950 text-white shadow-xl overflow-hidden">
          <div className="p-8 sm:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-6">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium text-blue-100">
                    Simple workflow
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  From first draft to polished document.
                </h2>

                <p className="text-lg text-blue-100 leading-relaxed">
                  Write, preview, customize, and export from a single elegant
                  workspace. Markly removes friction so you can focus on the content.
                </p>
              </div>

              <div className="space-y-4">
                {workflow.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur"
                  >
                    <div className="w-10 h-10 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="text-lg font-semibold">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customization */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl p-8 sm:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                <Layers className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Designed for focused writing.
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                The editor is clean by default, but powerful when you need it.
                Customize typography, switch layouts, and prepare your document
                for sharing without leaving the flow.
              </p>

              <div className="space-y-3">
                {[
                  'Split editor and preview layout',
                  'Beautiful light and dark mode',
                  'Export-ready document formatting',
                  'Clean interface with minimal distractions',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6 shadow-inner">
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                    <span>Font size</span>
                    <span>18px</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-600 to-purple-600" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                    <span>Line height</span>
                    <span>1.7</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-blue-600 to-purple-600" />
                  </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                    Beautiful reading preview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-7">
                    Customize how your Markdown feels before exporting or publishing.
                    Every detail is tuned for readability and elegance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl p-8 sm:p-12 lg:p-16 text-center">
          <Download className="w-12 h-12 mx-auto mb-6 text-blue-100" />

          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            Ready to create your next document?
          </h2>

          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Open Markly Editor and start writing with a clean Markdown workflow,
            live preview, and publishing-ready tools.
          </p>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Open Editor
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
