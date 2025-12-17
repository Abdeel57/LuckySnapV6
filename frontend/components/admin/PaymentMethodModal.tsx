import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentMethod: string, notes: string) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSave }) => {
    const [paymentMethod, setPaymentMethod] = useState('Transferencia');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(paymentMethod, notes);
        setPaymentMethod('Transferencia');
        setNotes('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Marcar como Pagado</h2>
                                    <p className="text-green-100 mt-1">Confirma los detalles del pago</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 p-2 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Método de Pago
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    required
                                >
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Depósito en Efectivo">Depósito en Efectivo</option>
                                    <option value="Punto de Venta">Punto de Venta</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notas (Opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                                    placeholder="Agrega algún comentario sobre este pago..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Confirmar Pago</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentMethodModal;

