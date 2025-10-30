import { ReactNode } from 'react';

export enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    RELEASED = 'RELEASED',
}

export interface Pack {
    q?: number;
    tickets?: number;
    name?: string;
    price: number;
}

export interface Raffle {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    price: number;
    tickets: number;
    sold: number;
    drawDate: Date;
    status: 'draft' | 'active' | 'finished';
    boletosConOportunidades?: boolean;
    numeroOportunidades?: number;
    giftTickets?: number;
    createdAt?: Date;
    updatedAt?: Date;
    // Campos adicionales para el frontend (no se envían al backend)
    heroImage?: string;
    gallery?: string[];
    packs?: Pack[];
    bonuses?: string[];
}

export interface Winner {
    id: string;
    name: string;
    prize: string;
    imageUrl: string;
    raffleTitle: string;
    drawDate: Date;
    ticketNumber?: number;
    testimonial?: string;
    phone?: string;
    city?: string;
}

export interface Customer {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    district: string;
    totalOrders?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Order {
    id?: string;
    folio?: string;
    customer: Customer;
    raffleId: string;
    raffleTitle?: string;
    tickets: number[];
    totalAmount?: number;
    total?: number;
    status: OrderStatus | string;
    paymentMethod?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
    expiresAt?: Date;
}

export interface PaymentAccount {
    id: string;
    bank: string;
    accountNumber: string;
    accountHolder: string;
}

export interface FaqItemData {
    id: string;
    question: string;
    answer: string;
}

export type LogoAnimation = 'none' | 'rotate' | 'pulse' | 'bounce';

export interface AppearanceSettings {
    siteName: string;
    logoUrl?: string; // Optional custom logo URL
    logoAnimation: LogoAnimation;
    colors: {
        backgroundPrimary: string;
        backgroundSecondary: string;
        accent: string;
        action: string;
    };
}

export interface DisplayPreferences {
    listingMode: 'paginado' | 'scroll';
    paidTicketsVisibility: 'a_la_vista' | 'no_disponibles';
}

export interface Settings {
    appearance: AppearanceSettings;
    contactInfo: {
        whatsapp: string;
        email: string;
    };
    socialLinks: {
        facebookUrl: string;
        instagramUrl: string;
        twitterUrl: string;
    };
    paymentAccounts: PaymentAccount[];
    faqs: FaqItemData[];
    displayPreferences?: DisplayPreferences;
}

export interface AdminUser {
    id: string;
    name: string;
    username: string;  // Cambio: usar username en lugar de email
    email?: string;    // Opcional
    password?: string;
    role: 'superadmin' | 'admin' | 'ventas';  // Nuevos roles
    createdAt?: Date;
    updatedAt?: Date;
}