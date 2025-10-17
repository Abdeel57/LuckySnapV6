// AdminCustomersPage.tsx - Componente para CLIENTES CONFIRMADOS
// Muestra solo órdenes con status === 'PAID'

import { useState, useEffect } from 'react';
import { getOrders, updateOrder, deleteOrder } from '../../services/api';

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
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
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    // Filtrar SOLO órdenes PAID (clientes confirmados)
    let filtered = orders.filter(order => order.status === 'PAID');

    // Aplicar búsqueda si existe
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.customer.name.toLowerCase().includes(search) ||
        order.customer.phone.includes(search) ||
        order.customer.email.toLowerCase().includes(search) ||
        order.customer.district.toLowerCase().includes(search)
      );
    }

    setFilteredOrders(filtered);
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
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes pagados'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Los clientes aparecerán aquí una vez que completen su pago'
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Información del Cliente */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {order.customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.customer.name}</h3>
                      <p className="text-sm text-gray-600">{order.customer.phone}</p>
                    </div>
                  </div>

                  {/* Detalles del Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{order.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Distrito</p>
                      <p className="font-medium">{order.customer.district}</p>
                    </div>
                  </div>

                  {/* Boletos y Monto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Boletos Comprados</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {order.tickets.map((ticket, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            #{ticket.number}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monto Total</p>
                      <p className="font-bold text-green-600">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  {/* Fecha de Compra */}
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Compra</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(order.id)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                  >
                    Ver Detalles
                  </button>
                  <button
                    onClick={() => handleEdit(order.id)}
                    disabled={refreshing}
                    className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={refreshing}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}