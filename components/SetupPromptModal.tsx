import React from 'react';
import Modal from './Modal';

interface SetupPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName: string;
    onGoToSettings: () => void;
}

const SetupPromptModal: React.FC<SetupPromptModalProps> = ({ isOpen, onClose, serviceName, onGoToSettings }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Setup Required: ${serviceName}`}>
            <div className="p-6">
                <p>To use this feature, you first need to configure the {serviceName}.</p>
                <p className="mt-2">Please go to the settings page to enter your API credentials.</p>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={onGoToSettings} className="btn btn-primary">Go to Settings</button>
                </div>
            </div>
        </Modal>
    );
};

export default SetupPromptModal;