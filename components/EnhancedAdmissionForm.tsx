import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdmissionApplication, SchoolInfo, AdmissionSettings } from '../types/school';
import Modal from './Modal';
import { useFileUpload } from '../hooks/useFileUpload';

interface EnhancedAdmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolInfo: SchoolInfo;
}

const EnhancedAdmissionForm: React.FC<EnhancedAdmissionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  schoolInfo
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    school_id: schoolInfo.id,
    student: {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: 'Male',
      nationality: 'Nigerian',
      stateOfOrigin: '',
      religion: '',
      bloodGroup: '',
      medicalConditions: '',
      previousSchool: '',
      classApplyingFor: ''
    },
    parent: {
      title: 'Mr.',
      firstName: '',
      lastName: '',
      relationship: 'Father',
      occupation: '',
      employer: '',
      phone: '',
      email: '',
      address: '',
      alternativeContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    },
    applicationDetails: {
      preferredStartDate: '',
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      previousSchoolRecords: false,
      reasonForApplication: '',
      howDidYouHearAboutUs: '',
      referredBy: ''
    },
    documents: {},
    status: 'submitted',
    submissionDate: new Date().toISOString()
  });

  const [admissionSettings, setAdmissionSettings] = useState<AdmissionSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const { uploadFile } = useFileUpload();

  useEffect(() => {
    if (schoolInfo.admission_settings) {
      setAdmissionSettings(schoolInfo.admission_settings);
    }
  }, [schoolInfo]);

  const handleInputChange = (section: keyof AdmissionApplication, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: keyof AdmissionApplication, nestedSection: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...prev[section]?.[nestedSection],
          [field]: value
        }
      }
    }));
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploadingFiles(prev => ({ ...prev, [documentType]: true }));
    try {
      const fileUrl = await uploadFile(file, `admissions/${schoolInfo.id}/${documentType}`);
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: fileUrl
        }
      }));
    } catch (error) {
      console.error('File upload error:', error);
      setError(`Failed to upload ${documentType}. Please try again.`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.student?.firstName &&
          formData.student?.lastName &&
          formData.student?.dateOfBirth &&
          formData.student?.classApplyingFor
        );
      case 2:
        return !!(
          formData.parent?.firstName &&
          formData.parent?.lastName &&
          formData.parent?.phone &&
          formData.parent?.email &&
          formData.parent?.address
        );
      case 3:
        return !!(formData.applicationDetails?.preferredStartDate);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError('');
    } else {
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const applicationData = {
        ...formData,
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submissionDate: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('admission_applications')
        .insert([applicationData]);

      if (insertError) throw insertError;

      // Send notification email to school admin
      await supabase.functions.invoke('send-admission-notification', {
        body: {
          schoolId: schoolInfo.id,
          applicationId: applicationData.id,
          studentName: `${formData.student?.firstName} ${formData.student?.lastName}`,
          parentEmail: formData.parent?.email
        }
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Submission error:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Student Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  value={formData.student?.firstName || ''}
                  onChange={(e) => handleInputChange('student', 'firstName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  value={formData.student?.lastName || ''}
                  onChange={(e) => handleInputChange('student', 'lastName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Middle Name</label>
              <input
                type="text"
                value={formData.student?.middleName || ''}
                onChange={(e) => handleInputChange('student', 'middleName', e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.student?.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('student', 'dateOfBirth', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select
                  value={formData.student?.gender || 'Male'}
                  onChange={(e) => handleInputChange('student', 'gender', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Class Applying For *</label>
              <select
                value={formData.student?.classApplyingFor || ''}
                onChange={(e) => handleInputChange('student', 'classApplyingFor', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Class</option>
                {admissionSettings?.availableClasses.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nationality</label>
                <input
                  type="text"
                  value={formData.student?.nationality || 'Nigerian'}
                  onChange={(e) => handleInputChange('student', 'nationality', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">State of Origin</label>
                <input
                  type="text"
                  value={formData.student?.stateOfOrigin || ''}
                  onChange={(e) => handleInputChange('student', 'stateOfOrigin', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Religion</label>
                <input
                  type="text"
                  value={formData.student?.religion || ''}
                  onChange={(e) => handleInputChange('student', 'religion', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select
                  value={formData.student?.bloodGroup || ''}
                  onChange={(e) => handleInputChange('student', 'bloodGroup', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Previous School</label>
              <input
                type="text"
                value={formData.student?.previousSchool || ''}
                onChange={(e) => handleInputChange('student', 'previousSchool', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Medical Conditions (if any)</label>
              <textarea
                value={formData.student?.medicalConditions || ''}
                onChange={(e) => handleInputChange('student', 'medicalConditions', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Please list any medical conditions, allergies, or special medical needs"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Title *</label>
                <select
                  value={formData.parent?.title || 'Mr.'}
                  onChange={(e) => handleInputChange('parent', 'title', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Rev.">Rev.</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Chief">Chief</option>
                </select>
              </div>
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  value={formData.parent?.firstName || ''}
                  onChange={(e) => handleInputChange('parent', 'firstName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  value={formData.parent?.lastName || ''}
                  onChange={(e) => handleInputChange('parent', 'lastName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Relationship to Student *</label>
              <select
                value={formData.parent?.relationship || 'Father'}
                onChange={(e) => handleInputChange('parent', 'relationship', e.target.value)}
                className="input-field"
                required
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.parent?.phone || ''}
                  onChange={(e) => handleInputChange('parent', 'phone', e.target.value)}
                  className="input-field"
                  required
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  value={formData.parent?.email || ''}
                  onChange={(e) => handleInputChange('parent', 'email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Home Address *</label>
              <textarea
                value={formData.parent?.address || ''}
                onChange={(e) => handleInputChange('parent', 'address', e.target.value)}
                className="input-field"
                rows={3}
                required
                placeholder="Please provide complete home address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Occupation</label>
                <input
                  type="text"
                  value={formData.parent?.occupation || ''}
                  onChange={(e) => handleInputChange('parent', 'occupation', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Employer</label>
                <input
                  type="text"
                  value={formData.parent?.employer || ''}
                  onChange={(e) => handleInputChange('parent', 'employer', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Alternative Contact (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={formData.parent?.alternativeContact?.name || ''}
                    onChange={(e) => handleNestedInputChange('parent', 'alternativeContact', 'name', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={formData.parent?.alternativeContact?.phone || ''}
                    onChange={(e) => handleNestedInputChange('parent', 'alternativeContact', 'phone', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label">Relationship</label>
                <input
                  type="text"
                  value={formData.parent?.alternativeContact?.relationship || ''}
                  onChange={(e) => handleNestedInputChange('parent', 'alternativeContact', 'relationship', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Uncle, Aunt, Family Friend"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Application Details</h3>
            
            <div>
              <label className="label">Preferred Start Date *</label>
              <input
                type="date"
                value={formData.applicationDetails?.preferredStartDate || ''}
                onChange={(e) => handleInputChange('applicationDetails', 'preferredStartDate', e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">How did you hear about our school?</label>
              <select
                value={formData.applicationDetails?.howDidYouHearAboutUs || ''}
                onChange={(e) => handleInputChange('applicationDetails', 'howDidYouHearAboutUs', e.target.value)}
                className="input-field"
              >
                <option value="">Select an option</option>
                <option value="Website">Website</option>
                <option value="Social Media">Social Media</option>
                <option value="Friend/Family">Friend/Family</option>
                <option value="Advertisement">Advertisement</option>
                <option value="School Visit">School Visit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Referred by (if applicable)</label>
              <input
                type="text"
                value={formData.applicationDetails?.referredBy || ''}
                onChange={(e) => handleInputChange('applicationDetails', 'referredBy', e.target.value)}
                className="input-field"
                placeholder="Name of person who referred you"
              />
            </div>

            <div>
              <label className="label">Reason for choosing our school</label>
              <textarea
                value={formData.applicationDetails?.reasonForApplication || ''}
                onChange={(e) => handleInputChange('applicationDetails', 'reasonForApplication', e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Please tell us why you want your child to attend our school"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasSpecialNeeds"
                  checked={formData.applicationDetails?.hasSpecialNeeds || false}
                  onChange={(e) => handleInputChange('applicationDetails', 'hasSpecialNeeds', e.target.checked)}
                  className="mr-3"
                />
                <label htmlFor="hasSpecialNeeds" className="text-sm">
                  My child has special educational needs or requires additional support
                </label>
              </div>

              {formData.applicationDetails?.hasSpecialNeeds && (
                <div>
                  <label className="label">Please describe the special needs or support required</label>
                  <textarea
                    value={formData.applicationDetails?.specialNeedsDescription || ''}
                    onChange={(e) => handleInputChange('applicationDetails', 'specialNeedsDescription', e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Please provide details about the special needs or support required"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="previousSchoolRecords"
                checked={formData.applicationDetails?.previousSchoolRecords || false}
                onChange={(e) => handleInputChange('applicationDetails', 'previousSchoolRecords', e.target.checked)}
                className="mr-3"
              />
              <label htmlFor="previousSchoolRecords" className="text-sm">
                I can provide previous school records and transcripts
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please upload the following documents. All documents should be in PDF, JPG, or PNG format and not exceed 5MB.
            </p>

            {admissionSettings?.documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{doc.name}</h4>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                    {doc.required && <span className="text-red-500 text-xs">* Required</span>}
                  </div>
                  <div className="text-right">
                    {uploadingFiles[doc.name] ? (
                      <div className="text-blue-600 text-sm">Uploading...</div>
                    ) : formData.documents?.[doc.name] ? (
                      <div className="text-green-600 text-sm">✓ Uploaded</div>
                    ) : (
                      <div className="text-gray-500 text-sm">Not uploaded</div>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        setError('File size must not exceed 5MB');
                        return;
                      }
                      handleFileUpload(doc.name, file);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploadingFiles[doc.name]}
                />
              </div>
            ))}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• All documents must be clear and legible</li>
                <li>• Original documents may be required for verification</li>
                <li>• Incomplete applications may delay the admission process</li>
                <li>• You will receive an email confirmation after submission</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Student Information';
      case 2: return 'Parent/Guardian Information';
      case 3: return 'Application Details';
      case 4: return 'Documents Upload';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply to ${schoolInfo.name}`} size="xl">
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of 4: {getStepTitle(currentStep)}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-6 py-2 rounded-lg font-medium ${
                submitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EnhancedAdmissionForm;
