import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

/**
 * A reusable popup modal component that informs the user to check their email.
 * It is controlled by the `isVisible` prop and can be closed via the `onClose` prop.
 *
 * @param {object} props
 * @param {boolean} props.isVisible - Controls whether the popup is shown or hidden.
 * @param {function} props.onClose - A function to call when the popup should be closed.
 */
const ConfirmationPopup = ({ isVisible, onClose }) => {
  // If not visible, render nothing
  if (!isVisible) {
    return null;
  }

  return (
    // Main overlay: fixed position, covers the screen, with a semi-transparent background
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Popup container: relative position for the close button, with themed background */}
      <div className="relative bg-[#fdfcf3] rounded-xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-200">

        {/* Close (cross) icon button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#336b6e] hover:text-[#bb9f58] transition-colors duration-300 focus:outline-none"
          aria-label="Close popup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Envelope Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#336b6e] bg-opacity-10 mb-5">
          {/* <svg className="h-8 w-8 text-[#336b6e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg> */}
          <Mail className="h-8 w-8 text-white" />
        </div>

        {/* Header text */}
        <h2 className="text-2xl font-bold text-[#336b6e] mb-4">Check Your Email</h2>

        {/* Informative message */}
        <p className="text-gray-700 mb-8">
          We've sent a confirmation link to your email. Please click the link to activate your account.
        </p>

        {/* Action buttons container */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* <button
            onClick={onClose}
            className="px-6 py-3 bg-[#336b6e] text-white font-semibold rounded-lg shadow-md hover:bg-[#2a5a5c] transition-all duration-300">Ok</button> */}
          <Link
            to="/trainer_login"
            onClick={onClose}
            className="px-6 py-3 bg-[#336b6e] text-white font-semibold rounded-lg shadow-md hover:bg-[#2a5a5c] transition-all duration-300"
          >
            Go to Login
          </Link>
          <Link
            to="/"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-[#bb9f58] text-[#bb9f58] font-semibold rounded-lg shadow-md hover:bg-[#bb9f58] hover:text-white transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
