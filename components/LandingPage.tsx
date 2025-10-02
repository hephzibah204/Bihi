import React, { useState, FC } from 'react';

const CheckIcon: FC<{ className?: string }> = ({ className = "w-6 h-6 text-indigo-500" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const LandingPage = ({ onNavigate }) => {
    const [subdomain, setSubdomain] = useState('');

    const handlePortalRedirect = (e) => {
        e.preventDefault();
        if (subdomain) {
            const { protocol, hostname, port } = window.location;
            const portString = port ? `:${port}` : '';
    
            if (hostname.includes('localhost')) {
                 window.location.href = `${protocol}//${subdomain}.localhost${portString}`;
            } else {
                const rootDomain = 'reportsheet.com.ng';
                window.location.href = `${protocol}//${subdomain}.${rootDomain}${portString}`;
            }
        }
    };
    
    const handleLinkClick = (e, view) => {
        e.preventDefault();
        onNavigate(view);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">ReportSheet</h1>
                    <nav className="hidden md:flex items-center space-x-8 text-slate-600 dark:text-slate-300">
                        <a href="#features" className="hover:text-indigo-500">Features</a>
                        <a href="#pricing" className="hover:text-indigo-500">Pricing</a>
                    </nav>
                     <div className="flex items-center space-x-2">
                        <form onSubmit={handlePortalRedirect} className="hidden sm:flex items-center">
                             <input 
                                type="text" 
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                                placeholder="your-portal"
                                className="input-field !py-2 !px-3 !rounded-r-none text-sm"
                            />
                            <button type="submit" className="btn btn-secondary !py-2 !px-3 !rounded-l-none text-sm">Sign In</button>
                        </form>
                        <a href="?view=signup" onClick={(e) => handleLinkClick(e, 'signup')} className="btn btn-primary ml-2">
                            Get Started
                        </a>
                    </div>
                </div>
            </header>

            <main>
                <section className="pt-48 pb-32 text-center relative overflow-hidden bg-white dark:bg-slate-800">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)] dark:bg-grid-slate-700/50"></div>
                     <div className="container mx-auto px-6 relative">
                        <h2 className="text-5xl md:text-7xl font-extrabold leading-tight text-slate-900 dark:text-white">
                            The OS for <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Modern Schools</span>
                        </h2>
                        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-slate-600 dark:text-slate-300">
                           Automate results, engage parents, and empower teachers with our all-in-one, AI-powered school management platform.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <a href="?view=demo" onClick={(e) => handleLinkClick(e, 'demo')} className="w-full sm:w-auto btn btn-primary px-8 py-3 text-lg">
                                Explore The Demo
                            </a>
                        </div>
                    </div>
                </section>
                
                <section id="features" className="py-24">
                     <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold">Everything you need. Nothing you don't.</h3>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                           {[{title: "Smart Result Management", desc: "Effortlessly enter scores and generate beautiful, customizable report cards in minutes."}, {title: "Parent & Student Portals", desc: "Give parents and students secure access to results, timetables, and school updates."}, {title: "AI-Powered Tools", desc: "Automate comments, plan lessons, and get deep performance insights with your AI assistant."}].map(f => (
                               <div key={f.title} className="card p-8">
                                    <h4 className="font-bold text-xl mb-2">{f.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-300">{f.desc}</p>
                                </div>
                           ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="py-24 bg-white dark:bg-slate-800">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold">Simple, Transparent Pricing</h3>
                            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Choose the perfect plan for your school's size and needs.</p>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                            <PricingCard
                                plan="Basic"
                                price="6,750"
                                period="/term"
                                description="For new and smaller schools getting started."
                                features={["Up to 500 Students", "Core Result Management", "Report Card Generation", "Standard Support"]}
                                onNavigate={onNavigate}
                            />
                            <PricingCard
                                plan="Pro"
                                price="9,450"
                                period="/term"
                                description="For growing schools that need more power and AI."
                                features={["Up to 2000 Students", "All Basic Features", "AI Comment Generator", "Advanced Analytics", "Parent & Student Portals", "Priority Support"]}
                                onNavigate={onNavigate}
                                popular
                            />
                            <PricingCard
                                plan="Enterprise"
                                price="13,500"
                                period="/term"
                                description="For large institutions with advanced needs."
                                features={["Unlimited Students", "All Pro Features", "AI Timetable Generation", "Dedicated Account Manager", "Custom Integrations"]}
                                onNavigate={onNavigate}
                            />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-800 dark:bg-black text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="text-center text-slate-400">
                        <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const PricingCard = ({ plan, price, period, description, features, onNavigate, popular = false }) => (
    <div className={`card p-8 flex flex-col h-full ${popular ? 'border-2 border-indigo-500 transform scale-105' : ''}`}>
        {popular && <span className="absolute top-0 -translate-y-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full left-1/2 -translate-x-1/2">Most Popular</span>}
        <h4 className="text-xl font-semibold">{plan}</h4>
        <p className="mt-2 text-slate-500">{description}</p>
        <p className="mt-6 text-4xl font-bold">₦{price} <span className="text-lg font-medium text-slate-500">{period}</span></p>
        <ul className="mt-8 space-y-4 text-slate-600 dark:text-slate-300">
            {features.map(feature => (
                <li key={feature} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <a href="?view=signup" onClick={(e) => onNavigate(e, 'signup')} className={`mt-auto w-full text-center btn ${popular ? 'btn-primary' : 'btn-secondary'} mt-8`}>
            Choose {plan}
        </a>
    </div>
);

export default LandingPage;