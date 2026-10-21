import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, Search } from 'lucide-react';
import { searchTickets, getRaffles } from '../services/api';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import OrdenCard from '../components/OrdenCard';
import QRScanner from '../components/QRScanner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field, { inputClass } from '../components/ui/Field';
import { useToast } from '../hooks/useToast';
import { Raffle } from '../types';
import { formatMoney, pluralize } from '../utils/format';

type SearchType = 'numero_boleto' | 'folio';

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
    { value: 'folio', label: 'Folio' },
    { value: 'numero_boleto', label: 'Número de boleto' },
];

const VerifierPage = () => {
    const [searchParams] = useSearchParams();
    const [searchType, setSearchType] = useState<SearchType>('folio');
    const [searchValue, setSearchValue] = useState('');
    const [selectedRaffleId, setSelectedRaffleId] = useState<string>('');
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loadingRaffles, setLoadingRaffles] = useState(false);
    const [resultados, setResultados] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());
    const [showQRScanner, setShowQRScanner] = useState(false);
    const toast = useToast();

    // Cargar sorteos activos para el filtro opcional
    useEffect(() => {
        const loadRaffles = async () => {
            setLoadingRaffles(true);
            try {
                const rafflesData = await getRaffles();
                setRaffles(rafflesData.filter(raffle => raffle.status === 'active'));
            } catch (error) {
                console.error('Error loading raffles:', error);
            } finally {
                setLoadingRaffles(false);
            }
        };
        loadRaffles();
    }, []);

    const runSearch = async (criteria: Record<string, any>, messages: { empty: string; found?: string; errorTitle: string }) => {
        setIsLoading(true);
        setResultados(null);
        setExpandedOrdenes(new Set());
        try {
            if (selectedRaffleId) criteria.raffleId = selectedRaffleId;
            const result = await searchTickets(criteria);
            setResultados(result);
            if (!result.clientes || result.clientes.length === 0) {
                toast.info('Sin resultados', messages.empty);
            } else if (messages.found) {
                toast.success(messages.found);
            }
        } catch (error: any) {
            console.error('Error searching:', error);
            toast.error(messages.errorTitle, error.message || 'No se encontraron resultados');
            setResultados(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Si hay un folio en la URL (viene de un QR), buscarlo automáticamente
    useEffect(() => {
        const folioFromUrl = searchParams.get('folio');
        if (folioFromUrl) {
            setSearchType('folio');
            setSearchValue(folioFromUrl);
            setTimeout(() => {
                runSearch({ folio: folioFromUrl }, { empty: 'No se encontraron boletos para este folio', found: 'Boleto encontrado', errorTitle: 'Error al buscar' });
            }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) {
            toast.error('Escribe un valor para buscar');
            return;
        }
        const criteria: Record<string, any> = {};
        if (searchType === 'numero_boleto') {
            const num = parseInt(searchValue.trim());
            if (isNaN(num)) {
                toast.error('Número de boleto inválido', 'Escribe solo el número, por ejemplo 123.');
                return;
            }
            criteria.numero_boleto = num;
        } else {
            criteria.folio = searchValue.trim();
        }
        await runSearch(criteria, { empty: 'No se encontraron boletos con esos datos', errorTitle: 'Error al buscar' });
    };

    const handleQRScan = async (qrData: string) => {
        setShowQRScanner(false);
        // El QR puede ser una URL (/#/verificador?folio=XXXXX) o JSON antiguo ({ folio, ... })
        let folio: string | null = null;
        if (qrData.includes('verificador') && qrData.includes('folio=')) {
            try {
                const url = new URL(qrData);
                folio = url.searchParams.get('folio');
                if (!folio && url.hash) {
                    folio = new URLSearchParams(url.hash.split('?')[1]).get('folio');
                }
            } catch { /* no es URL válida; se intenta como JSON */ }
        }
        if (!folio) {
            try { folio = JSON.parse(qrData).folio; } catch { /* no es JSON */ }
        }
        if (!folio) {
            toast.error('Código QR no válido', 'Escanea el QR del boleto digital o del comprobante.');
            return;
        }
        setSearchType('folio');
        setSearchValue(folio);
        await runSearch({ folio }, { empty: 'No se encontraron boletos para este código QR', found: 'Código QR leído', errorTitle: 'Error al escanear QR' });
    };

    const toggleOrden = (ordenId: string) => {
        setExpandedOrdenes(prev => {
            const next = new Set(prev);
            if (next.has(ordenId)) next.delete(ordenId); else next.add(ordenId);
            return next;
        });
    };

    const hasResults = !isLoading && resultados?.clientes?.length > 0;
    const noResults = !isLoading && resultados && (!resultados.clientes || resultados.clientes.length === 0);

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 sm:px-6 max-w-3xl pt-8 md:pt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">Boletos</p>
                <h1 className="text-display font-extrabold text-white">Verificar boleto</h1>
                <p className="mt-3 text-slate-400 max-w-xl">Busca por folio o por número de boleto, o escanea el código QR de tu comprobante.</p>

                <Card className="mt-6">
                    <form onSubmit={handleSearch} className="space-y-4" noValidate>
                        <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10" role="radiogroup" aria-label="Buscar por">
                            {SEARCH_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={searchType === type.value}
                                    onClick={() => { setSearchType(type.value); setSearchValue(''); }}
                                    className={`h-10 px-4 rounded-lg text-sm font-semibold transition-colors ${searchType === type.value ? 'bg-action text-white' : 'text-slate-300 hover:text-white'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <Field id="search-value" label={searchType === 'folio' ? 'Folio' : 'Número de boleto'} className="flex-1">
                                <input
                                    type={searchType === 'numero_boleto' ? 'number' : 'text'}
                                    inputMode={searchType === 'numero_boleto' ? 'numeric' : 'text'}
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder={searchType === 'folio' ? 'Ej. LKSNP-XXXXX' : 'Ej. 123'}
                                    className={`${inputClass} tnum`}
                                    autoComplete="off"
                                    required
                                />
                            </Field>
                            <Button type="submit" loading={isLoading} icon={<Search className="w-4 h-4" aria-hidden />} className="sm:flex-shrink-0">
                                Buscar
                            </Button>
                        </div>

                        <Field id="raffle-filter" label="Sorteo" optional>
                            <select value={selectedRaffleId} onChange={(e) => setSelectedRaffleId(e.target.value)} className={inputClass}>
                                <option value="">Todos los sorteos</option>
                                {loadingRaffles ? (
                                    <option disabled>Cargando sorteos…</option>
                                ) : (
                                    raffles.map(raffle => <option key={raffle.id} value={raffle.id}>{raffle.title}</option>)
                                )}
                            </select>
                        </Field>

                        <div className="flex items-center gap-3" aria-hidden>
                            <div className="flex-grow border-t border-white/[0.08]" />
                            <span className="text-xs font-semibold text-slate-400">o</span>
                            <div className="flex-grow border-t border-white/[0.08]" />
                        </div>

                        <Button type="button" variant="secondary" fullWidth onClick={() => setShowQRScanner(true)} icon={<QrCode className="w-5 h-5" aria-hidden />}>
                            Escanear código QR
                        </Button>
                    </form>
                </Card>

                <div className="mt-6 space-y-4" aria-live="polite">
                    {isLoading && (
                        <div className="py-10 text-center">
                            <Spinner />
                            <p className="text-sm text-slate-400">Buscando boletos…</p>
                        </div>
                    )}

                    {hasResults && (
                        <>
                            <p className="text-sm text-slate-400">
                                {pluralize(resultados.totalOrdenes, 'orden', 'órdenes')} encontradas
                                {resultados.totalClientes > 1 && ` · ${pluralize(resultados.totalClientes, 'cliente')}`}
                            </p>
                            {resultados.clientes.map((cliente: any) => (
                                <Card key={cliente.clienteId}>
                                    <div className="flex flex-wrap items-start justify-between gap-2 pb-4 mb-4 border-b border-white/[0.08]">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-white">{cliente.nombre}</h2>
                                            <p className="tnum text-sm text-slate-400">{pluralize(cliente.totalOrdenes, 'orden', 'órdenes')} · {pluralize(cliente.totalBoletos, 'boleto')}</p>
                                        </div>
                                        {cliente.totalPagado > 0 && (
                                            <p className="text-right">
                                                <span className="block text-xs font-semibold text-slate-400">Total pagado</span>
                                                <span className="tnum font-extrabold text-accent">{formatMoney(cliente.totalPagado)}</span>
                                            </p>
                                        )}
                                    </div>
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
                                </Card>
                            ))}
                        </>
                    )}

                    {noResults && (
                        <Card tone="subtle" className="text-center">
                            <p className="font-extrabold text-white">Sin resultados</p>
                            <p className="mt-1 text-sm text-slate-400">Revisa que el folio o el número estén bien escritos e intenta de nuevo.</p>
                        </Card>
                    )}
                </div>
            </div>

            {showQRScanner && (
                <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />
            )}
        </PageAnimator>
    );
};

export default VerifierPage;
