import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getOrderbyFolio } from '../services/api';
import { Order } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import OrderHistoryCard from '../components/OrderHistoryCard';

const VerifierPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { register, handleSubmit, setValue } = useForm<{ folio: string }>();
    const [order, setOrder] = useState<Order | null | undefined>(undefined); // undefined: not searched, null: not found
    const [isLoading, setIsLoading] = useState(false);
    const [searchedFolio, setSearchedFolio] = useState('');
    
    const initialFolio = searchParams.get('folio');
    
    const onSearch = useCallback(async (data: { folio: string }) => {
        if (!data.folio) return;
        setIsLoading(true);
        setSearchedFolio(data.folio);
        if (searchParams.get('folio') !== data.folio) {
            setSearchParams({ folio: data.folio });
        }
        const result = await getOrderbyFolio(data.folio);
        setOrder(result ?? null);
        setIsLoading(false);
    }, [setSearchParams, searchParams]);

    useEffect(() => {
        if (initialFolio) {
            setValue('folio', initialFolio);
            onSearch({ folio: initialFolio });
        }
    }, [initialFolio, onSearch, setValue]);


    return (
        <PageAnimator>
             <div className="container mx-auto px-4 max-w-2xl text-center py-12">
                <h1 className="text-3xl font-bold text-white mb-4">Verificador de Boletos</h1>
                <p className="text-slate-300 mb-8">Ingresa tu folio para ver el estado de tu apartado.</p>
                <div className="bg-background-secondary p-8 rounded-lg border border-slate-700/50 shadow-lg">
                    <form onSubmit={handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-2">
                        <input
                            {...register('folio', { required: true })}
                            placeholder="Tu Folio (ej. LKSNP-12345)"
                            className="flex-grow bg-slate-800 border border-slate-700 rounded-md py-3 px-4 text-white focus:ring-accent focus:border-accent"
                        />
                        <button type="submit" className="bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90">
                            Buscar
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-left">
                    {isLoading && <Spinner />}
                    {!isLoading && order && <OrderHistoryCard order={order} />}
                    {!isLoading && order === null && searchedFolio && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            No se encontró ningún apartado con el folio "{searchedFolio}".
                        </div>
                    )}
                </div>
             </div>
        </PageAnimator>
    );
};

export default VerifierPage;
