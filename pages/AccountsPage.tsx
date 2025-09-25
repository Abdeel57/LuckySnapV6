import React, { useState, useEffect } from 'react';
import PageAnimator from '../components/PageAnimator';
import { adminGetAllOrders } from '../services/api'; // Using admin for demo
import { Order } from '../types';
import OrderHistoryCard from '../components/OrderHistoryCard';
import Spinner from '../components/Spinner';

const AccountsPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would be getOrdersByUserId() or similar
        // For this demo, we fetch all and filter client-side to simulate a user's orders
        adminGetAllOrders().then(data => {
            // This filtering is a stand-in for fetching a specific user's data
            setOrders(data.filter(o => o.folio.endsWith('0') || o.folio.endsWith('5')));
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch orders", err);
            setLoading(false);
        });
    }, []);

  return (
    <PageAnimator>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Mi Cuenta</h1>
        
        <div className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg">
             <h2 className="text-xl font-bold text-white mb-4">Mi Historial de Boletos</h2>
            {loading ? <Spinner /> : (
                <div className="space-y-4">
                    {orders.length > 0 ? (
                        orders.map(order => <OrderHistoryCard key={order.folio} order={order} />)
                    ) : (
                        <p className="text-slate-400">Aún no has participado en ningún sorteo.</p>
                    )}
                </div>
            )}
        </div>
      </div>
    </PageAnimator>
  );
};

export default AccountsPage;
