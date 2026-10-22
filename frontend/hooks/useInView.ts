import { RefObject, useEffect, useState } from 'react';

/**
 * true mientras el elemento está (casi) en pantalla. Sirve para pausar trabajo
 * periódico fuera de la vista (p. ej. un contador que se re-renderiza cada segundo).
 * Sin IntersectionObserver se considera siempre visible.
 */
export const useInView = (ref: RefObject<Element | null>, rootMargin = '200px 0px'): boolean => {
    const [inView, setInView] = useState(true);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            entries => setInView(entries.some(entry => entry.isIntersecting)),
            { rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, rootMargin]);

    return inView;
};
