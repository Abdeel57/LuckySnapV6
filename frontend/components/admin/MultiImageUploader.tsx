import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiImageUploaderProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
    images = [],
    onChange,
    maxImages = 10,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Función para redimensionar imagen
    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo proporción
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                // Configurar canvas
                canvas.width = width;
                canvas.height = height;

                // Dibujar imagen redimensionada
                ctx?.drawImage(img, 0, 0, width, height);

                // Convertir a base64 con calidad optimizada
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };

            img.onerror = () => reject(new Error('Error al cargar la imagen'));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        // Validar número máximo de imágenes
        if (images.length + files.length > maxImages) {
            alert(`Máximo ${maxImages} imágenes permitidas`);
            return;
        }

        // Validar tipos de archivo
        const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            alert('Por favor selecciona solo archivos de imagen válidos');
            return;
        }

        // Validar tamaño (máximo 10MB por imagen)
        const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            alert('Algunas imágenes son demasiado grandes. Máximo 10MB por imagen');
            return;
        }

        setIsProcessing(true);

        try {
            console.log('📁 Procesando imágenes:', {
                cantidad: files.length,
                tamañoTotal: Math.round(files.reduce((sum, file) => sum + file.size, 0) / 1024) + 'KB'
            });

            const processedImages: string[] = [];
            
            for (const file of files) {
                const optimizedBase64 = await resizeImage(file);
                processedImages.push(optimizedBase64);
            }

            console.log('✅ Imágenes procesadas:', {
                cantidad: processedImages.length,
                tamañoPromedio: Math.round(processedImages.reduce((sum, img) => sum + img.length, 0) / processedImages.length * 0.75 / 1024) + 'KB'
            });

            // Agregar las nuevas imágenes
            const newImages = [...images, ...processedImages];
            onChange(newImages);

        } catch (error) {
            console.error('❌ Error procesando imágenes:', error);
            alert('Error al procesar las imágenes');
        } finally {
            setIsProcessing(false);
            // Limpiar el input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    const setMainImage = (index: number) => {
        if (index === 0) return; // Ya es la principal
        
        const newImages = [...images];
        [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
        onChange(newImages);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {/* Input de archivos oculto */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Botón de subir */}
            <div
                onClick={triggerFileInput}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2"></div>
                        <p className="text-sm text-gray-600">Procesando imágenes...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                            Haz clic para subir imágenes
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Máximo {maxImages} imágenes, 10MB cada una
                        </p>
                    </div>
                )}
            </div>

            {/* Galería de imágenes */}
            {images.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                        Imágenes ({images.length}/{maxImages})
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images.map((image, index) => (
                            <motion.div
                                key={index}
                                className="relative group"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Imagen */}
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                                    <img
                                        src={image}
                                        alt={`Imagen ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Overlay con controles */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                                        {/* Botón para hacer principal */}
                                        {index !== 0 && (
                                            <button
                                                onClick={() => setMainImage(index)}
                                                className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                                                title="Hacer imagen principal"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        {/* Botón eliminar */}
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                            title="Eliminar imagen"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Indicador de imagen principal */}
                                {index === 0 && (
                                    <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                        Principal
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Información adicional */}
                    <div className="text-xs text-gray-500">
                        <p>• La primera imagen será la imagen principal del sorteo</p>
                        <p>• Las demás imágenes aparecerán en la galería</p>
                        <p>• Haz clic en la estrella para cambiar la imagen principal</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiImageUploader;
