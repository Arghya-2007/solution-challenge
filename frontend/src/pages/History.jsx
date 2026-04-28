import React from 'react';

const History = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
      <div className="text-center space-y-6 p-10 rounded-3xl bg-white shadow-2xl border border-gray-100 max-w-lg w-full relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 blur-2xl opacity-70"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-gradient-to-tr from-purple-50 to-blue-50 blur-2xl opacity-70"></div>

        <div className="relative z-10 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 pb-2">
            Coming Soon
          </h1>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            We are crafting a premium history experience. Soon you will be able to track and review all your detailed audit records here.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100 mt-6 relative z-10">
          <span className="text-sm font-bold text-gray-400 tracking-[0.2em] uppercase">
            Audit History Module
          </span>
        </div>
      </div>
    </div>
  );
};

export default History;
