import { Globe, Clock3, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function PublishingPage() {
  return (
    <div className="overflow-hidden bg-gray-50 dark:bg-gray-950 min-h-screen">
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[2rem] border border-gray-200/80 dark:border-gray-800 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-emerald-950/50 dark:to-cyan-950/50 shadow-xl overflow-hidden">
          <div className="px-8 py-16 sm:px-12 lg:px-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-900/70 border border-emerald-100 dark:border-emerald-900/60 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Publishing
              </span>
            </div>

            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-lg">
              <Globe className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-cyan-800 dark:from-white dark:via-emerald-200 dark:to-cyan-200 bg-clip-text text-transparent leading-tight">
              Publishing is coming soon.
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              We are preparing a smooth publishing experience so you can turn
              your documents into beautiful, shareable pages with just a few
              clicks. It will be available as soon as possible.
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
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
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
