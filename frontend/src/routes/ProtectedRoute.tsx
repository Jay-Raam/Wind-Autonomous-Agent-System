import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
    const { initialized, isAuthenticated, initAuth } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!initialized) {
            void initAuth();
        }
    }, [initAuth, initialized]);

    if (!initialized) {
        return (
            <div className="relative flex h-screen items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
                {/* Ambient blobs */}
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute h-96 w-96 rounded-full bg-neutral-200 blur-3xl dark:bg-neutral-800"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute h-72 w-72 translate-x-24 translate-y-16 rounded-full bg-neutral-300 blur-3xl dark:bg-neutral-700"
                />

                <div className="relative flex flex-col items-center gap-6">
                    {/* Logo mark */}
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 shadow-2xl dark:bg-neutral-100"
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                        >
                            <Sparkles size={28} className="text-white dark:text-neutral-900" />
                        </motion.div>
                    </motion.div>

                    {/* Brand name */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <span className="text-lg font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                            Wind
                        </span>
                        <span className="text-xs font-medium text-neutral-400">v2.5</span>
                    </motion.div>

                    {/* Animated dots */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-2"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                                className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500"
                            />
                        ))}
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
};
