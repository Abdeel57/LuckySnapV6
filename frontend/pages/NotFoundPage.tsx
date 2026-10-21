import React from 'react';
import PageAnimator from '../components/PageAnimator';
import Button from '../components/ui/Button';

const NotFoundPage = () => (
  <PageAnimator>
    <div className="container mx-auto px-4 max-w-lg py-20 md:py-28 text-center">
      <p className="tnum text-6xl font-extrabold text-accent">404</p>
      <h1 className="mt-3 text-title font-extrabold text-white">Página no encontrada</h1>
      <p className="mt-2 text-slate-400">El enlace no existe o fue movido.</p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <Button to="/">Ver sorteos activos</Button>
        <Button to="/verificador" variant="secondary">Verificar un boleto</Button>
      </div>
    </div>
  </PageAnimator>
);

export default NotFoundPage;
