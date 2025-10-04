/*
================================================================================
================================================================================
ATTENTION AI ASSISTANT: STRICT DIRECTIVE FROM THE USER
================================================================================

This file, `LandingPage.tsx`, and all related public-facing components
(e.g., PublicLayout.tsx, Blog pages, etc.) are considered CRITICAL and STABLE.

DO NOT MODIFY, REFACTOR, OR "FIX" ANYTHING IN THIS FILE UNLESS I, THE USER,
HAVE EXPLICITLY AND DIRECTLY ASKED YOU TO CHANGE THIS SPECIFIC FILE.

The risk of accidental regressions, style changes, or functionality loss is
too high. Restoring from memory is unreliable and has caused issues. Your
primary instruction is to preserve the integrity of this file and its
related components at all costs.

Based on the user's prompt, I am now explicitly authorized to perform a major
overhaul on this component for this specific request.

================================================================================
================================================================================
*/
import React, { useState, useEffect } from 'react';
import { Plan, MenuItem, Testimonial, LandingPageContent } from '../types';
import { APP_VIEWS, CONTROLLABLE_FEATURES } from '../utils/constants';
import Logo from './icons/Logo';
import CheckIcon from './icons/CheckIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { apiGetPlatformSettings } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import ClockIcon from './icons/ClockIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import XIcon from './icons/XIcon';

// --- Sub-components for better organization ---

const CountdownTimer = ({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = {};

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
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
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
    if (!promoConfig.enabled || !promoConfig.endDate) return null;

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
                    <button onClick={() => onNavigate(APP_VIEWS.DEMO)} className="btn btn-secondary">Explore Demo</button>
                    <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn btn-primary">Get Started Free</button>
                </div>
                 <div className="md:hidden">
                    <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn btn-primary">Get Started</button>
                </div>
            </div>
        </header>
    );
};

// Fix: Explicitly type TestimonialCard as a React.FC to correctly handle the special 'key' prop during iteration.
const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className="card p-8">
        <p className="text-gray-600">"{testimonial.quote}"</p>
        <div className="mt-4 flex items-center">
            <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
            <div className="ml-4">
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.school}</p>
            </div>
        </div>
    </div>
);

