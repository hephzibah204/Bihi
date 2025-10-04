import React, { PropsWithChildren } from 'react';
import { MenuItem } from '../types';

interface PublicLayoutProps {
    onNavigate?: (view: string | null) => void;
    menuItems?: MenuItem[];
}

const PublicLayout = ({ children, onNavigate, menuItems }: PropsWithChildren<PublicLayoutProps>) => {
    
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        if (onNavigate && url.startsWith('?view=')) {
            e.preventDefault();
            onNavigate(url.replace('?view=', ''));
        }
    };
    
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
                    <nav className="flex items-center space-x-6">
                        {menuItems?.map(item => (
                             <a key={item.id} href={item.url} onClick={(e) => handleLinkClick(e, item.url)} className="text-gray-600 hover:text-indigo-600 font-medium">{item.label}</a>
                        ))}
                         <a href="/" onClick={handleBackToHome} className="btn btn-secondary">Back to Main Site</a>
                    </nav>
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