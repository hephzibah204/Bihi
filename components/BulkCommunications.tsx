import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdmissionApplication } from '../types/school';
import Modal from './Modal';

interface BulkCommunicationsProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'both';
  category: 'admission' | 'interview' | 'decision' | 'general';
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentName: string;
  status: string;
  selected: boolean;
}

const BulkCommunications: React.FC<BulkCommunicationsProps> = ({
  isOpen,
  onClose,
  schoolId
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('compose');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [communicationType, setCommunicationType] = useState<'email' | 'sms' | 'both'>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sending, setSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadRecipients();
      loadTemplates();
    }
  }, [isOpen, schoolId]);

  useEffect(() => {
    filterRecipients();
  }, [recipients, filterStatus]);

  const loadRecipients = async () => {
    try {
      const { data: applications, error } = await supabase
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId)
        .order('submission_date', { ascending: false });

      if (error) throw error;

      const recipientList: Recipient[] = applications.map(app => ({
        id: app.id,
        name: `${app.parent?.firstName} ${app.parent?.lastName}`,
        email: app.parent?.email || '',
        phone: app.parent?.phone || '',
        studentName: `${app.student?.firstName} ${app.student?.lastName}`,
        status: app.status,
        selected: false
      }));

      setRecipients(recipientList);
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const loadTemplates = async () => {
    // In a real app, these would come from the database
    const defaultTemplates: CommunicationTemplate[] = [
      {
        id: 'welcome',
        name: 'Application Received',
        subject: 'Application Received - {{studentName}}',
        content: `Dear {{parentName}},

Thank you for submitting an application for {{studentName}} to join our school.

We have received your application and it is currently being reviewed by our admissions team. You will receive an update within 3-5 business days.

Application Details:
- Student: {{studentName}}
- Class Applied For: {{classApplyingFor}}
- Application ID: {{applicationId}}

If you have any questions, please don't hesitate to contact our admissions office.

Best regards,
Admissions Team`,
        type: 'email',
        category: 'admission'
      },
      {
        id: 'interview_invitation',
        name: 'Interview Invitation',
        subject: 'Interview Invitation - {{studentName}}',
        content: `Dear {{parentName}},

We are pleased to invite {{studentName}} for an interview as part of our admission process.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Location: {{interviewLocation}}
- Interviewer: {{interviewer}}

Please confirm your attendance by replying to this email. If you need to reschedule, please contact us at least 24 hours in advance.

What to bring:
- Original copies of all submitted documents
- Student's recent report card
- Any additional certificates or awards

We look forward to meeting you and {{studentName}}.

Best regards,
Admissions Team`,
        type: 'email',
        category: 'interview'
      },
      {
        id: 'acceptance',
        name: 'Admission Acceptance',
        subject: 'Congratulations! Admission Offer - {{studentName}}',
        content: `Dear {{parentName}},

Congratulations! We are delighted to offer {{studentName}} a place at our school for the {{academicYear}} academic year.

Admission Details:
- Student: {{studentName}}
- Class: {{classApplyingFor}}
- Academic Year: {{academicYear}}
- Start Date: {{startDate}}

Next Steps:
1. Accept this offer by {{acceptanceDeadline}}
2. Complete the enrollment process
3. Pay the enrollment fee
4. Attend the new student orientation

Please contact our admissions office to confirm acceptance and begin the enrollment process.

We are excited to welcome {{studentName}} to our school community!

Best regards,
Admissions Team`,
        type: 'email',
        category: 'decision'
      },
      {
        id: 'rejection',
        name: 'Application Update',
        subject: 'Application Update - {{studentName}}',
        content: `Dear {{parentName}},

Thank you for your interest in our school and for submitting an application for {{studentName}}.

After careful consideration of all applications, we regret to inform you that we are unable to offer {{studentName}} a place for the {{academicYear}} academic year. This decision was particularly difficult given the high quality of applications we received.

We encourage you to apply again in the future, and we wish {{studentName}} all the best in their educational journey.

Thank you for considering our school.

Best regards,
Admissions Team`,
        type: 'email',
        category: 'decision'
      },
      {
        id: 'reminder_sms',
        name: 'Interview Reminder SMS',
        subject: '',
        content: `Hi {{parentName}}, this is a reminder that {{studentName}} has an interview scheduled for {{interviewDate}} at {{interviewTime}}. Please arrive 10 minutes early. Contact us if you need to reschedule.`,
        type: 'sms',
        category: 'interview'
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        subject: 'Payment Reminder - {{studentName}}',
        content: `Dear {{parentName}},

This is a friendly reminder that the application fee for {{studentName}} is still pending.

Amount Due: {{amount}}
Due Date: {{dueDate}}
Payment Reference: {{paymentReference}}

Please complete your payment to proceed with the application process.

Best regards,
Admissions Team`,
        type: 'both',
        category: 'general'
      }
    ];

    setTemplates(defaultTemplates);
  };

  const filterRecipients = () => {
    let filtered = recipients;
    
    if (filterStatus !== 'all') {
      filtered = recipients.filter(r => r.status === filterStatus);
    }

    setFilteredRecipients(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    const updated = filteredRecipients.map(r => ({ ...r, selected: checked }));
    setFilteredRecipients(updated);
    
    // Update the main recipients array
    const updatedRecipients = recipients.map(r => {
      const filtered = updated.find(fr => fr.id === r.id);
      return filtered ? filtered : r;
    });
    setRecipients(updatedRecipients);
  };

  const handleSelectRecipient = (id: string, checked: boolean) => {
    const updated = filteredRecipients.map(r => 
      r.id === id ? { ...r, selected: checked } : r
    );
    setFilteredRecipients(updated);

    // Update the main recipients array
    const updatedRecipients = recipients.map(r => 
      r.id === id ? { ...r, selected: checked } : r
    );
    setRecipients(updatedRecipients);
  };

  const handleTemplateSelect = (template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setMessage(template.content);
    setCommunicationType(template.type);
  };

  const replaceVariables = (text: string, recipient: Recipient, application?: any) => {
    return text
      .replace(/{{parentName}}/g, recipient.name)
      .replace(/{{studentName}}/g, recipient.studentName)
      .replace(/{{applicationId}}/g, recipient.id)
      .replace(/{{classApplyingFor}}/g, application?.student?.classApplyingFor || 'N/A')
      .replace(/{{academicYear}}/g, '2024/2025')
      .replace(/{{interviewDate}}/g, 'TBD')
      .replace(/{{interviewTime}}/g, 'TBD')
      .replace(/{{interviewLocation}}/g, 'School Office')
      .replace(/{{interviewer}}/g, 'Admissions Team')
      .replace(/{{acceptanceDeadline}}/g, 'Two weeks from today')
      .replace(/{{startDate}}/g, 'September 2024')
      .replace(/{{amount}}/g, '₦50,000')
      .replace(/{{dueDate}}/g, 'Within 7 days')
      .replace(/{{paymentReference}}/g, recipient.id);
  };

  const handleSendCommunication = async () => {
    const selectedRecipients = recipients.filter(r => r.selected);
    
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    if (!subject.trim() && communicationType !== 'sms') {
      alert('Please enter a subject');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSending(true);
    setSendingProgress(0);

    try {
      const total = selectedRecipients.length;
      let sent = 0;

      for (const recipient of selectedRecipients) {
        const personalizedSubject = replaceVariables(subject, recipient);
        const personalizedMessage = replaceVariables(message, recipient);

        // Send email
        if (communicationType === 'email' || communicationType === 'both') {
          await supabase.functions.invoke('send-bulk-email', {
            body: {
              to: recipient.email,
              subject: personalizedSubject,
              content: personalizedMessage,
              schoolId
            }
          });
        }

        // Send SMS
        if (communicationType === 'sms' || communicationType === 'both') {
          await supabase.functions.invoke('send-bulk-sms', {
            body: {
              to: recipient.phone,
              message: personalizedMessage,
              schoolId
            }
          });
        }

        sent++;
        setSendingProgress((sent / total) * 100);

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Log the communication
      await supabase.from('communication_logs').insert([{
        id: `comm_${Date.now()}`,
        school_id: schoolId,
        type: communicationType,
        subject: subject,
        message: message,
        recipient_count: selectedRecipients.length,
        sent_at: new Date().toISOString()
      }]);

      alert(`Successfully sent ${communicationType} to ${selectedRecipients.length} recipients`);
      
      // Reset form
      setSubject('');
      setMessage('');
      setSelectedTemplate(null);
      handleSelectAll(false);
      
    } catch (error) {
      console.error('Error sending communication:', error);
      alert('Failed to send communication. Please try again.');
    } finally {
      setSending(false);
      setSendingProgress(0);
    }
  };

  const selectedCount = recipients.filter(r => r.selected).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Communications" size="xl">
      <div className="p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'compose', name: 'Compose', icon: '✉️' },
              { id: 'templates', name: 'Templates', icon: '📝' },
              { id: 'history', name: 'History', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

        {activeTab === 'compose' && (
          <div className="space-y-6">
            {/* Communication Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Communication Type</label>
              <div className="flex space-x-4">
                {[
                  { value: 'email', label: 'Email Only', icon: '📧' },
                  { value: 'sms', label: 'SMS Only', icon: '📱' },
                  { value: 'both', label: 'Email + SMS', icon: '📧📱' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setCommunicationType(type.value as any)}
                    className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
                      communicationType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Use Template (Optional)</label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) handleTemplateSelect(template);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a template...</option>
                {templates
                  .filter(t => t.type === communicationType || t.type === 'both' || communicationType === 'both')
                  .map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
              </select>
            </div>

            {/* Subject (for email) */}
            {(communicationType === 'email' || communicationType === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject..."
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message {communicationType === 'sms' && '(SMS - 160 characters max)'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={communicationType === 'sms' ? 4 : 8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={communicationType === 'sms' ? 'Enter SMS message...' : 'Enter email message...'}
                maxLength={communicationType === 'sms' ? 160 : undefined}
              />
              {communicationType === 'sms' && (
                <div className="text-sm text-gray-500 mt-1">
                  {message.length}/160 characters
                </div>
              )}
            </div>

            {/* Variable Helper */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Available Variables</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><code>{'{{parentName}}'}</code> - Parent's name</p>
                <p><code>{'{{studentName}}'}</code> - Student's name</p>
                <p><code>{'{{applicationId}}'}</code> - Application ID</p>
                <p><code>{'{{classApplyingFor}}'}</code> - Class applied for</p>
                <p><code>{'{{academicYear}}'}</code> - Academic year</p>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">Recipients</label>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span className="text-sm text-gray-600">
                    {selectedCount} of {filteredRecipients.length} selected
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filteredRecipients.length > 0 && filteredRecipients.every(r => r.selected)}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="mr-3"
                    />
                    <span className="font-medium">Select All</span>
                  </label>
                </div>
                {filteredRecipients.map((recipient) => (
                  <div key={recipient.id} className="p-3 border-b border-gray-100 last:border-b-0">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={recipient.selected}
                        onChange={(e) => handleSelectRecipient(recipient.id, e.target.checked)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-600">
                          Student: {recipient.studentName} | Status: {recipient.status}
                        </div>
                        <div className="text-sm text-gray-500">
                          {recipient.email} | {recipient.phone}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sending Progress */}
            {sending && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Sending...</span>
                  <span className="text-sm">{Math.round(sendingProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sendingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSendCommunication}
                disabled={sending || selectedCount === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>
                  {sending 
                    ? 'Sending...' 
                    : `Send to ${selectedCount} recipient${selectedCount !== 1 ? 's' : ''}`
                  }
                </span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Communication Templates</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Create Template
              </button>
            </div>
            
            <div className="grid gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="capitalize">{template.type}</span>
                        <span>•</span>
                        <span className="capitalize">{template.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Use Template
                    </button>
                  </div>
                  {template.subject && (
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Communication History</h3>
            <div className="text-center py-8 text-gray-500">
              <p>Communication history will appear here</p>
              <p className="text-sm">Send your first bulk communication to see the history</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkCommunications;
