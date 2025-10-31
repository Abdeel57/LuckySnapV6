import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, Settings } from '../../types';

interface ReceiptGeneratorProps {
    order: Order;
    settings?: Settings;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ order, settings }) => {
    const formatDate = (date?: Date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('es-HN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'LPS 0.00';
        return `LPS ${amount.toFixed(2)}`;
    };

    // Generar datos para QR code
    const qrData = JSON.stringify({
        folio: order.folio || '',
        ticket: order.tickets[0] || 0,
        raffleId: order.raffleId
    });

    const siteName = settings?.appearance?.siteName || 'Lucky Snap';
    // El backend devuelve 'logo' en lugar de 'logoUrl'
    const logoUrl = (settings?.appearance as any)?.logo || settings?.appearance?.logoUrl;
    const whatsapp = settings?.contactInfo?.whatsapp || '';
    const email = settings?.contactInfo?.email || '';

    return (
        <div 
            id="receipt-content"
            style={{
                width: '800px',
                backgroundColor: '#ffffff',
                padding: '40px',
                fontFamily: 'Arial, sans-serif',
                color: '#000000',
                boxSizing: 'border-box'
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #000', paddingBottom: '20px' }}>
                {logoUrl && (
                    <img 
                        src={logoUrl} 
                        alt={siteName}
                        style={{ maxWidth: '150px', maxHeight: '80px', marginBottom: '15px' }}
                    />
                )}
                <h1 style={{ margin: '10px 0', fontSize: '28px', fontWeight: 'bold' }}>{siteName}</h1>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>COMPROBANTE DE PAGO</p>
            </div>

            {/* Order Information */}
            <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>Folio:</span>
                    <span>{order.folio || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>Fecha de Pago:</span>
                    <span>{formatDate(order.updatedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>Estado:</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>PAGADO</span>
                </div>
            </div>

            {/* Customer Information */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                    Información del Cliente
                </h3>
                <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Nombre: </span>
                    <span>{order.customer?.name || 'N/A'}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Teléfono: </span>
                    <span>{order.customer?.phone || 'N/A'}</span>
                </div>
                {order.customer?.district && (
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Distrito: </span>
                        <span>{order.customer.district}</span>
                    </div>
                )}
            </div>

            {/* Raffle Information */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                    Información del Sorteo
                </h3>
                <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Sorteo: </span>
                    <span>{order.raffleTitle || (order as any).raffle?.title || 'No disponible'}</span>
                </div>
            </div>

            {/* Tickets */}
            <div style={{ marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                    Boletos ({order.tickets?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {order.tickets?.map((ticket, index) => (
                        <span 
                            key={index}
                            style={{
                                display: 'inline-block',
                                padding: '8px 12px',
                                backgroundColor: '#000',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            #{ticket.toString().padStart(4, '0')}
                        </span>
                    ))}
                </div>
            </div>

            {/* Payment Information */}
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                    Información de Pago
                </h3>
                {order.paymentMethod && (
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Método de Pago: </span>
                        <span>{order.paymentMethod}</span>
                    </div>
                )}
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold' }}>
                        <span>Total Pagado:</span>
                        <span style={{ color: '#22c55e' }}>{formatCurrency(order.total || order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '25px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>Código QR de Verificación</p>
                <div style={{ display: 'inline-block', padding: '10px', backgroundColor: '#fff', borderRadius: '8px' }}>
                    <QRCodeSVG value={qrData} size={200} level="H" />
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Escanea este código para verificar tu boleto
                </p>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #000', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>Gracias por tu compra</p>
                {whatsapp && (
                    <p style={{ margin: '5px 0' }}>WhatsApp: {whatsapp}</p>
                )}
                {email && (
                    <p style={{ margin: '5px 0' }}>Email: {email}</p>
                )}
                <p style={{ margin: '10px 0 0 0', fontSize: '10px' }}>
                    Este es un comprobante digital generado automáticamente
                </p>
            </div>
        </div>
    );
};

export default ReceiptGenerator;
