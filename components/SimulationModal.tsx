import React from 'react';
import Modal from './Modal';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, title, url }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="full">
      <div className="p-4 h-[75vh]">
        <iframe
          src={url}
          title={title}
          className="w-full h-full rounded-lg border"
          allow="fullscreen"
        />
      </div>
    </Modal>
  );
};

export default SimulationModal;