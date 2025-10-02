import React, { PropsWithChildren } from 'react';

interface PublicLayoutProps {
    onNavigate?: (view: string | null) => void;
}

const PublicLayout = ({ children, onNavigate }: PropsWithChildren<PublicLayoutProps>) => {
    
    const handleBackToHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onNavigate) {
            e.preventDefault();
            onNavigate(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="/" onClick={handleBackToHome} className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">ReportSheet</a>
                    <a href="/" onClick={handleBackToHome} className="hover:text-indigo-600">Back to Main Site</a>
                </div>
            </header>
            <main className="container mx-auto px-6 py-12">
                {children}
            </main>
            <footer className="bg-gray-800 dark:bg-black text-white">
                 <div className="container mx-auto px-6 py-8 text-center">
                    <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;