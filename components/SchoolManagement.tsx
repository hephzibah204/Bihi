import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { SchoolInfo } from '../types/school';
import SchoolLandingPageBuilder from './SchoolLandingPageBuilder';
import AdmissionManagement from './AdmissionManagement';
import Modal from './Modal';
import { ADMIN_VIEWS } from '../utils/constants';

interface SchoolManagementProps {
  setActiveView: (view: string) => void;
}

const SchoolManagement: React.FC<SchoolManagementProps> = ({ setActiveView }) => {
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'landing-page' | 'admissions' | 'settings'>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
      
      if (data && data.length > 0 && !selectedSchool) {
        setSelectedSchool(data[0]);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (schoolData: Partial<SchoolInfo>) => {
    try {
      const newSchool = {
        ...schoolData,
        id: `school_${Date.now()}`,
        slug: schoolData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('schools')
        .insert([newSchool]);

      if (error) throw error;

      await loadSchools();
      setIsCreateModalOpen(false);
      alert('School created successfully!');
    } catch (error) {
      console.error('Error creating school:', error);
      alert('Failed to create school. Please try again.');
    }
  };

  const handleUpdateSchool = async (updates: Partial<SchoolInfo>) => {
    if (!selectedSchool) return;

    try {
      const { error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', selectedSchool.id);

      if (error) throw error;

      setSelectedSchool({ ...selectedSchool, ...updates });
      await loadSchools();
    } catch (error) {
      console.error('Error updating school:', error);
      alert('Failed to update school. Please try again.');
    }
  };

  const renderOverview = () => {
    if (!selectedSchool) return null;

    return (
      <div className="space-y-6">
        {/* School Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{selectedSchool.stats?.students || '0'}</div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{selectedSchool.stats?.teachers || '0'}</div>
            <div className="text-sm text-gray-600">Teachers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{selectedSchool.stats?.yearsOfExcellence || '0'}</div>
            <div className="text-sm text-gray-600">Years of Excellence</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">{selectedSchool.stats?.graduationRate || '0%'}</div>
            <div className="text-sm text-gray-600">Graduation Rate</div>
          </div>
        </div>

        {/* School Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
              <input
                type="text"
                value={selectedSchool.name}
                onChange={(e) => handleUpdateSchool({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motto</label>
              <input
                type="text"
                value={selectedSchool.motto || ''}
                onChange={(e) => handleUpdateSchool({ motto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={selectedSchool.description || ''}
                onChange={(e) => handleUpdateSchool({ description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={selectedSchool.phone}
                onChange={(e) => handleUpdateSchool({ phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={selectedSchool.email}
                onChange={(e) => handleUpdateSchool({ email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={selectedSchool.address}
                onChange={(e) => handleUpdateSchool({ address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Landing Page Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Landing Page</h3>
            <div className="flex space-x-3">
              <a
                href={`/schools/${selectedSchool.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View Live Page
              </a>
              <button
                onClick={() => setActiveTab('landing-page')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Edit Landing Page
              </button>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">Landing page preview</p>
            <p className="text-sm text-gray-500 mt-2">
              URL: {window.location.origin}/schools/{selectedSchool.slug}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('admissions')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-lg font-semibold text-gray-900">Manage Admissions</div>
              <div className="text-sm text-gray-600">View and manage admission applications</div>
            </button>
            <button
              onClick={() => setActiveTab('landing-page')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-lg font-semibold text-gray-900">Edit Landing Page</div>
              <div className="text-sm text-gray-600">Customize your school's landing page</div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-lg font-semibold text-gray-900">School Settings</div>
              <div className="text-sm text-gray-600">Configure admission settings and preferences</div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (!selectedSchool) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Admission Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Admissions Open</label>
                <p className="text-sm text-gray-600">Allow new admission applications</p>
              </div>
              <input
                type="checkbox"
                checked={selectedSchool.admission_settings?.isOpen || false}
                onChange={(e) => handleUpdateSchool({
                  admission_settings: {
                    ...selectedSchool.admission_settings,
                    isOpen: e.target.checked
                  }
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
              <input
                type="date"
                value={selectedSchool.admission_settings?.applicationDeadline || ''}
                onChange={(e) => handleUpdateSchool({
                  admission_settings: {
                    ...selectedSchool.admission_settings,
                    applicationDeadline: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <input
                type="text"
                value={selectedSchool.admission_settings?.academicYear || ''}
                onChange={(e) => handleUpdateSchool({
                  admission_settings: {
                    ...selectedSchool.admission_settings,
                    academicYear: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2024/2025"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="url"
                value={selectedSchool.socialMedia?.facebook || ''}
                onChange={(e) => handleUpdateSchool({
                  socialMedia: {
                    ...selectedSchool.socialMedia,
                    facebook: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://facebook.com/yourschool"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <input
                type="url"
                value={selectedSchool.socialMedia?.twitter || ''}
                onChange={(e) => handleUpdateSchool({
                  socialMedia: {
                    ...selectedSchool.socialMedia,
                    twitter: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://twitter.com/yourschool"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="url"
                value={selectedSchool.socialMedia?.instagram || ''}
                onChange={(e) => handleUpdateSchool({
                  socialMedia: {
                    ...selectedSchool.socialMedia,
                    instagram: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://instagram.com/yourschool"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={selectedSchool.website || ''}
                onChange={(e) => handleUpdateSchool({ website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourschool.edu.ng"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
          <p className="text-gray-600">Manage your school's landing pages and admissions</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New School
        </button>
      </div>

      {/* School Selector */}
      {schools.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select School:</label>
            <select
              value={selectedSchool?.id || ''}
              onChange={(e) => {
                const school = schools.find(s => s.id === e.target.value);
                setSelectedSchool(school || null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedSchool ? (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'landing-page', name: 'Landing Page', icon: '🎨' },
                  { id: 'admissions', name: 'Admissions', icon: '📝' },
                  { id: 'settings', name: 'Settings', icon: '⚙️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'landing-page' && (
                <SchoolLandingPageBuilder
                  schoolInfo={selectedSchool}
                  onSave={(content) => handleUpdateSchool({ landing_page_content: content })}
                />
              )}
              {activeTab === 'admissions' && (
                <AdmissionManagement schoolId={selectedSchool.id} />
              )}
              {activeTab === 'settings' && renderSettings()}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schools Found</h3>
          <p className="text-gray-600 mb-4">Create your first school to get started with landing pages and admissions.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Create Your First School
          </button>
        </div>
      )}

      {/* Create School Modal */}
      <CreateSchoolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSchool}
      />
    </div>
  );
};

// Create School Modal Component
const CreateSchoolModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (schoolData: Partial<SchoolInfo>) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    motto: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    established: '',
    principalName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: '',
      motto: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      established: '',
      principalName: ''
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New School" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motto</label>
            <input
              type="text"
              value={formData.motto}
              onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://yourschool.edu.ng"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
            <input
              type="text"
              value={formData.established}
              onChange={(e) => setFormData({ ...formData, established: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 1995"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Principal's Name</label>
          <input
            type="text"
            value={formData.principalName}
            onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create School
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SchoolManagement;
