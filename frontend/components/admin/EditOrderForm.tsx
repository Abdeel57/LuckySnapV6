import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Order } from '../../types';
import { User, Phone, MapPin, ShoppingCart, DollarSign, FileText, Save, X } from 'lucide-react';

interface EditOrderFormProps {
    order: Order;
    onSave: (updatedOrder: Order) => void;
    onCancel: () => void;
}

interface FormData {
    customerName: string;
    customerPhone: string;
    customerDistrict: string;
    notes: string;
}

const EditOrderForm: React.FC<EditOrderFormProps> = ({ order, onSave, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            customerName: order.customer?.name || '',
            customerPhone: order.customer?.phone || '',
            customerDistrict: order.customer?.district || '',
            notes: order.notes || ''
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
                    district: data.customerDistrict,
                    email: order.customer?.email || ''
                },
                notes: data.notes,
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
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Información Importante
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>• El <strong>estado</strong> se controla con los botones "Marcar Pagado" y "Liberar"</p>
                                <p>• El <strong>total</strong> no se puede modificar una vez creada la orden</p>
                                <p>• Solo puedes editar los datos del cliente y las notas</p>
                            </div>
                        </div>
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
                        <span className="text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'PAID' || order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            order.status === 'RELEASED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {order.status}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-green-600">
                            ${(order.totalAmount || order.total || 0).toLocaleString()}
                        </span>
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
                    {order.expiresAt && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Fecha de Expiración:</span>
                            <span className="font-medium text-gray-900">
                                {new Date(order.expiresAt).toLocaleString('es-ES')}
                            </span>
                        </div>
                    )}
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
