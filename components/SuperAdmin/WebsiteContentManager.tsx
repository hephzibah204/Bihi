import React, { useState } from 'react';

interface HeroSection {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    backgroundImage: string;
}

interface Feature {
    icon: string;
    title: string;
    description: string;
}

interface Testimonial {
    id: string;
    name: string;
    role: string;
    school: string;
    comment: string;
    avatar: string;
    rating: number;
}

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const WebsiteContentManager = () => {
    const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'testimonials' | 'faq' | 'footer'>('hero');

    // Hero Section
    const [heroSection, setHeroSection] = useState<HeroSection>({
        title: 'Complete School Management Solution for Nigerian Schools',
        subtitle: 'Manage students, fees, attendance, and communicate with parents - all in one platform',
        ctaPrimary: 'Start Free Trial',
        ctaSecondary: 'View Pricing',
        backgroundImage: '/images/hero-bg.jpg'
    });

    // Features Section
    const [features, setFeatures] = useState<Feature[]>([
        {
            icon: '👥',
            title: 'Student Management',
            description: 'Efficiently manage student records, admissions, and academic progress'
        },
        {
            icon: '💰',
            title: 'Fee Management',
            description: 'Accept payments via Paystack, Flutterwave with automated reminders'
        },
        {
            icon: '📱',
            title: 'Parent Communication',
            description: 'Send SMS and email notifications to keep parents informed'
        },
        {
            icon: '📊',
            title: 'Analytics & Reports',
            description: 'Generate detailed reports and insights on school performance'
        },
        {
            icon: '📝',
            title: 'Attendance Tracking',
            description: 'Mark and monitor student attendance with real-time updates'
        },
        {
            icon: '🎓',
            title: 'Exam Management',
            description: 'Conduct exams, grade papers, and publish results seamlessly'
        }
    ]);

    // Testimonials
    const [testimonials, setTestimonials] = useState<Testimonial[]>([
        {
            id: '1',
            name: 'Mrs. Adeyemi',
            role: 'Principal',
            school: 'Grace Academy, Lagos',
            comment: 'Dossier.NG has transformed how we manage our school. Fee collection is now 3x faster!',
            avatar: '/avatars/avatar1.jpg',
            rating: 5
        },
        {
            id: '2',
            name: 'Mr. Okonkwo',
            role: 'Administrator',
            school: 'Royal International School, Abuja',
            comment: 'The SMS notification feature keeps parents informed. We have seen 95% parent engagement!',
            avatar: '/avatars/avatar2.jpg',
            rating: 5
        },
        {
            id: '3',
            name: 'Dr. Bello',
            role: 'Director',
            school: 'Excel College, Port Harcourt',
            comment: 'Best investment we made! The analytics help us make data-driven decisions.',
            avatar: '/avatars/avatar3.jpg',
            rating: 5
        }
    ]);

    // FAQ
    const [faqItems, setFaqItems] = useState<FAQItem[]>([
        {
            id: '1',
            question: 'What payment methods do you support?',
            answer: 'We support Paystack, Flutterwave, bank transfers, and cash payments. Parents can pay school fees online securely.'
        },
        {
            id: '2',
            question: 'Is there a mobile app?',
            answer: 'Yes! We have mobile apps for both iOS and Android available on the Professional and Enterprise plans.'
        },
        {
            id: '3',
            question: 'How secure is my school data?',
            answer: 'We use bank-level encryption and host on secure Nigerian data centers. Your data is backed up daily and compliant with NDPR regulations.'
        },
        {
            id: '4',
            question: 'Can I try before purchasing?',
            answer: 'Yes! We offer a 14-day free trial with no credit card required. You can test all features risk-free.'
        }
    ]);

    // Footer Content
    const [footerContent, setFooterContent] = useState({
        companyName: 'Dossier.NG',
        tagline: 'Empowering Nigerian Schools with Technology',
        address: 'Lagos, Nigeria',
        phone: '+234 xxx xxx xxxx',
        email: 'support@dossier.ng',
        socialMedia: {
            facebook: 'https://facebook.com/dossierng',
            twitter: 'https://twitter.com/dossierng',
            instagram: 'https://instagram.com/dossierng',
            linkedin: 'https://linkedin.com/company/dossierng'
        }
    });

    const saveChanges = () => {
        // This would typically save to backend
        alert('Website content saved successfully! Changes will reflect on the live site.');
    };

    const HeroPanel = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">🎨</span>
                    <div>
                        <h4 className="font-semibold text-blue-900">Hero Section</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            This is the first thing visitors see. Make it compelling!
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Main Title *
                        </label>
                        <input
                            type="text"
                            value={heroSection.title}
                            onChange={(e) => setHeroSection({ ...heroSection, title: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Subtitle
                        </label>
                        <textarea
                            value={heroSection.subtitle}
                            onChange={(e) => setHeroSection({ ...heroSection, subtitle: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Primary Button Text
                            </label>
                            <input
                                type="text"
                                value={heroSection.ctaPrimary}
                                onChange={(e) => setHeroSection({ ...heroSection, ctaPrimary: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Secondary Button Text
                            </label>
                            <input
                                type="text"
                                value={heroSection.ctaSecondary}
                                onChange={(e) => setHeroSection({ ...heroSection, ctaSecondary: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Background Image URL
                        </label>
                        <input
                            type="text"
                            value={heroSection.backgroundImage}
                            onChange={(e) => setHeroSection({ ...heroSection, backgroundImage: e.target.value })}
                            placeholder="/images/hero-bg.jpg"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={saveChanges}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Save Hero Section
                    </button>
                </div>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Preview</h4>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg text-center">
                    <h1 className="text-3xl font-bold mb-3">{heroSection.title}</h1>
                    <p className="text-lg mb-6">{heroSection.subtitle}</p>
                    <div className="flex justify-center space-x-4">
                        <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold">
                            {heroSection.ctaPrimary}
                        </button>
                        <button className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold">
                            {heroSection.ctaSecondary}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const FeaturesPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Features Showcase</h3>
                    <p className="text-sm text-slate-500">Highlight what makes your platform special</p>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    + Add Feature
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-4xl">{feature.icon}</span>
                            <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                        </div>
                        <input
                            type="text"
                            value={feature.title}
                            onChange={(e) => {
                                const newFeatures = [...features];
                                newFeatures[idx].title = e.target.value;
                                setFeatures(newFeatures);
                            }}
                            className="w-full px-3 py-2 mb-2 border border-slate-300 rounded-lg font-semibold"
                        />
                        <textarea
                            value={feature.description}
                            onChange={(e) => {
                                const newFeatures = [...features];
                                newFeatures[idx].description = e.target.value;
                                setFeatures(newFeatures);
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={saveChanges}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
                Save Features
            </button>
        </div>
    );

    const TestimonialsPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Customer Testimonials</h3>
                    <p className="text-sm text-slate-500">Show social proof from happy clients</p>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    + Add Testimonial
                </button>
            </div>

            <div className="space-y-4">
                {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={testimonial.name}
                                    onChange={(e) => {
                                        setTestimonials(testimonials.map(t =>
                                            t.id === testimonial.id ? { ...t, name: e.target.value } : t
                                        ));
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                                <input
                                    type="text"
                                    value={testimonial.role}
                                    onChange={(e) => {
                                        setTestimonials(testimonials.map(t =>
                                            t.id === testimonial.id ? { ...t, role: e.target.value } : t
                                        ));
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">School</label>
                                <input
                                    type="text"
                                    value={testimonial.school}
                                    onChange={(e) => {
                                        setTestimonials(testimonials.map(t =>
                                            t.id === testimonial.id ? { ...t, school: e.target.value } : t
                                        ));
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Comment</label>
                                <textarea
                                    value={testimonial.comment}
                                    onChange={(e) => {
                                        setTestimonials(testimonials.map(t =>
                                            t.id === testimonial.id ? { ...t, comment: e.target.value } : t
                                        ));
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                            <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className="text-yellow-400 text-xl">
                                        {star <= testimonial.rating ? '⭐' : '☆'}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={() => setTestimonials(testimonials.filter(t => t.id !== testimonial.id))}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={saveChanges}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
                Save Testimonials
            </button>
        </div>
    );

    const FAQPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Frequently Asked Questions</h3>
                    <p className="text-sm text-slate-500">Address common questions upfront</p>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    + Add Question
                </button>
            </div>

            <div className="space-y-4">
                {faqItems.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
                                <input
                                    type="text"
                                    value={item.question}
                                    onChange={(e) => {
                                        setFaqItems(faqItems.map(f =>
                                            f.id === item.id ? { ...f, question: e.target.value } : f
                                        ));
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Answer</label>
                                <textarea
                                    value={item.answer}
                                    onChange={(e) => {
                                        setFaqItems(faqItems.map(f =>
                                            f.id === item.id ? { ...f, answer: e.target.value } : f
                                        ));
                                    }}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <button
                                onClick={() => setFaqItems(faqItems.filter(f => f.id !== item.id))}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                                Delete Question
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={saveChanges}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
                Save FAQ
            </button>
        </div>
    );

    const FooterPanel = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Footer Information</h3>
                <p className="text-sm text-slate-500">Company details and social links</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                        <input
                            type="text"
                            value={footerContent.companyName}
                            onChange={(e) => setFooterContent({ ...footerContent, companyName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                        <input
                            type="text"
                            value={footerContent.tagline}
                            onChange={(e) => setFooterContent({ ...footerContent, tagline: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                        <input
                            type="text"
                            value={footerContent.address}
                            onChange={(e) => setFooterContent({ ...footerContent, address: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                        <input
                            type="text"
                            value={footerContent.phone}
                            onChange={(e) => setFooterContent({ ...footerContent, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={footerContent.email}
                            onChange={(e) => setFooterContent({ ...footerContent, email: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Social Media Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Facebook</label>
                            <input
                                type="text"
                                value={footerContent.socialMedia.facebook}
                                onChange={(e) => setFooterContent({
                                    ...footerContent,
                                    socialMedia: { ...footerContent.socialMedia, facebook: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Twitter</label>
                            <input
                                type="text"
                                value={footerContent.socialMedia.twitter}
                                onChange={(e) => setFooterContent({
                                    ...footerContent,
                                    socialMedia: { ...footerContent.socialMedia, twitter: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Instagram</label>
                            <input
                                type="text"
                                value={footerContent.socialMedia.instagram}
                                onChange={(e) => setFooterContent({
                                    ...footerContent,
                                    socialMedia: { ...footerContent.socialMedia, instagram: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                            <input
                                type="text"
                                value={footerContent.socialMedia.linkedin}
                                onChange={(e) => setFooterContent({
                                    ...footerContent,
                                    socialMedia: { ...footerContent.socialMedia, linkedin: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={saveChanges}
                    className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Save Footer
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Website Content Manager</h1>
                <p className="text-violet-100">Control all website content from one place</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'hero', label: 'Hero Section', icon: '🎯' },
                        { id: 'features', label: 'Features', icon: '⚡' },
                        { id: 'testimonials', label: 'Testimonials', icon: '💬' },
                        { id: 'faq', label: 'FAQ', icon: '❓' },
                        { id: 'footer', label: 'Footer', icon: '📄' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'hero' && <HeroPanel />}
            {activeTab === 'features' && <FeaturesPanel />}
            {activeTab === 'testimonials' && <TestimonialsPanel />}
            {activeTab === 'faq' && <FAQPanel />}
            {activeTab === 'footer' && <FooterPanel />}
        </div>
    );
};

export default WebsiteContentManager;