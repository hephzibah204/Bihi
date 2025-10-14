import React, { useState, useEffect } from 'react';
import { apiGetTenants } from '../services/api';

const TenantSelector = () => {
    const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState('');

    useEffect(() => {
        const fetchTenants = async () => {
            setLoading(true);
            const tenantsData = await apiGetTenants();
            setTenants(tenantsData);
            if (tenantsData.length > 0) {
                setSelectedTenant(tenantsData[0].id);
            }
            setLoading(false);
        };
        fetchTenants();
    }, []);

    const handleSelect = (tenantId: string) => {
        setSelectedTenant(tenantId);
        // In a full implementation, this would trigger a data reload for the selected tenant context.
        const tenant = tenants.find(t => t.id === tenantId);
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `Switched to tenant: ${tenant?.name}. Data would be reloaded in a full app.` } }));
    }

    if (loading) return <div className="card p-4 text-center">Loading schools...</div>;

    return (
        <div className="card p-4">
            <h2 className="text-lg font-semibold">Select School Portal</h2>
            {tenants.length > 0 ? (
                <>
                    <select 
                        className="input-field mt-2"
                        value={selectedTenant}
                        onChange={(e) => handleSelect(e.target.value)}
                        aria-label="Select a school portal"
                    >
                        {tenants.map(tenant => (
                            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">This is a demo component and does not yet reload page data.</p>
                </>
            ) : (
                <p className="mt-2 text-gray-500">No school portals found.</p>
            )}
        </div>
    );
};

export default TenantSelector;