import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import PublicAdmissionForm from './PublicAdmissionForm';
import SEOHead from './SEOHead';
import { SchoolLandingPageContent, SchoolInfo } from '../types/school';

// Hero Section Component
const HeroSection = ({ content, schoolInfo, onApplyClick }: { 
  content: SchoolLandingPageContent['hero'], 
  schoolInfo: SchoolInfo,
  onApplyClick: () => void 
}) => (
  <section 
    className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900"
    style={{
      backgroundImage: content.backgroundImage ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
  >
    <div className="container mx-auto px-6 text-center text-white">
      <div className="max-w-4xl mx-auto">
        {schoolInfo.logo && (
          <img src={schoolInfo.logo} alt={schoolInfo.name} className="h-20 w-auto mx-auto mb-6" />
        )}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          {content.title || `Welcome to ${schoolInfo.name}`}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
          {content.subtitle || schoolInfo.motto}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={onApplyClick}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105"
          >
            Apply for Admission
          </button>
          <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition-all">
            Take Virtual Tour
          </button>
        </div>
      </div>
    </div>
    
    {/* Scroll indicator */}
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
        <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
      </div>
    </div>
  </section>
);

// About Section
const AboutSection = ({ content, schoolInfo }: { 
  content: SchoolLandingPageContent['about'], 
  schoolInfo: SchoolInfo 
}) => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            {content.title || `About ${schoolInfo.name}`}
          </h2>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            {content.description || schoolInfo.description}
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{schoolInfo.stats?.students || '500+'}</div>
              <div className="text-gray-600">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{schoolInfo.stats?.teachers || '50+'}</div>
              <div className="text-gray-600">Teachers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{schoolInfo.stats?.yearsOfExcellence || '25+'}</div>
              <div className="text-gray-600">Years of Excellence</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{schoolInfo.stats?.graduationRate || '98%'}</div>
              <div className="text-gray-600">Graduation Rate</div>
            </div>
          </div>
        </div>
        <div className="relative">
          {content.image ? (
            <img src={content.image} alt="About us" className="rounded-lg shadow-xl w-full" />
          ) : (
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shadow-xl h-96 flex items-center justify-center">
              <span className="text-gray-500">School Image</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
);

// Programs Section
const ProgramsSection = ({ content }: { content: SchoolLandingPageContent['programs'] }) => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-gray-900">
          {content.title || 'Our Academic Programs'}
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {content.subtitle || 'Comprehensive education programs designed to nurture every student\'s potential'}
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {content.programs.map((program, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            {program.image && (
              <img src={program.image} alt={program.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900">{program.name}</h3>
              <p className="text-gray-600 mb-4">{program.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Ages: {program.ageRange}</span>
                <span>Duration: {program.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Facilities Section
const FacilitiesSection = ({ content }: { content: SchoolLandingPageContent['facilities'] }) => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-gray-900">
          {content.title || 'World-Class Facilities'}
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {content.subtitle || 'State-of-the-art facilities designed to enhance learning and development'}
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.facilities.map((facility, index) => (
          <div key={index} className="text-center group">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-4 group-hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{facility.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{facility.name}</h3>
              <p className="text-gray-600 text-sm">{facility.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Testimonials Section
const TestimonialsSection = ({ content }: { content: SchoolLandingPageContent['testimonials'] }) => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 text-gray-900">
          {content.title || 'What Parents Say'}
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {content.testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              {testimonial.avatar ? (
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
                  <span className="text-gray-600 font-bold">{testimonial.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                <p className="text-gray-600 text-sm">{testimonial.role}</p>
              </div>
            </div>
            <p className="text-gray-700 italic">"{testimonial.content}"</p>
            <div className="flex text-yellow-400 mt-3">
              {[...Array(5)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Contact Section
const ContactSection = ({ content, schoolInfo, onApplyClick }: { 
  content: SchoolLandingPageContent['contact'], 
  schoolInfo: SchoolInfo,
  onApplyClick: () => void 
}) => (
  <section className="py-20 bg-gray-900 text-white">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-4xl font-bold mb-6">
            {content.title || 'Get in Touch'}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {content.subtitle || 'Ready to join our school community? Contact us today!'}
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-2xl mr-4">📍</span>
              <span>{schoolInfo.address}</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-4">📞</span>
              <span>{schoolInfo.phone}</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-4">✉️</span>
              <span>{schoolInfo.email}</span>
            </div>
          </div>
          <button 
            onClick={onApplyClick}
            className="mt-8 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-full text-lg transition-all"
          >
            Apply Now
          </button>
        </div>
        <div className="bg-gray-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Quick Contact</h3>
          <form className="space-y-4">
            <input 
              type="text" 
              placeholder="Your Name" 
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input 
              type="email" 
              placeholder="Your Email" 
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <textarea 
              placeholder="Your Message" 
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            ></textarea>
            <button 
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition-all"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
);

// Main School Landing Page Component
const SchoolLandingPage = () => {
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [landingContent, setLandingContent] = useState<SchoolLandingPageContent | null>(null);
  const [isAdmissionFormOpen, setIsAdmissionFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        // Load school info and landing page content
        const { data: school } = await supabase
          .from('schools')
          .select('*')
          .eq('slug', schoolSlug)
          .single();

        if (school) {
          setSchoolInfo(school);
          setLandingContent(school.landing_page_content || getDefaultLandingContent(school));
        }
      } catch (error) {
        console.error('Error loading school data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolSlug) {
      loadSchoolData();
    }
  }, [schoolSlug]);

  const handleApplyClick = () => {
    setIsAdmissionFormOpen(true);
  };

  const handleAdmissionSuccess = () => {
    alert('Application submitted successfully! We will contact you soon.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school information...</p>
        </div>
      </div>
    );
  }

  if (!schoolInfo || !landingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">School Not Found</h1>
          <p className="text-gray-600 mb-8">The school you're looking for doesn't exist or is not available.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* SEO Head */}
      <SEOHead
        title={landingContent.hero.title}
        description={landingContent.about.description}
        keywords={['school', 'education', 'admission', schoolInfo.name]}
        image={landingContent.hero.backgroundImage}
        schoolInfo={schoolInfo}
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {schoolInfo.logo && (
              <img src={schoolInfo.logo} alt={schoolInfo.name} className="h-10 w-auto" />
            )}
            <span className="text-xl font-bold text-gray-900">{schoolInfo.name}</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
            <a href="#programs" className="text-gray-600 hover:text-blue-600 transition-colors">Programs</a>
            <a href="#facilities" className="text-gray-600 hover:text-blue-600 transition-colors">Facilities</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <button 
            onClick={handleApplyClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </button>
        </div>
      </nav>

      {/* Page Sections */}
      <HeroSection 
        content={landingContent.hero} 
        schoolInfo={schoolInfo} 
        onApplyClick={handleApplyClick}
      />
      
      <div id="about">
        <AboutSection content={landingContent.about} schoolInfo={schoolInfo} />
      </div>
      
      <div id="programs">
        <ProgramsSection content={landingContent.programs} />
      </div>
      
      <div id="facilities">
        <FacilitiesSection content={landingContent.facilities} />
      </div>
      
      <div id="testimonials">
        <TestimonialsSection content={landingContent.testimonials} />
      </div>
      
      <div id="contact">
        <ContactSection 
          content={landingContent.contact} 
          schoolInfo={schoolInfo} 
          onApplyClick={handleApplyClick}
        />
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {schoolInfo.logo && (
                  <img src={schoolInfo.logo} alt={schoolInfo.name} className="h-8 w-auto" />
                )}
                <span className="text-lg font-bold">{schoolInfo.name}</span>
              </div>
              <p className="text-gray-400">{schoolInfo.motto}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#programs" className="hover:text-white transition-colors">Programs</a></li>
                <li><a href="#facilities" className="hover:text-white transition-colors">Facilities</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{schoolInfo.address}</li>
                <li>{schoolInfo.phone}</li>
                <li>{schoolInfo.email}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                {schoolInfo.socialMedia?.facebook && (
                  <a href={schoolInfo.socialMedia.facebook} className="text-gray-400 hover:text-white transition-colors">
                    Facebook
                  </a>
                )}
                {schoolInfo.socialMedia?.twitter && (
                  <a href={schoolInfo.socialMedia.twitter} className="text-gray-400 hover:text-white transition-colors">
                    Twitter
                  </a>
                )}
                {schoolInfo.socialMedia?.instagram && (
                  <a href={schoolInfo.socialMedia.instagram} className="text-gray-400 hover:text-white transition-colors">
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {schoolInfo.name}. All rights reserved. Powered by ReportSheet.</p>
          </div>
        </div>
      </footer>

      {/* Admission Form Modal */}
      <PublicAdmissionForm 
        isOpen={isAdmissionFormOpen}
        onClose={() => setIsAdmissionFormOpen(false)}
        onSuccess={handleAdmissionSuccess}
      />
    </div>
  );
};

// Helper function to generate default landing content
const getDefaultLandingContent = (school: SchoolInfo): SchoolLandingPageContent => ({
  hero: {
    title: `Welcome to ${school.name}`,
    subtitle: school.motto || 'Excellence in Education',
    backgroundImage: ''
  },
  about: {
    title: `About ${school.name}`,
    description: school.description || 'We are committed to providing quality education and nurturing young minds.',
    image: ''
  },
  programs: {
    title: 'Our Academic Programs',
    subtitle: 'Comprehensive education programs designed to nurture every student\'s potential',
    programs: [
      {
        name: 'Primary Education',
        description: 'Foundation learning for ages 6-11',
        ageRange: '6-11 years',
        duration: '6 years',
        image: ''
      },
      {
        name: 'Secondary Education',
        description: 'Comprehensive secondary education',
        ageRange: '12-18 years',
        duration: '6 years',
        image: ''
      }
    ]
  },
  facilities: {
    title: 'World-Class Facilities',
    subtitle: 'State-of-the-art facilities designed to enhance learning',
    facilities: [
      { name: 'Library', description: 'Well-stocked library with digital resources', icon: '📚' },
      { name: 'Science Labs', description: 'Modern laboratories for practical learning', icon: '🔬' },
      { name: 'Sports Complex', description: 'Complete sports and recreation facilities', icon: '⚽' },
      { name: 'Computer Lab', description: 'Latest technology for digital literacy', icon: '💻' }
    ]
  },
  testimonials: {
    title: 'What Parents Say',
    testimonials: [
      {
        name: 'Mrs. Johnson',
        role: 'Parent',
        content: 'Excellent school with dedicated teachers and great facilities.',
        avatar: ''
      }
    ]
  },
  contact: {
    title: 'Get in Touch',
    subtitle: 'Ready to join our school community? Contact us today!'
  }
});

export default SchoolLandingPage;
