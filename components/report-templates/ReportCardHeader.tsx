import React from 'react';

const ReportCardHeader = ({ settings }) => {
  const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
  return (
    <div className="text-center mb-6">
      <img src={settings.schoolLogo || defaultLogo} alt="School Logo" className="w-20 h-20 mx-auto mb-2 rounded-full"/>
      <h1 className="text-3xl font-bold">{settings.schoolName}</h1>
      <p>{settings.schoolAddress}</p>
      <h2 className="text-xl font-semibold mt-2">Student Report Card</h2>
    </div>
  );
};

export default ReportCardHeader;
