import React, { useState, useEffect } from 'react';
// Fix: Correctly import DashboardView from the central types file, not from Sidebar.
import Sidebar from './Sidebar';
import { DashboardView } from '../types';
import Header from './Header';
import DashboardContent from './DashboardContent';
import SandboxBanner from './SandboxBanner';
import { DEMO_TENANT_ID, demoSchoolSettings, demoStudents, demoSubjects, demoScores, demoAttendance, demoBehavioralRecords, demoActivities, demoFees, demoScratchCards } from '../utils/demoData';
// Fix: Replaced non-existent `apiSaveActivities` with `updateActivities` to resolve the import error.
import { apiSaveSchoolSettings, apiSaveStudents, apiSaveSubjects, apiSaveScores, apiSaveAttendance, apiSaveBehavioralRecords, updateActivities, apiSaveFees, apiSaveScratchCards } from '../services/api';
import DemoRoleSelector from './DemoRoleSelector';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './ParentDashboard';
import TeacherDashboard from './TeacherDashboard';
import { TenantProvider } from '../contexts/TenantContext';
import { PlanFeaturesProvider } from '../contexts/PlanFeaturesContext';

const setupDemoData = async () => {
    console.log("Setting up demo environment...");
    try {
        await Promise.all([
            apiSaveSchoolSettings(demoSchoolSettings, DEMO_TENANT_ID),
            apiSaveStudents(demoStudents, DEMO_TENANT_ID),
            apiSaveSubjects(demoSubjects, DEMO_TENANT_ID),
            apiSaveScores(demoScores, DEMO_TENANT_ID),
            apiSaveAttendance(demoAttendance, DEMO_TENANT_ID),
            apiSaveBehavioralRecords(demoBehavioralRecords, DEMO_TENANT_ID),
            apiSaveFees(demoFees, DEMO_TENANT_ID),
            apiSaveScratchCards(demoScratchCards, DEMO_TENANT_ID),
            // Fix: Switched to `updateActivities` and passed a function to match its expected signature, as `apiSaveActivities` was not exported from the API service.
            updateActivities(() => demoActivities, DEMO_TENANT_ID)
        ]);
        console.log("Demo environment setup complete.");
    } catch (error) {
        console.error("Failed to set up demo data:", error);
    }
};

interface SelectedProfile {
  role: string;
  userId?: string;
}

const DemoPage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<DashboardView>('dashboard');
    const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
    // Fix: Add headerTitle state to dynamically update the header.
    const [headerTitle, setHeaderTitle] = useState('Dashboard');

    useEffect(() => {
        sessionStorage.setItem('isDemoMode', 'true');
        
        const initDemo = async () => {
            await setupDemoData();
            setLoading(false);
        };
        initDemo();

        return () => {
            sessionStorage.removeItem('isDemoMode');
        };
    }, []);

    // Fix: Add useEffect to update header title when activeView changes.
    useEffect(() => {
        const viewName = activeView.replace(/-/g, ' ');
        setHeaderTitle(viewName.charAt(0).toUpperCase() + viewName.slice(1));
    }, [activeView]);


    const handleDemoLogout = () => {
        window.location.href = window.location.pathname;
    };

    const handleViewChange = (view: DashboardView) => {
        setActiveView(view);
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">Preparing Demo...</div>;
    }

    if (!selectedProfile) {
        return <DemoRoleSelector onSelectProfile={setSelectedProfile} />;
    }

    // Render the correct dashboard based on the selected role
    switch (selectedProfile.role.toLowerCase()) {
        case 'student':
            return <StudentDashboard isDemo={true} onLogout={handleDemoLogout} demoUserId={selectedProfile.userId} />;
        case 'parent':
            return <ParentDashboard isDemo={true} onLogout={handleDemoLogout} demoUserId={selectedProfile.userId} />;
        case 'teacher':
            return <TeacherDashboard isDemo={true} onLogout={handleDemoLogout} />;
        case 'admin':
        default:
            return (
                <TenantProvider>
                    <PlanFeaturesProvider>
                        <SandboxBanner />
                        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 pt-12">
                            <Sidebar 
                                isSidebarOpen={isSidebarOpen} 
                                setSidebarOpen={setSidebarOpen} 
                                activeView={activeView}
                                setActiveView={handleViewChange}
                                userRole="Admin"
                            />
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Fix: Pass the missing 'title' prop to the Header component. */}
                                <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={handleDemoLogout} />
                                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                                    <div className="container mx-auto px-6 py-8">
                                        <DashboardContent activeView={activeView} setActiveView={handleViewChange} userRole="Admin" />
                                    </div>
                                </main>
                            </div>
                        </div>
                    </PlanFeaturesProvider>
                </TenantProvider>
            );
    }
};

export default DemoPage;