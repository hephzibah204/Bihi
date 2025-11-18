import React from 'react';
import { DashboardView } from '../types';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import RecentActivityWidget from './RecentActivityWidget';
import DashboardInsights from './DashboardInsights';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import SparklesIcon from './icons/SparklesIcon';
import { ADMIN_VIEWS } from '../utils/constants';
import PlanSelector from './PlanSelector';
import DataChampionsWidget from './DataChampionsWidget';
import AttendanceSnapshotWidget from './AttendanceSnapshotWidget';
import FinancialVitalsPro from './FinancialVitalsPro';
import IncomeExpenseTrendChart from './IncomeExpenseTrendChart';
import ExpenseCategoryBreakdown from './ExpenseCategoryBreakdown';
import TopDebtorsByClassAlt from './TopDebtorsByClassAlt';
import HighPriorityDebtorsWidget from './HighPriorityDebtorsWidget';
import FinancialQAWidget from './FinancialQAWidget';
import ClassPerformanceRanking from './ClassPerformanceRanking';
import SubjectHotColdChart from './SubjectHotColdChart';
import SchoolVitals from './SchoolVitals';
import AnalystQAWidget from './AnalystQAWidget';
import EarlyIntervention from './EarlyIntervention';
import IdleClassesAlertWidget from './IdleClassesAlertWidget';
import TeacherPerformanceWidget from './TeacherPerformanceWidget';

const DashboardHome = ({ setActiveView }: { setActiveView: (view: DashboardView) => void }) => {
    const { isSubscribed, planName, isLoading } = usePlanFeatures();

    const quickLinks = [
        { view: ADMIN_VIEWS.STUDENTS, title: "Manage Students", icon: <UsersIcon className="w-8 h-8"/>, description: "Add, edit, or import student records." },
        { view: ADMIN_VIEWS.RESULTS, title: "Enter Scores", icon: <ClipboardListIcon className="w-8 h-8"/>, description: "Input the latest CA and exam scores." },
        { view: ADMIN_VIEWS.REPORT_CARDS, title: "Generate Reports", icon: <DocumentArrowDownIcon className="w-8 h-8"/>, description: "Create and print report cards." },
        { view: ADMIN_VIEWS.PROMOTIONS, title: "Promote Students", icon: <GraduationCapIcon className="w-8 h-8"/>, description: "Move students to the next class." },
    ];

    const renderSubscriptionPrompt = () => (
        <>
            <div className="card bg-indigo-50 my-6">
                <div className="p-6 text-center">
                     <SparklesIcon className="w-12 h-12 mx-auto text-indigo-500" />
                     <h2 className="mt-4 text-xl font-semibold">Welcome to ReportSheet!</h2>
                     <p className="mt-2 text-gray-600">Your account is active. Subscribe to a plan to unlock all features and start managing your school like a pro.</p>
                </div>
            </div>
            <PlanSelector isSubscribed={isSubscribed} planName={planName} />
        </>
    );

    return (
        <div>
            {isSubscribed && <p className="mt-2 text-gray-600">Here are some quick actions to get you started.</p>}

            {isLoading ? (
                <div className="card mt-6 p-6 text-center">Loading...</div>
            ) : isSubscribed ? (
                <>
                    {/* Quick Actions at top */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                        {quickLinks.map(link => (
                            <button
                                key={link.view}
                                onClick={() => setActiveView(link.view as DashboardView)}
                                className="card p-6 text-center hover:shadow-lg hover:scale-105 transition-transform duration-200"
                            >
                                <div className="text-indigo-500 mx-auto w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full">
                                    {link.icon}
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">{link.title}</h3>
                                <p className="mt-1 text-sm text-gray-500">{link.description}</p>
                            </button>
                        ))}
                    </div>

                    {/* Recent Activity + Data Champions just below */}
                    <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 mt-6">
                        <RecentActivityWidget />
                        <DataChampionsWidget />
                    </div>

                    {/* Existing analytics below */}
                    <SchoolVitals />
                    <DashboardInsights />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <IdleClassesAlertWidget />
                        <TeacherPerformanceWidget />
                    </div>
                    <div className="mt-6">
                        <EarlyIntervention />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AttendanceSnapshotWidget />
                        <FinancialVitalsPro />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <IncomeExpenseTrendChart />
                        <ExpenseCategoryBreakdown />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopDebtorsByClassAlt />
                        <HighPriorityDebtorsWidget />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ClassPerformanceRanking onDrillDown={setActiveView} />
                        <SubjectHotColdChart onDrillDown={setActiveView} />
                    </div>
                    <div className="mt-6">
                        <AnalystQAWidget />
                    </div>
                    <div className="mt-6">
                        <FinancialQAWidget />
                    </div>
                </>
            ) : (
                renderSubscriptionPrompt()
            )}
        </div>
    );
};

export default DashboardHome;