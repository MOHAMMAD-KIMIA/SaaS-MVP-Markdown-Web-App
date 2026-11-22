import { 
  Zap, 
  Users, 
  Globe, 
  Lock, 
  Sparkles, 
  Code, 
  FileText, 
  Share2,
  Cloud,
  Palette,
  BarChart,
  Smartphone,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export function FeaturesPage() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Experience blazing-fast performance with our optimized editor. Write without lag, even with large documents.',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      details: {
        headline: 'Performance That Keeps Up With Your Thoughts',
        content: 'Our editor is built from the ground up for speed. With advanced caching, lazy loading, and optimized rendering, you can work with documents of any size without experiencing lag or delays. Whether you\'re writing a quick note or a 100-page manuscript, Markly responds instantly to every keystroke.',
        benefits: [
          'Instant load times, even for large documents',
          'Smooth scrolling through thousands of lines',
          'Real-time syntax highlighting without performance impact',
          'Optimized for both desktop and mobile devices'
        ]
      }
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with your team. See changes as they happen and collaborate in real-time.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      details: {
        headline: 'Collaborate Like You\'re in the Same Room',
        content: 'See your teammates\' cursors, edits, and comments as they happen. Our real-time collaboration engine ensures everyone stays in sync, with conflict resolution that just works. No more emailing documents back and forth or dealing with version conflicts.',
        benefits: [
          'Live cursor tracking shows who\'s editing what',
          'Instant synchronization across all devices',
          'Smart conflict resolution prevents overwrites',
          'Built-in chat and commenting for seamless communication'
        ]
      }
    },
    {
      icon: Globe,
      title: 'Publish Anywhere',
      description: 'Export to multiple formats or publish directly to the web. Your content, your way.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      details: {
        headline: 'From Draft to Published in Seconds',
        content: 'Export your documents to PDF, Word, HTML, or Markdown with a single click. Or publish directly to the web with a beautiful, responsive layout. Custom domains, SEO optimization, and analytics are all built in. Your content deserves to be seen.',
        benefits: [
          'One-click export to PDF, DOCX, HTML, and Markdown',
          'Publish to web with custom domains and SSL',
          'SEO-optimized pages with meta tags and structured data',
          'Automatic responsive design for all screen sizes'
        ]
      }
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'End-to-end encryption keeps your documents safe. Your data belongs to you, always.',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      details: {
        headline: 'Your Privacy is Our Priority',
        content: 'All your documents are encrypted end-to-end, meaning only you and those you share with can read them. We use industry-standard encryption protocols and never sell your data. Your intellectual property stays yours, and we take every measure to keep it secure.',
        benefits: [
          'End-to-end encryption for all documents',
          'Two-factor authentication for account security',
          'Granular permission controls for sharing',
          'GDPR and SOC 2 compliant infrastructure'
        ]
      }
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Writing',
      description: 'Get intelligent suggestions, grammar corrections, and style improvements as you write.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      details: {
        headline: 'Write Better With AI Assistance',
        content: 'Our AI writing assistant helps you craft better content. Get real-time grammar and style suggestions, generate ideas when you\'re stuck, and improve clarity with intelligent rewrites. It\'s like having a professional editor looking over your shoulder, but better.',
        benefits: [
          'Real-time grammar and spelling corrections',
          'Style suggestions to improve readability',
          'AI-powered content generation and brainstorming',
          'Tone adjustment for different audiences'
        ]
      }
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'Syntax highlighting, code blocks, and markdown shortcuts. Built for technical writers.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      details: {
        headline: 'Built for Technical Documentation',
        content: 'Whether you\'re writing API docs, tutorials, or technical specifications, Markly has you covered. Syntax highlighting for 100+ languages, inline code execution, and markdown shortcuts make technical writing a breeze. Export to GitHub-flavored markdown or publish as interactive documentation.',
        benefits: [
          'Syntax highlighting for 100+ programming languages',
          'Live code preview and execution',
          'Markdown shortcuts and keyboard-first workflow',
          'Export to GitHub-flavored markdown'
        ]
      }
    },
  ];

  const advancedFeatures = [
    {
      icon: FileText,
      title: 'Smart Templates',
      description: 'Start faster with pre-built templates for blogs, documentation, reports, and more.',
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'Share documents with a link. Control permissions and track who views your content.',
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description: 'Access your documents from anywhere. Automatic sync across all your devices.',
    },
    {
      icon: Palette,
      title: 'Custom Themes',
      description: 'Personalize your workspace with custom themes and editor preferences.',
    },
    {
      icon: BarChart,
      title: 'Analytics',
      description: 'Track document views, engagement, and reader behavior with built-in analytics.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Write on the go with our responsive mobile interface. Full features, any device.',
    },
  ];

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Everything you need to write better
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Powerful features designed to help you create, collaborate, and publish beautiful documents with ease.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Core Features
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                The essential tools that make Markly powerful
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg"
                >
                  <div className={`${feature.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Feature Sections */}
      {features.map((feature, index) => (
        <section key={index} className="py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'} rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
                {/* Content Side */}
                <div className={`flex flex-col justify-center ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className={`${feature.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.details.headline}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {feature.details.content}
                  </p>
                  <div className="space-y-3">
                    {feature.details.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <CheckCircle className={`w-5 h-5 ${feature.color} flex-shrink-0 mt-0.5`} />
                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <button className={`mt-8 inline-flex items-center space-x-2 ${feature.color} font-semibold hover:underline group/btn`}>
                    <span>Learn more about {feature.title}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Visual Side */}
                <div className={`flex items-center justify-center ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className={`${feature.bgColor} w-full h-full min-h-[300px] rounded-2xl flex items-center justify-center border-2 border-dashed ${feature.color.replace('text-', 'border-').replace('dark:text-', 'dark:border-')}`}>
                    <feature.icon className={`w-32 h-32 ${feature.color} opacity-20`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Advanced Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Advanced Capabilities
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Professional tools for power users
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advancedFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-md"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl shadow-xl border border-blue-200 dark:border-blue-800 p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Markly?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                See how we compare to traditional editors
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Markly
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Traditional Editors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Real-time Collaboration</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Cloud Sync</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">~</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">AI Writing Assistant</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Web Publishing</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Version Control</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">~</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 mb-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-2xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to experience the difference?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of writers who have already made the switch to Markly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors border-2 border-blue-400">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
