import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderAdvancedProps {
  value?: string;
  onChange: (base64: string) => void;
  placeholder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  accept?: string;
}

const ImageUploaderAdvanced: React.FC<ImageUploaderAdvancedProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar imagen",
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8,
  accept = "image/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  // Sincronizar preview con value cuando cambie desde fuera (ej: reset del formulario)
  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  // Función para redimensionar imagen manteniendo transparencia
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

        // Detectar si la imagen tiene transparencia
        const isTransparent = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp';
        
        // Para formatos sin transparencia (JPEG), llenar con fondo blanco
        if (!isTransparent && ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a base64 manteniendo formato original si tiene transparencia
        let base64: string;
        if (isTransparent) {
          // Usar PNG para mantener transparencia (sin fondo blanco)
          base64 = canvas.toDataURL('image/png');
        } else {
          // Usar JPEG para formatos sin transparencia
          base64 = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('📁 Procesando imagen:', {
        nombre: file.name,
        tamaño: Math.round(file.size / 1024) + 'KB',
        tipo: file.type
      });

      // Redimensionar imagen
      const optimizedBase64 = await resizeImage(file);
      
      console.log('✅ Imagen optimizada:', {
        tamañoOriginal: Math.round(file.size / 1024) + 'KB',
        tamañoOptimizado: Math.round(optimizedBase64.length * 0.75 / 1024) + 'KB', // Aproximación
        dimensiones: `${maxWidth}x${maxHeight}`
      });

      // Actualizar preview y valor
      setPreview(optimizedBase64);
      onChange(optimizedBase64);

    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      alert('Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Botón de subida */}
      <div
        onClick={triggerFileInput}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${preview 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Procesando imagen...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded-lg shadow-md bg-transparent"
              style={{ mixBlendMode: 'normal' }}
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload size={32} className="text-gray-400" />
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF hasta 10MB
            </p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      {preview && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>✅ Imagen optimizada y redimensionada</p>
          <p>📏 Dimensiones máximas: {maxWidth}x{maxHeight}px</p>
          <p>🎯 Calidad: {Math.round(quality * 100)}%</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploaderAdvanced;
