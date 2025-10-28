import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-10 h-10',
    };

    return (
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-t-purple-500 border-gray-200 dark:border-gray-600`} role="status">
            <span className="sr-only">Loading...</span>
        </div>
    );
};
