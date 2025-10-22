import React from 'react';

const ReportCardHeader = ({ settings, term, session }) => {
  const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
  const logo = settings?.schoolLogo || defaultLogo;
  const motto = settings?.reportCardSettings?.schoolMotto;

  return (
    <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50 to-white shadow-xl print:bg-white print:shadow-none print:border-gray-200">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-100 opacity-60 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-indigo-100 opacity-40 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-6 px-6 py-8 sm:px-10 md:grid-cols-[auto,1fr] md:items-center">
        <div className="mx-auto md:mx-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-lg ring-4 ring-white">
            <img src={logo} alt="School Logo" className="h-20 w-20 object-contain" />
          </div>
        </div>
        <div className="text-center md:text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">Official Report Card</p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{settings?.schoolName || 'Your School Name'}</h1>
          {settings?.schoolAddress && <p className="text-sm text-gray-500">{settings.schoolAddress}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {session && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                {session} Session
              </span>
            )}
            {term && (
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm ring-1 ring-indigo-700/40 print:bg-gray-800">
                {term} Term
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-indigo-700 italic">
            {motto || 'Nurturing brilliance, character & confidence.'}
          </p>
        </div>
      </div>
    </header>
  );
};

export default ReportCardHeader;
