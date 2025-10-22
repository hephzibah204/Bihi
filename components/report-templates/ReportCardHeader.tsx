import React from 'react';

const ReportCardHeader = ({ settings }) => {
  const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
  return (
    <div className="mb-6">
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 to-violet-500 print:bg-indigo-600 rounded-full" />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={settings.schoolLogo || defaultLogo}
            alt="School Logo"
            className="w-16 h-16 rounded-full ring-2 ring-indigo-500"
          />
          <div className="hidden md:flex flex-col text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">Student Report Card</span>
          </div>
        </div>
        <div className="flex-1 text-center px-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-gray-900">
            {settings.schoolName}
          </h1>
          <p className="text-sm text-gray-600">{settings.schoolAddress}</p>
          {settings?.reportCardSettings?.schoolMotto && (
            <p className="text-xs text-gray-500 italic mt-1">"{settings.reportCardSettings.schoolMotto}"</p>
          )}
        </div>
        <div className="w-16" />
      </div>
    </div>
  );
};

export default ReportCardHeader;
