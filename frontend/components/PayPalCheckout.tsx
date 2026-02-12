import React, { useState, useEffect, useMemo } from 'react';
import { PayPalButtons, PayPalScriptProvider, PayPalCardFieldsProvider, PayPalCardFieldsForm, usePayPalCardFields } from '@paypal/react-paypal-js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface PayPalCheckoutProps {
  orderId: string;
  amount: number; // Monto en Lempiras
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: 'card' | 'paypal';
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  orderId,
  amount,
  onSuccess,
  onError,
  variant = 'card',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  const PAYPAL_CLIENT_ID = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || '';

  // Convertir HNL a USD (tasa aproximada, ajustar según necesidad)
  const convertToUSD = (lempiras: number): string => {
    const exchangeRate = 24.7; // Ajustar según tasa actual
    return (lempiras / exchangeRate).toFixed(2);
  };

  const amountUSD = parseFloat(convertToUSD(amount));
  const isCardVariant = variant === 'card';

  // Verificar que PayPal esté configurado
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <p className="font-semibold">PayPal no está configurado</p>
        </div>
        <p className="text-sm text-yellow-700 mt-2">
          Configura VITE_PAYPAL_CLIENT_ID en tus variables de entorno.
        </p>
      </div>
    );
  }

  const handleCreateOrder = async (): Promise<string> => {
    try {
      setError(null);

      // Crear orden de PayPal en tu backend
      const response = await fetch(`${API_URL}/payment/paypal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear orden de PayPal');
      }

      const data = await response.json();
      setPaypalOrderId(data.paypalOrderId);

      // Retornar el order ID para PayPal
      return data.paypalOrderId || '';
    } catch (err: any) {
      const errorMessage = err.message || 'Error al crear la orden de pago';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (data: any): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!paypalOrderId && data.orderID) {
        setPaypalOrderId(data.orderID);
      }

      const paypalId = paypalOrderId || data.orderID;

      if (!paypalId) {
        throw new Error('No se pudo obtener el ID de la orden de PayPal');
      }

      // Capturar el pago en tu backend
      const response = await fetch(`${API_URL}/payment/paypal/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paypalOrderId: paypalId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al procesar el pago');
      }

      const result = await response.json();

      if (result.success) {
        // Redirigir a página de confirmación
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/#/comprobante/${orderId}`);
        }
      } else {
        throw new Error('El pago no se pudo completar');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error('Error en PayPal:', err);
    const errorMessage = err.message || 'Error en el proceso de pago';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  useEffect(() => {
    if (!isCardVariant) return;

    const loadClientToken = async () => {
      try {
        setIsTokenLoading(true);
        const response = await fetch(`${API_URL}/payment/paypal/client-token`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'No se pudo generar el client token');
        }
        const data = await response.json();
        setClientToken(data.clientToken || null);
      } catch (err: any) {
        const errorMessage = err.message || 'Error al preparar el pago con tarjeta';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsTokenLoading(false);
      }
    };

    loadClientToken();
  }, [API_URL, isCardVariant, onError]);

  const scriptOptions = useMemo(() => {
    const baseOptions: Record<string, any> = {
      clientId: PAYPAL_CLIENT_ID,
      currency: 'USD',
      intent: 'capture',
    };

    if (isCardVariant) {
      baseOptions.components = 'card-fields';
      if (clientToken) {
        baseOptions.dataClientToken = clientToken;
      }
    }

    return baseOptions;
  }, [PAYPAL_CLIENT_ID, clientToken, isCardVariant]);

  const CardSubmitButton: React.FC = () => {
    const { cardFields } = usePayPalCardFields();

    const submitHandler = async () => {
      if (!cardFields || typeof cardFields.submit !== 'function') return;
      try {
        setLoading(true);
        setError(null);
        await cardFields.submit();
      } catch (err: any) {
        const errorMessage = err.message || 'Error al procesar el pago con tarjeta';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <button
        type="button"
        onClick={submitHandler}
        disabled={loading}
        className="w-full bg-gradient-to-r from-action to-accent text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Pagar con tarjeta'}
      </button>
    );
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p className="font-semibold">Error</p>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {loading && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="font-semibold">Procesando pago...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {isCardVariant ? 'Completa tu pago con tarjeta' : 'Completa tu pago con PayPal'}
          </h3>
          <p className="text-gray-600 text-sm">
            Monto: <span className="font-bold text-lg text-blue-600">L. {amount.toFixed(2)}</span>
            {' '}
            <span className="text-gray-500">
              (${amountUSD.toFixed(2)} USD aprox.)
            </span>
          </p>
        </div>

        {isCardVariant && isTokenLoading && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="font-semibold">Preparando pago con tarjeta...</p>
            </div>
          </div>
        )}

        <PayPalScriptProvider options={scriptOptions}>
          {isCardVariant ? (
            <PayPalCardFieldsProvider
              createOrder={handleCreateOrder}
              onApprove={handleApprove}
              onError={handleError}
            >
              <div className="mb-4">
                <PayPalCardFieldsForm />
              </div>
              <CardSubmitButton />
            </PayPalCardFieldsProvider>
          ) : (
            <PayPalButtons
              createOrder={handleCreateOrder}
              onApprove={handleApprove}
              onError={handleError}
              onCancel={() => {
                setError('Pago cancelado por el usuario');
              }}
              style={{
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal',
              }}
              disabled={loading}
            />
          )}
        </PayPalScriptProvider>

        <p className="text-xs text-gray-500 text-center mt-4">
          {isCardVariant
            ? 'Tus datos de tarjeta se procesan de forma segura por PayPal.'
            : 'Al hacer clic en el botón, serás redirigido a PayPal para completar tu pago de forma segura.'}
        </p>
      </div>
    </div>
  );
};

export default PayPalCheckout;


