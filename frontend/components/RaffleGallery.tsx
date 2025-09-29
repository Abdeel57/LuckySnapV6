import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
                {/* Imagen principal */}
                <div className="relative group">
                    <img
                        src={images[currentIndex] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                        alt={`${title} - Imagen ${currentIndex + 1}`}
                        className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => openModal(currentIndex)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                        }}
                    />
                    
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

                {/* Controles de navegación */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Siguiente imagen"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Miniaturas */}
                {images.length > 1 && (
                    <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                    index === currentIndex 
                                        ? 'border-accent ring-2 ring-accent ring-opacity-50' 
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <img
                                    src={image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}
                                    alt={`${title} - Miniatura ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
                                    }}
                                />
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
