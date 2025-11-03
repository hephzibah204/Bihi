import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './icons/Logo';

const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const onUp = () => setIsOnline(true);
    const onDown = () => setIsOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
    };
  }, []);

  const retry = () => {
    try {
      window.location.reload();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-2xl font-bold text-gray-800">ReportSheet</span>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6">
        <div className="text-center max-w-xl">
          <p className="text-sm font-semibold text-indigo-600">Error 404</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">Page not found</h1>
          <p className="mt-4 text-gray-600">We couldn’t find a page at <span className="font-mono">{location.pathname}</span>.</p>

          {!isOnline && (
            <div className="mt-6 p-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-left">
              <p className="font-semibold">You appear to be offline.</p>
              <p className="mt-1">Check your internet connection and try again.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn btn-primary px-6 py-2">Go to Home</Link>
            <Link to="/demo" className="btn btn-secondary px-6 py-2">Try Demo</Link>
            <Link to="/signin" className="btn btn-accent px-6 py-2">Sign In</Link>
            <button onClick={retry} className="btn px-6 py-2 border border-gray-300">Retry</button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>If this keeps happening, please contact support or your school admin.</p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ReportSheet by Hephzibah Edutech.</p>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;