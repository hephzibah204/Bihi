import React, { useState, useEffect } from 'react';
import { Plan, MenuItem, Testimonial, LandingPageContent } from '../types';
import { APP_VIEWS } from '../utils/constants';
import Logo from './icons/Logo';
import CheckIcon from './icons/CheckIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { apiGetPlatformSettings } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import ClockIcon from './icons/ClockIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';

// --- Sub-components for better organization ---

const CountdownTimer = ({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft: { hours?: number; minutes?: number; seconds?: number } = {};
        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60))),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setTimeout(() => { setTimeLeft(calculateTimeLeft()); }, 1000);
        return () => clearTimeout(timer);
    });

    return (
        <div className="countdown-timer">
            {typeof timeLeft.hours !== 'undefined' && timeLeft.hours >= 0 ? (
                <>
                    <div><div className="value">{String(timeLeft.hours).padStart(2, '0')}</div><div className="label">Hours</div></div>
                    <div><div className="value">{String(timeLeft.minutes).padStart(2, '0')}</div><div className="label">Mins</div></div>
                    <div><div className="value">{String(timeLeft.seconds).padStart(2, '0')}</div><div className="label">Secs</div></div>
                </>
            ) : (
                <>
                    <div><div className="value">00</div><div className="label">Hours</div></div>
                    <div><div className="value">00</div><div className="label">Mins</div></div>
                    <div><div className="value">00</div><div className="label">Secs</div></div>
                </>
            )}
        </div>
    );
};

const PromoBanner = ({ promoConfig }) => {
    if (!promoConfig?.enabled || !promoConfig.endDate) return null;
    return (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 text-center">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
                <p className="font-semibold">{promoConfig.text}</p>
                <CountdownTimer endDate={promoConfig.endDate} />
            </div>
        </div>
    );
};

const Header = ({ onNavigate, menuItems }) => {
    const handleLinkClick = (e, url) => {
        if (url.startsWith('?view=')) {
            e.preventDefault();
            onNavigate(url.replace('?view=', ''));
        } else if (url.startsWith('#')) {
             e.preventDefault();
             document.querySelector(url)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <a href="/" onClick={(e) => { e.preventDefault(); onNavigate(null); }} className="flex items-center space-x-2">
                    <Logo className="h-8 w-8" />
                    <span className="text-2xl font-bold text-gray-800">ReportSheet</span>
                </a>
                <nav className="hidden md:flex items-center space-x-6">
                    {menuItems?.map(item => (
                        <a key={item.id} href={item.url} onClick={(e) => handleLinkClick(e, item.url)} className="text-gray-600 hover:text-indigo-600 font-medium">{item.label}</a>
                    ))}
                </nav>
                <div className="hidden md:flex items-center space-x-2">
                    <button onClick={() => onNavigate(APP_VIEWS.SIGNIN)} className="btn btn-secondary">Sign In</button>
                    <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn btn-primary">Get Started Free</button>
                </div>
                 <div className="md:hidden">
                    <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn btn-primary">Get Started</button>
                </div>
            </div>
        </header>
    );
};

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className="card p-8 h-full flex flex-col">
        <p className="text-gray-600 flex-grow">"{testimonial.quote}"</p>
        <div className="mt-4 flex items-center">
            <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
            <div className="ml-4">
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.school}</p>
            </div>
        </div>
    </div>
);

