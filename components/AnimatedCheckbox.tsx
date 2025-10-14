import React, { useId } from 'react';

interface AnimatedCheckboxProps {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id?: string;
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({ checked, onChange, id }) => {
    // A hidden input for accessibility and form functionality.
    const internalId = id || useId();

    // The wrapper div is important for consistent sizing and alignment
    return (
        <div className="inline-flex items-center justify-center" style={{ width: '1.25rem', height: '1.25rem' }}>
             <input 
                type="checkbox" 
                id={internalId}
                className="sr-only" // screen-reader only
                checked={checked}
                onChange={onChange}
            />
            <label
                htmlFor={internalId}
                className={`animated-checkbox ${checked ? 'checked' : ''}`}
                aria-hidden="true"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path className="checkmark__path" d="M5 13l4 4L19 7" />
                </svg>
            </label>
        </div>
    );
};

export default AnimatedCheckbox;
