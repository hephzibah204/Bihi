import React from 'react';
import Modal from './Modal';
import BookOpenIcon from './icons/BookOpenIcon';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import { ADMIN_VIEWS } from '../utils/constants';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    onNavigate: (view: string) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onComplete, onNavigate }) => {
    
    const checklistItems = [
        { view: ADMIN_VIEWS.SUBJECTS, icon: <BookOpenIcon className="w-6 h-6"/>, title: 'Set Up Subjects', description: 'Define the subjects taught in your school.' },
        { view: ADMIN_VIEWS.STUDENTS, icon: <UsersIcon className="w-6 h-6"/>, title: 'Add Your Students', description: 'Import or manually add your student records.' },
        // Fix: Changed ADMIN_VIEWS.TEACHERS to ADMIN_VIEWS.STAFF which is the correct key.
        { view: ADMIN_VIEWS.STAFF, icon: <BriefcaseIcon className="w-6 h-6"/>, title: 'Invite Teachers', description: 'Add your teachers and other staff members.' },
        { view: ADMIN_VIEWS.RESULTS, icon: <ClipboardListIcon className="w-6 h-6"/>, title: 'Enter First Scores', description: 'Start inputting scores for the current term.' },
        { view: ADMIN_VIEWS.REPORT_CARDS, icon: <DocumentArrowDownIcon className="w-6 h-6"/>, title: 'Preview a Report Card', description: 'See how easy it is to generate reports.' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Welcome to ReportSheet!">
            <div className="p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Let's Get Your School Set Up</h2>
                    <p className="mt-2 text-gray-600">
                        Follow these simple steps to get started. You can always find these options in the sidebar.
                    </p>
                </div>
                
                <div className="mt-6 space-y-3">
                    {checklistItems.map(item => (
                        <button 
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 transition-colors flex items-center space-x-4"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                {item.icon}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">{item.title}</h4>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button onClick={onClose} className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                        Skip for now
                    </button>
                    <button onClick={onComplete} className="btn btn-primary">
                        Start Exploring
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default WelcomeModal;
