import React from 'react';
import { SchoolSettings } from '../types';

interface ManualBankSettingsProps {
  settings: Partial<SchoolSettings>;
  onSettingsChange: (changed: Partial<SchoolSettings>) => void;
}

const ManualBankSettings: React.FC<ManualBankSettingsProps> = ({ settings, onSettingsChange }) => {
  const integrations = settings.integrations || {};

  const handleIntegrationChange = (field: string, value: string) => {
    onSettingsChange({
      integrations: {
        ...integrations,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold flex items-center gap-2">
          <span className="text-indigo-600">🏦</span> Manual Bank Payments
        </h4>
        <p className="text-sm text-gray-500 mt-1">
          Configure your school’s bank details for parents who prefer paying via bank transfer or deposit.
          These instructions will show on the Parent Fees page and on receipt footers.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Bank Name</label>
            <input
              type="text"
              className="input-field"
              value={integrations.manual_bank_name || ''}
              onChange={(e) => handleIntegrationChange('manual_bank_name', e.target.value)}
              placeholder="e.g., Zenith Bank"
            />
          </div>
          <div>
            <label className="label">Account Name</label>
            <input
              type="text"
              className="input-field"
              value={integrations.manual_bank_account_name || ''}
              onChange={(e) => handleIntegrationChange('manual_bank_account_name', e.target.value)}
              placeholder="e.g., Dossier College"
            />
          </div>
          <div>
            <label className="label">Account Number</label>
            <input
              type="text"
              className="input-field"
              value={integrations.manual_bank_account_number || ''}
              onChange={(e) => handleIntegrationChange('manual_bank_account_number', e.target.value)}
              placeholder="e.g., 0123456789"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Payment Instructions</label>
            <textarea
              className="input-field"
              rows={4}
              value={integrations.manual_payment_instructions || ''}
              onChange={(e) => handleIntegrationChange('manual_payment_instructions', e.target.value)}
              placeholder={"Include Student ID and Name in transfer narration. Upload proof on the Parent Fees page or email bursary@your-school.edu."}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualBankSettings;