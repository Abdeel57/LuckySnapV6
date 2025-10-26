import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getOrderByFolio, verifyTicket, getRaffles } from '../services/api';
import { Order, Raffle } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import OrderHistoryCard from '../components/OrderHistoryCard';
import QRScanner from '../components/QRScanner';
import { QrCode, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const VerifierPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { register, handleSubmit, setValue, watch } = useForm<{ folio: string; numero_boleto: string; sorteo_id: string }>();
    const [order, setOrder] = useState<Order | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [searchedFolio, setSearchedFolio] = useState('');
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [activeTab, setActiveTab] = useState<'folio' | 'boleto'>('folio');
    const toast = useToast();
    
    const initialFolio = searchParams.get('folio');
    const selectedRaffleId = watch('sorteo_id');
    
    const onSearch = useCallback(async (data: { folio: string }) => {
        if (!data.folio) return;
        setIsLoading(true);
        setSearchedFolio(data.folio);
        setVerificationResult(null);
        
        if (searchParams.get('folio') !== data.folio) {
            setSearchParams({ folio: data.folio });
        }
        
        try {
            const result = await getOrderByFolio(data.folio);
            setOrder(result ?? null);
        } catch (error: any) {
            console.error('Error searching order:', error);
            toast.error('Error al buscar', error.message || 'No se pudo encontrar el folio');
            setOrder(null);
        } finally {
            setIsLoading(false);
        }
    }, [setSearchParams, searchParams, toast]);

    const onVerifyTicket = async (data: { numero_boleto: string; sorteo_id: string }) => {
        if (!data.numero_boleto || !data.sorteo_id) {
            toast.error('Error', 'Por favor completa todos los campos');
            return;
        }

        setIsLoading(true);
        setVerificationResult(null);
        setOrder(undefined);

        try {
            const result = await verifyTicket({
                numero_boleto: parseInt(data.numero_boleto),
                sorteo_id: data.sorteo_id
            });
            setVerificationResult(result);
        } catch (error: any) {
            console.error('Error verifying ticket:', error);
            toast.error('Error al verificar', error.message || 'No se pudo verificar el boleto');
            setVerificationResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    const onQRScan = async (qrData: string) => {
        setIsLoading(true);
        setVerificationResult(null);
        setOrder(undefined);
        setShowQRScanner(false);

        try {
            const result = await verifyTicket({ codigo_qr: qrData });
            setVerificationResult(result);
        } catch (error: any) {
            console.error('Error verifying QR:', error);
            toast.error('Error al verificar QR', error.message || 'Código QR inválido');
            setVerificationResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar rifas al montar el componente
    useEffect(() => {
        const loadRaffles = async () => {
            try {
                const rafflesData = await getRaffles();
                setRaffles(rafflesData);
            } catch (error) {
                console.error('Error loading raffles:', error);
            }
        };
        loadRaffles();
    }, []);

    useEffect(() => {
        if (initialFolio) {
            setValue('folio', initialFolio);
            onSearch({ folio: initialFolio });
        }
    }, [initialFolio, onSearch, setValue]);


    return (
        <PageAnimator>
            <ToastContainer />
            <div className="container mx-auto px-4 max-w-4xl text-center py-12">
                <h1 className="text-3xl font-bold text-white mb-4">Verificador de Boletos</h1>
                <p className="text-slate-300 mb-8">Verifica el estado de tus boletos por folio, número o código QR.</p>
                
                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-background-secondary rounded-lg p-1 border border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('folio')}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                activeTab === 'folio' 
                                    ? 'bg-action text-white' 
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            Por Folio
                        </button>
                        <button
                            onClick={() => setActiveTab('boleto')}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                activeTab === 'boleto' 
                                    ? 'bg-action text-white' 
                                    : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            Por Boleto
                        </button>
                    </div>
                </div>

                {/* Formulario de búsqueda */}
                <div className="bg-background-secondary p-8 rounded-lg border border-slate-700/50 shadow-lg mb-8">
                    {activeTab === 'folio' ? (
                        <form onSubmit={handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-2">
                            <input
                                {...register('folio', { required: true })}
                                placeholder="Tu Folio (ej. LKSNP-12345)"
                                className="flex-grow bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent"
                            />
                            <button type="submit" className="bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90">
                                <Search className="w-4 h-4 inline mr-2" />
                                Buscar
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                    {...register('sorteo_id', { required: true })}
                                    className="flex-grow bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent"
                                >
                                    <option value="">Selecciona un sorteo</option>
                                    {raffles.map(raffle => (
                                        <option key={raffle.id} value={raffle.id}>
                                            {raffle.title}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    {...register('numero_boleto', { required: true })}
                                    type="number"
                                    placeholder="Número de boleto"
                                    className="flex-grow bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent"
                                />
                                <button 
                                    type="button"
                                    onClick={handleSubmit(onVerifyTicket)}
                                    className="bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90"
                                >
                                    <Search className="w-4 h-4 inline mr-2" />
                                    Verificar
                                </button>
                            </div>
                            
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowQRScanner(true)}
                                    className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <QrCode className="w-4 h-4 inline mr-2" />
                                    Escanear QR
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resultados */}
                <div className="text-left">
                    {isLoading && (
                        <div className="text-center">
                            <Spinner />
                        </div>
                    )}
                    
                    {/* Resultado de verificación por folio */}
                    {!isLoading && order && <OrderHistoryCard order={order} />}
                    
                    {!isLoading && order === null && searchedFolio && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            No se encontró ningún apartado con el folio "{searchedFolio}".
                        </div>
                    )}

                    {/* Resultado de verificación de boleto */}
                    {!isLoading && verificationResult && (
                        <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg">
                            <div className="flex items-center mb-4">
                                {verificationResult.valido ? (
                                    <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-500 mr-2" />
                                )}
                                <h3 className="text-xl font-bold text-white">
                                    {verificationResult.valido ? 'Boleto Válido' : 'Boleto No Válido'}
                                </h3>
                            </div>
                            
                            <p className="text-slate-300 mb-4">{verificationResult.mensaje}</p>
                            
                            {verificationResult.boleto && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Número:</span>
                                        <span className="text-white ml-2">{verificationResult.boleto.numero}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Sorteo:</span>
                                        <span className="text-white ml-2">{verificationResult.boleto.sorteo}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Cliente:</span>
                                        <span className="text-white ml-2">{verificationResult.boleto.cliente}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Estado:</span>
                                        <span className={`ml-2 ${
                                            verificationResult.boleto.estado === 'PAID' ? 'text-green-400' : 'text-yellow-400'
                                        }`}>
                                            {verificationResult.boleto.estado === 'PAID' ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Folio:</span>
                                        <span className="text-white ml-2">{verificationResult.boleto.folio}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Monto:</span>
                                        <span className="text-white ml-2">LPS {verificationResult.boleto.monto}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Scanner Modal */}
            {showQRScanner && (
                <QRScanner
                    onScan={onQRScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}
        </PageAnimator>
    );
};

export default VerifierPage;
