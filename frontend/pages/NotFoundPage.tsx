import React from 'react';
import PageAnimator from '../components/PageAnimator';
import Button from '../components/ui/Button';

const NotFoundPage = () => (
  <PageAnimator>
    <div className="container mx-auto px-4 max-w-lg py-20 md:py-28 text-center">
      <p className="tnum font-display text-7xl font-semibold text-action-ink">404</p>
      <h1 className="mt-3 font-display text-title font-semibold text-ink">Ups, esta página no existe</h1>
      <p className="mt-2 text-muted">El enlace no existe o fue movido.</p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <Button to="/">Ver sorteos activos</Button>
        <Button to="/verificador" variant="secondary">Verificar un boleto</Button>
      </div>
    </div>
  </PageAnimator>
);

export default NotFoundPage;
