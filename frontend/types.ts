import { ReactNode } from 'react';

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    CANCELLED = 'cancelled',
}

export interface Pack {
    q: number;
    price: number;
}

export interface Raffle {
    id: string;
    title: string;
    slug: string;
    description: string;
    heroImage: string;
    gallery: string[];
    tickets: number;
    sold: number;
    drawDate: Date;
    packs: Pack[];
    bonuses: string[];
    status: 'draft' | 'active' | 'finished';
}

export interface Winner {
    id: string;
    name: string;
    prize: string;
    imageUrl: string;
    raffleTitle: string;
    drawDate: Date;
}

export interface Order {
    folio: string;
    name: string;
    phone: string;
    state: string;
    raffleId: string;
    raffleTitle: string;
    tickets: number[];
    total: number;
    status: OrderStatus;
    createdAt: Date;
    expiresAt: Date;
}

export interface PaymentAccount {
    id: string;
    bank: string;
    accountHolder: string;
    accountNumber: string;
    clabe: string;
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
}

export interface AdminUser {
    id: string;
    name: string;
    username: string;
    role: 'Administrator' | 'Editor';
}