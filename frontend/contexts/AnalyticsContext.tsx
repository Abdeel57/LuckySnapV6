import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnalyticsData {
    // Métricas de usuarios
    totalVisitors: number;
    uniqueVisitors: number;
    returningVisitors: number;
    
    // Métricas de rifas
    totalRaffles: number;
    activeRaffles: number;
    completedRaffles: number;
    
    // Métricas de ventas
    totalSales: number;
    todaySales: number;
    monthlySales: number;
    
    // Métricas de conversión
    conversionRate: number;
    averageOrderValue: number;
    
    // Métricas de engagement
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
    
    // Datos temporales
    dailyStats: DailyStat[];
    monthlyStats: MonthlyStat[];
    topPages: PageStat[];
    deviceStats: DeviceStat[];
}

interface DailyStat {
    date: string;
    visitors: number;
    sales: number;
    orders: number;
}

interface MonthlyStat {
    month: string;
    visitors: number;
    sales: number;
    orders: number;
}

interface PageStat {
    page: string;
    views: number;
    uniqueViews: number;
}

interface DeviceStat {
    device: string;
    count: number;
    percentage: number;
}

interface AnalyticsContextType {
    data: AnalyticsData | null;
    isLoading: boolean;
    refreshData: () => Promise<void>;
    trackPageView: (page: string) => void;
    trackEvent: (event: string, data?: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Datos simulados para desarrollo (en producción vendrían de una API real)
const generateMockData = (): AnalyticsData => {
    const today = new Date();
    const dailyStats: DailyStat[] = [];
    const monthlyStats: MonthlyStat[] = [];
    
    // Generar datos de los últimos 30 días
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dailyStats.push({
            date: date.toISOString().split('T')[0],
            visitors: Math.floor(Math.random() * 200) + 50,
            sales: Math.floor(Math.random() * 5000) + 1000,
            orders: Math.floor(Math.random() * 50) + 10,
        });
    }
    
    // Generar datos de los últimos 12 meses
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        monthlyStats.push({
            month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            visitors: Math.floor(Math.random() * 5000) + 1000,
            sales: Math.floor(Math.random() * 50000) + 10000,
            orders: Math.floor(Math.random() * 500) + 100,
        });
    }
    
    return {
        totalVisitors: 15420,
        uniqueVisitors: 12350,
        returningVisitors: 3070,
        totalRaffles: 8,
        activeRaffles: 3,
        completedRaffles: 5,
        totalSales: 125000,
        todaySales: 2500,
        monthlySales: 45000,
        conversionRate: 3.2,
        averageOrderValue: 85.50,
        pageViews: 45680,
        averageSessionDuration: 4.5,
        bounceRate: 35.2,
        dailyStats,
        monthlyStats,
        topPages: [
            { page: '/', views: 12500, uniqueViews: 8900 },
            { page: '/sorteo/iphone-15-pro-max', views: 8500, uniqueViews: 6200 },
            { page: '/verificador', views: 3200, uniqueViews: 2800 },
            { page: '/cuentas-de-pago', views: 2100, uniqueViews: 1900 },
        ],
        deviceStats: [
            { device: 'Móvil', count: 8500, percentage: 55.1 },
            { device: 'Desktop', count: 5200, percentage: 33.7 },
            { device: 'Tablet', count: 1720, percentage: 11.2 },
        ],
    };
};

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadAnalyticsData = async () => {
        setIsLoading(true);
        try {
            // Simular delay de carga
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockData = generateMockData();
            setData(mockData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = async () => {
        await loadAnalyticsData();
    };

    const trackPageView = (page: string) => {
        // En producción, esto enviaría datos a un servicio de analytics
        console.log('Page view tracked:', page);
    };

    const trackEvent = (event: string, data?: any) => {
        // En producción, esto enviaría eventos a un servicio de analytics
        console.log('Event tracked:', event, data);
    };

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const value: AnalyticsContextType = {
        data,
        isLoading,
        refreshData,
        trackPageView,
        trackEvent,
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};
