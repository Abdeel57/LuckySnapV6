import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, CreditCard, User, Copy, Check, Sparkles } from 'lucide-react';
import { getSettings } from '../services/api';
import { PaymentAccount } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import { useOptimizedAnimations } from '../utils/deviceDetection';
import { useToast } from '../hooks/useToast';

const PaymentAccountsPage = () => {
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const reduceAnimations = useOptimizedAnimations();
    const toast = useToast();

    useEffect(() => {
        getSettings().then(settings => {
            setAccounts(settings.paymentAccounts);
            setLoading(false);
        });
    }, []);

    const copyToClipboard = async (text: string, accountId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(accountId);
            toast.success('¡Copiado!', 'El número de cuenta se ha copiado al portapapeles');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error('Error', 'No se pudo copiar el número de cuenta');
        }
    };

    return (
        <PageAnimator>
            <div className="min-h-screen bg-background-primary relative overflow-hidden">
                {/* Fondo con efecto */}
                <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-purple-900/10 to-background-primary" />
                {!reduceAnimations && (
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-action/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
                    </div>
                )}

                <div className="container mx-auto px-4 max-w-4xl py-12 md:py-16 relative z-10">
                    {/* Header mejorado */}
                    <motion.div
                        initial={reduceAnimations ? {} : { opacity: 0, y: -20 }}
                        animate={reduceAnimations ? {} : { opacity: 1, y: 0 }}
                        transition={reduceAnimations ? {} : { duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-action animate-pulse" />
                            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent" style={{ animationDelay: '0.5s' }} />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                            <span className="bg-gradient-to-r from-action via-accent to-action bg-clip-text text-transparent">
                                Cuentas para Realizar tu Pago
                            </span>
                        </h1>
                        <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
                            Una vez realizado tu pago, por favor envía tu comprobante a nuestro WhatsApp para confirmar tu apartado.
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {accounts.map((acc, index) => (
                                <motion.div
                                    key={acc.id}
                                    initial={reduceAnimations ? {} : { opacity: 0, y: 30 }}
                                    animate={reduceAnimations ? {} : { opacity: 1, y: 0 }}
                                    transition={reduceAnimations ? {} : { delay: index * 0.15, duration: 0.5 }}
                                    whileHover={reduceAnimations ? {} : { y: -5, scale: 1.02 }}
                                    className="relative group"
                                >
                                    {/* Efecto de resplandor en hover */}
                                    {!reduceAnimations && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-action/20 via-accent/20 to-action/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                                    )}
                                    
                                    {/* Tarjeta principal */}
                                    <div className="relative bg-gradient-to-br from-background-secondary via-background-secondary to-slate-800/50 p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl backdrop-blur-sm overflow-hidden">
                                        {/* Decoración de fondo */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-action/10 to-accent/10 rounded-full blur-2xl" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-action/10 rounded-full blur-xl" />

                                        {/* Contenido */}
                                        <div className="relative z-10">
                                            {/* Header de la tarjeta */}
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-gradient-to-br from-action/20 to-accent/20 rounded-xl backdrop-blur-sm border border-action/30">
                                                        <Building2 className="w-6 h-6 md:w-7 md:h-7 text-action" />
                                                    </div>
                                                    <h2 className="text-xl md:text-2xl font-black text-white">
                                                        {acc.bank}
                                                    </h2>
                                                </div>
                                                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent opacity-60" />
                                            </div>

                                            {/* Información de la cuenta */}
                                            <div className="space-y-4">
                                                {/* Titular */}
                                                <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                                                    <div className="p-2 bg-action/10 rounded-lg">
                                                        <User className="w-4 h-4 md:w-5 md:h-5 text-action" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-slate-400 mb-1">Titular</p>
                                                        <p className="text-base md:text-lg font-bold text-white break-words">
                                                            {acc.accountHolder}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Número de cuenta con botón de copiar */}
                                                <div className="p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <p className="text-xs text-slate-400">Número de Cuenta</p>
                                                        <button
                                                            onClick={() => copyToClipboard(acc.accountNumber, acc.id)}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-action/10 hover:bg-action/20 text-action rounded-lg transition-all duration-300 text-xs font-semibold border border-action/30 hover:border-action/50 group/copy"
                                                            title="Copiar número de cuenta"
                                                        >
                                                            {copiedId === acc.id ? (
                                                                <>
                                                                    <Check className="w-4 h-4" />
                                                                    <span>Copiado</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-4 h-4 group-hover/copy:scale-110 transition-transform" />
                                                                    <span>Copiar</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="w-5 h-5 text-accent/60 flex-shrink-0" />
                                                        <p className="text-lg md:text-xl font-black text-white font-mono tracking-wider break-all select-all">
                                                            {acc.accountNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageAnimator>
    );
};

export default PaymentAccountsPage;
