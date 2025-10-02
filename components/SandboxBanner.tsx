import React from 'react';

const SandboxBanner = () => {
    const handleExit = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        sessionStorage.removeItem('isDemoMode');
        window.location.href = '/'; // Redirect to the main landing page
    };

    return (
        <div className="bg-yellow-400 text-yellow-900 text-center p-3 font-semibold fixed top-0 w-full z-50">
            <p>
                You are in Demo Mode. Your changes will not be saved.
                <a href="/" onClick={handleExit} className="underline ml-4">Exit Demo</a>
            </p>
        </div>
    );
};

export default SandboxBanner;