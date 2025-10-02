import React, { useState, PropsWithChildren, ReactNode } from 'react';
import BursaryFees from './BursaryFees';
import BursaryInvoice from './BursaryInvoice';
import BursaryScratchCards from './BursaryScratchCards';

type BursaryView = 'fees' | 'invoice' | 'scratch_cards';

const Bursary = () => {
    const [activeView, setActiveView] = useState<BursaryView>('fees');

    const renderView = () => {
        switch(activeView) {
            case 'fees': return <BursaryFees />;
            case 'invoice': return <BursaryInvoice />;
            case 'scratch_cards': return <BursaryScratchCards />;
            default: return <BursaryFees />;
        }
    };

    // Fix: Updated NavButton to use PropsWithChildren for robust typing of children.
    interface NavButtonProps {
        view: BursaryView;
    }

    const NavButton = ({ view, children }: PropsWithChildren<NavButtonProps>) => {
        const isActive = activeView === view;
        const activeClasses = 'bg-indigo-600 text-white';
        const inactiveClasses = 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600';
        return (
            <button
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 font-semibold rounded-md shadow-sm transition-colors ${isActive ? activeClasses : inactiveClasses}`}
            >
                {children}
            </button>
        );
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Bursary / Finance</h1>
            <div className="mt-6 flex space-x-2 border-b dark:border-gray-700 pb-4">
                <NavButton view="fees">School Fees</NavButton>
                <NavButton view="invoice">Student Invoice</NavButton>
                <NavButton view="scratch_cards">Scratch Cards</NavButton>
            </div>
            <div className="mt-6">
                {renderView()}
            </div>
        </div>
    );
};

export default Bursary;