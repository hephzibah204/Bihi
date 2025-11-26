import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { SchoolLandingPageContent, SchoolInfo, LandingPageTemplate, PageSection } from '../types/school';
import { useFileUpload } from '../hooks/useFileUpload';
import Modal from './Modal';

interface SchoolLandingPageBuilderProps {
  schoolInfo: SchoolInfo;
  onSave: (content: SchoolLandingPageContent) => void;
}

const SchoolLandingPageBuilder: React.FC<SchoolLandingPageBuilderProps> = ({ schoolInfo, onSave }) => {
  const [content, setContent] = useState<SchoolLandingPageContent>(
    schoolInfo.landing_page_content || getDefaultContent(schoolInfo)
  );
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const { uploadFile } = useFileUpload();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    // In a real app, these would come from the database
    const defaultTemplates: LandingPageTemplate[] = [
      {
        id: 'modern',
        name: 'Modern School',
        description: 'Clean, modern design with bold typography',
        thumbnail: '/templates/modern-thumb.jpg',
        category: 'modern',
        sections: ['hero', 'about', 'programs', 'facilities', 'testimonials', 'contact'],
        colorScheme: {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937'
        }
      },
      {
        id: 'classic',
        name: 'Classic Academy',
        description: 'Traditional, elegant design with serif fonts',
        thumbnail: '/templates/classic-thumb.jpg',
        category: 'classic',
        sections: ['hero', 'about', 'programs', 'facilities', 'staff', 'testimonials', 'contact'],
        colorScheme: {
          primary: '#7C2D12',
          secondary: '#92400E',
          accent: '#D97706',
          background: '#FEF7ED',
          text: '#1C1917'
        }
      },
      {
        id: 'creative',
        name: 'Creative Arts',
        description: 'Vibrant, creative design for arts-focused schools',
        thumbnail: '/templates/creative-thumb.jpg',
        category: 'creative',
        sections: ['hero', 'about', 'programs', 'gallery', 'achievements', 'testimonials', 'contact'],
        colorScheme: {
          primary: '#7C3AED',
          secondary: '#5B21B6',
          accent: '#EC4899',
          background: '#FEFBFF',
          text: '#1E1B4B'
        }
      }
    ];
    setTemplates(defaultTemplates);
  };

  const handleContentChange = (section: keyof SchoolLandingPageContent, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayItemChange = (section: keyof SchoolLandingPageContent, arrayField: string, index: number, field: string, value: any) => {
    setContent(prev => {
      const sectionData = prev[section] as any;
      const newArray = [...sectionData[arrayField]];
      newArray[index] = { ...newArray[index], [field]: value };
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [arrayField]: newArray
        }
      };
    });
  };

  const addArrayItem = (section: keyof SchoolLandingPageContent, arrayField: string, newItem: any) => {
    setContent(prev => {
      const sectionData = prev[section] as any;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [arrayField]: [...sectionData[arrayField], newItem]
        }
      };
    });
  };

  const removeArrayItem = (section: keyof SchoolLandingPageContent, arrayField: string, index: number) => {
    setContent(prev => {
      const sectionData = prev[section] as any;
      const newArray = sectionData[arrayField].filter((_: any, i: number) => i !== index);
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [arrayField]: newArray
        }
      };
    });
  };

  const handleImageUpload = async (section: string, field: string, file: File, index?: number) => {
    try {
      const imageUrl = await uploadFile(file, `schools/${schoolInfo.id}/landing-page/${section}`);
      
      if (typeof index === 'number') {
        // For array items
        handleArrayItemChange(section as keyof SchoolLandingPageContent, field, index, 'image', imageUrl);
      } else {
        // For single fields
        handleContentChange(section as keyof SchoolLandingPageContent, field, imageUrl);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({ landing_page_content: content })
        .eq('id', schoolInfo.id);

      if (error) throw error;

      onSave(content);
      alert('Landing page saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save landing page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: LandingPageTemplate) => {
    // Apply template structure while preserving school-specific content
    const updatedContent = {
      ...content,
      // Apply template color scheme to existing content
      // This would be more sophisticated in a real implementation
    };
    setContent(updatedContent);
    setShowTemplateModal(false);
  };

  const renderSectionEditor = () => {
    switch (activeSection) {
      case 'hero':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Hero Section</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <textarea
                value={content.hero.title}
                onChange={(e) => handleContentChange('hero', 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Enter hero title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <textarea
                value={content.hero.subtitle}
                onChange={(e) => handleContentChange('hero', 'subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter hero subtitle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload('hero', 'backgroundImage', file);
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {content.hero.backgroundImage && (
                <img src={content.hero.backgroundImage} alt="Hero background" className="mt-2 h-32 w-full object-cover rounded-md" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary CTA Text</label>
                <input
                  type="text"
                  value={content.hero.ctaText || 'Apply for Admission'}
                  onChange={(e) => handleContentChange('hero', 'ctaText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary CTA Text</label>
                <input
                  type="text"
                  value={content.hero.secondaryCtaText || 'Take Virtual Tour'}
                  onChange={(e) => handleContentChange('hero', 'secondaryCtaText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">About Section</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={content.about.title}
                onChange={(e) => handleContentChange('about', 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={content.about.description}
                onChange={(e) => handleContentChange('about', 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload('about', 'image', file);
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {content.about.image && (
                <img src={content.about.image} alt="About" className="mt-2 h-32 w-full object-cover rounded-md" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
              <textarea
                value={content.about.mission || ''}
                onChange={(e) => handleContentChange('about', 'mission', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter your school's mission statement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vision Statement</label>
              <textarea
                value={content.about.vision || ''}
                onChange={(e) => handleContentChange('about', 'vision', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter your school's vision statement"
              />
            </div>
          </div>
        );

      case 'programs':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Academic Programs</h3>
              <button
                onClick={() => addArrayItem('programs', 'programs', {
                  name: 'New Program',
                  description: 'Program description',
                  ageRange: '6-12 years',
                  duration: '6 years',
                  image: ''
                })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Program
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
              <input
                type="text"
                value={content.programs.title}
                onChange={(e) => handleContentChange('programs', 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Subtitle</label>
              <textarea
                value={content.programs.subtitle}
                onChange={(e) => handleContentChange('programs', 'subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              {content.programs.programs.map((program, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Program {index + 1}</h4>
                    <button
                      onClick={() => removeArrayItem('programs', 'programs', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                      <input
                        type="text"
                        value={program.name}
                        onChange={(e) => handleArrayItemChange('programs', 'programs', index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                      <input
                        type="text"
                        value={program.ageRange}
                        onChange={(e) => handleArrayItemChange('programs', 'programs', index, 'ageRange', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={program.description}
                      onChange={(e) => handleArrayItemChange('programs', 'programs', index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('programs', 'programs', file, index);
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {program.image && (
                      <img src={program.image} alt={program.name} className="mt-2 h-24 w-full object-cover rounded-md" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'facilities':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Facilities</h3>
              <button
                onClick={() => addArrayItem('facilities', 'facilities', {
                  name: 'New Facility',
                  description: 'Facility description',
                  icon: '🏢'
                })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Facility
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
              <input
                type="text"
                value={content.facilities.title}
                onChange={(e) => handleContentChange('facilities', 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4">
              {content.facilities.facilities.map((facility, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Facility {index + 1}</h4>
                    <button
                      onClick={() => removeArrayItem('facilities', 'facilities', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <input
                        type="text"
                        value={facility.icon}
                        onChange={(e) => handleArrayItemChange('facilities', 'facilities', index, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="🏢"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                      <input
                        type="text"
                        value={facility.name}
                        onChange={(e) => handleArrayItemChange('facilities', 'facilities', index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={facility.description}
                      onChange={(e) => handleArrayItemChange('facilities', 'facilities', index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Testimonials</h3>
              <button
                onClick={() => addArrayItem('testimonials', 'testimonials', {
                  name: 'Parent Name',
                  role: 'Parent',
                  content: 'Great school with excellent teachers.',
                  avatar: ''
                })}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Testimonial
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
              <input
                type="text"
                value={content.testimonials.title}
                onChange={(e) => handleContentChange('testimonials', 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4">
              {content.testimonials.testimonials.map((testimonial, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Testimonial {index + 1}</h4>
                    <button
                      onClick={() => removeArrayItem('testimonials', 'testimonials', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={testimonial.name}
                        onChange={(e) => handleArrayItemChange('testimonials', 'testimonials', index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <input
                        type="text"
                        value={testimonial.role}
                        onChange={(e) => handleArrayItemChange('testimonials', 'testimonials', index, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content</label>
                    <textarea
                      value={testimonial.content}
                      onChange={(e) => handleArrayItemChange('testimonials', 'testimonials', index, 'content', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('testimonials', 'testimonials', file, index);
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {testimonial.avatar && (
                      <img src={testimonial.avatar} alt={testimonial.name} className="mt-2 h-16 w-16 rounded-full object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Select a section to edit</div>;
    }
  };

  const sections = [
    { id: 'hero', name: 'Hero Section', icon: '🎯' },
    { id: 'about', name: 'About Us', icon: '📖' },
    { id: 'programs', name: 'Programs', icon: '🎓' },
    { id: 'facilities', name: 'Facilities', icon: '🏢' },
    { id: 'testimonials', name: 'Testimonials', icon: '💬' },
    { id: 'contact', name: 'Contact', icon: '📞' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Landing Page Builder</h1>
              <p className="text-sm text-gray-600">{schoolInfo.name}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Choose Template
              </button>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                {previewMode ? 'Edit Mode' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          {!previewMode && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Page Sections</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{section.icon}</span>
                      {section.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={previewMode ? 'lg:col-span-4' : 'lg:col-span-3'}>
            {previewMode ? (
              <div className="bg-white rounded-lg shadow">
                {/* Preview would render the actual landing page here */}
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Landing Page Preview</h2>
                  <p className="text-gray-600 mb-8">Preview of your landing page would appear here</p>
                  <div className="bg-gray-100 rounded-lg p-12">
                    <p className="text-gray-500">Landing page preview coming soon...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                {renderSectionEditor()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Choose a Template"
        size="xl"
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Template Preview</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <button
                    onClick={() => applyTemplate(template)}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Helper function to generate default content
const getDefaultContent = (schoolInfo: SchoolInfo): SchoolLandingPageContent => ({
  hero: {
    title: `Welcome to ${schoolInfo.name}`,
    subtitle: schoolInfo.motto || 'Excellence in Education',
    backgroundImage: '',
    ctaText: 'Apply for Admission',
    secondaryCtaText: 'Take Virtual Tour'
  },
  about: {
    title: `About ${schoolInfo.name}`,
    description: schoolInfo.description || 'We are committed to providing quality education and nurturing young minds.',
    image: '',
    mission: '',
    vision: ''
  },
  programs: {
    title: 'Our Academic Programs',
    subtitle: 'Comprehensive education programs designed to nurture every student\'s potential',
    programs: [
      {
        name: 'Primary Education',
        description: 'Foundation learning for young minds',
        ageRange: '6-11 years',
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

export default SchoolLandingPageBuilder;
