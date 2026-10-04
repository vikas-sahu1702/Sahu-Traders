import React from 'react';
import { getStatusBadgeClass } from '../../utils/helpers';

const Badge = ({ text, type }) => {
  const classes = type ? getStatusBadgeClass(type) : getStatusBadgeClass(text);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${classes}`}>
      {text}
    </span>
  );
};

export default Badge;
