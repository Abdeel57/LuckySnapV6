import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchTickets } from '../services/api';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import OrdenCard from '../components/OrdenCard';
import QRScanner from '../components/QRScanner';
import { QrCode, Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

type SearchType = 'numero_boleto' | 'folio';

const VerifierPage = () => {
    const [searchParams] = useSearchParams();
    const [searchType, setSearchType] = useState<SearchType>('folio');
    const [searchValue, setSearchValue] = useState('');
    const [resultados, setResultados] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());
    const [showQRScanner, setShowQRScanner] = useState(false);
    const toast = useToast();

    // Función para búsqueda automática desde URL
    const handleAutoSearch = async (folio: string) => {
        setIsLoading(true);
        setResultados(null);
        setExpandedOrdenes(new Set());
        
        try {
            const result = await searchTickets({ folio });
            setResultados(result);
            
            if (!result.clientes || result.clientes.length === 0) {
                toast.info('Sin resultados', 'No se encontraron boletos para este folio');
            } else {
                toast.success('Éxito', 'Boleto encontrado desde código QR');
            }
        } catch (error: any) {
            console.error('Error searching from QR:', error);
            toast.error('Error al buscar', error.message || 'No se encontraron resultados');
            setResultados(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Si hay un folio en la URL (viene de QR), buscarlo automáticamente
    useEffect(() => {
        const folioFromUrl = searchParams.get('folio');
        if (folioFromUrl) {
            setSearchType('folio');
            setSearchValue(folioFromUrl);
            // Buscar automáticamente después de un breve delay para que el componente esté listo
            setTimeout(() => {
                handleAutoSearch(folioFromUrl);
            }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const getPlaceholder = () => {
        switch (searchType) {
            case 'numero_boleto':
                return 'Ingresa el número de boleto (ej. 123)';
            case 'folio':
                return 'Ingresa el folio (ej. LKSNP-XXXXX)';
            default:
                return 'Ingresa tu búsqueda';
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) {
            toast.error('Error', 'Por favor ingresa un valor para buscar');
            return;
        }
        
        setIsLoading(true);
        setResultados(null);
        setExpandedOrdenes(new Set());
        
        try {
            // Construir criterios según el tipo de búsqueda
            const criteria: any = {};
            
            if (searchType === 'numero_boleto') {
                const num = parseInt(searchValue.trim());
                if (isNaN(num)) {
                    toast.error('Error', 'Por favor ingresa un número de boleto válido');
                    setIsLoading(false);
                    return;
                }
                criteria.numero_boleto = num;
            } else if (searchType === 'folio') {
                criteria.folio = searchValue.trim();
            }
            
            const result = await searchTickets(criteria);
            setResultados(result);
            
            if (!result.clientes || result.clientes.length === 0) {
                toast.info('Sin resultados', 'No se encontraron boletos con esos criterios');
            }
        } catch (error: any) {
            console.error('Error searching:', error);
            toast.error('Error al buscar', error.message || 'No se encontraron resultados');
            setResultados(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQRScan = async (qrData: string) => {
        setIsLoading(true);
        setShowQRScanner(false);
        setResultados(null);
        setExpandedOrdenes(new Set());
        
        try {
            // El QR puede ser:
            // 1. Una URL (formato nuevo): /#/verificador?folio=XXXXX
            // 2. JSON (formato antiguo): { folio, ticket, raffleId }
            
            let folio: string | null = null;
            
            // Intentar como URL primero
            if (qrData.includes('verificador') && qrData.includes('folio=')) {
                try {
                    const url = new URL(qrData);
                    folio = url.searchParams.get('folio');
                    // Si es hash router, buscar en el hash
                    if (!folio && url.hash) {
                        const hashParams = new URLSearchParams(url.hash.split('?')[1]);
                        folio = hashParams.get('folio');
                    }
                } catch {
                    // Si no es URL válida, intentar parsear como JSON
                }
            }
            
            // Si no se encontró folio en URL, intentar como JSON (compatibilidad con códigos antiguos)
            if (!folio) {
                try {
                    const qrParsed = JSON.parse(qrData);
                    folio = qrParsed.folio;
                } catch {
                    // No es JSON ni URL válida
                }
            }
            
            if (!folio) {
                toast.error('Error', 'El código QR no contiene un folio válido. Asegúrate de escanear el QR del boleto digital.');
                setIsLoading(false);
                return;
            }
            
            // Buscar por folio
            const result = await searchTickets({ folio });
            setResultados(result);
            
            if (!result.clientes || result.clientes.length === 0) {
                toast.info('Sin resultados', 'No se encontraron boletos para este código QR');
            } else {
                toast.success('Éxito', 'Código QR escaneado correctamente');
            }
        } catch (error: any) {
            console.error('Error scanning QR:', error);
            toast.error('Error al escanear QR', error.message || 'Error al procesar el código QR');
            setResultados(null);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOrden = (ordenId: string) => {
        const newExpanded = new Set(expandedOrdenes);
        if (newExpanded.has(ordenId)) {
            newExpanded.delete(ordenId);
        } else {
            newExpanded.add(ordenId);
        }
        setExpandedOrdenes(newExpanded);
    };


    return (
        <PageAnimator>
            <ToastContainer />
            <div className="container mx-auto px-4 max-w-5xl py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-4">Verificador de Boletos</h1>
                    <p className="text-slate-300">Busca tus boletos por número de boleto, folio o escanea el código QR</p>
                </div>
                
                {/* Formulario de búsqueda */}
                <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        {/* Métodos de búsqueda manual */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-shrink-0 w-full sm:w-auto">
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value as SearchType)}
                                    className="w-full sm:w-48 bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent text-sm"
                                >
                                    <option value="numero_boleto">Número de boleto</option>
                                    <option value="folio">Folio</option>
                                </select>
                            </div>
                            <input
                                type={searchType === 'numero_boleto' ? 'number' : 'text'}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder={getPlaceholder()}
                                className="flex-grow bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Buscar
                            </button>
                        </div>
                        
                        {/* Separador con QR */}
                        <div className="flex items-center gap-4 my-2">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="text-slate-400 text-sm">o</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>
                        
                        {/* Botón QR destacado */}
                        <button
                            type="button"
                            onClick={() => setShowQRScanner(true)}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-3"
                        >
                            <QrCode className="w-6 h-6" />
                            <span>Escanear Código QR del Boleto</span>
                        </button>
                    </form>
                </div>

                {/* Resultados */}
                <div className="space-y-6">
                    {isLoading && (
                        <div className="text-center py-12">
                            <Spinner />
                            <p className="text-slate-400 mt-4">Buscando boletos...</p>
                        </div>
                    )}
                    
                    {!isLoading && resultados && resultados.clientes && resultados.clientes.length > 0 && (
                        <>
                            <div className="text-center mb-4">
                                <p className="text-slate-400">
                                    Se encontraron <span className="text-white font-semibold">{resultados.totalClientes}</span> cliente(s) con{' '}
                                    <span className="text-white font-semibold">{resultados.totalOrdenes}</span> orden(es)
                                </p>
                            </div>
                            
                            {resultados.clientes.map((cliente: any) => (
                                <div key={cliente.clienteId} className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg">
                                    {/* Encabezado del Cliente */}
                                    <div className="mb-5 pb-5 border-b border-slate-700">
                                        <h3 className="text-xl font-bold text-white mb-2">{cliente.nombre}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-300">
                                            <p className="flex items-center gap-2">
                                                📊 {cliente.totalOrdenes} orden(es) • {cliente.totalBoletos} boletos
                                            </p>
                                        </div>
                                        {cliente.totalPagado > 0 && (
                                            <p className="text-green-400 font-semibold mt-3">
                                                💰 Total pagado: L. {cliente.totalPagado.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Lista de Órdenes */}
                                    <div className="space-y-3">
                                        {cliente.ordenes.map((orden: any) => (
                                            <OrdenCard
                                                key={orden.ordenId}
                                                orden={orden}
                                                isExpanded={expandedOrdenes.has(orden.ordenId)}
                                                onToggle={() => toggleOrden(orden.ordenId)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    
                    {!isLoading && resultados && resultados.clientes && resultados.clientes.length === 0 && (
                        <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 p-6 rounded-lg text-center">
                            <p className="font-semibold mb-2">No se encontraron resultados</p>
                            <p className="text-sm text-yellow-200/80">
                                Verifica que los datos ingresados sean correctos e intenta de nuevo.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Scanner Modal */}
            {showQRScanner && (
                <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}
        </PageAnimator>
    );
};

export default VerifierPage;
