import { Users, Clock3, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function CollaborationPage() {
  return (
    <div className="overflow-hidden bg-gray-50 dark:bg-gray-950 min-h-screen">
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] border border-gray-200/80 dark:border-gray-800 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/60 dark:to-purple-950/60 shadow-xl overflow-hidden">
          <div className="px-8 py-16 sm:px-12 lg:px-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-900/70 border border-blue-100 dark:border-blue-900/60 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Collaboration
              </span>
            </div>

            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-lg">
              <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
              Collaboration is coming soon.
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              We are building a powerful collaboration experience for teams.
              Real-time editing, comments, and shared workflows will be available
              as soon as possible.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-md">
                <Clock3 className="w-5 h-5 text-amber-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Coming soon
                </span>
              </div>

              <Link
                to="/editor"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Open Editor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