const ComparisonTable = ({ title, features }) => {
    return (
        <section className="py-20 px-6">
            <div className="container mx-auto max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
                <div className="hidden md:block table-container">
                    <table className="table">
                        <thead><tr><th className="th">Feature</th><th className="th text-center">Regular School Portals</th><th className="th text-center">ReportSheet</th></tr></thead>
                        <tbody>
                            {features.map((feature, i) => (
                                <tr key={i}><td className="td font-medium">{feature.name}</td><td className="td text-center">{feature.regular}</td><td className="td text-center font-bold text-indigo-600">{feature.reportsheet}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden space-y-4">
                    {features.map((feature, i) => (
                        <div key={i} className="card p-4 border rounded-lg">
                            <h3 className="font-bold text-base mb-3">{feature.name}</h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div><p className="text-sm text-gray-500 mb-1">Regular Portals</p><p className="font-semibold text-lg">{feature.regular}</p></div>
                                <div className="bg-indigo-50 p-2 rounded-md"><p className="text-sm text-indigo-700 font-semibold mb-1">ReportSheet</p><p className="font-bold text-lg text-indigo-600">{feature.reportsheet}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PricingCard: React.FC<{ plan: any, cycle: string, onAction: () => void }> = ({ plan, cycle, onAction }) => {
    const price = plan[`price_${cycle}`];
    return (
        <div className={`card p-8 flex flex-col relative ${plan.name === 'Pro' ? 'border-2 border-indigo-500' : ''}`}>
            {plan.name === 'Pro' && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-2 text-gray-500 flex-grow">{plan.description}</p>
            <p className="mt-4 text-4xl font-extrabold">₦{price.toLocaleString()}<span className="text-base font-medium text-gray-500">/{cycle.replace('ly', '')}</span></p>
            <p className="mt-1 text-gray-600">Up to <strong>{plan.features.maxStudents}</strong> students</p>
            <button onClick={onAction} className={`btn ${plan.name === 'Pro' ? 'btn-primary' : 'btn-secondary'} mt-8 w-full`}>Get Started</button>
        </div>
    );
};

const FAQItem: React.FC<{ q: string; a: string; index: number; openIndex: number; setOpenIndex: (index: number) => void; }> = ({ q, a, index, openIndex, setOpenIndex }) => {
    const isOpen = index === openIndex;
    return (
        <div className="faq-item" data-open={isOpen}>
            <button onClick={() => setOpenIndex(isOpen ? -1 : index)} className="faq-question"><span>{q}</span><ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} /></button>
            <div className="faq-answer"><p>{a}</p></div>
        </div>
    );
};

const featureIcons = { ClockIcon: <ClockIcon className="w-8 h-8"/>, SparklesIcon: <SparklesIcon className="w-8 h-8"/>, ChatBubbleLeftRightIcon: <ChatBubbleLeftRightIcon className="w-8 h-8"/>, ChartBarIcon: <ChartBarIcon className="w-8 h-8"/>, DocumentArrowDownIcon: <DocumentArrowDownIcon className="w-8 h-8"/>, BrainCircuitIcon: <BrainCircuitIcon className="w-8 h-8"/> };

// --- Main Component ---
const LandingPage = ({ content, onNavigate, menuItems }: { content: LandingPageContent, onNavigate: (view: string) => void, menuItems: MenuItem[] }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'termly' | 'yearly'>('termly');
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [plans, setPlans] = useState<Plan[]>([]);

    useEffect(() => {
        const fetchPlans = async () => {
            const settings = await apiGetPlatformSettings();
            setPlans(settings.plans || []);
        };
        fetchPlans();
    }, []);

    if (!content) {
        return <div className="flex items-center justify-center h-screen">Loading page content...</div>;
    }

    const { hero, problem, solution, testimonials, faq, finalCta, pricing, comparison } = content;

    return (
        <div className="bg-white text-gray-800">
            <PromoBanner promoConfig={content.promoBanner} />
            <Header onNavigate={onNavigate} menuItems={menuItems} />

            <main>
                <section className="text-center py-20 px-6 bg-gray-50">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl mx-auto">{hero.title}</h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">{hero.subtitle}</p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                         <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn btn-primary px-8 py-3 text-lg">Get Started Free</button>
                         <button onClick={() => onNavigate(APP_VIEWS.DEMO)} className="btn btn-secondary px-8 py-3 text-lg">Explore Live Demo</button>
                    </div>
                </section>

                <section className="py-20 px-6">
                    <div className="container mx-auto text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-bold">{problem.title}</h2>
                        <ul className="mt-8 text-lg grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-left">
                           {problem.points.map((point, i) => ( <li key={i} className="flex items-center space-x-3"><div className="w-6 h-6 flex-shrink-0 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center font-bold">-</div><span>{point}</span></li> ))}
                        </ul>
                        {problem.extraText && <p className="mt-8 text-lg text-gray-600">{problem.extraText}</p>}
                    </div>
                </section>
                
                <section id="features" className="py-20 px-6 bg-indigo-50">
                     <div className="container mx-auto">
                        <div className="text-center max-w-3xl mx-auto"><h2 className="text-3xl md:text-4xl font-bold">{solution.title}</h2></div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mt-12 max-w-7xl mx-auto">
                            {solution.features.map((feature, i) => (
                                <div key={i} className="card p-6 lg:col-span-1 md:col-span-1">
                                    <div className="text-indigo-500 w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-lg mb-4">{featureIcons[feature.icon] || <SparklesIcon className="w-8 h-8"/>}</div>
                                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3><p className="text-gray-600">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                <section className="py-20 px-6">
                    <div className="container mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center">{testimonials.title}</h2>
                        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-7xl mx-auto">{testimonials.items.map(t => <TestimonialCard key={t.id} testimonial={t} />)}</div>
                    </div>
                </section>

                {comparison && <ComparisonTable title={comparison.title} features={comparison.features} />}

                <section id="pricing" className="py-20 px-6 bg-gray-50">
                    <div className="container mx-auto">
                        <div className="text-center max-w-3xl mx-auto"><h2 className="text-3xl md:text-4xl font-bold">{pricing?.title}</h2><p className="mt-4 text-lg text-gray-600">{pricing?.subtitle}</p></div>
                        <div className="flex justify-center my-8">
                            <div className="pricing-toggle">
                                <button onClick={() => setBillingCycle('monthly')} aria-pressed={billingCycle === 'monthly'}>Monthly</button>
                                <button onClick={() => setBillingCycle('termly')} aria-pressed={billingCycle === 'termly'}>Termly</button>
                                <button onClick={() => setBillingCycle('yearly')} aria-pressed={billingCycle === 'yearly'}>Yearly <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">Save 20%</span></button>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">{plans.map(plan => <PricingCard key={plan.id} plan={plan} cycle={billingCycle} onAction={() => onNavigate(APP_VIEWS.SIGNUP)} />)}</div>
                    </div>
                </section>

                <section id="faq" className="py-20 px-6">
                    <div className="container mx-auto max-w-3xl">
                        <div className="text-center"><h2 className="text-3xl md:text-4xl font-bold">{faq.title}</h2></div>
                        <div className="mt-12">{faq.items.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} index={i} openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} />)}</div>
                    </div>
                </section>
                
                <section className="py-20 px-6 bg-indigo-600 text-white">
                    <div className="container mx-auto text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-bold">{finalCta.title}</h2>
                        <p className="mt-4 text-lg text-indigo-200">{finalCta.subtitle}</p>
                        <div className="mt-8"><button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn bg-white text-indigo-600 hover:bg-indigo-100 px-8 py-3 text-lg">Get Started Free</button></div>
                        {finalCta.tagline && <p className="mt-8 font-semibold text-indigo-200">{finalCta.tagline}</p>}
                    </div>
                </section>
            </main>

            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto px-6 py-8 text-center">
                    <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;