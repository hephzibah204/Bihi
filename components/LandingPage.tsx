import React, { useState, FC } from 'react';

const CheckIcon: FC<{ className?: string }> = ({ className = "w-6 h-6 text-green-500" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const LandingPage = ({ onNavigate }) => {
    const [subdomain, setSubdomain] = useState('');
    const [billingCycle, setBillingCycle] = useState('termly'); // 'monthly', 'termly', 'yearly'

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
    
    const pricing = {
        monthly: {
            basic: { price: '2,500', save: '' },
            pro: { price: '3,500', save: '' },
            enterprise: { price: '5,000', save: '' },
        },
        termly: {
            basic: { price: '6,750', save: 'Save ₦750' },
            pro: { price: '9,450', save: 'Save ₦1,050' },
            enterprise: { price: '13,500', save: 'Save ₦1,500' },
        },
        yearly: {
            basic: { price: '25,500', save: 'Save ₦4,500' },
            pro: { price: '35,700', save: 'Save ₦6,300' },
            enterprise: { price: '51,000', save: 'Save ₦9,000' },
        }
    };

    const periodText = {
        monthly: '/ month',
        termly: '/ term',
        yearly: '/ year'
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">ReportSheet</h1>
                    <nav className="hidden md:flex items-center space-x-6">
                        <a href="#features" className="hover:text-indigo-600">Features</a>
                        <a href="#pricing" className="hover:text-indigo-600">Pricing</a>
                        <a href="#contact" className="hover:text-indigo-600">Contact</a>
                    </nav>
                     <div className="flex items-center space-x-2">
                        <a href="#signin" className="btn btn-secondary">
                            Sign In
                        </a>
                        <a href="?view=signup" onClick={(e) => handleLinkClick(e, 'signup')} className="btn btn-primary">
                            Sign Up
                        </a>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="pt-32 pb-20 text-center bg-white dark:bg-gray-800">
                    <div className="container mx-auto px-6">
                        <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
                            🚀 Transform Your School With the Future of Education Management
                        </h2>
                        <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
                            Run your entire school smarter, faster, and stress-free — with AI-powered automation, seamless administration, and beautifully designed report cards.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <a href="?view=demo" onClick={(e) => handleLinkClick(e, 'demo')} className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
                                Explore Free Demo
                            </a>
                            <a href="tel:+2349077780156" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                                📞 Talk to Sales
                            </a>
                        </div>
                    </div>
                </section>
                
                 {/* Sign In Section */}
                <section id="signin" className="py-16 bg-gray-100 dark:bg-gray-900">
                    <div className="container mx-auto px-6 text-center max-w-2xl">
                         <h3 className="text-3xl font-bold">Already have a portal?</h3>
                         <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your school's portal name to sign in.</p>
                         <form onSubmit={handlePortalRedirect} className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
                            <label htmlFor="subdomain-input" className="sr-only">School portal name</label>
                            <input 
                                id="subdomain-input"
                                type="text" 
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                                placeholder="e.g., myschool"
                                className="input-field flex-grow text-center sm:text-left"
                                aria-label="School portal name"
                                autoCapitalize="none"
                            />
                             <span className="text-gray-500 hidden sm:block">.reportsheet.com.ng</span>
                            <button type="submit" className="w-full sm:w-auto btn btn-primary">
                                Go to Portal
                            </button>
                         </form>
                    </div>
                </section>
                
                {/* Why Schools Love Us Section */}
                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">🌟 Why Schools Love Our Platform</h3>
                            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Running a school shouldn’t feel like juggling fire. With our all-in-one School Operating System, you can stay ahead. This is not just another school software — it’s your competitive edge.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                            {['Save Time', 'Boost Reputation', 'Grow Revenue', 'Stay Ahead'].map(benefit => (
                                <div key={benefit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                                    <CheckIcon className="w-10 h-10 text-green-500 mx-auto" />
                                    <h4 className="mt-4 text-xl font-semibold">{benefit}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-white dark:bg-gray-800">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                             <h3 className="text-3xl md:text-4xl font-bold">🎓 What You Get</h3>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
                                <h4 className="font-bold text-xl mb-2">School Portal for Teachers & Admins</h4>
                                <p className="text-gray-600 dark:text-gray-300">Manage students, teachers, subjects, and timetables in one place. Bulk student promotions and ID card generation. Export beautiful, customizable report cards.</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
                                <h4 className="font-bold text-xl mb-2">Parent & Student Portals</h4>
                                <p className="text-gray-600 dark:text-gray-300">Parents can check results, attendance, and behavior records online. Students can access timetables, results, and even an AI Tutor for study support.</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
                                <h4 className="font-bold text-xl mb-2">AI-Powered Features (Your Secret Weapon)</h4>
                                <p className="text-gray-600 dark:text-gray-300">Get smart, personalized report card comments, plan lessons in seconds, generate timetables automatically, and spot struggling students early.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Imagine Section */}
                <section className="py-20 bg-indigo-600 text-white">
                    <div className="container mx-auto px-6 text-center">
                        <h3 className="text-3xl font-bold">💡 Imagine This</h3>
                        <p className="mt-4 text-lg max-w-3xl mx-auto text-indigo-200">
                            Instead of wasting hours preparing results, your teachers finish in minutes. Parents are impressed with professional, modern report cards. Your school brand stands out as tech-forward and parent-friendly. You have real-time insight into your school’s academic growth. <strong className="text-white">That’s the difference this platform makes.</strong>
                        </p>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold">💰 Simple, Transparent Pricing</h3>
                            <p className="mt-3 text-lg text-green-600 dark:text-green-400 font-semibold">🎉 Special Early-Bird Discount for First Users — Lock in your rate today.</p>
                        </div>
                        
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-1 flex space-x-1">
                                <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 text-sm font-semibold rounded-full ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-900 text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}>Monthly</button>
                                <button onClick={() => setBillingCycle('termly')} className={`px-4 py-2 text-sm font-semibold rounded-full ${billingCycle === 'termly' ? 'bg-white dark:bg-gray-900 text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}>Termly (~10% Off)</button>
                                <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 text-sm font-semibold rounded-full ${billingCycle === 'yearly' ? 'bg-white dark:bg-gray-900 text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}>Yearly (~15% Off)</button>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* Basic Plan */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 flex flex-col">
                                <h4 className="text-xl font-semibold">Basic</h4>
                                <p className="mt-6 text-4xl font-bold">₦{pricing[billingCycle].basic.price} <span className="text-lg font-medium text-gray-500">{periodText[billingCycle]}</span></p>
                                {pricing[billingCycle].basic.save && <p className="text-green-600 font-semibold mt-1">{pricing[billingCycle].basic.save}</p>}
                                <a href="?view=signup" onClick={(e) => handleLinkClick(e, 'signup')} className="mt-auto w-full text-center btn btn-secondary">Get Started</a>
                            </div>
                            {/* Pro Plan */}
                            <div className="border-2 border-indigo-600 rounded-lg p-8 flex flex-col relative">
                                <span className="absolute top-0 -translate-y-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                                <h4 className="text-xl font-semibold">Pro</h4>
                                <p className="mt-6 text-4xl font-bold">₦{pricing[billingCycle].pro.price} <span className="text-lg font-medium text-gray-500">{periodText[billingCycle]}</span></p>
                                {pricing[billingCycle].pro.save && <p className="text-green-600 font-semibold mt-1">{pricing[billingCycle].pro.save}</p>}
                                <a href="?view=signup" onClick={(e) => handleLinkClick(e, 'signup')} className="mt-auto w-full text-center btn btn-primary">Choose Pro</a>
                            </div>
                            {/* Enterprise Plan */}
                             <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 flex flex-col">
                                <h4 className="text-xl font-semibold">Enterprise</h4>
                                <p className="mt-6 text-4xl font-bold">₦{pricing[billingCycle].enterprise.price} <span className="text-lg font-medium text-gray-500">{periodText[billingCycle]}</span></p>
                                {pricing[billingCycle].enterprise.save && <p className="text-green-600 font-semibold mt-1">{pricing[billingCycle].enterprise.save}</p>}
                                <a href="mailto:info@hephzibahedutech.com.ng" className="mt-auto w-full text-center btn btn-secondary">Contact Sales</a>
                            </div>
                        </div>
                    </div>
                </section>
                
                 {/* Next Step Section */}
                <section id="contact" className="py-20 bg-white dark:bg-gray-800">
                     <div className="container mx-auto px-6 text-center">
                        <h3 className="text-3xl md:text-4xl font-bold">📞 Take the Next Step</h3>
                        <p className="mt-4 text-lg max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
                           Join forward-thinking school owners who are transforming the way education is managed. Don’t wait. The future of school management is already here. Make it yours today.
                        </p>
                        <div className="mt-8 space-y-4 text-lg">
                           <p><strong>📲 Call/WhatsApp:</strong> <a href="tel:+2349077780156" className="text-indigo-600 hover:underline">09077780156</a></p>
                           <p><strong>📧 Email:</strong> <a href="mailto:info@hephzibahedutech.com.ng" className="text-indigo-600 hover:underline">info@hephzibahedutech.com.ng</a></p>
                           <p><strong>🌐 Visit:</strong> <a href="https://reportsheet.com.ng" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">reportsheet.com.ng</a></p>
                        </div>
                     </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 dark:bg-black text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                        <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p>
                        <div className="flex mt-4 md:mt-0 space-x-6 text-gray-400">
                            <span>Terms of Service</span>
                            <span>Privacy Policy</span>
                        </div>
                    </div>
                </div>
            </footer>
            
            {/* Sticky Mobile CTA */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
                 <a href="?view=demo" onClick={(e) => handleLinkClick(e, 'demo')} className="w-full btn btn-primary text-lg">
                    🚀 Explore Free Demo
                </a>
            </div>
        </div>
    );
};

export default LandingPage;