import React, { useEffect, useState } from 'react';
import { apiGetTenants, apiGetPlatformSettings } from '../../services/api';
import SubscriptionManagementModal from '../SubscriptionManagementModal';
import { Tenant, Plan } from '../../types';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

const LicenseManager: React.FC = () => {
  const { can } = usePlatformPermission();
  const canManagePlatformSettings = can('manage_platform_settings');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantData, settingsData] = await Promise.all([
        apiGetTenants(),
        apiGetPlatformSettings()
      ]);
      setTenants(tenantData || []);
      setPlans(settingsData?.plans || []);
    } catch (e) {
      console.error('Failed to load license data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getPlanName = (planId?: string) => {
    if (!planId) return 'Unsubscribed';
    return plans.find(p => p.id === planId)?.name || 'Unknown Plan';
  };

  const openManageModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTenant(null);
    fetchData();
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-slate-800">License Manager</h2>
        <input
          className="input-field w-64"
          placeholder="Search tenants..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </div>

      {!canManagePlatformSettings && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          You have read-only access to licenses (missing manage_platform_settings).
        </div>
      )}

      {loading ? (
        <div className="p-6">Loading tenants...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Tenant</th>
                <th className="th">Plan</th>
                <th className="th">Status</th>
                <th className="th">Expiry</th>
                <th className="th">Trial End</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(tenant => (
                <tr key={tenant.id}>
                  <td className="td">{tenant.name}</td>
                  <td className="td">{getPlanName(tenant.planId)}</td>
                  <td className="td capitalize">{tenant.subscriptionStatus || 'unsubscribed'}</td>
                  <td className="td">{tenant.subscriptionExpiryDate ? new Date(tenant.subscriptionExpiryDate).toLocaleDateString() : '-'}</td>
                  <td className="td">{tenant.trialEndDate ? new Date(tenant.trialEndDate).toLocaleDateString() : '-'}</td>
                  <td className="td">
                    <button className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => canManagePlatformSettings ? openManageModal(tenant) : alert('You do not have permission to manage platform settings.')} disabled={!canManagePlatformSettings}>Manage</button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr><td className="td" colSpan={6}>No tenants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTenant && (
        <SubscriptionManagementModal isOpen={isModalOpen} onClose={closeModal} tenant={selectedTenant} />
      )}
    </div>
  );
};

export default LicenseManager;