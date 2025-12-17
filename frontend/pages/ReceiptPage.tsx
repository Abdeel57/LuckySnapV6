import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Order, Settings } from '../types';
import { getOrderByFolio, getSettings } from '../services/api';
import Spinner from '../components/Spinner';
import PageAnimator from '../components/PageAnimator';

const ReceiptPage: React.FC = () => {
    const { folio } = useParams<{ folio: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!folio) {
                setError('Folio no proporcionado');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [orderData, settingsData] = await Promise.all([
                    getOrderByFolio(folio),
                    getSettings()
                ]);

                if (!orderData) {
                    setError('Orden no encontrada');
                    return;
                }

                // Solo mostrar si la orden está pagada
                if (orderData.status !== 'PAID' && orderData.status !== 'COMPLETED') {
                    setError('Esta orden aún no ha sido pagada');
                    return;
                }

                setOrder(orderData);
                setSettings(settingsData || null);
            } catch (err) {
                console.error('Error loading receipt:', err);
                setError('Error al cargar el comprobante');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [folio]);

    const formatDate = (date?: Date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('es-HN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'LPS 0.00';
        return `LPS ${amount.toFixed(2)}`;
    };

    if (loading) {
        return (
            <PageAnimator>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Spinner size="lg" />
                        <p className="mt-4 text-gray-600">Cargando comprobante...</p>
                    </div>
                </div>
            </PageAnimator>
        );
    }

    if (error || !order) {
        return (
            <PageAnimator>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Comprobante no encontrado</h1>
                        <p className="text-gray-600 mb-6">{error || 'No se pudo cargar el comprobante'}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </PageAnimator>
        );
    }

    // Generar URL para QR code que lleve directamente al verificador
    // Como usa HashRouter, la URL debe ser: /#/verificador?folio=XXXXX
    // useSearchParams funciona correctamente con HashRouter y lee los query params del hash
    const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : '';
    const qrData = `${baseUrl}/#/verificador?folio=${encodeURIComponent(order.folio || '')}`;

    const siteName = settings?.appearance?.siteName || 'Lucky Snap';
    const logoUrl = (settings?.appearance as any)?.logo || settings?.appearance?.logoUrl;
    const whatsapp = settings?.contactInfo?.whatsapp || '';
    const email = settings?.contactInfo?.email || '';

    return (
        <PageAnimator>
            <style>{`
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                }
                @media screen {
                    .print-only { display: none; }
                }
            `}</style>
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                            {logoUrl && (
                                <img 
                                    src={logoUrl} 
                                    alt={siteName}
                                    className="max-w-[320px] max-h-[160px] mx-auto mb-4 bg-transparent"
                                    style={{ mixBlendMode: 'normal' }}
                                />
                            )}
                            <h1 className="text-3xl font-bold text-gray-900">{siteName}</h1>
                            <p className="text-gray-600 mt-2 text-lg">COMPROBANTE DE PAGO</p>
                        </div>

                        {/* Order Information */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Folio:</span>
                                <span className="text-gray-900 font-mono text-lg">{order.folio || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Fecha de Pago:</span>
                                <span className="text-gray-900">{formatDate(order.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Estado:</span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                                    PAGADO
                                </span>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                                Información del Cliente
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-semibold text-gray-700">Nombre: </span>
                                    <span className="text-gray-900">{order.customer?.name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Teléfono: </span>
                                    <span className="text-gray-900">{order.customer?.phone || 'N/A'}</span>
                                </div>
                                {order.customer?.district && (
                                    <div>
                                        <span className="font-semibold text-gray-700">Distrito: </span>
                                        <span className="text-gray-900">{order.customer.district}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Raffle Information */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                                Información del Sorteo
                            </h3>
                            <div>
                                <span className="font-semibold text-gray-700">Sorteo: </span>
                                <span className="text-gray-900">{order.raffleTitle || (order as any).raffle?.title || 'No disponible'}</span>
                            </div>
                        </div>

                        {/* Tickets */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                                Boletos ({order.tickets?.length || 0})
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {order.tickets?.map((ticket, index) => (
                                    <span 
                                        key={index}
                                        className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm"
                                    >
                                        #{ticket.toString().padStart(4, '0')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                                Información de Pago
                            </h3>
                            {order.paymentMethod && (
                                <div className="mb-4">
                                    <span className="font-semibold text-gray-700">Método de Pago: </span>
                                    <span className="text-gray-900">{order.paymentMethod}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t-2 border-gray-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900">Total Pagado:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {formatCurrency(order.total || order.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="text-center bg-gray-50 rounded-xl p-6 mb-6">
                            <p className="font-semibold text-gray-900 mb-4">Código QR de Verificación</p>
                            <div className="inline-block p-4 bg-white rounded-xl shadow-md">
                                <QRCodeSVG value={qrData} size={200} level="H" />
                            </div>
                            <p className="mt-4 text-sm text-gray-600">
                                Escanea este código para verificar tu boleto
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-600">
                            <p className="mb-2">Gracias por tu compra</p>
                            {whatsapp && (
                                <p>WhatsApp: {whatsapp}</p>
                            )}
                            {email && (
                                <p>Email: {email}</p>
                            )}
                            <p className="mt-4 text-xs text-gray-500">
                                Este es un comprobante digital generado automáticamente
                            </p>
                        </div>

                        {/* Print Button */}
                        <div className="mt-6 flex justify-center gap-4 no-print">
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                            >
                                Imprimir / Guardar PDF
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                Volver al inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageAnimator>
    );
};

export default ReceiptPage;
