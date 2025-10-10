import React, { useState, useEffect } from 'react';
import { apiGetInvoices, apiGetPayments } from '../services/api';
import StatCard from './StatCard';
import BanknotesIcon from './icons/BanknotesIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';
import StatCardSkeleton from './skeletons/StatCardSkeleton';

const BursaryDashboard = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, totalOutstanding: 0, paymentsPending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [invoices, payments] = await Promise.all([
                    apiGetInvoices(),
                    apiGetPayments()
                ]);

                const totalRevenue = payments
                    .filter(p => p.status === 'verified')
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalOutstanding = invoices
                    .filter(inv => inv.status !== 'paid')
                    .reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);

                const paymentsPending = payments.filter(p => p.status === 'pending').length;

                setStats({ totalRevenue, totalOutstanding, paymentsPending });
            } catch (error) {
                console.error("Failed to load bursary stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
                title="Total Revenue (Verified)"
                value={`₦${stats.totalRevenue.toLocaleString()}`}
                icon={<BanknotesIcon className="w-6 h-6" />}
                trend={{ value: '12%', direction: 'up' }}
            />
            <StatCard
                title="Total Outstanding"
                value={`₦${stats.totalOutstanding.toLocaleString()}`}
                icon={<BanknotesIcon className="w-6 h-6" />}
                trend={{ value: '3%', direction: 'down' }}
            />
            <StatCard
                title="Payments Pending Verification"
                value={stats.paymentsPending}
                icon={<BanknotesIcon className="w-6 h-6" />}
                trend={null}
            />
        </div>
    );
};

export default BursaryDashboard;
