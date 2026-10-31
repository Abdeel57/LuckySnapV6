import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Check, CheckCircle2, Copy, Download } from 'lucide-react';
import { Order, Settings } from '../types';
import { getOrderByFolio, getSettings } from '../services/api';
import Spinner from '../components/Spinner';
import PageAnimator from '../components/PageAnimator';
import Button from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { formatMoney } from '../utils/format';

const ReceiptPage: React.FC = () => {
    const { folio } = useParams<{ folio: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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

    if (loading) {
        return (
            <PageAnimator>
                <div className="min-h-screen bg-page flex items-center justify-center">
                    <div className="text-center">
                        <Spinner size="lg" />
                        <p className="text-sm text-muted">Cargando comprobante…</p>
                    </div>
                </div>
            </PageAnimator>
        );
    }

    if (error || !order) {
        return (
            <PageAnimator>
                <div className="min-h-screen bg-page flex items-center justify-center px-4">
                    <div className="max-w-md w-full rounded-3xl bg-surface shadow-soft lit p-6 text-center">
                        <h1 className="text-xl font-bold text-ink">Comprobante no disponible</h1>
                        <p className="mt-2 text-muted">{error || 'No se pudo cargar el comprobante'}</p>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                            <Button onClick={() => navigate('/')}>Volver al inicio</Button>
                            <Button onClick={() => navigate('/verificador')} variant="secondary">Ir al verificador</Button>
                        </div>
                    </div>
                </div>
            </PageAnimator>
        );
    }

    // URL para el QR: lleva directamente al verificador (HashRouter → /#/verificador?folio=XXXXX)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const qrData = `${baseUrl}/#/verificador?folio=${encodeURIComponent(order.folio || '')}`;
    const permalink = `${baseUrl}/#/comprobante/${order.folio}`;

    const siteName = settings?.appearance?.siteName || 'Lucky Snap';
    const logoUrl = (settings?.appearance as any)?.logo || (settings?.appearance as any)?.logoUrl;
    const whatsapp = settings?.contactInfo?.whatsapp || '';
    const email = settings?.contactInfo?.email || '';

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(permalink);
            setCopied(true);
            toast.success('Enlace copiado');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('No se pudo copiar', 'Selecciona el enlace y cópialo manualmente.');
        }
    };

    return (
        <PageAnimator>
            <style>{`
                @media print {
                    body { margin: 0; padding: 0; background: #fff; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                }
                @media screen {
                    .print-only { display: none; }
                }
            `}</style>
            <div className="min-h-screen bg-page py-6 sm:py-10 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Confirmación y acciones (no se imprimen) */}
                    <div className="no-print mb-5">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-300 mb-4">
                                <CheckCircle2 className="w-7 h-7" aria-hidden />
                            </div>
                            <h1 className="font-display text-title font-bold text-ink">¡Gracias por tu compra!</h1>
                            <p className="mt-2 text-muted">Tu pago está confirmado. Guarda este comprobante; incluye un QR para verificar tus boletos.</p>
                        </div>

                        <div className="mt-6 rounded-3xl bg-surface shadow-soft lit p-4 sm:p-5 space-y-4">
                            <Button onClick={() => window.print()} size="lg" fullWidth icon={<Download className="w-5 h-5" aria-hidden />}>
                                Descargar o imprimir
                            </Button>
                            <div>
                                <p className="text-xs font-semibold text-muted mb-1.5">Enlace permanente</p>
                                <div className="flex items-center gap-2">
                                    <input readOnly value={permalink} aria-label="Enlace del comprobante" className="tnum flex-1 min-w-0 h-11 rounded-xl bg-surface-2 border border-line px-3 text-sm text-ink" />
                                    <button type="button" onClick={copyLink} className="flex-shrink-0 inline-flex items-center gap-1.5 h-11 px-3 rounded-xl bg-surface border border-line text-sm font-semibold text-ink hover:bg-ink/5">
                                        {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comprobante imprimible (fondo blanco a propósito) */}
                    <div className="bg-white rounded-3xl shadow-lift p-6 sm:p-8">
                        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                            {logoUrl && (
                                <img
                                    src={logoUrl}
                                    alt={siteName}
                                    className="max-w-[240px] max-h-[120px] mx-auto mb-4 bg-transparent"
                                    style={{ mixBlendMode: 'normal' }}
                                />
                            )}
                            <h2 className="font-display text-2xl font-bold text-gray-900">{siteName}</h2>
                            <p className="text-gray-600 mt-1 text-sm font-semibold tracking-wide">COMPROBANTE DE PAGO</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Folio:</span>
                                <span className="tnum text-gray-900 font-bold text-lg">{order.folio || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Fecha de pago:</span>
                                <span className="text-gray-900">{formatDate(order.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Estado:</span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm">PAGADO</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">Cliente</h3>
                            <div className="space-y-1.5 text-gray-900">
                                <p><span className="font-semibold text-gray-700">Nombre: </span>{order.customer?.name || 'N/A'}</p>
                                <p><span className="font-semibold text-gray-700">Teléfono: </span>{order.customer?.phone || 'N/A'}</p>
                                {order.customer?.district && <p><span className="font-semibold text-gray-700">Departamento: </span>{order.customer.district}</p>}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">Sorteo</h3>
                            <p className="text-gray-900">{order.raffleTitle || (order as any).raffle?.title || 'No disponible'}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">Boletos ({order.tickets?.length || 0})</h3>
                            <div className="flex flex-wrap gap-2">
                                {order.tickets?.map((ticket, index) => (
                                    <span key={index} className="tnum inline-block px-3 py-1.5 bg-gray-900 text-white rounded-lg font-bold text-sm">
                                        #{ticket.toString().padStart(4, '0')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">Pago</h3>
                            {order.paymentMethod && (
                                <p className="mb-3 text-gray-900"><span className="font-semibold text-gray-700">Método: </span>{order.paymentMethod}</p>
                            )}
                            <div className="pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total pagado</span>
                                <span className="tnum text-2xl font-bold text-green-600">{formatMoney(order.total || order.totalAmount)}</span>
                            </div>
                        </div>

                        <div className="text-center bg-gray-50 rounded-xl p-6 mb-6">
                            <p className="font-semibold text-gray-900 mb-4">Código QR de verificación</p>
                            <div className="inline-block p-4 bg-white rounded-xl shadow-md">
                                <QRCodeSVG value={qrData} size={180} level="H" />
                            </div>
                            <p className="mt-4 text-sm text-gray-600">Escanea este código para verificar tus boletos</p>
                        </div>

                        <div className="pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-600">
                            <p className="mb-1">Gracias por tu compra</p>
                            {whatsapp && <p>WhatsApp: {whatsapp}</p>}
                            {email && <p>Email: {email}</p>}
                            <p className="mt-3 text-xs text-gray-500">Comprobante digital generado automáticamente</p>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 no-print">
                            <button type="button" onClick={() => window.print()} className="h-11 px-5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors">
                                Imprimir / Guardar PDF
                            </button>
                            <button type="button" onClick={() => navigate('/')} className="h-11 px-5 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors">
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