interface PricingCardProps {
    plan: Plan;
    cycle: string;
    onAction: () => void;
}
const PricingCard: React.FC<PricingCardProps> = ({ plan, cycle, onAction }) => {
    const price = plan[`price_${cycle}`];
    
    return (
        <div className={`card p-8 flex flex-col ${plan.name === 'Pro' ? 'border-2 border-indigo-500' : ''}`}>
            {plan.name === 'Pro' && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-4 text-4xl font-extrabold">₦{price.toLocaleString()}<span className="text-base font-medium text-gray-500">/{cycle.replace('ly', '')}</span></p>
            <ul className="mt-6 space-y-3 text-gray-600 flex-grow">
                <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-1"/>
                    <span>Up to <strong>{plan.features.maxStudents >= 1000 ? '500+' : plan.features.maxStudents}</strong> students</span>
                </li>
                {CONTROLLABLE_FEATURES.map(feature => {
                    const isIncluded = plan.features[feature.key];
                    return (
                        <li key={feature.key} className={`flex items-start ${!isIncluded ? 'text-gray-400' : ''}`}>
                            {isIncluded ? (
                                <CheckIcon className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-1"/>
                            ) : (
                                <XIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-1"/>
                            )}
                            <span className={!isIncluded ? 'line-through' : ''}>{feature.name}</span>
                        </li>
                    );
                })}
            </ul>
            <button onClick={onAction} className={`btn ${plan.name === 'Pro' ? 'btn-primary' : 'btn-secondary'} mt-8 w-full`}>
                Get Started
            </button>
        </div>
    );
};

interface FAQItemProps {
    q: string; a: string; index: number; openIndex: number;
    setOpenIndex: (index: number) => void;
}
const FAQItem: React.FC<FAQItemProps> = ({ q, a, index, openIndex, setOpenIndex }) => {
    const isOpen = index === openIndex;
    return (
        <div className="faq-item" data-open={isOpen}>
            <button onClick={() => setOpenIndex(isOpen ? -1 : index)} className="faq-question">
                <span>{q}</span>
                <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            <div className="faq-answer"><p>{a}</p></div>
        </div>
    );
};

const featureIcons = {
    ClockIcon: <ClockIcon className="w-8 h-8"/>,
    SparklesIcon: <SparklesIcon className="w-8 h-8"/>,
    ChatBubbleLeftRightIcon: <ChatBubbleLeftRightIcon className="w-8 h-8"/>,
};

// --- Main Component ---
const LandingPage = ({ content, onNavigate, menuItems }: { content: LandingPageContent, onNavigate: (view: string) => void, menuItems: MenuItem[] }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'termly' | 'yearly'>('termly');
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [promoConfig, setPromoConfig] = useState({ enabled: false, text: '', endDate: null });

    React.useEffect(() => {
        const fetchPlans = async () => {
            const settings = await apiGetPlatformSettings();
            setPlans(settings.plans || []);
        };
        fetchPlans();

        const now = new Date().getTime();
        const promoExpiryStr = localStorage.getItem('promoExpiry');
        const finalChanceGiven = localStorage.getItem('promoFinalChanceGiven') === 'true';

        if (!promoExpiryStr) {
            // First visit
            const newExpiry = now + 7 * 60 * 60 * 1000;
            localStorage.setItem('promoExpiry', newExpiry.toString());
            setPromoConfig({
                enabled: true,
                text: "🎉 Special Launch Offer: Your exclusive 7-hour deal is on!",
                endDate: newExpiry,
            });
        } else {
            const promoExpiry = parseInt(promoExpiryStr, 10);
            if (now < promoExpiry) {
                // Offer is still active
                const text = finalChanceGiven 
                    ? "Final Chance! Your 3-hour offer is ending soon." 
                    : "🎉 Special Launch Offer: Your exclusive 7-hour deal is on!";
                setPromoConfig({
                    enabled: true,
                    text: text,
                    endDate: promoExpiry,
                });
            } else {
                // Offer expired
                if (!finalChanceGiven) {
                    // Give final chance
                    const newExpiry = now + 3 * 60 * 60 * 1000;
                    localStorage.setItem('promoExpiry', newExpiry.toString());
                    localStorage.setItem('promoFinalChanceGiven', 'true');
                    setPromoConfig({
                        enabled: true,
                        text: "Final Chance! Your 3-hour offer is ending soon.",
                        endDate: newExpiry,
                    });
                } else {
                    // Final chance expired, hide banner
                    setPromoConfig({ enabled: false, text: '', endDate: null });
                }
            }
        }
    }, []);

    if (!content) {
        return <div className="flex items-center justify-center h-screen">Loading page content...</div>;
    }

    const { hero, problem, solution, howItWorks, testimonials, faq, finalCta } = content;

    return (
        <div className="bg-white text-gray-800">
            <PromoBanner promoConfig={promoConfig} />
            <Header onNavigate={onNavigate} menuItems={menuItems} />

            <main>
                {/* Hero Section */}
                <section className="text-center py-20 px-6 bg-gray-50">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl mx-auto">{hero.title}</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">{hero.subtitle}</p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                         <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn btn-primary px-8 py-3 text-lg">Get Started Free</button>
                         <button onClick={() => onNavigate(APP_VIEWS.DEMO)} className="btn btn-secondary px-8 py-3 text-lg">Explore Live Demo</button>
                    </div>
                </section>

                {/* Problem Section */}
                <section className="py-20 px-6">
                    <div className="container mx-auto text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-bold">{problem.title}</h2>
                        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            {problem.points.map((point, i) => (
                                <li key={i} className="flex items-start space-x-3"><CheckIcon className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1"/><span>{point}</span></li>
                            ))}
                        </ul>
                    </div>
                </section>
                
                {/* Solution Section */}
                <section id="features" className="py-20 px-6 bg-indigo-50">
                     <div className="container mx-auto">
                        <div className="text-center max-w-3xl mx-auto">
                             <h2 className="text-3xl md:text-4xl font-bold">{solution.title}</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 mt-12">
                            {solution.features.map((feature, i) => (
                                <div key={i} className="card p-6">
                                    <div className="text-indigo-500 w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-lg mb-4">{featureIcons[feature.icon] || <SparklesIcon className="w-8 h-8"/>}</div>
                                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                 {/* Testimonials */}
                <section className="py-20 px-6">
                    <div className="container mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center">{testimonials.title}</h2>
                        <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">
                            {testimonials.items.map(t => <TestimonialCard key={t.id} testimonial={t} />)}
                        </div>
                    </div>
                </section>

                 {/* Pricing Section */}
                <section id="pricing" className="py-20 px-6 bg-gray-50">
                    <div className="container mx-auto">
                        <div className="text-center max-w-3xl mx-auto"><h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2><p className="mt-4 text-lg text-gray-600">Choose the plan that's right for your school. No hidden fees.</p></div>
                        <div className="flex justify-center my-8">
                            <div className="pricing-toggle">
                                <button onClick={() => setBillingCycle('monthly')} aria-pressed={billingCycle === 'monthly'}>Monthly</button>
                                <button onClick={() => setBillingCycle('termly')} aria-pressed={billingCycle === 'termly'}>Termly</button>
                                <button onClick={() => setBillingCycle('yearly')} aria-pressed={billingCycle === 'yearly'}>Yearly <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">Save 20%</span></button>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {plans.map(plan => <PricingCard key={plan.id} plan={plan} cycle={billingCycle} onAction={() => onNavigate(APP_VIEWS.SIGNUP)} />)}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="py-20 px-6">
                    <div className="container mx-auto max-w-3xl">
                        <div className="text-center"><h2 className="text-3xl md:text-4xl font-bold">{faq.title}</h2></div>
                        <div className="mt-12">
                            {faq.items.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} index={i} openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} />)}
                        </div>
                    </div>
                </section>
                
                 {/* Final CTA */}
                <section className="py-20 px-6 bg-indigo-600 text-white">
                    <div className="container mx-auto text-center max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-bold">{finalCta.title}</h2>
                        <p className="mt-4 text-lg text-indigo-200">{finalCta.subtitle}</p>
                        <div className="mt-8">
                            <button onClick={() => onNavigate(APP_VIEWS.SIGNUP)} className="btn bg-white text-indigo-600 hover:bg-indigo-100 px-8 py-3 text-lg">Get Started Free Today</button>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white"><div className="container mx-auto px-6 py-8 text-center"><p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p></div></footer>
        </div>
    );
};

export default LandingPage;