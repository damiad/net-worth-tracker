import React from "react";

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={`pb-4 border-b dark:border-gray-700 mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
  >
    {children}
  </h3>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}>
    {children}
  </div>
);
