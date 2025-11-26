import React from 'react';
import CheckCircleIcon from '../icons/CheckCircleIcon';

interface SuccessMessageProps {
  title?: string;
  message: string;
  className?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title = 'Success',
  message,
  className = ''
}) => {
  return (
    <div className={`rounded-md bg-green-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">{title}</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;
