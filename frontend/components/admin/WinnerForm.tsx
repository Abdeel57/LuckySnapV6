import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, User, Award, Calendar, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Raffle } from '../../types';

interface WinnerFormProps {
    raffles: Raffle[];
    onSave: (winnerData: any) => void;
    onCancel: () => void;
}

const WinnerForm: React.FC<WinnerFormProps> = ({ raffles, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        raffleId: '',
        ticketNumber: '',
        phone: '',
        city: '',
        testimonial: '',
        imageFile: null as File | null,
        imagePreview: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const selectedRaffle = raffles.find(r => r.id === formData.raffleId);
            if (!selectedRaffle) {
                alert('Por favor selecciona un sorteo');
                return;
            }

            // Convertir imagen a base64 si existe
            let imageUrl = selectedRaffle.heroImage || '';
            if (formData.imageFile) {
                try {
                    const base64 = await convertFileToBase64(formData.imageFile);
                    imageUrl = `data:${formData.imageFile.type};base64,${base64}`;
                } catch (error) {
                    console.error('Error converting image:', error);
                    alert('Error al procesar la imagen. Usando imagen por defecto.');
                }
            } else if (formData.imagePreview) {
                imageUrl = formData.imagePreview;
            }

            const winnerData = {
                name: formData.name,
                raffleId: formData.raffleId,
                raffleTitle: selectedRaffle.title,
                prize: selectedRaffle.title,
                drawDate: new Date(),
                ticketNumber: formData.ticketNumber ? parseInt(formData.ticketNumber) : undefined,
                phone: formData.phone || undefined,
                city: formData.city || undefined,
                testimonial: formData.testimonial || undefined,
                imageUrl: imageUrl
            };

            await onSave(winnerData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                // Remover el prefijo "data:image/...;base64,"
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Agregar Ganador Manual</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Selector de Sorteo */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Award className="w-4 h-4 inline mr-2" />
                    Sorteo *
                </label>
                <select
                    name="raffleId"
                    value={formData.raffleId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                >
                    <option value="">-- Selecciona un sorteo --</option>
                    {raffles.map(raffle => (
                        <option key={raffle.id} value={raffle.id}>{raffle.title}</option>
                    ))}
                </select>
            </div>

            {/* Nombre */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre del Ganador *
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre completo"
                    required
                />
            </div>

            {/* Número de Boleto */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Boleto Ganador
                </label>
                <input
                    type="number"
                    name="ticketNumber"
                    value={formData.ticketNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 42"
                />
            </div>

            {/* Información de Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Teléfono
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: 99999999"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Ciudad
                    </label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Tegucigalpa"
                    />
                </div>
            </div>

            {/* Imagen del Ganador */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Foto del Ganador
                </label>
                <div className="flex items-center gap-4">
                    {formData.imagePreview && (
                        <motion.img
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={formData.imagePreview}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                        {formData.imagePreview ? 'Cambiar Foto' : 'Subir Foto'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Sube una foto del ganador para generar confianza
                </p>
            </div>

            {/* Testimonio */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Testimonio (Opcional)
                </label>
                <textarea
                    name="testimonial"
                    value={formData.testimonial}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Un testimonio del ganador sobre cómo se sintió al ganar..."
                />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar Ganador'}
                </button>
            </div>
        </form>
    );
};

export default WinnerForm;
