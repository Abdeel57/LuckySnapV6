import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/admin';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError('');
        setIsSubmitting(true);
        
        // Simulate async login
        setTimeout(() => {
            const success = auth.login(password);
            if (success) {
                navigate(from, { replace: true });
            } else {
                setError('Contraseña incorrecta. Inténtalo de nuevo.');
                setPassword('');
            }
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
            >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Lucky Snap</h1>
                        <p className="text-gray-500">Panel de Administración</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="relative mb-4">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:ring-blue-500 focus:border-blue-500 transition"
                                required
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-red-500 text-sm text-center mb-4"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        Volver a la página pública
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;