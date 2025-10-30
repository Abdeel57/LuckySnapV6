import {
  Raffle,
  Order,
  Winner,
  Settings,
  OrderStatus,
  AdminUser,
} from '../types';

// --- IMPORTANTE ---
// Esta URL se configura automáticamente según el entorno
// En desarrollo: http://localhost:3000/api (con proxy de Vite)
// En producción: se toma de la variable de entorno VITE_API_URL
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// Debug: Log the API URL being used
console.log('🔗 API URL being used:', API_URL);
console.log('🌍 Environment:', (import.meta as any).env?.MODE);
console.log('📋 VITE_API_URL from env:', (import.meta as any).env?.VITE_API_URL);
console.log('📋 All env vars:', (import.meta as any).env);

/**
 * A robust response handler for fetch requests.
 */
const handleResponse = async (response: Response) => {
    // For 204 No Content, which is common for DELETE, return success without parsing JSON.
    if (response.status === 204) {
        return;
    }

    if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
            // Attempt to get a more specific error from the response body
            const errorBody = await response.json();
            errorMessage = errorBody.message || JSON.stringify(errorBody);
        } catch (e) {
            // The body was not JSON or another error occurred.
            // The initial error message is the best we have.
        }
        throw new Error(errorMessage);
    }

    // If the response is OK, parse the JSON body.
    return response.json();
};

const parseDates = (data: any, fields: string[]): any => {
    if (!data) return data;
    const parsedData = { ...data };
    fields.forEach(field => {
        if (parsedData[field]) {
            parsedData[field] = new Date(parsedData[field]);
        }
    });
    return parsedData;
}

const parseOrderDates = (order: any) => parseDates(order, ['createdAt', 'expiresAt']);
const parseRaffleDates = (raffle: any) => parseDates(raffle, ['drawDate']);
const parseWinnerDates = (winner: any) => parseDates(winner, ['drawDate']);


// --- Public API Calls ---

