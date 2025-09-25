import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Check, Gift, Trash2 } from 'lucide-react';
import { getFinishedRaffles, drawWinner, saveWinner, adminGetAllWinners, adminDeleteWinner } from '../../services/api';
import { Raffle, Order, Winner } from '../../types';
import Spinner from '../../components/Spinner';

const AdminWinnersPage = () => {
    const [finishedRaffles, setFinishedRaffles] = useState<Raffle[]>([]);
    const [allWinners, setAllWinners] = useState<Winner[]>([]);
    const [selectedRaffle, setSelectedRaffle] = useState<string>('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [winner, setWinner] = useState<{ ticket: number; order: Order } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [raffles, winners] = await Promise.all([getFinishedRaffles(), adminGetAllWinners()]);
            setFinishedRaffles(raffles);
            setAllWinners(winners);
        } catch (err) {
            setError("Error al cargar los datos.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        loadData();
    }, []);

    const handleDraw = async () => {
        if (!selectedRaffle) return;
        setIsDrawing(true);
        setError(null);
        setWinner(null);
        
        try {
            const winnerData = await drawWinner(selectedRaffle);
            setWinner(winnerData);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al realizar el sorteo.");
        } finally {
            setIsDrawing(false);
        }
    };
    
    const handleSaveWinner = async () => {
        if (!winner) return;

        const raffle = finishedRaffles.find(r => r.id === selectedRaffle);
        if (!raffle) return;

        const winnerData = {
            name: winner.order.name,
            prize: raffle.title,
            imageUrl: raffle.heroImage, // Using raffle hero image as winner image
            raffleTitle: raffle.title,
            drawDate: raffle.drawDate,
        };
        // @ts-ignore
        await saveWinner(winnerData);
        alert(`¡Ganador ${winner.order.name} guardado con éxito!`);
        setWinner(null);
        setSelectedRaffle('');
        loadData();
    };
    
    const handleDeleteWinner = async (winnerId: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar a este ganador?")) {
            await adminDeleteWinner(winnerId);
            loadData();
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} >
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Ganadores</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Realizar un Sorteo</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="raffle-select" className="text-sm text-gray-600 mb-1 block">Selecciona un Sorteo Finalizado</label>
                        <select 
                            id="raffle-select"
                            value={selectedRaffle}
                            onChange={(e) => { setSelectedRaffle(e.target.value); setWinner(null); setError(null); }}
                            className="w-full bg-gray-50 p-2.5 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isDrawing}
                        >
                            <option value="">-- Elige un sorteo --</option>
                            {finishedRaffles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleDraw}
                        disabled={!selectedRaffle || isDrawing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400 transition-colors"
                    >
                        <Trophy className="w-5 h-5"/>
                        {isDrawing ? 'Sorteando...' : 'Realizar Sorteo'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {(isDrawing || winner || error) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="mb-6 bg-white p-6 rounded-lg shadow-md min-h-[10rem] flex items-center justify-center"
                    >
                        {isDrawing && <Spinner />}
                        {error && <p className="text-center text-red-500 font-semibold">{error}</p>}
                        {winner && (
                             <div className="text-center">
                                 <Trophy className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
                                <p className="text-gray-600">¡El boleto ganador es el!</p>
                                <p className="text-6xl font-bold text-blue-600 my-2">{winner.ticket}</p>
                                <p className="text-2xl font-semibold text-gray-800">Felicidades a <span className="text-blue-500">{winner.order.name}</span></p>
                                <p className="text-gray-500">Folio: {winner.order.folio}</p>
                                <button onClick={handleSaveWinner} className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-md">
                                    Guardar y Publicar Ganador
                                </button>
                             </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
             <div className="bg-white p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Ganadores</h2>
                 <div className="space-y-3">
                     {isLoading ? <Spinner /> : allWinners.length > 0 ? allWinners.map(w => (
                         <div key={w.id} className="flex justify-between items-center p-3 border rounded-md">
                            <div>
                                <p className="font-bold">{w.name}</p>
                                <p className="text-sm text-gray-500">{w.prize}</p>
                            </div>
                            <button onClick={() => handleDeleteWinner(w.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                <Trash2 size={18}/>
                            </button>
                         </div>
                     )) : <p className="text-gray-500">Aún no hay ganadores registrados.</p>}
                 </div>
             </div>
        </motion.div>
    );
};

export default AdminWinnersPage;
