import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

const WhatsAppFloatingButton = ({ 
  phoneNumber, 
  message = "Hello! I'm interested in your services.", 
  companyName = "Support" 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
      >
        {/* Main Button - Removed tooltip code */}
        <motion.button
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {/* Pulse Animation Background */}
          <motion.div
            className="absolute inset-0 bg-[#25D366] rounded-full opacity-20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* WhatsApp Icon */}
          <MessageCircle size={28} className="relative z-10" />
          
          {/* Online Status Dot */}
          <motion.div 
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Chat Preview (Optional - you can also remove this if not needed) */}
      {isHovered && (
        <motion.div
          className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{companyName}</h4>
              <p className="text-xs text-green-500">● Online</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">Hi there! 👋</p>
          <p className="text-sm text-gray-600">How can we help you today?</p>
        </motion.div>
      )}
    </>
  );
};

export default WhatsAppFloatingButton;
