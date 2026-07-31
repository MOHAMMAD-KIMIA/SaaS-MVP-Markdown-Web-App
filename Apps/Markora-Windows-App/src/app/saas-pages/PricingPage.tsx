import { useState } from 'react';
import { Link } from 'react-router';
import { Check, X, Star, Sparkles, ChevronDown } from 'lucide-react';

export function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const plans = [
    {
      name: 'Free',
      description: 'For individuals getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { name: 'Up to 10 documents', included: true },
        { name: 'Basic editor', included: true },
        { name: 'Export to PDF & HTML', included: true },
        { name: 'Community support', included: true },
        { name: 'Real-time collaboration', included: false },
        { name: 'Custom templates', included: false },
        { name: 'Priority support', included: false },
        { name: 'Advanced security', included: false },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      description: 'For professionals and small teams',
      monthlyPrice: 12,
      yearlyPrice: 120,
      features: [
        { name: 'Unlimited documents', included: true },
        { name: 'Advanced editor', included: true },
        { name: 'Export to all formats', included: true },
        { name: 'Real-time collaboration', included: true },
        { name: 'Custom templates', included: true },
        { name: 'Version history', included: true },
        { name: 'Priority support', included: false },
        { name: 'Advanced security', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'For large teams and organizations',
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [
        { name: 'Everything in Pro', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Advanced security', included: true },
        { name: 'SSO & SAML', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'SLA guarantee', included: true },
        { name: 'Custom training', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: 'Editor',
      features: [
        { name: 'Markdown support', free: true, pro: true, enterprise: true },
        { name: 'WYSIWYG mode', free: true, pro: true, enterprise: true },
        { name: 'Syntax highlighting', free: true, pro: true, enterprise: true },
        { name: 'Live preview', free: true, pro: true, enterprise: true },
        { name: 'Custom themes', free: false, pro: true, enterprise: true },
        { name: 'Advanced formatting', free: false, pro: true, enterprise: true },
      ],
    },
    {
      category: 'Collaboration',
      features: [
        { name: 'Document sharing', free: true, pro: true, enterprise: true },
        { name: 'Real-time editing', free: false, pro: true, enterprise: true },
        { name: 'Comments & mentions', free: false, pro: true, enterprise: true },
        { name: 'Team workspaces', free: false, pro: true, enterprise: true },
        { name: 'Role-based permissions', free: false, pro: true, enterprise: true },
        { name: 'Guest access', free: false, pro: false, enterprise: true },
      ],
    },
    {
      category: 'Publishing',
      features: [
        { name: 'Export to PDF', free: true, pro: true, enterprise: true },
        { name: 'Export to HTML', free: true, pro: true, enterprise: true },
        { name: 'Export to DOCX', free: false, pro: true, enterprise: true },
        { name: 'Custom domains', free: false, pro: true, enterprise: true },
        { name: 'SEO optimization', free: false, pro: true, enterprise: true },
        { name: 'White labeling', free: false, pro: false, enterprise: true },
      ],
    },
    {
      category: 'Security & Support',
      features: [
        { name: 'SSL encryption', free: true, pro: true, enterprise: true },
        { name: 'Version history (7 days)', free: true, pro: false, enterprise: false },
        { name: 'Version history (90 days)', free: false, pro: true, enterprise: false },
        { name: 'Version history (unlimited)', free: false, pro: false, enterprise: true },
        { name: 'Priority support', free: false, pro: true, enterprise: true },
        { name: 'SSO & SAML', free: false, pro: false, enterprise: true },
      ],
    },
  ];

  const faqs = [
    {
      question: 'Can I change my plan later?',
      answer:
        'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via invoice.',
    },
    {
      question: 'Is there a free trial?',
      answer:
        'Yes! All paid plans come with a 14-day free trial. No credit card required to start.',
    },
    {
      question: 'What happens if I cancel?',
      answer:
        'You can cancel anytime. Your account will remain active until the end of your billing period, and you can export all your documents.',
    },
    {
      question: 'Do you offer discounts for non-profits or education?',
      answer:
        'Yes! We offer special pricing for non-profit organizations and educational institutions. Contact our sales team for details.',
    },
    {
      question: 'How does team collaboration work?',
      answer:
        'Team members can work together in real-time on shared documents. You can assign roles, leave comments, and track changes with full version history.',
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12;
    return price;
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

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
                <span className="text-sm font-medium text-white">14-day free trial included</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-12">
                Choose the perfect plan for your needs. Scale as you grow.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center space-x-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-full shadow-xl">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                    billingPeriod === 'monthly'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 relative ${
                    billingPeriod === 'yearly'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-green-500 text-white px-2.5 py-1 rounded-full font-bold">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular
                    ? 'ring-2 ring-blue-600 dark:ring-blue-500 shadow-2xl shadow-blue-500/20 dark:shadow-blue-500/30 scale-105'
                    : 'border border-gray-200/50 dark:border-gray-800/50 shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full flex items-center space-x-2 shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="mb-8 pt-4">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">{plan.description}</p>
                  
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${getPrice(plan).toFixed(0)}
                    </span>
                    <span className="text-xl text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  
                  {billingPeriod === 'yearly' && plan.yearlyPrice > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Billed ${plan.yearlyPrice} annually
                    </p>
                  )}
                </div>

                <Link
                  to={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`block w-full py-4 px-6 rounded-2xl text-center font-bold transition-all duration-300 mb-8 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-lg'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 mt-0.5 ${
                        feature.included 
                          ? 'text-green-500' 
                          : 'text-gray-300 dark:text-gray-700'
                      }`}>
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          feature.included
                            ? 'text-gray-700 dark:text-gray-300 font-medium'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Compare All Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Detailed breakdown of what's included in each plan
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20">
                    <th className="px-6 py-5 text-left font-bold text-gray-900 dark:text-white">
                      Feature
                    </th>
                    <th className="px-6 py-5 text-center font-bold text-gray-900 dark:text-white">
                      Free
                    </th>
                    <th className="px-6 py-5 text-center font-bold text-gray-900 dark:text-white">
                      Pro
                    </th>
                    <th className="px-6 py-5 text-center font-bold text-gray-900 dark:text-white">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, i) => (
                    <>
                      <tr key={`category-${i}`} className="bg-gradient-to-r from-blue-50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
                        <td
                          colSpan={4}
                          className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-blue-900 dark:text-blue-300"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, j) => (
                        <tr
                          key={`feature-${i}-${j}`}
                          className="border-t border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                            {feature.name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {feature.free ? (
                              <div className="inline-flex w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-700 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {feature.pro ? (
                              <div className="inline-flex w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-700 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {feature.enterprise ? (
                              <div className="inline-flex w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-700 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Accordion Style */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white pr-8">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-6 pt-2">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
