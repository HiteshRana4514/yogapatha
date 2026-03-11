import React from 'react';
import { Link } from 'react-router-dom';
const EmailConfirmed = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdfcf3] p-4 sm:p-6">
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">

        <h1 className="text-3xl font-bold text-[#336b6e] mb-4">
          Email Confirmed!
        </h1>

        <p className="text-gray-700 mb-8 text-lg">
          Thank you for confirming your email. You can now log in and start your YogaPatha journey.
        </p>

        <Link
          to="/trainer_login"
          className="inline-block w-full sm:w-auto px-8 py-3 bg-[#336b6e] text-white font-semibold rounded-lg shadow-md hover:bg-[#2a5a5c] transition-all duration-300 transform hover:-translate-y-1"
        >
          Go to Login
        </Link>
      </div>

      <footer className="mt-8 text-sm text-[#bb9f58]">
        &copy; 2025 YogaPatha. All rights reserved.
      </footer>
    </div>
  );
};

export default EmailConfirmed;
