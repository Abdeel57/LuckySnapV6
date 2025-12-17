import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Copy, Check, Link } from 'lucide-react';
import { Order, Settings } from '../../types';

interface PaymentConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    settings?: Settings;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    order,
    settings 
}) => {
    const [linkCopied, setLinkCopied] = useState(false);

    if (!isOpen || !order) return null;

    /**
     * Normaliza un número de teléfono para Honduras
     * Formato requerido por WhatsApp: 504XXXXXXXX (código de país + 8 dígitos, sin +)
     * 
     * @param phone - Número de teléfono en cualquier formato
     * @returns Número normalizado para WhatsApp (ej: 50499999999) o cadena vacía si no es válido
     */
    const formatPhoneNumberForHonduras = (phone?: string): string => {
        if (!phone) return '';
        
        // Remover todos los caracteres no numéricos (espacios, guiones, paréntesis, +, etc.)
        const digitsOnly = phone.replace(/\D/g, '');
        
        // Si no hay dígitos, retornar vacío
        if (!digitsOnly) return '';
        
        // Código de país de Honduras
        const countryCode = '504';
        
        // Casos posibles:
        // 1. Número local de 8 dígitos (ej: 99999999) → Agregar 504
        if (digitsOnly.length === 8) {
            return `${countryCode}${digitsOnly}`;
        }
        
        // 2. Número con código de país al inicio (ej: 50499999999 o 50499999999)
        if (digitsOnly.startsWith(countryCode) && digitsOnly.length === 11) {
            return digitsOnly; // Ya tiene el formato correcto
        }
        
        // 3. Número con código de país pero con formato diferente (ej: 00504, etc.)
        if (digitsOnly.length > 8) {
            // Buscar si termina con 8 dígitos (asumir que los últimos 8 son el número local)
            const last8 = digitsOnly.slice(-8);
            if (last8.length === 8) {
                return `${countryCode}${last8}`;
            }
        }
        
        // 4. Si tiene menos de 8 dígitos, no es válido
        if (digitsOnly.length < 8) {
            console.warn('Número de teléfono muy corto:', phone);
            return '';
        }
        
        // 5. Por defecto, si tiene 8+ dígitos, usar los últimos 8 y agregar código de país
        const last8Digits = digitsOnly.slice(-8);
        return `${countryCode}${last8Digits}`;
    };

    /**
     * Obtiene el número de teléfono del cliente desde la orden
     * Verifica tanto customer.phone como user.phone (por compatibilidad)
     */
    const getCustomerPhone = (): string => {
        // Intentar obtener de customer primero (formato actual)
        const customerPhone = order?.customer?.phone;
        if (customerPhone) {
            return formatPhoneNumberForHonduras(customerPhone);
        }
        
        // Si no está en customer, intentar user (formato alternativo)
        const userPhone = (order as any)?.user?.phone;
        if (userPhone) {
            return formatPhoneNumberForHonduras(userPhone);
        }
        
        return '';
    };

    const getReceiptUrl = () => {
        // Usar window.location.origin para obtener la URL base
        const baseUrl = window.location.origin;
        // Como usa HashRouter, usar #/comprobante/:folio
        return `${baseUrl}#/comprobante/${order.folio}`;
    };

    const copyLinkToClipboard = () => {
        const url = getReceiptUrl();
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }).catch(() => {
            alert('Error al copiar el link. Por favor cópialo manualmente: ' + url);
        });
    };

    const handleSendReceipt = () => {
        // Obtener número de teléfono normalizado
        const phoneNumber = getCustomerPhone();
        
        if (!phoneNumber) {
            const originalPhone = order?.customer?.phone || (order as any)?.user?.phone || 'No disponible';
            alert(`No se pudo obtener un número de teléfono válido del cliente.\n\nNúmero encontrado: ${originalPhone}\n\nPor favor, verifica que el cliente tenga un número de teléfono válido de 8 dígitos.`);
            return;
        }

        // Validar que el número tenga el formato correcto (11 dígitos: 504 + 8 dígitos)
        if (phoneNumber.length !== 11 || !phoneNumber.startsWith('504')) {
            console.error('Número de teléfono con formato incorrecto:', phoneNumber);
            alert(`El número de teléfono tiene un formato incorrecto: ${phoneNumber}\n\nDebe ser un número de Honduras válido (8 dígitos).`);
            return;
        }

        const receiptUrl = getReceiptUrl();
        const message = `¡Tu comprobante de pago está listo! Folio: ${order.folio || 'N/A'}\n\nVer tu comprobante aquí: ${receiptUrl}`;
        const encodedMessage = encodeURIComponent(message);
        
        // WhatsApp Web/App URL format: https://wa.me/504XXXXXXXX
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        console.log('📱 Abriendo WhatsApp:', {
            phoneNumber,
            whatsappUrl,
            customerName: order.customer?.name,
            folio: order.folio
        });

        // Abrir WhatsApp en nueva pestaña
        window.open(whatsappUrl, '_blank');

        // Cerrar modal después de un momento
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
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
                                        <h2 className="text-2xl font-bold">Pago Confirmado</h2>
                                        <p className="text-green-100 mt-1">Orden marcada como pagada exitosamente</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 p-2 rounded-xl"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="p-2 bg-green-500 rounded-full">
                                            <Link className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Orden: {order.folio}</h3>
                                            <p className="text-sm text-gray-600">
                                                {order.customer?.name || 'Cliente'} - {order.tickets?.length || 0} boleto(s)
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        Total: <span className="font-bold text-green-600">
                                            LPS {(order.total || order.totalAmount || 0).toFixed(2)}
                                        </span>
                                    </p>
                                </div>

                                <div className="text-sm text-gray-600 space-y-3">
                                    <p className="mb-2">¿Deseas enviar el link del comprobante de pago al cliente por WhatsApp?</p>
                                    
                                    {/* Link del comprobante */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Link del Comprobante:
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={getReceiptUrl()}
                                                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                            />
                                            <button
                                                onClick={copyLinkToClipboard}
                                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                                                title="Copiar link"
                                            >
                                                {linkCopied ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {linkCopied && (
                                            <p className="text-xs text-green-600 mt-2">¡Link copiado al portapapeles!</p>
                                        )}
                                    </div>
                                    
                                    <p className="text-xs text-gray-500">
                                        El cliente podrá ver su comprobante completo con QR code en el link que se enviará.
                                    </p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Salir
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendReceipt}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center space-x-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Enviar Comprobante de Pago</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PaymentConfirmationModal;
