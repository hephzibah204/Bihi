import React from 'react';

interface EmptyStateProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, actionText, onAction }) => {
  return (
    <div className="text-center p-8 border-2 border-dashed rounded-lg">
      <p className="text-gray-500">{message}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="mt-4 btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;