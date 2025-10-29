import React, { useState } from 'react';
import { searchTickets } from '../services/api';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import OrdenCard from '../components/OrdenCard';
// import QRScanner from '../components/QRScanner'; // Mantenido para uso futuro
// import { QrCode, Search } from 'lucide-react';
import { Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

type SearchType = 'numero_boleto' | 'nombre_cliente' | 'telefono' | 'folio';

const VerifierPage = () => {
    const [searchType, setSearchType] = useState<SearchType>('numero_boleto');
    const [searchValue, setSearchValue] = useState('');
    const [resultados, setResultados] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());
    // const [showQRScanner, setShowQRScanner] = useState(false); // Mantenido para uso futuro con QR
    const toast = useToast();

    const getPlaceholder = () => {
        switch (searchType) {
            case 'numero_boleto':
                return 'Ingresa el número de boleto (ej. 123)';
            case 'nombre_cliente':
                return 'Ingresa el nombre del cliente';
            case 'telefono':
                return 'Ingresa el número de teléfono';
            case 'folio':
                return 'Ingresa el folio (ej. ORD-2024-00123)';
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
            } else if (searchType === 'nombre_cliente') {
                criteria.nombre_cliente = searchValue.trim();
            } else if (searchType === 'telefono') {
                criteria.telefono = searchValue.trim();
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
                    <p className="text-slate-300">Busca tus boletos por número, nombre, teléfono o folio</p>
                </div>
                
                {/* Formulario de búsqueda */}
                <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-shrink-0 w-full sm:w-auto">
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value as SearchType)}
                                className="w-full sm:w-48 bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent text-sm"
                            >
                                <option value="numero_boleto">Número de boleto</option>
                                <option value="nombre_cliente">Nombre del cliente</option>
                                <option value="telefono">Teléfono</option>
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
                        {/* Botón QR - Deshabilitado por ahora, código mantenido para uso futuro */}
                        {/* <button
                            type="button"
                            onClick={() => setShowQRScanner(true)}
                            className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <QrCode className="w-4 h-4" />
                            QR
                        </button> */}
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
                                                📞 {cliente.telefono}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                📍 {cliente.distrito}
                                            </p>
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

            {/* QR Scanner Modal - Código mantenido para uso futuro */}
            {/* {showQRScanner && (
                <QRScanner
                    onScan={async (qrData: string) => {
                        setIsLoading(true);
                        setShowQRScanner(false);
                        try {
                            // El QR contiene { numero_boleto, sorteo_id }
                            const qrParsed = JSON.parse(qrData);
                            const result = await searchTickets({ numero_boleto: qrParsed.numero_boleto });
                            setResultados(result);
                        } catch (error: any) {
                            console.error('Error scanning QR:', error);
                            toast.error('Error al escanear QR', error.message || 'Código QR inválido');
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    onClose={() => setShowQRScanner(false)}
                />
            )} */}
        </PageAnimator>
    );
};

export default VerifierPage;
