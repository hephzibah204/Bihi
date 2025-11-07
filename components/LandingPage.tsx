import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem, LandingPageContent } from '../types';
import Logo from './icons/Logo';
import CheckIcon from './icons/CheckIcon';
import ClockIcon from './icons/ClockIcon';
import SparklesIcon from './icons/SparklesIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import Bars3Icon from './icons/Bars3Icon';
import XIcon from './icons/XIcon';
import FAQ from './FAQ';
import { DEFAULT_LANDING_PAGE_CONTENT, DEFAULT_MENU_ITEMS } from '../utils/landingPageContent';

// --- Icon Mapping ---
const icons: { [key: string]: React.FC<any> } = {
    ClockIcon, SparklesIcon, ChatBubbleLeftRightIcon, ChartBarIcon, DocumentArrowDownIcon, BrainCircuitIcon
};

// --- Sub-components for better organization ---

const Header = ({ menuItems }: { menuItems?: MenuItem[] }) => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = (
        <>
            {menuItems?.map(item => {
                const className = "text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200";
                if (item.url.startsWith('#')) return <a key={item.id} href={item.url} className={className} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>;
                return <Link key={item.id} to={item.url} className={className} onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>;
            })}
        </>
    );

    return (
        <header className="sticky top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
<Link to="/" className="flex items-center space-x-2">
                    <Logo className="h-8 w-8" />
                    <span className="text-2xl font-bold text-gray-800">Dossier.ng</span>
                </Link>
                <nav className="hidden md:flex items-center space-x-6">
                    {navLinks}
                </nav>
                <div className="hidden md:flex items-center space-x-2">
                    <Link to="/signin" className="btn btn-secondary">Sign In</Link>
                    <Link to="/signup" className="btn btn-primary">Get Started</Link>
                </div>
                <div className="md:hidden">
                    <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
                        {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-md">
                    <nav className="flex flex-col space-y-4 p-6">
                        {navLinks}
                        <div className="border-t pt-4 space-y-2">
                            <Link to="/signin" className="block text-center btn btn-secondary w-full">Sign In</Link>
                            <Link to="/signup" className="block text-center btn btn-primary w-full">Get Started</Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};


const Hero = ({ content }: { content: LandingPageContent['hero'] }) => (
    <section className="py-24 text-center bg-gray-50">
        <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight" dangerouslySetInnerHTML={{ __html: require('../utils/sanitize').safeHtml(content?.title || '') }} />
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-600" dangerouslySetInnerHTML={{ __html: require('../utils/sanitize').safeHtml(content?.subtitle || '') }} />
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/signup" className="btn btn-primary px-8 py-3 text-lg">Start Free Trial</Link>
                <Link to="/demo" className="btn btn-secondary px-8 py-3 text-lg">View Demo</Link>
            </div>
        </div>
    </section>
);

const Problem = ({ content }: { content: LandingPageContent['problem'] }) => (
    <section id="problem" className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{content?.title}</h2>
            <div className="mt-12 grid md:grid-cols-2 gap-12 items-center text-left">
                <ul className="space-y-6">
                    {content?.points?.map((point, index) => (
                        <li key={index} className="flex items-start">
                            <CheckIcon className="w-6 h-6 text-red-500 mr-4 flex-shrink-0 mt-1" />
                            <span className="text-gray-700">{point}</span>
                        </li>
                    ))}
                </ul>
                <p className="text-gray-600 text-lg leading-relaxed">{content?.extraText}</p>
            </div>
        </div>
    </section>
);

const Solution = ({ content }: { content: LandingPageContent['solution'] }) => (
    <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 text-center max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{content?.title}</h2>
            <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-12 text-left">
                {content?.features?.map((feature, index) => {
                    const Icon = icons[feature.icon] || SparklesIcon;
                    return (
                        <div key={index}>
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-100 text-indigo-600">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-gray-900">{feature.title}</h3>
                            <p className="mt-2 text-base text-gray-600">{feature.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
);

const Testimonials = ({ content }: { content: LandingPageContent['testimonials'] }) => (
    <section id="testimonials" className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{content?.title}</h2>
            <div className="mt-16 grid md:grid-cols-1 lg:grid-cols-3 gap-8">
                {content?.items?.map((testimonial) => (
                    <div key={testimonial.id} className="card p-8 text-left flex flex-col">
                        <p className="text-gray-600 flex-grow">"{testimonial.quote}"</p>
                        <div className="mt-6 flex items-center">
                            <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                            <div className="ml-4">
                                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.school}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const Pricing = ({ content }: { content: LandingPageContent['pricing'] }) => (
    <section id="pricing" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{content?.title}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">{content?.subtitle}</p>
            <div className="mt-8">
                <Link to="/signup" className="btn btn-primary px-8 py-3 text-lg">View Pricing & Plans</Link>
            </div>
        </div>
    </section>
);

const Comparison = ({ content }: { content: LandingPageContent['comparison'] }) => (
    <section id="comparison" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{content?.title}</h2>
            <div className="mt-12 table-container">
                <table className="table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="th">Feature</th>
                            <th className="th">Manual Methods</th>
                            <th className="th text-indigo-600">Dossier.ng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {content?.features?.map((feature, index) => (
                            <tr key={index}>
                                <td className="td font-semibold text-left">{feature.name}</td>
                                <td className="td text-gray-400 line-through">{feature.regular}</td>
                                <td className="td font-bold text-indigo-600">{feature.reportsheet}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </section>
);

const FinalCTA = ({ content }: { content: LandingPageContent['finalCta'] }) => (
    <section className="py-24 text-center bg-white">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{content?.title}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">{content?.subtitle}</p>
            <div className="mt-8">
                <Link to="/signup" className="btn btn-primary px-8 py-3 text-lg">Get Started for Free</Link>
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="font-semibold uppercase">Product</h3>
                    <nav className="mt-4 space-y-2">
                        <a href="#features" className="text-gray-400 hover:text-white">Features</a><br/>
                        <a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a><br/>
                        <Link to="/demo" className="text-gray-400 hover:text-white">Demo</Link>
                    </nav>
                </div>
                 <div>
                    <h3 className="font-semibold uppercase">Company</h3>
                    <nav className="mt-4 space-y-2">
                        <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link><br/>
                        <Link to="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                    </nav>
                </div>
                <div>
                    <h3 className="font-semibold uppercase">Legal</h3>
                    <nav className="mt-4 space-y-2">
                        <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link><br/>
                        <Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
                    </nav>
                </div>
                 <div>
                    <h3 className="font-semibold uppercase">Connect</h3>
                     <nav className="mt-4 space-y-2">
                        <a href="#" className="text-gray-400 hover:text-white">Twitter / X</a><br/>
                        <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
                    </nav>
                </div>
            </div>
            <div className="mt-12 border-t border-gray-700 pt-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Dossier.ng by Hephzibah Edutech. All rights reserved.</p>
            </div>
        </div>
    </footer>
);


// --- Main Landing Page Component ---

const LandingPage = ({ content, menuItems }: { content: LandingPageContent, menuItems: MenuItem[] }) => {
    const effectiveContent = { ...DEFAULT_LANDING_PAGE_CONTENT, ...(content || {}) } as LandingPageContent;
    const effectiveMenu = menuItems || DEFAULT_MENU_ITEMS;

    return (
        <div className="bg-gray-50 text-gray-800">
            <Header menuItems={effectiveMenu} />
            <main>
                <Hero content={effectiveContent.hero} />
                <Problem content={effectiveContent.problem} />
                <Solution content={effectiveContent.solution} />
                <Testimonials content={effectiveContent.testimonials} />
                <Pricing content={effectiveContent.pricing} />
                <Comparison content={effectiveContent.comparison} />
                <FAQ content={effectiveContent.faq} />
                <FinalCTA content={effectiveContent.finalCta} />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
