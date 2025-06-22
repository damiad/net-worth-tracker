import React from "react";

export const Select = (props) => (
  <select
    {...props}
    className={`block w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.className}`}
  >
    {props.children}
  </select>
);
