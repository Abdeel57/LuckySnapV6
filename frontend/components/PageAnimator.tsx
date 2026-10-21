import React, { PropsWithChildren } from 'react';

// Entrada de página con CSS (sin framer-motion, que así no se descarga en todas las páginas):
// en móviles solo fade-in; desde md (768px) fade-in con desplazamiento.
// FIX: Used PropsWithChildren to correctly type the component that accepts children.
const PageAnimator = ({ children }: PropsWithChildren) => (
  <div className="animate-page-in md:animate-page-in-up">
    {children}
  </div>
);

export default PageAnimator;
