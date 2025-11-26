import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdmissionApplication, SchoolDashboardStats } from '../types/school';
import Modal from './Modal';
import { format } from 'date-fns';

interface AdmissionManagementProps {
  schoolId: string;
}

const AdmissionManagement: React.FC<AdmissionManagementProps> = ({ schoolId }) => {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [stats, setStats] = useState<SchoolDashboardStats | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'under_review' | 'accepted' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApplications();
    loadStats();
  }, [schoolId]);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId)
        .order('submissionDate', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_applications')
        .select('status, submissionDate, student')
        .eq('school_id', schoolId);

      if (error) throw error;

      const applications = data || [];
      const stats: SchoolDashboardStats = {
        totalApplications: applications.length,
        pendingReview: applications.filter(app => app.status === 'submitted' || app.status === 'under_review').length,
        acceptedApplications: applications.filter(app => app.status === 'accepted').length,
        rejectedApplications: applications.filter(app => app.status === 'rejected').length,
        interviewsScheduled: applications.filter(app => app.status === 'interview_scheduled').length,
        recentApplications: applications.slice(0, 5),
        applicationsByClass: getApplicationsByClass(applications),
        applicationsByMonth: getApplicationsByMonth(applications)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getApplicationsByClass = (applications: any[]) => {
    const classCounts: Record<string, number> = {};
    applications.forEach(app => {
      const className = app.student?.classApplyingFor;
      if (className) {
        classCounts[className] = (classCounts[className] || 0) + 1;
      }
    });
    return Object.entries(classCounts).map(([class_, count]) => ({ class: class_, count }));
  };

  const getApplicationsByMonth = (applications: any[]) => {
    const monthCounts: Record<string, number> = {};
    applications.forEach(app => {
      const month = format(new Date(app.submissionDate), 'MMM yyyy');
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    return Object.entries(monthCounts).map(([month, count]) => ({ month, count }));
  };

  const updateApplicationStatus = async (applicationId: string, status: AdmissionApplication['status'], notes?: string) => {
    try {
      const { error } = await supabase
        .from('admission_applications')
        .update({
          status,
          notes,
          reviewDate: new Date().toISOString(),
          reviewedBy: 'Admin' // In a real app, this would be the current user
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status, notes, reviewDate: new Date().toISOString() }
            : app
        )
      );

      // Send notification email to parent
      await supabase.functions.invoke('send-admission-status-update', {
        body: {
          applicationId,
          status,
          notes
        }
      });

      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = searchTerm === '' || 
      `${app.student?.firstName} ${app.student?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.parent?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.student?.classApplyingFor.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: AdmissionApplication['status']) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: AdmissionApplication['status']) => {
    switch (status) {
      case 'submitted': return 'New Application';
      case 'under_review': return 'Under Review';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'waitlisted': return 'Waitlisted';
      default: return status;
    }
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
      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.totalApplications}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.interviewsScheduled}</div>
            <div className="text-sm text-gray-600">Interviews Scheduled</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.acceptedApplications}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>
      )}

      {/* Applications by Class Chart */}
      {stats && stats.applicationsByClass.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Applications by Class</h3>
          <div className="space-y-3">
            {stats.applicationsByClass.map(({ class: className, count }) => (
              <div key={className} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{className}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.totalApplications) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            {['all', 'submitted', 'under_review', 'accepted', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : getStatusLabel(status as any)}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Admission Applications ({filteredApplications.length})</h3>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No applications found matching your criteria.
          </div>
        ) : (
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
                    Parent Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.student?.firstName} {application.student?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          DOB: {application.student?.dateOfBirth ? format(new Date(application.student.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.student?.classApplyingFor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.parent?.firstName} {application.parent?.lastName}</div>
                      <div className="text-sm text-gray-500">{application.parent?.email}</div>
                      <div className="text-sm text-gray-500">{application.parent?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(application.submissionDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      
                      {application.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'under_review')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'accepted')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {application.status === 'under_review' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'interview_scheduled')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Schedule Interview
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'accepted')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedApplication(null);
          }}
          onStatusUpdate={(status, notes) => {
            updateApplicationStatus(selectedApplication.id, status, notes);
            setIsDetailModalOpen(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
};

// Application Detail Modal Component
const ApplicationDetailModal: React.FC<{
  application: AdmissionApplication;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (status: AdmissionApplication['status'], notes?: string) => void;
}> = ({ application, isOpen, onClose, onStatusUpdate }) => {
  const [notes, setNotes] = useState(application.notes || '');
  const [selectedStatus, setSelectedStatus] = useState<AdmissionApplication['status']>(application.status);

  const handleStatusUpdate = () => {
    onStatusUpdate(selectedStatus, notes);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Details" size="xl">
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Student Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-gray-900">
                {application.student?.firstName} {application.student?.middleName} {application.student?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Date of Birth</label>
              <p className="text-gray-900">
                {application.student?.dateOfBirth ? format(new Date(application.student.dateOfBirth), 'MMMM dd, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Gender</label>
              <p className="text-gray-900">{application.student?.gender}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Class Applying For</label>
              <p className="text-gray-900">{application.student?.classApplyingFor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Nationality</label>
              <p className="text-gray-900">{application.student?.nationality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">State of Origin</label>
              <p className="text-gray-900">{application.student?.stateOfOrigin || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Religion</label>
              <p className="text-gray-900">{application.student?.religion || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Blood Group</label>
              <p className="text-gray-900">{application.student?.bloodGroup || 'N/A'}</p>
            </div>
          </div>
          {application.student?.previousSchool && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Previous School</label>
              <p className="text-gray-900">{application.student.previousSchool}</p>
            </div>
          )}
          {application.student?.medicalConditions && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Medical Conditions</label>
              <p className="text-gray-900">{application.student.medicalConditions}</p>
            </div>
          )}
        </div>

        {/* Parent Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Parent/Guardian Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-gray-900">
                {application.parent?.title} {application.parent?.firstName} {application.parent?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Relationship</label>
              <p className="text-gray-900">{application.parent?.relationship}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900">{application.parent?.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{application.parent?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Occupation</label>
              <p className="text-gray-900">{application.parent?.occupation || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Employer</label>
              <p className="text-gray-900">{application.parent?.employer || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Address</label>
            <p className="text-gray-900">{application.parent?.address}</p>
          </div>
          {application.parent?.alternativeContact?.name && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Alternative Contact</label>
              <p className="text-gray-900">
                {application.parent.alternativeContact.name} ({application.parent.alternativeContact.relationship}) - {application.parent.alternativeContact.phone}
              </p>
            </div>
          )}
        </div>

        {/* Application Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Application Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Preferred Start Date</label>
              <p className="text-gray-900">
                {application.applicationDetails?.preferredStartDate ? 
                  format(new Date(application.applicationDetails.preferredStartDate), 'MMMM dd, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">How They Heard About Us</label>
              <p className="text-gray-900">{application.applicationDetails?.howDidYouHearAboutUs || 'N/A'}</p>
            </div>
          </div>
          {application.applicationDetails?.referredBy && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Referred By</label>
              <p className="text-gray-900">{application.applicationDetails.referredBy}</p>
            </div>
          )}
          {application.applicationDetails?.reasonForApplication && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Reason for Application</label>
              <p className="text-gray-900">{application.applicationDetails.reasonForApplication}</p>
            </div>
          )}
          {application.applicationDetails?.hasSpecialNeeds && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Special Needs</label>
              <p className="text-gray-900">{application.applicationDetails.specialNeedsDescription}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        {application.documents && Object.keys(application.documents).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {Object.entries(application.documents).map(([docType, url]) => (
                <div key={docType} className="flex justify-between items-center">
                  <span className="text-gray-900">{docType}</span>
                  <a
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Document
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Update Application Status</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AdmissionApplication['status'])}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="submitted">New Application</option>
                <option value="under_review">Under Review</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about this application..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
          <button
            onClick={handleStatusUpdate}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Update Status
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdmissionManagement;
