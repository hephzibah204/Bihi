import React from 'react';
import Modal from './Modal';
import { Student } from '../types';

interface SelectChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    childrenList: Student[];
    onSelectChild: (student: Student) => void;
}

const SelectChildModal: React.FC<SelectChildModalProps> = ({ isOpen, onClose, childrenList, onSelectChild }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Child's Profile">
            <div className="p-6 space-y-4">
                <p>This account is linked to multiple students. Please select which child's portal you'd like to view.</p>
                {childrenList.map(child => (
                    <button 
                        key={child.id} 
                        onClick={() => onSelectChild(child)}
                        className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition"
                    >
                        <img 
                            src={child.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(child.name)}`} 
                            alt={child.name} 
                            className="w-12 h-12 rounded-full mr-4"
                        />
                        <div>
                            <p className="font-semibold text-lg text-left">{child.name}</p>
                            <p className="text-sm text-gray-500 text-left">{child.class}</p>
                        </div>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default SelectChildModal;