

import React, { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '../types';

interface PublicLayoutProps {
    menuItems?: MenuItem[];
}

const PublicLayout = ({ children, menuItems }: PropsWithChildren<PublicLayoutProps>) => {
    
    const getLinkPath = (url: string) => {
        if (!url) return '/';
        if (url.startsWith('?view=')) {
            return `/${url.replace('?view=', '')}`;
        }
        return url;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-indigo-600">ReportSheet</Link>
                    <nav className="flex items-center space-x-6">
                        {menuItems?.map(item => (
                             <Link key={item.id} to={getLinkPath(item.url)} className="text-gray-600 hover:text-indigo-600 font-medium">{item.label}</Link>
                        ))}
                         <Link to="/" className="btn btn-secondary">Back to Main Site</Link>
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
