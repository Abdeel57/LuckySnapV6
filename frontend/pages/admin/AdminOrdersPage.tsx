import React, { useState, useEffect } from 'react';
import { adminGetAllOrders, adminUpdateOrderStatus } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { Search, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
// FIX: Corrected import path for 'es' locale.
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../../components/Spinner';

const OrderDetailModal = ({ order, onClose, onConfirmPayment, onCancelOrder }: { order: Order, onClose: () => void, onConfirmPayment: (folio: string) => void, onCancelOrder: (folio: string) => void }) => {
    return (
         <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Folio: {order.folio}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X /></button>
                </div>
                <div className="space-y-2 text-sm">
                    <p><span className="font-semibold text-gray-600">Nombre:</span> {order.name}</p>
                    <p><span className="font-semibold text-gray-600">Teléfono:</span> {order.phone}</p>
                    <p><span className="font-semibold text-gray-600">Departamento:</span> {order.state}</p>
                    <p><span className="font-semibold text-gray-600">Rifa:</span> {order.raffleTitle}</p>
                    <p><span className="font-semibold text-gray-600">Boletos:</span> {order.tickets.join(', ')}</p>
                    <p><span className="font-semibold text-gray-600">Total:</span> LPS {order.total.toFixed(2)}</p>
                    <p><span className="font-semibold text-gray-600">Fecha:</span> {format(order.createdAt, "P p", { locale: es })}</p>
                </div>
                {order.status === OrderStatus.PENDING && (
                    <div className="mt-6 border-t pt-4 space-y-2">
                        <button onClick={() => onConfirmPayment(order.folio)} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">
                            Confirmar Pago
                        </button>
                         <button onClick={() => onCancelOrder(order.folio)} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">
                            Cancelar Apartado
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}

const AdminOrdersPage = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
      setLoading(true);
      const data = await adminGetAllOrders();
      setAllOrders(data);
      setFilteredOrders(data);
      setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const results = allOrders.filter(order =>
        order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm)
    );
    setFilteredOrders(results);
  }, [searchTerm, allOrders]);

  const handleUpdateStatus = async (folio: string, status: OrderStatus) => {
    try {
        await adminUpdateOrderStatus(folio, status);
        fetchOrders(); 
        setSelectedOrder(null); 
    } catch (e) {
        alert("Error al actualizar el estado");
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Apartados</h1>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Ingrese el Folio, Nombre o Teléfono"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-10 pr-3 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <h2 className="text-lg font-bold text-gray-800 mb-2">Listado de apartados</h2>
      
      {loading ? (
          <div className="flex justify-center py-8"><Spinner/></div>
      ) : (
          <div className="space-y-2">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <button key={order.folio} onClick={() => setSelectedOrder(order)} className="w-full text-left flex justify-between items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 rounded-md">
                      <div>
                          <p className="font-semibold text-gray-800">{order.folio} - {order.name}</p>
                           <p className="text-sm text-gray-500">{order.raffleTitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         {/* FIX: Use OrderStatus enum for type-safe comparison instead of string literals. */}
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === OrderStatus.PAID ? 'bg-green-100 text-green-700' : order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span>
                         <ChevronRight size={20} className="text-gray-400" />
                      </div>
                  </button>
              )) : <p className="text-gray-500 p-3">No se encontraron apartados.</p>}
          </div>
      )}
       <AnimatePresence>
        {selectedOrder && <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onConfirmPayment={(folio) => handleUpdateStatus(folio, OrderStatus.PAID)}
            onCancelOrder={(folio) => handleUpdateStatus(folio, OrderStatus.CANCELLED)}
            />}
       </AnimatePresence>
    </div>
  );
};

export default AdminOrdersPage;