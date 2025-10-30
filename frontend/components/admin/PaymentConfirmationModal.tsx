import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Order, Settings } from '../../types';
import ReceiptGenerator from './ReceiptGenerator';

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
    const [isGenerating, setIsGenerating] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !order) return null;

    const formatPhoneNumber = (phone?: string) => {
        if (!phone) return '';
        // Remover espacios, guiones y caracteres especiales
        return phone.replace(/[\s\-\(\)]/g, '');
    };

    const generateReceiptImage = async (): Promise<string> => {
        if (!receiptRef.current) throw new Error('Receipt ref not found');

        setIsGenerating(true);
        try {
            // Esperar un momento para que el componente se renderice completamente
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capturar el componente como imagen
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Mejor calidad
                logging: false,
                useCORS: true
            });

            // Convertir canvas a blob
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Error al generar imagen'));
                        return;
                    }

                    // Crear URL del blob
                    const url = URL.createObjectURL(blob);
                    
                    // Descargar automáticamente
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `comprobante-${order.folio || 'recibo'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Resolver con la URL del blob
                    resolve(url);
                }, 'image/png');
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendReceipt = async () => {
        try {
            // Generar y descargar imagen
            await generateReceiptImage();

            // Preparar mensaje para WhatsApp
            const phoneNumber = formatPhoneNumber(order.customer?.phone);
            if (!phoneNumber) {
                alert('No se encontró número de teléfono del cliente');
                return;
            }

            const message = `¡Tu comprobante de pago está listo! Folio: ${order.folio || 'N/A'}. Por favor adjunta la imagen descargada.`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

            // Abrir WhatsApp
            window.open(whatsappUrl, '_blank');

            // Cerrar modal después de un momento
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Error generando comprobante:', error);
            alert('Error al generar el comprobante. Por favor intenta nuevamente.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Componente de comprobante oculto para captura */}
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>
                        <div ref={receiptRef}>
                            <ReceiptGenerator order={order} settings={settings} />
                        </div>
                    </div>

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
                                            <Download className="w-5 h-5 text-white" />
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

                                <div className="text-sm text-gray-600">
                                    <p className="mb-2">¿Deseas enviar el comprobante de pago al cliente por WhatsApp?</p>
                                    <p className="text-xs text-gray-500">
                                        El comprobante se descargará automáticamente y se abrirá WhatsApp con un mensaje pre-formateado.
                                    </p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                                    disabled={isGenerating}
                                >
                                    Salir
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendReceipt}
                                    disabled={isGenerating}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Generando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Enviar Comprobante de Pago</span>
                                        </>
                                    )}
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
