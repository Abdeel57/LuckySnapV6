import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Spinner from '../../components/Spinner';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor, completa todos los campos');
            return;
        }

        const success = await login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Credenciales incorrectas. Intenta nuevamente.');
        }
    };

    return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-background-secondary rounded-lg shadow-lg border border-slate-700/50 p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Panel de Administración</h1>
                        <p className="text-slate-400">Inicia sesión para acceder al panel</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                                Usuario
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    placeholder="Orlando12"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    <span className="ml-2">Iniciando sesión...</span>
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    {/* Mensaje removido por seguridad - credenciales solo para el dueño */}
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;