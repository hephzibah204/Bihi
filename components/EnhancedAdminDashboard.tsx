import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdmissionApplication, SchoolInfo } from '../types/school';
import AdmissionAnalytics from './AdmissionAnalytics';
import BulkCommunications from './BulkCommunications';
import NotificationCenter from './NotificationCenter';
import PaymentGateway from './PaymentGateway';
import InterviewScheduler from './InterviewScheduler';
import LanguageSelector from './LanguageSelector';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

interface EnhancedAdminDashboardProps {
  schoolId: string;
  userId: string;
}

const EnhancedAdminDashboardInner: React.FC<EnhancedAdminDashboardProps> = ({ schoolId, userId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'analytics' | 'communications' | 'settings'>('overview');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isCommunicationsModalOpen, setIsCommunicationsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadDashboardData();
  }, [schoolId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load school info
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;
      setSchoolInfo(school);

      // Load applications
      const { data: apps, error: appsError } = await supabase
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId)
        .order('submission_date', { ascending: false });

      if (appsError) throw appsError;
      setApplications(apps || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return '📝';
      case 'under_review': return '👀';
      case 'interview_scheduled': return '🗓️';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '📄';
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('admission_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Reload applications
      loadDashboardData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleScheduleInterview = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setIsInterviewModalOpen(true);
  };

  const handleProcessPayment = (application: AdmissionApplication) => {
    setSelectedApplication(application);
    setIsPaymentModalOpen(true);
  };

  const getDashboardStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'submitted').length;
    const underReview = applications.filter(app => app.status === 'under_review').length;
    const interviewed = applications.filter(app => app.status === 'interview_scheduled').length;
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;

    return { total, pending, underReview, interviewed, accepted, rejected };
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {schoolInfo?.name} - Admin Dashboard
              </h1>
              <p className="text-gray-600">Manage admissions and school operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector showLabel={false} />
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <button
                onClick={() => setIsCommunicationsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📧 Bulk Communications
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'applications', name: 'Applications', icon: '📝' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'communications', name: 'Communications', icon: '📧' },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📊</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Applications</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📝</div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                    <p className="text-sm text-gray-600">Pending Review</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👀</div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.underReview}</p>
                    <p className="text-sm text-gray-600">Under Review</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🗓️</div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.interviewed}</p>
                    <p className="text-sm text-gray-600">Interviewed</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">✅</div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                    <p className="text-sm text-gray-600">Accepted</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">❌</div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-sm text-gray-600">Rejected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.slice(0, 10).map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{getStatusIcon(application.status)}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {application.student?.firstName} {application.student?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Parent: {application.parent?.firstName} {application.parent?.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {application.student?.classApplyingFor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                            {application.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.submission_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {application.status === 'submitted' && (
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'under_review')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review
                            </button>
                          )}
                          {application.status === 'under_review' && (
                            <button
                              onClick={() => handleScheduleInterview(application)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Schedule Interview
                            </button>
                          )}
                          {application.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleProcessPayment(application)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">All Applications</h2>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.student?.firstName} {application.student?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            DOB: {application.student?.dateOfBirth}
                          </div>
                          <div className="text-sm text-gray-500">
                            Gender: {application.student?.gender}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.parent?.firstName} {application.parent?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.parent?.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.parent?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.student?.classApplyingFor}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                            {application.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          application.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {application.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AdmissionAnalytics schoolId={schoolId} />
        )}

        {activeTab === 'communications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication Center</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setIsCommunicationsModalOpen(true)}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">📧</div>
                    <h3 className="font-medium text-gray-900">Bulk Email/SMS</h3>
                    <p className="text-sm text-gray-500">Send messages to multiple recipients</p>
                  </div>
                </button>
                
                <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📝</div>
                    <h3 className="font-medium text-gray-900">Templates</h3>
                    <p className="text-sm text-gray-500">Manage communication templates</p>
                  </div>
                </button>
                
                <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-medium text-gray-900">Reports</h3>
                    <p className="text-sm text-gray-500">View communication analytics</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">School Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                  <input
                    type="text"
                    value={schoolInfo?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Motto</label>
                  <input
                    type="text"
                    value={schoolInfo?.motto || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={schoolInfo?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedApplication && (
        <>
          <PaymentGateway
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={(paymentRef) => {
              console.log('Payment successful:', paymentRef);
              setIsPaymentModalOpen(false);
              loadDashboardData();
            }}
            amount={50000}
            currency="NGN"
            description="Application Fee"
            applicantEmail={selectedApplication.parent?.email || ''}
            applicantName={`${selectedApplication.parent?.firstName} ${selectedApplication.parent?.lastName}`}
            schoolId={schoolId}
            applicationId={selectedApplication.id}
          />

          <InterviewScheduler
            isOpen={isInterviewModalOpen}
            onClose={() => setIsInterviewModalOpen(false)}
            application={selectedApplication}
            onScheduled={(slot) => {
              console.log('Interview scheduled:', slot);
              setIsInterviewModalOpen(false);
              loadDashboardData();
            }}
          />
        </>
      )}

      <BulkCommunications
        isOpen={isCommunicationsModalOpen}
        onClose={() => setIsCommunicationsModalOpen(false)}
        schoolId={schoolId}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        schoolId={schoolId}
        userId={userId}
      />
    </div>
  );
};

const EnhancedAdminDashboard: React.FC<EnhancedAdminDashboardProps> = (props) => {
  return (
    <LanguageProvider>
      <EnhancedAdminDashboardInner {...props} />
    </LanguageProvider>
  );
};

export default EnhancedAdminDashboard;
