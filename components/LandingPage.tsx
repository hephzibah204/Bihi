import React, { useState, FC, useEffect, useRef } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

// --- Reusable Icon Component ---
const CheckIcon: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

// --- New Countdown Timer Component ---
const CountdownTimer = () => {
    const calculateTimeLeft = () => {
        // Set a consistent future date for the offer to end
        const year = new Date().getFullYear();
        const targetDate = new Date(`Dec 31, ${year} 23:59:59`);
        const difference = +targetDate - +new Date();

        let timeLeft = {};
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
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

    const timerComponents = Object.keys(timeLeft).map(interval => {
        if (!timeLeft[interval] && timeLeft[interval] !== 0) {
            return null;
        }
        return (
            <div key={interval}>
                <div className="value">{String(timeLeft[interval]).padStart(2, '0')}</div>
                <div className="label">{interval}</div>
            </div>
        );
    });

    return (
        <div className="countdown-timer">
            {timerComponents.length ? timerComponents : <span>Offer Expired!</span>}
        </div>
    );
};


// --- Main Landing Page Component ---
const LandingPage = ({ onNavigate }) => {
    const [billingCycle, setBillingCycle] = useState('termly');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const handleLinkClick = (e, view) => {
        e.preventDefault();
        onNavigate(view);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <Header onNavigate={handleLinkClick} />
            <main>
                <HeroSection onNavigate={handleLinkClick} />
                <SocialProof />
                <ProblemSolution />
                <PricingSection billingCycle={billingCycle} setBillingCycle={setBillingCycle} onNavigate={handleLinkClick} />
                <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
                <OfferSection onNavigate={handleLinkClick} />
            </main>
            <Footer />
        </div>
    );
};

// --- Page Sections (New Structure) ---

const Header = ({ onNavigate }) => (
     <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <a href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">ReportSheet</a>
            <nav className="hidden md:flex items-center space-x-8 text-slate-600 dark:text-slate-300 font-medium">
                <a href="#features" className="hover:text-indigo-500 transition-colors">Features</a>
                <a href="#pricing" className="hover:text-indigo-500 transition-colors">Pricing</a>
                <a href="#faq" className="hover:text-indigo-500 transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center space-x-2">
                 <a href="?view=signup" onClick={(e) => onNavigate(e, 'signup')} className="btn btn-primary">
                    Get Started Free
                </a>
            </div>
        </div>
    </header>
);

const HeroSection = ({ onNavigate }) => (
    <section className="pt-48 pb-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/50"></div>
        <div className="container mx-auto px-6 relative">
            <h2 className="text-5xl md:text-7xl font-extrabold leading-tight text-slate-900 dark:text-white tracking-tighter">
                From Tedious Paperwork to <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Seamless Progress</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-slate-600 dark:text-slate-300">
                The All-In-One OS for Modern Nigerian Schools. Automate results, engage parents, and empower teachers with our AI-powered platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="?view=signup" onClick={(e) => onNavigate(e, 'signup')} className="w-full sm:w-auto btn btn-primary px-8 py-3 text-lg">
                    Get Started Free
                </a>
                <a href="?view=demo" onClick={(e) => onNavigate(e, 'demo')} className="w-full sm:w-auto btn btn-secondary px-8 py-3 text-lg">
                    Explore The Demo
                </a>
            </div>
        </div>
    </section>
);

const SocialProof = () => (
    <section className="py-12 bg-slate-100 dark:bg-slate-800">
        <div className="container mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trusted by leading schools across Nigeria</p>
            {/* Placeholder logos */}
            <div className="mt-6 flex justify-center items-center space-x-8 opacity-60">
                <p className="font-bold text-lg">Brightstar Academy</p>
                <p className="font-bold text-lg">Oakland College</p>
                <p className="font-bold text-lg">Kingsville Int'l</p>
            </div>
        </div>
    </section>
);

const ProblemSolution = () => (
    <section id="features" className="py-24">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
                <h3 className="text-4xl font-bold tracking-tight">Stop Drowning in Paperwork. Start Inspiring Minds.</h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Manual processes are slow, error-prone, and steal valuable time from what truly matters: education.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <FeatureCard title="Reclaim Your Time" desc="Automate result computation, report card generation, and student promotion. Finish in minutes what used to take days." />
                <FeatureCard title="Engage Parents Effortlessly" desc="Give parents a secure portal to view results, track attendance, and receive school announcements in real-time." />
                <FeatureCard title="Empower Your Teachers" desc="Equip your staff with AI tools to write insightful comments, plan engaging lessons, and identify at-risk students." />
            </div>
        </div>
    </section>
);

const FeatureCard = ({ title, desc }) => (
    <div className="card p-8 border-transparent hover:border-indigo-500 hover:shadow-xl">
        <h4 className="font-bold text-xl mb-2">{title}</h4>
        <p className="text-slate-600 dark:text-slate-300">{desc}</p>
    </div>
);


const PricingSection = ({ billingCycle, setBillingCycle, onNavigate }) => {
    const plans = [
        { name: "Basic", price: { monthly: 8000, termly: 20250, yearly: 54000 }, desc: "For new and smaller schools.", features: ["Up to 500 Students", "Core Result Management", "Report Card Generation", "Standard Support"] },
        { name: "Pro", price: { monthly: 12000, termly: 32400, yearly: 86400 }, desc: "For growing schools that need more power.", features: ["Up to 2000 Students", "All Basic Features", "AI Comment Generator", "Advanced Analytics", "Parent & Student Portals", "Priority Support"], popular: true },
        { name: "Enterprise", price: { monthly: 18000, termly: 48600, yearly: 129600 }, desc: "For large institutions.", features: ["Unlimited Students", "All Pro Features", "AI Timetable Generation", "Dedicated Account Manager", "Custom Integrations"] },
    ];

    return (
        <section id="pricing" className="py-24 bg-white dark:bg-slate-800">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <h3 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h3>
                    <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Choose the perfect plan for your school. No hidden fees.</p>
                </div>
                <div className="flex justify-center mb-12">
                    <div className="pricing-toggle">
                        <button onClick={() => setBillingCycle('monthly')} className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</button>
                        <button onClick={() => setBillingCycle('termly')} className={billingCycle === 'termly' ? 'active' : ''}>Termly</button>
                        <button onClick={() => setBillingCycle('yearly')} className={billingCycle === 'yearly' ? 'active' : ''}>Yearly <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">Save 20%</span></button>
                    </div>
                </div>
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {plans.map(plan => <PricingCard key={plan.name} {...plan} billingCycle={billingCycle} onNavigate={onNavigate} />)}
                </div>
            </div>
        </section>
    );
};

const PricingCard = ({ name, price, desc, features, onNavigate, popular = false, billingCycle }) => (
    <div className={`card p-8 flex flex-col h-full ${popular ? 'border-2 border-indigo-500 transform lg:scale-105' : 'border'}`}>
        {popular && <span className="absolute top-0 -translate-y-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full left-1/2 -translate-x-1/2">Most Popular</span>}
        <h4 className="text-xl font-semibold">{name}</h4>
        <p className="mt-2 text-slate-500 min-h-[40px]">{desc}</p>
        <p className="mt-6">
            <span className="text-4xl font-bold">₦{price[billingCycle].toLocaleString()}</span>
            <span className="text-lg font-medium text-slate-500">/{billingCycle === 'monthly' ? 'mo' : billingCycle === 'termly' ? 'term' : 'yr'}</span>
        </p>
        <ul className="mt-8 space-y-4 text-slate-600 dark:text-slate-300">
            {features.map(feature => (
                <li key={feature} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <a href="?view=signup" onClick={(e) => onNavigate(e, 'signup')} className={`w-full text-center btn ${popular ? 'btn-primary' : 'btn-secondary'} mt-8`}>
            Choose {name}
        </a>
    </div>
);

const FAQSection = ({ openFaq, setOpenFaq }) => {
    const faqs = [
        { q: "Is my school's data safe and secure?", a: "Absolutely. We use industry-standard encryption and secure cloud infrastructure to protect all your data. You own your data, always." },
        { q: "Can ReportSheet be customized for our school?", a: "Yes! While ReportSheet works great out-of-the-box, our Enterprise plan includes options for custom integrations and features to fit your unique needs." },
        { q: "What kind of support do you offer?", a: "We offer standard email support for all plans. The Pro and Enterprise plans include priority support, ensuring you get faster responses when you need them most." },
        { q: "Is it difficult to get started?", a: "Not at all. We've designed ReportSheet to be incredibly intuitive. You can easily import your existing student data via CSV and be up and running in under an hour." },
    ];
    return (
        <section id="faq" className="py-24">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h3 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
                    {faqs.map((faq, index) => (
                        <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                            <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="faq-question">
                                <span>{faq.q}</span>
                                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                            </button>
                            <div className="faq-answer">
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const OfferSection = ({ onNavigate }) => (
    <section className="py-24 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-6 text-center">
             <h3 className="text-4xl font-extrabold tracking-tight">Limited Time Offer: <span className="text-pink-400">20% OFF</span> Your First Year!</h3>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">Start today and lock in your discount. This offer ends soon.</p>
            <div className="mt-8 flex justify-center">
                <CountdownTimer />
            </div>
            <div className="mt-10">
                <a href="?view=signup" onClick={(e) => onNavigate(e, 'signup')} className="btn btn-primary bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-10 py-4 text-xl">
                    Claim My Discount Now
                </a>
            </div>
        </div>
    </section>
);


const Footer = () => (
    <footer className="bg-slate-800 dark:bg-black text-white">
        <div className="container mx-auto px-6 py-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p>
        </div>
    </footer>
);

export default LandingPage;