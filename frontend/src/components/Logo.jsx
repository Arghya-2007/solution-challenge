import { motion } from "framer-motion";

export default function Logo({ className = "", width = 36, height = 36 }) {
    return (
        <motion.div
            className={`flex items-center justify-center ${className}`}
            style={{ width, height }}
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Ring - Google Blue */}
                <circle cx="50" cy="50" r="46" stroke="#1A73E8" strokeWidth="8" strokeLinecap="round" strokeDasharray="60 200" strokeDashoffset="0">
                    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="10s" repeatCount="indefinite" />
                </circle>
                
                {/* Inner Ring - Google Green */}
                <circle cx="50" cy="50" r="32" stroke="#34A853" strokeWidth="6" strokeLinecap="round" strokeDasharray="50 150" strokeDashoffset="0">
                    <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="8s" repeatCount="indefinite" />
                </circle>

                {/* Core Lens - Google Yellow & Red */}
                <path d="M50 25C35 25 20 50 20 50C20 50 35 75 50 75C65 75 80 50 80 50C80 50 65 25 50 25Z" fill="url(#lensGrad)" opacity="0.9" />
                <circle cx="50" cy="50" r="12" fill="#1A73E8" />
                <circle cx="52" cy="48" r="4" fill="#FFFFFF" opacity="0.8" />

                <defs>
                    <linearGradient id="lensGrad" x1="20" y1="25" x2="80" y2="75" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FBBC04" />
                        <stop offset="1" stopColor="#EA4335" />
                    </linearGradient>
                </defs>
            </svg>
        </motion.div>
    );
}
