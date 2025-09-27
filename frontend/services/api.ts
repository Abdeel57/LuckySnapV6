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
    const data = await handleResponse(await fetch(`${API_URL}/public/raffles/active`));
    return data.map(parseRaffleDates);
};

export const getRaffleBySlug = async (slug: string): Promise<Raffle | undefined> => {
    const data = await handleResponse(await fetch(`${API_URL}/public/raffles/slug/${slug}`));
    return data ? parseRaffleDates(data) : undefined;
};

export const getOccupiedTickets = async (raffleId: string): Promise<number[]> => {
    return handleResponse(await fetch(`${API_URL}/public/raffles/${raffleId}/occupied-tickets`));
};

export const getPastWinners = async (): Promise<Winner[]> => {
    const data = await handleResponse(await fetch(`${API_URL}/public/winners`));
    return data.map(parseWinnerDates);
};

export const getSettings = async (): Promise<Settings> => {
    // Try the working endpoint first, fallback to settings
    try {
        const response = await fetch(`${API_URL}/public/working`);
        if (response.ok) {
            const data = await response.json();
            return data.data; // Extract data from the working endpoint response
        }
    } catch (error) {
        console.log('Working endpoint failed, trying settings endpoint');
    }
    
    // Fallback to original settings endpoint
    return handleResponse(await fetch(`${API_URL}/public/settings`));
};

export const createOrder = async (orderData: Omit<Order, 'folio' | 'status' | 'createdAt' | 'expiresAt' | 'id'>): Promise<Order> => {
    const response = await fetch(`${API_URL}/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    });
    const data = await handleResponse(response);
    return parseOrderDates(data);
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