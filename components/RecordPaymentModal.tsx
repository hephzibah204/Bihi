import React from 'react';
import Modal from './Modal';

const RecordPaymentModal = ({ isOpen, onClose, invoice }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Record Manual Payment">
            <div className="p-6">
                <p>Record a manual payment for this invoice.</p>
            </div>
        </Modal>
    );
};

export default RecordPaymentModal;
