import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/api';
import { DollarSign, List, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import Spinner from '../../components/Spinner';

interface Stats {
    todaySales: number;
    pendingOrders: number;
    activeRaffles: number;
}

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-md flex items-center"
    >
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </motion.div>
);

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats().then(data => {
            setStats(data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load dashboard stats", err);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Inicio</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    icon={DollarSign}
                    title="Ventas de Hoy"
                    value={`LPS ${(stats?.todaySales ?? 0).toFixed(2)}`}
                    color="bg-green-500"
                />
                <StatCard
                    icon={List}
                    title="Apartados Pendientes"
                    value={stats?.pendingOrders ?? 0}
                    color="bg-yellow-500"
                />
                <StatCard
                    icon={Ticket}
                    title="Rifas Activas"
                    value={stats?.activeRaffles ?? 0}
                    color="bg-blue-500"
                />
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Bienvenido al Panel de Administración</h2>
                <p className="text-gray-600">
                    Desde aquí puedes gestionar todas las rifas, ver los apartados de boletos, seleccionar ganadores y configurar los ajustes del sitio. Utiliza el menú de navegación para acceder a las diferentes secciones.
                </p>
            </div>
        </div>
    );
};

export default AdminDashboardPage;