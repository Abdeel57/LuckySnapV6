import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Trash2, X } from 'lucide-react';
import { getFinishedRaffles, getRaffles, drawWinner, saveWinner, adminGetAllWinners, adminDeleteWinner } from '../../services/api';
import { Raffle, Order, Winner } from '../../types';
import Spinner from '../../components/Spinner';
import WinnerForm from '../../components/admin/WinnerForm';
import WinnerDrawAnimation from '../../components/admin/WinnerDrawAnimation';

const AdminWinnersPage = () => {
    const [finishedRaffles, setFinishedRaffles] = useState<Raffle[]>([]);
    const [allRaffles, setAllRaffles] = useState<Raffle[]>([]);
    const [allWinners, setAllWinners] = useState<Winner[]>([]);
    const [selectedRaffle, setSelectedRaffle] = useState<string>('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);
    const [winner, setWinner] = useState<{ ticket: number; order: Order } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWinnerForm, setShowWinnerForm] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [raffles, allRafflesData, winners] = await Promise.all([
                getFinishedRaffles(), 
                getRaffles(),
                adminGetAllWinners()
            ]);
            setFinishedRaffles(raffles);
            setAllRaffles(allRafflesData);
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
        setShowAnimation(true);
        setAnimationComplete(false);
        
        try {
            // Obtener el ganador después de la animación
            setTimeout(async () => {
                try {
                    const winnerData = await drawWinner(selectedRaffle);
                    setWinner(winnerData);
                } catch (err: any) {
                    setError(err.message || "Ocurrió un error al realizar el sorteo.");
                    setShowAnimation(false);
                } finally {
                    setIsDrawing(false);
                }
            }, 4000); // Tiempo para que termine la animación (3s countdown + 1s de margen)
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al realizar el sorteo.");
            setShowAnimation(false);
            setIsDrawing(false);
        }
    };

    const handleAnimationComplete = () => {
        setAnimationComplete(true);
        setShowAnimation(false);
    };
    
    const handleSaveWinner = async () => {
        if (!winner) {
            alert('No hay ganador para guardar');
            return;
        }

        const raffle = finishedRaffles.find(r => r.id === selectedRaffle);
        if (!raffle) {
            alert('No se encontró la rifa seleccionada');
            return;
        }

        try {
            const winnerName = winner.order.customer?.name || winner.order.name;
            
            console.log('🔍 Debug info:');
            console.log('Winner object:', winner);
            console.log('Winner.order:', winner.order);
            console.log('Winner.order.customer:', winner.order.customer);
            console.log('Winner.order.name:', winner.order.name);
            console.log('Winner Name result:', winnerName);
            
            const winnerData = {
                name: winnerName,
                prize: raffle.title,
                imageUrl: raffle.heroImage || raffle.imageUrl,
                raffleTitle: raffle.title,
                drawDate: raffle.drawDate,
                ticketNumber: winner.ticket,
                phone: winner.order.customer?.phone,
                city: winner.order.customer?.district
            };
            
            console.log('💾 Guardando ganador con datos:', JSON.stringify(winnerData, null, 2));
            await saveWinner(winnerData);
            console.log('✅ Ganador guardado exitosamente');
            
            alert(`¡Ganador ${winner.order.customer?.name || winner.order.name} guardado con éxito!`);
            setWinner(null);
            setSelectedRaffle('');
            setAnimationComplete(false);
            loadData();
        } catch (err: any) {
            console.error('❌ Error al guardar ganador:', err);
            alert(`Error al guardar ganador: ${err.message}`);
        }
    };

    const handleSaveManualWinner = async (winnerData: any) => {
        try {
            // Si hay una imagen, subirla primero (por ahora usamos la URL directa)
            const dataToSave = {
                name: winnerData.name,
                prize: winnerData.prize,
                imageUrl: winnerData.imageUrl,
                raffleTitle: winnerData.raffleTitle,
                drawDate: winnerData.drawDate,
                ticketNumber: winnerData.ticketNumber,
                phone: winnerData.phone,
                city: winnerData.city,
                testimonial: winnerData.testimonial
            };
            
            await saveWinner(dataToSave);
            alert('¡Ganador guardado exitosamente!');
            setShowWinnerForm(false);
            loadData();
        } catch (err: any) {
            alert('Error al guardar ganador: ' + err.message);
        }
    };

    const handleDeleteWinner = async (winnerId: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar a este ganador?")) {
            await adminDeleteWinner(winnerId);
            loadData();
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <Trophy className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Ganadores</h1>
                                <p className="text-gray-600">Gestiona los ganadores de tus sorteos</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowWinnerForm(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Agregar Ganador Manual</span>
                        </button>
                    </div>
                </div>

                {/* Realizar Sorteo */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Realizar un Sorteo Aleatorio</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="raffle-select" className="text-sm font-semibold text-gray-700 mb-1 block">
                                Selecciona un Sorteo Finalizado
                            </label>
                            <select 
                                id="raffle-select"
                                value={selectedRaffle}
                                onChange={(e) => { 
                                    setSelectedRaffle(e.target.value); 
                                    setWinner(null); 
                                    setError(null);
                                    setAnimationComplete(false);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isDrawing}
                            >
                                <option value="">-- Elige un sorteo --</option>
                                {finishedRaffles.map(r => (
                                    <option key={r.id} value={r.id}>{r.title}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleDraw}
                            disabled={!selectedRaffle || isDrawing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 disabled:bg-gray-400 transition-colors"
                        >
                            <Trophy className="w-5 h-5"/>
                            {isDrawing ? 'Sorteando...' : 'Realizar Sorteo'}
                        </button>
                    </div>
                </div>

                {/* Animación o Resultado */}
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6"
                        >
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
                                <p className="text-center text-red-600 font-semibold">{error}</p>
                            </div>
                        </motion.div>
                    )}
                    {showAnimation && !error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6"
                        >
                            <WinnerDrawAnimation
                                isRunning={isDrawing}
                                winnerNumber={winner?.ticket || null}
                                onComplete={handleAnimationComplete}
                            />
                        </motion.div>
                    )}
                    {!showAnimation && winner && !error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6"
                        >
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-2xl shadow-2xl p-8">
                                    <div className="text-center">
                                        <div className="flex justify-center mb-4">
                                            <Trophy className="h-20 w-20 text-yellow-500" />
                                        </div>
                                        
                                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                            ¡¡¡ GANADOR !!!
                                        </h2>
                                        
                                        {/* Boleto ganador destacado */}
                                        <div className="bg-white rounded-2xl shadow-xl border-4 border-yellow-400 p-8 mb-6 transform hover:scale-105 transition-transform">
                                            <p className="text-lg font-semibold text-gray-600 mb-2">Boleto Ganador</p>
                                            <p className="text-8xl font-bold text-yellow-500 my-4 drop-shadow-lg">
                                                {winner.ticket}
                                            </p>
                                            <div className="border-t-2 border-gray-200 pt-4 mt-4">
                                                <p className="text-2xl font-bold text-gray-900 mb-2">
                                                    {winner.order.customer?.name || winner.order.name}
                                                </p>
                                                <p className="text-sm text-gray-600">Folio: {winner.order.folio}</p>
                                                {winner.order.customer?.phone && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Teléfono: {winner.order.customer.phone}
                                                    </p>
                                                )}
                                                {winner.order.customer?.district && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Ciudad: {winner.order.customer.district}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Información del premio */}
                                        <div className="bg-blue-100 rounded-xl p-4 mb-6">
                                            <p className="text-lg font-semibold text-blue-900">
                                                Rifa: {finishedRaffles.find(r => r.id === selectedRaffle)?.title || 'Sin título'}
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Fecha de sorteo: {new Date(finishedRaffles.find(r => r.id === selectedRaffle)?.drawDate || new Date()).toLocaleDateString('es-ES', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        
                                        {/* Botones de acción */}
                                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                                            <button 
                                                onClick={() => { 
                                                    setWinner(null); 
                                                    setShowAnimation(false); 
                                                    setSelectedRaffle('');
                                                }} 
                                                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Volver a Seleccionar
                                            </button>
                                            <button 
                                                onClick={handleSaveWinner} 
                                                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Confirmar Ganador
                                            </button>
                                        </div>
                                    </div>
                                </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Historial de Ganadores */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Ganadores</h2>
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        ) : allWinners.length > 0 ? (
                            allWinners.map(w => (
                                <div key={w.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        {w.imageUrl && (
                                            <img 
                                                src={w.imageUrl} 
                                                alt={w.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                                            />
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900">{w.name}</p>
                                            <p className="text-sm text-gray-500">{w.raffleTitle}</p>
                                            {w.ticketNumber && (
                                                <p className="text-xs text-blue-600">Boleto: {w.ticketNumber}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteWinner(w.id)} 
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">Aún no hay ganadores registrados.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Agregar Ganador Manual */}
            <AnimatePresence>
                {showWinnerForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowWinnerForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <WinnerForm
                                    raffles={allRaffles}
                                    onSave={handleSaveManualWinner}
                                    onCancel={() => setShowWinnerForm(false)}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminWinnersPage;
