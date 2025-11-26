import React from 'react';
import ExclamationTriangleIcon from '../icons/ExclamationTriangleIcon';

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  action,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            {action && <p className="mt-1 text-xs">{action}</p>}
          </div>
          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                className="text-sm font-medium text-red-800 hover:text-red-900"
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
