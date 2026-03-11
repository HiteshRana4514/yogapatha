import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-[#fdfcf3] flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            {/* Decorative Background Elements */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-1/4 -left-20 w-64 h-64 bg-[#336b6e]/5 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    rotate: -360,
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#bb9f58]/5 rounded-full blur-3xl"
            />

            {/* Main Content */}
            <div className="relative z-10 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-[#336b6e] rounded-full mb-8 shadow-xl">
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Compass className="w-12 h-12 text-[#fdfcf3]" />
                        </motion.div>
                    </div>

                    <h1 className="text-8xl md:text-9xl font-bold text-[#336b6e] mb-2 tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-semibold text-[#336b6e] mb-6">
                        Off the Yoga Path
                    </h2>

                    <p className="text-[#336b6e]/70 text-lg mb-12 max-w-md mx-auto leading-relaxed">
                        The page you're looking for seems to have drifted away like autumn leaves. Let's redirect your energy back to the source.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-[#336b6e] text-white rounded-full font-bold flex items-center gap-2 hover:bg-[#2a5557] transition-colors shadow-lg"
                            >
                                <Home className="w-5 h-5" />
                                Return to Home
                            </motion.button>
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="px-8 py-4 border-2 border-[#336b6e] text-[#336b6e] rounded-full font-bold flex items-center gap-2 hover:bg-[#336b6e]/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Zen Quote or Tip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-8 left-0 right-0"
            >
                <p className="italic text-[#336b6e]/40 text-sm px-4">
                    "Sometimes getting lost is the only way to find yourself."
                </p>
            </motion.div>
        </div>
    );
};

export default NotFound;
