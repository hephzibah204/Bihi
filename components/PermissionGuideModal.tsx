import React from 'react';
import Modal from './Modal';

interface PermissionGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    permissionName: 'camera' | 'microphone';
}

const PermissionGuideModal: React.FC<PermissionGuideModalProps> = ({ isOpen, onClose, permissionName }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Enable ${permissionName}`}>
            <div className="p-6">
                <p>To use this feature, you need to grant {permissionName} access in your browser.</p>
                <p className="mt-2">Please click "Allow" when your browser prompts you.</p>
            </div>
        </Modal>
    );
};

export default PermissionGuideModal;
