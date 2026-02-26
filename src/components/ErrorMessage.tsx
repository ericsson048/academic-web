/**
 * ErrorMessage component for displaying user-friendly error messages.
 * Used throughout the app to show API errors, validation errors, etc.
 */
import { ReactNode } from 'react';

interface ErrorMessageProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
}

export function ErrorMessage({
  message = 'An error occurred',
  title = 'Error',
  onRetry,
  children,
  className = '',
}: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-1 text-sm text-red-700">
            {children || <p>{message}</p>}
          </div>
          
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ValidationErrors component for displaying field-level validation errors.
 * Typically used with form submissions.
 */
interface ValidationErrorsProps {
  errors: Record<string, string[]> | Record<string, string>;
  className?: string;
}

export function ValidationErrors({ errors, className = '' }: ValidationErrorsProps) {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Please correct the following errors:
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {errorEntries.map(([field, messages]) => {
              const fieldName = field === 'non_field_errors' ? '' : `${field}: `;
              const errorMessages = Array.isArray(messages) ? messages : [messages];
              
              return errorMessages.map((msg, idx) => (
                <li key={`${field}-${idx}`}>
                  {fieldName}{msg}
                </li>
              ));
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * NetworkError component for displaying network/connection errors.
 */
interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className = '' }: NetworkErrorProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Connection Error</h3>
          <p className="mt-1 text-sm text-yellow-700">
            Unable to connect to the server. Please check your internet connection.
          </p>
          
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Retry connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InlineFieldError component for displaying validation errors next to form fields.
 */
interface InlineFieldErrorProps {
  error?: string | string[];
  className?: string;
}

export function InlineFieldError({ error, className = '' }: InlineFieldErrorProps) {
  if (!error) {
    return null;
  }

  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {errorMessage}
    </p>
  );
}
