import { FileText, Plus, Upload, Clock, Star, Folder, Search, MoreVertical, ExternalLink } from 'lucide-react';

export function DashboardPage() {
  const recentDocuments = [
    {
      title: 'Product Requirements Doc',
      lastEdited: '2 hours ago',
      folder: 'Projects',
      starred: true,
    },
    {
      title: 'Meeting Notes - Q2 Planning',
      lastEdited: '5 hours ago',
      folder: 'Notes',
      starred: false,
    },
    {
      title: 'API Documentation',
      lastEdited: '1 day ago',
      folder: 'Technical',
      starred: true,
    },
    {
      title: 'Blog Post Draft',
      lastEdited: '2 days ago',
      folder: 'Content',
      starred: false,
    },
    {
      title: 'User Research Findings',
      lastEdited: '3 days ago',
      folder: 'Research',
      starred: false,
    },
  ];

  const quickStats = [
    { label: 'Total Documents', value: '24', icon: FileText },
    { label: 'Shared with Me', value: '8', icon: Folder },
    { label: 'Starred', value: '5', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold mb-2">Welcome back to Markly</h1>
              <p className="text-blue-100">
                Ready to continue writing? Pick up where you left off or start something new.
              </p>
            </div>
            <button className="group px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold flex items-center space-x-2">
              <span>Open Editor</span>
              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">New Document</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start with a blank document
              </p>
            </button>

            <button className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Use Template</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose from our templates
              </p>
            </button>

            <button className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-green-500 dark:hover:border-green-500 transition-all text-left">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Import Document</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload from your computer
              </p>
            </button>
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentDocuments.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {doc.title}
                        </h3>
                        {doc.starred && (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                          <Folder className="w-4 h-4" />
                          <span>{doc.folder}</span>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
                        <span className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{doc.lastEdited}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center">
            <button className="text-blue-600 dark:text-blue-400 hover:underline">
              View all documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
