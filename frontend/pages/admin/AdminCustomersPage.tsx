// AdminCustomersPage.tsx - Componente para CLIENTES CONFIRMADOS
// Muestra solo órdenes con status === 'COMPLETED'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Mail,
  DollarSign
} from 'lucide-react';
import { Order, Raffle } from '../../types';
import { getOrders, updateOrder, deleteOrder, markOrderPaid, getRaffles } from '../../services/api';

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Cargar órdenes al montar
  useEffect(() => {
    loadOrders();
  }, []);

  // Actualizar órdenes filtradas cuando cambien
  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, rafflesData] = await Promise.all([
        getOrders(),
        getRaffles()
      ]);
      setOrders(ordersData || []);
      setRaffles(rafflesData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    // Filtrar SOLO órdenes COMPLETED (clientes confirmados)
    let filtered = orders.filter(order => order.status === 'COMPLETED');

    // Aplicar búsqueda si existe
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.customer.name.toLowerCase().includes(search) ||
        order.customer.phone.includes(search) ||
        order.customer.email?.toLowerCase().includes(search) ||
        order.customer.district.toLowerCase().includes(search)
      );
    }

    setFilteredOrders(filtered);
  };

  // Obtener rifa por ID
  const getRaffleById = (raffleId: string) => {
    return raffles.find(r => r.id === raffleId);
  };

  const handleEdit = async (orderId) => {
    try {
      setRefreshing(true);
      // Lógica para editar cliente
      console.log('Editar cliente:', orderId);
      alert('Función de edición en desarrollo');
    } catch (error) {
      console.error('Error editing customer:', error);
      alert(`Error al editar cliente: ${error.message || 'Error desconocido'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        setRefreshing(true);
        await deleteOrder(orderId);
        await loadOrders(); // Recargar datos
        alert('Cliente eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert(`Error al eliminar cliente: ${error.message || 'Error desconocido'}`);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleViewDetails = (orderId) => {
    // Lógica para ver detalles
    console.log('Ver detalles del cliente:', orderId);
    alert('Función de detalles en desarrollo');
  };

  // Estadística: Solo cuenta PAID
  const totalCustomers = orders.filter(o => o.status === 'PAID').length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clientes Confirmados</h1>
            <p className="text-gray-600">Clientes que han completado su pago</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-green-600">{totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, email o distrito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadOrders}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <span>🔄</span>
            )}
            Actualizar
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              {/* Header con folio y estado */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.folio}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('es-ES')} - {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  {order.status}
                </span>
              </div>

              {/* Información del cliente */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Cliente
                </h4>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{order.customer.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{order.customer.phone}</span>
                  </div>
                  {order.customer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{order.customer.email}</span>
                    </div>
                  )}
                  {order.customer.district && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{order.customer.district}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de la orden */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                  Detalles
                </h4>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rifa:</span>
                    <span className="font-medium text-gray-900">{getRaffleById(order.raffleId)?.title || 'Rifa no encontrada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boletos:</span>
                    <span className="font-medium text-gray-900">{order.tickets.length} ({order.tickets.join(', ')})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-green-600 text-lg">
                      ${(order.totalAmount || order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleViewDetails(order.id)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver</span>
                </button>
                <button
                  onClick={() => handleEdit(order.id)}
                  disabled={refreshing}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                >
                  <span>Editar</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes confirmados</h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'No se encontraron clientes con los filtros aplicados'
                : 'Los clientes aparecerán aquí una vez que completen su pago'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}