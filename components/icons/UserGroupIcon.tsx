import React from 'react';
import UsersGroupIcon from './UsersGroupIcon'; // Reuse existing UsersGroupIcon

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return <UsersGroupIcon {...props} />;
};

export default UserGroupIcon;
