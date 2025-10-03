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
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="/" onClick={handleBackToHome} className="text-2xl font-bold text-indigo-600">ReportSheet</a>
                    <a href="/" onClick={handleBackToHome} className="hover:text-indigo-600">Back to Main Site</a>
                </div>
            </header>
            <main className="container mx-auto px-6 py-12">
                {children}
            </main>
            <footer className="bg-gray-800 text-white">
                 <div className="container mx-auto px-6 py-8 text-center">
                    <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;