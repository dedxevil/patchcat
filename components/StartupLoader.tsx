
import React from 'react';

const StartupLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#1c1c1c] text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#3ecf8e]"></div>
      <h1 className="text-2xl font-semibold mt-6 tracking-wider">Patchcat</h1>
      <p className="text-lg text-gray-400 mt-2">Syncing your tests...</p>
    </div>
  );
};

export default StartupLoader;
