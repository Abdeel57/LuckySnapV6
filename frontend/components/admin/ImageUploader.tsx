import React, { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
    value?: string;
    onChange: (imageUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('📁 Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'bytes');
        
        // Validar tamaño (2MB)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('La imagen excede el tamaño máximo de 2MB');
            console.error('❌ Imagen muy grande:', file.size, 'bytes');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Convertir a base64
            const base64 = await fileToBase64(file);
            
            // Subir al backend
            const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/upload/image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageData: base64 }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.url) {
                console.log('✅ Imagen subida correctamente:', result.url);
                onChange(result.url);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (err) {
            console.error('❌ Error subiendo imagen:', err);
            setError('Error al subir la imagen. Usando imagen placeholder.');
            
            // Fallback a placeholder
            const placeholderUrl = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop';
            onChange(placeholderUrl);
        } finally {
            setUploading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const removeImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange('');
    };

    const triggerFileInput = () => {
        document.getElementById('file-upload')?.click();
    };


    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-600 mb-1">Imagen Principal</label>
            {error && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ {error}
                </div>
            )}
            <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                onClick={triggerFileInput}
            >
                <div className="space-y-1 text-center">
                    {uploading ? (
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-2" />
                            <p className="text-sm text-gray-600">Subiendo imagen...</p>
                        </div>
                    ) : value ? (
                        <div className="relative group mx-auto">
                            <img src={value} alt="Preview" className="mx-auto h-40 w-auto rounded-md object-contain" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <button
                                    onClick={removeImage}
                                    type="button"
                                    className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 z-10"
                                    aria-label="Remove image"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <span
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                >
                                    <span>Sube un archivo</span>
                                </span>
                                <p className="pl-1">o arrástralo aquí</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF (máx. 2MB)</p>
                        </>
                    )}
                     <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
        </div>
    );
};

export default ImageUploader;
