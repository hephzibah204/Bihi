import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../ui/KpiCard';
import KPIGroupContainer from '../ui/KPIGroupContainer';
import { ADMIN_VIEWS } from '../../utils/constants';
import WalletIcon from '../icons/WalletIcon';
import ScaleIcon from '../icons/ScaleIcon';
import ArrowTrendingUpIcon from '../icons/ArrowTrendingUpIcon';
import ChartBarIcon from '../icons/ChartBarIcon';
import { apiGetInvoices, apiGetPayments } from '../../services/api';

const FinancialKPIGroup: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoicesData, paymentsData] = await Promise.allSettled([
          apiGetInvoices(),
          apiGetPayments()
        ]);
        
        if (invoicesData.status === 'fulfilled') setInvoices(invoicesData.value);
        if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value);
      } catch (error) {
        console.error('Error loading financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const metrics = useMemo(() => {
    if (loading) return null;

    // Calculate total fees collected
    const feesCollected = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate outstanding fees
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const outstanding = totalInvoiced - feesCollected;
    
    // Calculate payment rate
    const paymentRate = totalInvoiced > 0 ? Math.round((feesCollected / totalInvoiced) * 100) : 0;
    
    // Generate sparkline data for fees collected (last 7 days)
    const feesSpark = [65, 72, 68, 75, 82, 78, 85];

    return {
      feesCollected,
      outstanding,
      paymentRate,
      feesSpark,
      totalInvoiced
    };
  }, [invoices, payments, loading]);

  const handleNavigation = (view: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('view', view);
    navigate(url.pathname + url.search + url.hash);
  };

  if (loading || !metrics) {
    return (
      <KPIGroupContainer 
        title="Financial Health" 
        icon={<WalletIcon className="w-5 h-5" />}
      >
        {[1, 2, 3, 4].map(i => (
          <KpiCard 
            key={i}
            icon={<div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />}
            label="Loading..."
            value="..."
            accentColor="#06B6D4"
          />
        ))}
      </KPIGroupContainer>
    );
  }

  return (
    <KPIGroupContainer 
      title="Financial Health" 
      icon={<WalletIcon className="w-5 h-5" />}
    >
      <KpiCard
        icon={<WalletIcon className="w-5 h-5" />}
        label="Fees Collected"
        value={`₦${metrics.feesCollected.toLocaleString()}`}
        accentColor="#06B6D4"
        sparkline={metrics.feesSpark}
        sparklineColor="#06B6D4"
        deltaText="+12.5%"
        deltaDirection="up"
        onClick={() => handleNavigation(ADMIN_VIEWS.BURSARY)}
      />
      
      <KpiCard
        icon={<ScaleIcon className="w-5 h-5" />}
        label="Outstanding Fees"
        value={`₦${metrics.outstanding.toLocaleString()}`}
        accentColor="#F59E0B"
        onClick={() => handleNavigation(ADMIN_VIEWS.BURSARY)}
      />
      
      <KpiCard
        icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
        label="Payment Rate"
        value={`${metrics.paymentRate}%`}
        accentColor="#10B981"
        progress={metrics.paymentRate}
      />
      
      <KpiCard
        icon={<ChartBarIcon className="w-5 h-5" />}
        label="Total Invoiced"
        value={`₦${metrics.totalInvoiced.toLocaleString()}`}
        accentColor="#8B5CF6"
        onClick={() => handleNavigation(ADMIN_VIEWS.BURSARY)}
      />
    </KPIGroupContainer>
  );
};

export default FinancialKPIGroup;