export const getActiveRaffles = async (): Promise<Raffle[]> => {
    try {
        console.log('Trying backend for active raffles...');
        const response = await fetch(`${API_URL}/public/raffles/active`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend raffles loaded successfully:', data);
            
            // Ensure we return an array
            if (Array.isArray(data)) {
                return data.map(parseRaffleDates);
            } else if (data.raffles && Array.isArray(data.raffles)) {
                return data.raffles.map(parseRaffleDates);
            } else {
                console.log('⚠️ Unexpected data format, returning empty array');
                return [];
            }
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for active raffles');
    const { localApi } = await import('./localApi');
    return localApi.getRaffles();
};

export const getRaffleBySlug = async (slug: string): Promise<Raffle | undefined> => {
    try {
        console.log('🔍 Trying backend for raffle by slug:', slug);
        const response = await fetch(`${API_URL}/public/raffles/slug/${slug}`);
        const raffle = await handleResponse(response);
        console.log('✅ Backend raffle by slug loaded successfully:', { id: raffle?.id, title: raffle?.title });
        return parseDates(raffle, ['drawDate', 'createdAt', 'updatedAt']);
    } catch (error) {
        console.error('❌ Backend error for raffle by slug:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for raffle by slug');
    const { localApi } = await import('./localApi');
    const raffles = await localApi.getRaffles();
    return raffles.find(r => r.slug === slug);
};

export const getRaffleById = async (id: string): Promise<Raffle | undefined> => {
    try {
        console.log('🔍 Trying backend for raffle by ID:', id);
        const response = await fetch(`${API_URL}/public/raffles/${id}`);
        const raffle = await handleResponse(response);
        console.log('✅ Backend raffle by ID loaded successfully:', { id: raffle?.id, title: raffle?.title });
        return parseDates(raffle, ['drawDate', 'createdAt', 'updatedAt']);
    } catch (error) {
        console.error('❌ Backend error for raffle by ID:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for raffle by ID');
    const { localApi } = await import('./localApi');
    const raffles = await localApi.getRaffles();
    return raffles.find(r => r.id === id);
};

export const getOccupiedTickets = async (raffleId: string): Promise<number[]> => {
    try {
        console.log('🔍 Trying backend for occupied tickets:', raffleId);
        const response = await fetch(`${API_URL}/public/raffles/${raffleId}/occupied-tickets`);
        const tickets = await handleResponse(response);
        console.log('✅ Backend occupied tickets loaded successfully:', tickets?.length || 0);
        return tickets || [];
    } catch (error) {
        console.error('❌ Backend error for occupied tickets:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for occupied tickets');
    return [];
};

export const getPastWinners = async (): Promise<Winner[]> => {
    try {
        console.log('Trying backend for past winners...');
        const response = await fetch(`${API_URL}/public/winners`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend winners loaded successfully:', data);
            
            // Ensure we return an array
            if (Array.isArray(data)) {
                return data.map(parseWinnerDates);
            } else if (data.winners && Array.isArray(data.winners)) {
                return data.winners.map(parseWinnerDates);
            } else {
                console.log('⚠️ Unexpected winners format, returning empty array');
                return [];
            }
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for winners');
    const { localApi } = await import('./localApi');
    return localApi.getWinners();
};

export const getSettings = async (): Promise<Settings> => {
    try {
        console.log('Trying backend for settings...');
        const response = await fetch(`${API_URL}/public/settings`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend settings loaded successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for settings');
    const { localApi } = await import('./localApi');
    return localApi.getSettings();
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
    try {
        console.log('Trying backend for update settings...');
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend settings updated successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for update settings');
    const { localApi } = await import('./localApi');
    return localApi.updateSettings(settings);
};

// --- Admin API Calls ---

export const createRaffle = async (raffle: any): Promise<Raffle> => {
    try {
        console.log('🚀 Trying backend for create raffle...');
        console.log('📤 Payload:', raffle);
        
        const response = await fetch(`${API_URL}/admin/raffles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(raffle),
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Backend raffle created successfully');
            
            // Si la respuesta tiene estructura { success, data }, extraer data
            if (result.success && result.data) {
                return result.data;
            }
            return result;
        } else {
            const errorText = await response.text();
            console.log('❌ Backend returned error status:', response.status);
            console.log('❌ Error details:', errorText);
            
            // Intentar parsear el error como JSON
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || 'Error al crear la rifa');
            } catch {
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        if (error instanceof Error) {
            throw error; // Re-lanzar el error para que se maneje en el componente
        }
        throw new Error('Error desconocido al crear la rifa');
    }
};

export const updateRaffle = async (id: string, raffle: Partial<Raffle>): Promise<Raffle> => {
    try {
        console.log('Trying backend for update raffle...');
        console.log('Update payload:', { id, raffle });
        
        const response = await fetch(`${API_URL}/admin/raffles/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(raffle),
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Backend raffle updated successfully');
            
            // Si la respuesta tiene estructura { success, data }, extraer data
            if (result.success && result.data) {
                return result.data;
            }
            return result;
        } else {
            const errorText = await response.text();
            console.log('❌ Backend returned error status:', response.status);
            console.log('❌ Error details:', errorText);
            
            // Intentar parsear el error como JSON
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || 'Error al actualizar la rifa');
            } catch {
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        if (error instanceof Error) {
            throw error; // Re-lanzar el error para que se maneje en el componente
        }
        throw new Error('Error desconocido al actualizar la rifa');
    }
};

export const verifyTicket = async (data: { codigo_qr?: string; numero_boleto?: number; sorteo_id?: string }): Promise<any> => {
    try {
        console.log('🔍 Verifying ticket:', data);
        
        const response = await fetch(`${API_URL}/public/verificar-boleto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Ticket verification successful');
            return result.data;
        } else {
            const errorText = await response.text();
            console.log('❌ Backend returned error status:', response.status);
            console.log('❌ Error details:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || 'Error al verificar el boleto');
            } catch {
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Error desconocido al verificar el boleto');
    }
};

export const searchTickets = async (criteria: {
    numero_boleto?: number;
    nombre_cliente?: string;
    telefono?: string;
    folio?: string;
}): Promise<any> => {
    try {
        console.log('🔍 Buscando boletos con criterios:', criteria);
        
        const response = await fetch(`${API_URL}/public/buscar-boletos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(criteria),
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ 
                message: `Error ${response.status}: ${response.statusText}` 
            }));
            throw new Error(error.message || 'Error al buscar boletos');
        }
        
        const result = await response.json();
        console.log('✅ Búsqueda exitosa:', result);
        
        // El backend devuelve { success: true, data: {...} }
        return result.data || result;
    } catch (error) {
        console.error('❌ Error searching tickets:', error);
        throw error instanceof Error ? error : new Error('Error desconocido al buscar boletos');
    }
};

export const downloadTickets = async (raffleId: string, tipo: 'apartados' | 'pagados', formato: 'csv' | 'excel' = 'csv'): Promise<void> => {
    try {
        console.log('📥 Downloading tickets:', { raffleId, tipo, formato });
        
        const response = await fetch(`${API_URL}/admin/raffles/${raffleId}/boletos/${tipo}/descargar?formato=${formato}`, {
            method: 'GET',
        });
        
        if (response.ok) {
            console.log('✅ Tickets downloaded successfully');
            
            // Obtener el nombre del archivo del header Content-Disposition
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `boletos-${tipo}-${raffleId}.${formato === 'excel' ? 'xlsx' : 'csv'}`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // Obtener el tipo de contenido
            const contentType = response.headers.get('Content-Type') || 
                (formato === 'excel' 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    : 'text/csv');
            
            // Obtener el contenido como blob
            const blob = await response.blob();
            
            // Crear y descargar archivo
            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ File downloaded:', filename);
            
        } else {
            const errorText = await response.text();
            console.log('❌ Backend returned error status:', response.status);
            console.log('❌ Error details:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || 'Error al descargar boletos');
            } catch {
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Error desconocido al descargar boletos');
    }
};

export const deleteRaffle = async (id: string): Promise<void> => {
    try {
        console.log('Trying backend for delete raffle...');
        const response = await fetch(`${API_URL}/admin/raffles/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log('✅ Backend raffle deleted successfully');
            return;
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
            
            // Intentar parsear el error como JSON
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || 'Error al eliminar la rifa');
            } catch {
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        if (error instanceof Error) {
            throw error; // Re-lanzar el error para que se maneje en el componente
        }
        throw new Error('Error desconocido al eliminar la rifa');
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for delete raffle');
    const { localApi } = await import('./localApi');
    return localApi.deleteRaffle(id);
};

export const getRaffles = async (): Promise<Raffle[]> => {
    try {
        console.log('Trying backend for get raffles...');
        const response = await fetch(`${API_URL}/admin/raffles`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend raffles loaded successfully');
            return data;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for get raffles');
    const { localApi } = await import('./localApi');
    return localApi.getRaffles();
};

export const getUsers = async (): Promise<AdminUser[]> => {
    try {
        console.log('🔍 Obteniendo usuarios del backend...');
        const response = await fetch(`${API_URL}/admin/users`);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ 
                message: `Error ${response.status}: ${response.statusText}` 
            }));
            throw new Error(error.message || `Error al obtener usuarios: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Usuarios obtenidos exitosamente:', data.length || 0);
        
        // El backend devuelve un array directo de usuarios (sin password)
        // Validar que es un array
        if (!Array.isArray(data)) {
            throw new Error('Respuesta del servidor en formato incorrecto');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
        throw error instanceof Error ? error : new Error('Error desconocido al obtener usuarios');
    }
};

export const createUser = async (user: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser> => {
    try {
        console.log('➕ Creando usuario en el backend...', { username: user.username, role: user.role });
        
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        
        if (!response.ok) {
            // Intentar obtener mensaje de error del backend
            const error = await response.json().catch(() => ({ 
                message: `Error ${response.status}: ${response.statusText}` 
            }));
            
            // El backend devuelve { message: string } en caso de error
            const errorMessage = error.message || error.error || `Error al crear usuario: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Usuario creado exitosamente');
        
        // El backend devuelve { success: true, message: string, data: AdminUser }
        if (result.data) {
            return result.data;
        }
        
        // Si no viene en formato estructurado, asumir que es el usuario directamente
        return result;
    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        throw error instanceof Error ? error : new Error('Error desconocido al crear usuario');
    }
};

export const updateUser = async (id: string, user: Partial<AdminUser>): Promise<AdminUser> => {
    try {
        console.log('🔧 Actualizando usuario en el backend...', { id, updates: Object.keys(user) });
        
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        
        if (!response.ok) {
            // Intentar obtener mensaje de error del backend
            const error = await response.json().catch(() => ({ 
                message: `Error ${response.status}: ${response.statusText}` 
            }));
            
            // El backend devuelve { message: string } en caso de error
            const errorMessage = error.message || error.error || `Error al actualizar usuario: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Usuario actualizado exitosamente');
        
        // El backend devuelve { success: true, message: string, data: AdminUser }
        if (result.data) {
            return result.data;
        }
        
        // Si no viene en formato estructurado, asumir que es el usuario directamente
        return result;
    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
        throw error instanceof Error ? error : new Error('Error desconocido al actualizar usuario');
    }
};

export const deleteUser = async (id: string): Promise<void> => {
    try {
        console.log('🗑️ Eliminando usuario en el backend...', { id });
        
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            // Intentar obtener mensaje de error del backend
            const error = await response.json().catch(() => ({ 
                message: `Error ${response.status}: ${response.statusText}` 
            }));
            
            // El backend devuelve { message: string } en caso de error
            const errorMessage = error.message || error.error || `Error al eliminar usuario: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // El backend devuelve { success: true, message: string }
        const result = await response.json().catch(() => ({}));
        console.log('✅ Usuario eliminado exitosamente');
        
        // No necesitamos retornar nada en delete
        return;
    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        throw error instanceof Error ? error : new Error('Error desconocido al eliminar usuario');
    }
};


export const getOrderbyFolio = async (folio: string): Promise<Order | undefined> => {
     try {
        const data = await handleResponse(await fetch(`${API_URL}/public/orders/folio/${folio}`));
        return data ? parseOrderDates(data) : undefined;
    } catch (e) {
        // If the order is not found (404), handleResponse will throw. We return undefined.
        return undefined;
    }
};

// --- Admin API Calls ---

export const getDashboardStats = async () => {
    return handleResponse(await fetch(`${API_URL}/admin/stats`));
};

// --- Analytics API Calls ---

export interface SalesTrend {
    date: string;
    sales: number;
    orders: number;
    revenue: number;
}

export interface CustomerInsight {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    topCustomers: Array<{
        id: string;
        name: string;
        email: string;
        totalSpent: number;
        orderCount: number;
        lastOrder: Date;
    }>;
}

export interface ConversionFunnel {
    visitors: number;
    interested: number;
    addedToCart: number;
    initiatedCheckout: number;
    completedPurchase: number;
    conversionRate: number;
}

export interface ROIMetrics {
    totalRevenue: number;
    totalAdSpend: number;
    totalOrders: number;
    costPerAcquisition: number;
    returnOnAdSpend: number;
    revenuePerCustomer: number;
}

export const getSalesTrends = async (period: 'day' | 'week' | 'month' = 'day', days: number = 30): Promise<SalesTrend[]> => {
    try {
        const response = await fetch(`${API_URL}/admin/analytics/sales-trends?period=${period}&days=${days}`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching sales trends:', error);
        throw error;
    }
};

export const getCustomerInsights = async (): Promise<CustomerInsight> => {
    try {
        const response = await fetch(`${API_URL}/admin/analytics/customer-insights`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching customer insights:', error);
        throw error;
    }
};

export const getConversionFunnel = async (): Promise<ConversionFunnel> => {
    try {
        const response = await fetch(`${API_URL}/admin/analytics/conversion-funnel`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching conversion funnel:', error);
        throw error;
    }
};

export const getROIMetrics = async (): Promise<ROIMetrics> => {
    try {
        const response = await fetch(`${API_URL}/admin/analytics/roi-metrics`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching ROI metrics:', error);
        throw error;
    }
};

export const getPopularRaffles = async (): Promise<Array<{
    id: string;
    title: string;
    ticketsSold: number;
    revenue: number;
    conversionRate: number;
}>> => {
    try {
        const response = await fetch(`${API_URL}/admin/analytics/popular-raffles`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching popular raffles:', error);
        throw error;
    }
};

export const getDashboardSummary = async () => {
    try {
        const response = await fetch(`${API_URL}/admin/analytics/dashboard-summary`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        throw error;
    }
};

export const adminGetAllOrders = async (): Promise<Order[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/orders`));
    return data.map(parseOrderDates);
};

export const adminGetRaffles = async (): Promise<Raffle[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/raffles`));
    return data.map(parseRaffleDates);
};

export const adminCreateRaffle = async (data: Omit<Raffle, 'id' | 'sold'>): Promise<Raffle> => {
    const response = await fetch(`${API_URL}/admin/raffles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return parseRaffleDates(result);
};

export const adminUpdateRaffle = async (data: Raffle): Promise<Raffle> => {
    const response = await fetch(`${API_URL}/admin/raffles/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return parseRaffleDates(result);
};

export const adminDeleteRaffle = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/raffles/${id}`, { method: 'DELETE' });
    await handleResponse(response);
};

export const adminUpdateOrderStatus = async (folio: string, status: OrderStatus): Promise<Order> => {
     const response = await fetch(`${API_URL}/admin/orders/${folio}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    const data = await handleResponse(response);
    return parseOrderDates(data);
};

export const getFinishedRaffles = async (): Promise<Raffle[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/raffles/finished`));
    return data.map(parseRaffleDates);
}

export const drawWinner = async (raffleId: string): Promise<{ ticket: number; order: Order }> => {
    const response = await fetch(`${API_URL}/admin/winners/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raffleId }),
    });
    const data = await handleResponse(response);
    return { ...data, order: parseOrderDates(data.order) };
};

export const saveWinner = async (winnerData: Omit<Winner, 'id'>): Promise<Winner> => {
    const response = await fetch(`${API_URL}/admin/winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(winnerData),
    });
    const data = await handleResponse(response);
    return parseWinnerDates(data);
};

export const adminGetAllWinners = async (): Promise<Winner[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/admin/winners`));
    return data.map(parseWinnerDates);
}

export const adminDeleteWinner = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/winners/${id}`, { method: 'DELETE' });
    await handleResponse(response);
}

export const adminGetUsers = async (): Promise<AdminUser[]> => {
    return handleResponse(await fetch(`${API_URL}/admin/users`));
};

// Funciones de órdenes mejoradas
export const createOrder = async (order: Omit<Order, 'id' | 'folio' | 'createdAt' | 'updatedAt' | 'expiresAt'>): Promise<Order> => {
    try {
        console.log('🚀 Trying backend for create order...');
        console.log('📤 Sending order data:', order);
        console.log('🌐 API URL:', `${API_URL}/public/orders`);
        
        const response = await fetch(`${API_URL}/public/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend order created successfully:', data);
            return parseOrderDates(data);
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
            throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        throw error; // Re-throw para que el frontend maneje el error
    }
};

export const getOrderByFolio = async (folio: string): Promise<Order | undefined> => {
    try {
        console.log('🔍 Trying backend for order by folio:', folio);
        const response = await fetch(`${API_URL}/public/orders/folio/${folio}`);
        const order = await handleResponse(response);
        console.log('✅ Backend order by folio loaded successfully:', { folio: order?.folio });
        return parseOrderDates(order);
    } catch (error) {
        console.error('❌ Backend error for order by folio:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for order by folio');
    const { localApi } = await import('./localApi');
    return localApi.getOrderByFolio(folio);
};

export const getOrders = async (page: number = 1, limit: number = 50, status?: string): Promise<Order[]> => {
    try {
        console.log('🔍 Trying backend for orders...');
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_URL}/admin/orders?${params.toString()}`);
        
        if (!response.ok) {
            console.log('❌ Backend returned error status:', response.status);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        // El backend ahora devuelve { orders: [], pagination: {} }
        const orders = data.orders || data; // Compatibilidad con respuesta vieja y nueva
        console.log('✅ Backend orders loaded successfully:', orders?.length || 0);
        return orders?.map(parseOrderDates) || [];
    } catch (error) {
        console.error('❌ Backend error for orders:', error);
        // Fallback to local data
        console.log('🔄 Using local data for orders');
        const { localApi } = await import('./localApi');
        return localApi.getOrders();
    }
};

export const updateOrder = async (id: string, order: Partial<Order>): Promise<Order> => {
    try {
        console.log('Trying backend for update order...');
        const response = await fetch(`${API_URL}/admin/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend order updated successfully');
            return parseOrderDates(data);
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for update order');
    const { localApi } = await import('./localApi');
    return localApi.updateOrder(id, order);
};

export const deleteOrder = async (id: string): Promise<void> => {
    try {
        console.log('Trying backend for delete order...');
        const response = await fetch(`${API_URL}/admin/orders/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log('✅ Backend order deleted successfully');
            return;
        } else {
            console.log('❌ Backend returned error status:', response.status);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for delete order');
    const { localApi } = await import('./localApi');
    return localApi.deleteOrder(id);
};

// Nuevas funciones específicas de órdenes según especificaciones
export const markOrderPaid = async (id: string, paymentMethod?: string, notes?: string): Promise<Order> => {
    try {
        console.log('🚀 Trying backend for mark order paid...');
        const response = await fetch(`${API_URL}/admin/orders/${id}/mark-paid`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethod, notes }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend order marked as paid successfully');
            return parseOrderDates(data);
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for mark order paid');
    const { localApi } = await import('./localApi');
    return localApi.updateOrder(id, { status: 'PAID' });
};

export const editOrder = async (id: string, data: { customer?: any; tickets?: number[]; notes?: string }): Promise<Order> => {
    try {
        console.log('🚀 Trying backend for edit order...');
        const response = await fetch(`${API_URL}/admin/orders/${id}/edit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Backend order edited successfully');
            return parseOrderDates(result);
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for edit order');
    const { localApi } = await import('./localApi');
    return localApi.updateOrder(id, data);
};

export const releaseOrder = async (id: string): Promise<Order> => {
    try {
        console.log('🚀 Trying backend for release order...');
        const response = await fetch(`${API_URL}/admin/orders/${id}/release`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend order released successfully');
            return parseOrderDates(data);
        } else {
            console.log('❌ Backend returned error status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
            throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.log('❌ Backend failed with exception:', error);
        throw error; // Re-lanzar el error para que se maneje en el componente
    }
};

// Funciones de clientes
export const getCustomers = async (): Promise<any[]> => {
    try {
        console.log('🔍 Trying backend for customers...');
        const response = await fetch(`${API_URL}/admin/customers`);
        const customers = await handleResponse(response);
        console.log('✅ Backend customers loaded successfully:', customers?.length || 0);
        return customers || [];
    } catch (error) {
        console.error('❌ Backend error for customers:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for customers');
    const { localApi } = await import('./localApi');
    return localApi.getCustomers();
};

export const getCustomerById = async (id: string): Promise<any | undefined> => {
    try {
        console.log('🔍 Trying backend for customer by ID:', id);
        const response = await fetch(`${API_URL}/admin/customers/${id}`);
        const customer = await handleResponse(response);
        console.log('✅ Backend customer by ID loaded successfully:', { id: customer?.id });
        return customer;
    } catch (error) {
        console.error('❌ Backend error for customer by ID:', error);
    }
    
    // Fallback to local data
    console.log('🔄 Using local data for customer by ID');
    const { localApi } = await import('./localApi');
    return localApi.getCustomerById(id);
};

export const adminCreateUser = async (data: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const adminUpdateUser = async (data: AdminUser): Promise<AdminUser> => {
     const response = await fetch(`${API_URL}/admin/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const adminDeleteUser = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE' });
    await handleResponse(response);
};

export const adminUpdateSettings = async (settings: Settings): Promise<Settings> => {
    const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST', // Using POST for upsert
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    return handleResponse(response);
}