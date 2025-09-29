import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/gallery.css';

interface RaffleGalleryProps {
    images: string[];
    title: string;
    className?: string;
}

const RaffleGallery: React.FC<RaffleGalleryProps> = ({ images, title, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
                <span className="text-gray-500">Sin imágenes</span>
            </div>
        );
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const openModal = (index: number) => {
        setCurrentIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Galería principal */}
            <div className={`relative ${className}`}>
                {/* Imagen principal con diseño creativo */}
                <div className="relative group">
                    {/* Contenedor con aspecto cuadrado y efectos visuales */}
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl border-2 border-slate-700/50 gallery-hover-effect gradient-border">
                        <div className="gradient-border-inner w-full h-full">
                        {/* Efecto de brillo sutil */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                        
                        {/* Imagen principal */}
                        <img
                            src={images[currentIndex] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                            alt={`${title} - Imagen ${currentIndex + 1}`}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                            onClick={() => openModal(currentIndex)}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                            }}
                        />
                        
                        {/* Overlay con información elegante */}
                        {images.length > 1 && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white text-sm font-medium">
                                                {currentIndex + 1} de {images.length}
                                            </span>
                                            <div className="flex space-x-1">
                                                {images.map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                                            index === currentIndex 
                                                                ? 'bg-white' 
                                                                : 'bg-white/40'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Indicador de galería */}
                        {images.length > 1 && (
                            <div className="absolute top-4 right-4 glass-effect rounded-full px-3 py-1">
                                <span className="text-white text-xs font-medium">
                                    {images.length} fotos
                                </span>
                            </div>
                        )}
                        </div>
                    </div>
                    
                    {/* Overlay con información */}
                    {images.length > 1 && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                                    {currentIndex + 1} de {images.length}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controles de navegación elegantes */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 glass-effect text-white p-3 rounded-full hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-lg pulse-glow"
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 glass-effect text-white p-3 rounded-full hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-lg pulse-glow"
                            aria-label="Siguiente imagen"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Miniaturas elegantes */}
                {images.length > 1 && (
                    <div className="flex space-x-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${
                                    index === currentIndex 
                                        ? 'border-accent ring-4 ring-accent/30 shadow-lg shadow-accent/20' 
                                        : 'border-slate-600 hover:border-slate-400 shadow-md'
                                }`}
                            >
                                <img
                                    src={image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                    alt={`${title} - Miniatura ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                    }}
                                />
                                {/* Indicador de imagen activa */}
                                {index === currentIndex && (
                                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-accent rounded-full shadow-lg"></div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de imagen completa */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <div className="relative max-w-4xl max-h-full">
                            {/* Botón cerrar */}
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                                aria-label="Cerrar"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Imagen en modal */}
                            <motion.img
                                key={currentIndex}
                                src={images[currentIndex] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                alt={`${title} - Imagen ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                }}
                            />

                            {/* Controles en modal */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            prevImage();
                                        }}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                                        aria-label="Imagen anterior"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            nextImage();
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                                        aria-label="Siguiente imagen"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Indicador de posición */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                    {currentIndex + 1} de {images.length}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RaffleGallery;
