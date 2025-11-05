import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import Spinner from '../../components/Spinner';
import { getSettings } from '../../services/api';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [siteName, setSiteName] = useState('Lucky Snap');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Cargar logo del sitio
        getSettings().then(settings => {
            if (settings?.appearance?.logo) {
                setLogoUrl(settings.appearance.logo);
            }
            if (settings?.siteName) {
                setSiteName(settings.siteName);
            }
        }).catch(() => {
            // Si falla, usar valores por defecto
        });
    }, []);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
                    {/* Logo del sitio */}
                    <div className="text-center mb-8">
                        {logoUrl ? (
                            <motion.img
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                src={logoUrl}
                                alt={siteName}
                                className="mx-auto h-20 w-auto object-contain mb-6"
                            />
                        ) : (
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Lock className="h-10 w-10 text-white" />
                            </div>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
                        <p className="text-gray-500 text-sm">Inicia sesión para acceder al panel</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Campo de Usuario */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Usuario
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Orlando12"
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Campo de Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={isLoading}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Mensaje de Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Botón de Inicio de Sesión */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    <span className="ml-2">Iniciando sesión...</span>
                                </>
                            ) : (
                                'ENTRAR'
                            )}
                        </button>
                    </form>
                </div>

                {/* Texto de copyright o información adicional */}
                <p className="text-center text-gray-400 text-xs mt-6">
                    {siteName} © {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;