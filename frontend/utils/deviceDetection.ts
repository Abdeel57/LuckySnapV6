/**
 * Utilidad para detectar dispositivos y aplicar optimizaciones de rendimiento
 */

import { useState, useEffect } from 'react';

export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isLowEndDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Detectar dispositivos de gama baja basado en hardware
    const hardwareConcurrency = (navigator as any).hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    return hardwareConcurrency <= 2 || deviceMemory <= 2;
};

export const shouldReduceAnimations = (): boolean => {
    return isMobile() || isLowEndDevice();
};

export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const useOptimizedAnimations = (): boolean => {
    const [reduceAnimations, setReduceAnimations] = useState(false);

    useEffect(() => {
        const checkOptimizations = () => {
            setReduceAnimations(shouldReduceAnimations() || prefersReducedMotion());
        };
        
        checkOptimizations();
        
        // Escuchar cambios en preferencias de usuario
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            const handleChange = () => checkOptimizations();
            
            // Compatibilidad con navegadores antiguos
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else {
                mediaQuery.addListener(handleChange);
            }
            
            return () => {
                if (mediaQuery.removeEventListener) {
                    mediaQuery.removeEventListener('change', handleChange);
                } else {
                    mediaQuery.removeListener(handleChange);
                }
            };
        }
    }, []);

    return reduceAnimations;
};

