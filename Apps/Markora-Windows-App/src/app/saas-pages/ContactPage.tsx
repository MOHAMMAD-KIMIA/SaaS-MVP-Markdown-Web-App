import { Mail, MessageSquare, HelpCircle, Clock, MapPin, Phone, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">We're here to help</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white">
                Contact Us
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Have a question or need help? Get in touch with our team and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Method Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-xl text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get help via email
              </p>
              <a
                href="mailto:support@markly.com"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                support@markly.com
              </a>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-xl text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Live Chat</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Chat with our team
              </p>
              <button className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                Start a chat
              </button>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-xl text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Help Center</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Browse our guides
              </p>
              <Link to="/docs" className="text-green-600 dark:text-green-400 hover:underline font-semibold">
                View documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Send us a message
              </h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us more about your question or feedback..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 font-bold text-lg"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Support Info */}
            <div className="space-y-6">
              {/* Support Hours Card */}
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">We're here to help</h3>
                  <p className="text-blue-100 mb-6">
                    Our support team is available to answer your questions and help you get the most out of Markly.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Support Hours</div>
                        <div className="text-blue-100 text-sm">Monday - Friday, 9am - 6pm EST</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Email Response</div>
                        <div className="text-blue-100 text-sm">Within 24 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Live Chat</div>
                        <div className="text-blue-100 text-sm">Average wait: 5 minutes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Contact Methods */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                  Other Contact Methods
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Phone (Enterprise)</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Sales Inquiries</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">sales@markly.com</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Office Location</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        123 Tech Street<br />San Francisco, CA 94105
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Notice */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-3xl p-6 shadow-lg">
                <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2 text-lg">
                  Frequently Asked Questions
                </h4>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                  Before reaching out, check if your question is answered in our FAQ section.
                </p>
                <Link
                  to="/docs"
                  className="inline-block px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm font-bold"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MapPin className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Map placeholder</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  123 Tech Street, San Francisco, CA 94105
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
