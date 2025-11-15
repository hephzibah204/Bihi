import React, { PropsWithChildren } from 'react';

interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Card: React.FC<PropsWithChildren<CardProps>> = ({ header, footer, className, children }) => {
  return (
    <div className={`card ${className || ''}`}>
      {header && <div className="px-5 pt-5"><div className="text-base font-semibold">{header}</div></div>}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 pb-5">{footer}</div>}
    </div>
  );
};

export default Card;
