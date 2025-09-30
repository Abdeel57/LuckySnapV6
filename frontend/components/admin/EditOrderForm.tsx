import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Order } from '../../types';
import { User, Phone, Mail, MapPin, ShoppingCart, DollarSign, FileText, Save, X } from 'lucide-react';

interface EditOrderFormProps {
    order: Order;
    onSave: (updatedOrder: Order) => void;
    onCancel: () => void;
}

interface FormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerDistrict: string;
    status: string;
    notes: string;
    totalAmount: number;
}

const EditOrderForm: React.FC<EditOrderFormProps> = ({ order, onSave, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            customerName: order.customer.name,
            customerPhone: order.customer.phone,
            customerEmail: order.customer.email || '',
            customerDistrict: order.customer.district,
            status: order.status,
            notes: order.notes || '',
            totalAmount: order.totalAmount || order.total || 0
        }
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const updatedOrder: Order = {
                ...order,
                customer: {
                    ...order.customer,
                    name: data.customerName,
                    phone: data.customerPhone,
                    email: data.customerEmail,
                    district: data.customerDistrict
                },
                status: data.status,
                notes: data.notes,
                totalAmount: data.totalAmount,
                updatedAt: new Date()
            };
            
            onSave(updatedOrder);
        } catch (error) {
            console.error('Error updating order:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información del cliente */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Información del Cliente
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Completo
                        </label>
                        <input
                            {...register('customerName', { required: 'El nombre es requerido' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.customerName && (
                            <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono
                        </label>
                        <input
                            {...register('customerPhone', { 
                                required: 'El teléfono es requerido',
                                pattern: {
                                    value: /^\d{8}$/,
                                    message: 'Debe tener 8 dígitos'
                                }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.customerPhone && (
                            <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            {...register('customerEmail', {
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Email inválido'
                                }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.customerEmail && (
                            <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Distrito
                        </label>
                        <input
                            {...register('customerDistrict', { required: 'El distrito es requerido' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.customerDistrict && (
                            <p className="text-red-500 text-sm mt-1">{errors.customerDistrict.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Información de la orden */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
                    Información de la Orden
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <select
                            {...register('status', { required: 'El estado es requerido' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="PENDING">Pendiente</option>
                            <option value="COMPLETED">Completada</option>
                            <option value="CANCELLED">Cancelada</option>
                            <option value="EXPIRED">Expirada</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total (LPS)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('totalAmount', { 
                                required: 'El total es requerido',
                                min: { value: 0, message: 'El total debe ser mayor a 0' }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.totalAmount && (
                            <p className="text-red-500 text-sm mt-1">{errors.totalAmount.message}</p>
                        )}
                    </div>
                </div>
                
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas
                    </label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Notas adicionales sobre la orden..."
                    />
                </div>
            </div>

            {/* Información de solo lectura */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Información de Solo Lectura
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Folio:</span>
                        <span className="font-medium text-gray-900">{order.folio}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Boletos:</span>
                        <span className="font-medium text-gray-900">{order.tickets.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Fecha de Creación:</span>
                        <span className="font-medium text-gray-900">
                            {new Date(order.createdAt).toLocaleString('es-ES')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Fecha de Expiración:</span>
                        <span className="font-medium text-gray-900">
                            {new Date(order.expiresAt).toLocaleString('es-ES')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                </button>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
            </div>
        </form>
    );
};

export default EditOrderForm;
