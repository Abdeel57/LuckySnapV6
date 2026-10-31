import React from 'react';
import PageAnimator from '../components/PageAnimator';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/**
 * Ruta /mis-cuentas. La versión anterior listaba órdenes de todos los clientes
 * (vía /admin/orders) como demostración; se reemplaza por un acceso al
 * verificador, donde cada persona consulta sus boletos con su propio folio.
 */
const AccountsPage = () => (
  <PageAnimator>
    <div className="container mx-auto px-4 sm:px-6 max-w-lg pt-10 md:pt-16">
      <Card className="text-center py-8">
        <p className="text-sm font-extrabold text-action-ink mb-1.5">Mis boletos</p>
        <h1 className="font-display text-title font-semibold text-ink">Consulta tus boletos con tu folio</h1>
        <p className="mt-2 text-muted">El folio está en tu apartado y en el mensaje de WhatsApp. También puedes buscar por número de boleto o escanear el QR del comprobante.</p>
        <Button to="/verificador" size="lg" className="mt-6">Ir al verificador</Button>
      </Card>
    </div>
  </PageAnimator>
);

export default AccountsPage;
