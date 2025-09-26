import React from 'react';
import { Link } from 'react-router-dom';
import PageAnimator from '../components/PageAnimator';

const NotFoundPage = () => {
  return (
    <PageAnimator>
      <div className="text-center py-20">
        <h1 className="text-6xl font-extrabold text-accent">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-white">Página no encontrada</h2>
        <p className="mt-4 text-lg text-slate-400">
          Lo sentimos, la página que buscas no existe o fue movida.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </PageAnimator>
  );
};

export default NotFoundPage;
