import React from 'react';
import BeakerIcon from './BeakerIcon'; // Reuse existing BeakerIcon

const ScienceIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return <BeakerIcon {...props} />;
};

export default ScienceIcon;
