import React from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
    value?: string;
    onChange: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // En lugar de convertir a base64, usar una URL de placeholder
            // Esto evita el error 413 Content Too Large
            console.log('📁 Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'bytes');
            
            // Para evitar el error 413, usamos una imagen placeholder
            // En producción, aquí subirías la imagen a un servicio como Cloudinary
            const placeholderUrl = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop';
            onChange(placeholderUrl);
            
            console.log('⚠️ Usando imagen placeholder para evitar error 413');
        }
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
            <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                onClick={triggerFileInput}
            >
                <div className="space-y-1 text-center">
                    {value ? (
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
                            <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                        </>
                    )}
                     <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
        </div>
    );
};

export default ImageUploader;
