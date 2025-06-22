import React from "react";
import { Loader } from "lucide-react";

export const Spinner = () => (
  <div className="flex justify-center items-center h-full min-h-screen">
    <Loader className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);
