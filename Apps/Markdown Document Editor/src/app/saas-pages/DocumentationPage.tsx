import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Book, Terminal, Code, Zap, Search, HelpCircle } from 'lucide-react';
import { Link } from 'react-router';

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedCategories, setExpandedCategories] = useState(['introduction', 'features']);
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const sidebarItems = [
    {
      category: 'Introduction',
      id: 'introduction',
      pages: [
        { title: 'Getting Started', id: 'getting-started' },
        { title: 'Installation', id: 'installation' },
        { title: 'Quick Start', id: 'quick-start' },
      ],
    },
    {
      category: 'Features',
      id: 'features',
      pages: [
        { title: 'Editor Basics', id: 'editor-basics' },
        { title: 'Markdown Syntax', id: 'markdown-syntax' },
        { title: 'Collaboration', id: 'collaboration' },
      ],
    },
    {
      category: 'Publishing',
      id: 'publishing',
      pages: [
        { title: 'Export Options', id: 'export-options' },
        { title: 'Web Publishing', id: 'web-publishing' },
        { title: 'Custom Domains', id: 'custom-domains' },
      ],
    },
    {
      category: 'API Reference',
      id: 'api',
      pages: [
        { title: 'Authentication', id: 'authentication' },
        { title: 'Documents API', id: 'documents-api' },
        { title: 'Webhooks', id: 'webhooks' },
      ],
    },
  ];

  const onThisPage = [
    { title: 'Overview', id: 'overview' },
    { title: 'Prerequisites', id: 'prerequisites' },
    { title: 'Installation Steps', id: 'installation-steps' },
    { title: 'Configuration', id: 'configuration' },
    { title: 'Next Steps', id: 'next-steps' },
  ];

  const [activeHeading, setActiveHeading] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const headings = contentRef.current.querySelectorAll('[data-heading-id]');
      let current = 'overview';

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top < 200) {
          current = heading.getAttribute('data-heading-id') || 'overview';
        }
      });

      setActiveHeading(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const scrollToHeading = (headingId: string) => {
    const element = document.querySelector(`[data-heading-id="${headingId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px] gap-8 xl:gap-12">
          {/* Left Sidebar - Floating Island */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <nav className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Book className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Documentation</h2>
                  </div>
                </div>

                <div className="space-y-1">
                  {sidebarItems.map((category) => (
                    <div key={category.id}>
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <span>{category.category}</span>
                        {expandedCategories.includes(category.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {expandedCategories.includes(category.id) && (
                        <div className="ml-4 mt-1 space-y-1">
                          {category.pages.map((page) => (
                            <button
                              key={page.id}
                              onClick={() => setActiveSection(page.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                                activeSection === page.id
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {page.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Hero Section with Search */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Documentation
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Everything you need to get started with Markly. Learn features, master the editor, and publish beautiful documents.
              </p>

              {/* Search Bar - Floating Card */}
              <div className="max-w-2xl mx-auto">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documentation…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Article Content */}
            <article className="prose prose-lg dark:prose-invert max-w-none" ref={contentRef}>
              <h1 data-heading-id="overview" className="scroll-mt-24">
                Getting Started with Markly
              </h1>
              <p className="lead">
                Welcome to Markly! This guide will help you get up and running with our powerful
                markdown editor in just a few minutes.
              </p>

              <div className="not-prose bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 my-8">
                <div className="flex items-start space-x-3">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Quick Tip
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      You can start writing immediately with our free plan. No credit card
                      required!
                    </p>
                  </div>
                </div>
              </div>

              <h2 data-heading-id="prerequisites" className="scroll-mt-24">
                Prerequisites
              </h2>
              <p>
                Before you begin, make sure you have the following:
              </p>
              <ul>
                <li>A modern web browser (Chrome, Firefox, Safari, or Edge)</li>
                <li>An internet connection</li>
                <li>A Markly account (sign up is free)</li>
              </ul>

              <h2 data-heading-id="installation-steps" className="scroll-mt-24">
                Installation Steps
              </h2>
              <p>
                Markly is a web-based application, so there's no installation required. Simply
                follow these steps:
              </p>

              <ol>
                <li>
                  <strong>Create an account</strong>
                  <p>Visit our signup page and create your free account.</p>
                </li>
                <li>
                  <strong>Verify your email</strong>
                  <p>Check your inbox for a verification email and click the link.</p>
                </li>
                <li>
                  <strong>Start writing</strong>
                  <p>Once verified, you'll be taken to your dashboard where you can create your first document.</p>
                </li>
              </ol>

              <div className="not-prose bg-gray-900 dark:bg-gray-800 rounded-xl p-6 my-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Terminal className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300 text-sm font-mono">Example Command</span>
                </div>
                <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                  <code>{`# Create a new document
markly create "My First Document"

# Start the editor
markly edit document.md`}</code>
                </pre>
              </div>

              <h2 data-heading-id="configuration" className="scroll-mt-24">
                Configuration
              </h2>
              <p>
                You can customize Markly to fit your workflow. Here are some common configurations:
              </p>

              <h3>Editor Settings</h3>
              <table>
                <thead>
                  <tr>
                    <th>Setting</th>
                    <th>Description</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Theme</td>
                    <td>Light or dark mode</td>
                    <td>Light</td>
                  </tr>
                  <tr>
                    <td>Font</td>
                    <td>Editor font family</td>
                    <td>Inter</td>
                  </tr>
                  <tr>
                    <td>Auto-save</td>
                    <td>Automatic save interval</td>
                    <td>30 seconds</td>
                  </tr>
                </tbody>
              </table>

              <div className="not-prose bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 my-8">
                <div className="flex items-start space-x-3">
                  <Code className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Note
                    </h4>
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      Settings are synced across all your devices automatically.
                    </p>
                  </div>
                </div>
              </div>

              <h2 data-heading-id="next-steps" className="scroll-mt-24">
                Next Steps
              </h2>
              <p>
                Now that you're set up, here are some things you can do next:
              </p>
              <ul>
                <li>Learn about <a href="#markdown-syntax">Markdown syntax</a></li>
                <li>Explore <a href="#collaboration">collaboration features</a></li>
                <li>Check out our <a href="#export-options">export options</a></li>
              </ul>

              {/* Navigation */}
              <div className="not-prose flex items-center justify-between pt-12 mt-12 border-t border-gray-200 dark:border-gray-800">
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>Previous</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          </main>

          {/* Right Sidebar - Floating Island */}
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <nav className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                  On This Page
                </h3>
                <ul className="space-y-2 mb-8">
                  {onThisPage.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToHeading(item.id)}
                        className={`block text-sm transition-colors text-left w-full ${
                          activeHeading === item.id
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Need Help Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-3 mb-3">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          Need help?
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Can't find what you're looking for?
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/contact"
                      className="block w-full text-center px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      Get Support
                    </Link>
                  </div>
                </div>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
