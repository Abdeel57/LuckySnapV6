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
  const [isScriptReady, setIsScriptReady] = useState(false);
  const navigate = useNavigate();

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  const PAYPAL_CLIENT_ID = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || '';

  // Logs de depuración
  console.log('🔍 PayPalCheckout renderizado:', {
    orderId,
    amount,
    variant,
    hasClientId: !!PAYPAL_CLIENT_ID,
    clientIdLength: PAYPAL_CLIENT_ID?.length || 0,
    apiUrl: API_URL,
  });

  // Convertir HNL a USD (tasa aproximada, ajustar según necesidad)
  const convertToUSD = (lempiras: number): string => {
    const exchangeRate = 24.7; // Ajustar según tasa actual
    return (lempiras / exchangeRate).toFixed(2);
  };

  const amountUSD = parseFloat(convertToUSD(amount));
  const isCardVariant = variant === 'card';

  // Verificar que PayPal esté configurado
  if (!PAYPAL_CLIENT_ID) {
    console.error('❌ PayPal no configurado: VITE_PAYPAL_CLIENT_ID está vacío');
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
    if (!isCardVariant) {
      console.log('ℹ️ No es variant card, saltando carga de client token');
      return;
    }

    console.log('🔄 Iniciando carga de client token...');
    const loadClientToken = async () => {
      try {
        setIsTokenLoading(true);
        console.log('📡 Fetching client token desde:', `${API_URL}/payment/paypal/client-token`);
        const response = await fetch(`${API_URL}/payment/paypal/client-token`);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          // Si no se puede obtener el token (Advanced Card Payments no disponible),
          // simplemente no lo establecemos y usaremos PayPalButtons con tarjeta
          const errorText = await response.text();
          console.warn('⚠️ Advanced Card Payments no disponible, usando PayPalButtons con tarjeta. Error:', errorText);
          setClientToken(null);
          setIsTokenLoading(false);
          return;
        }
        const data = await response.json();
        console.log('✅ Client token recibido:', data.clientToken ? 'Sí' : 'No');
        setClientToken(data.clientToken || null);
      } catch (err: any) {
        // Si hay error, usamos PayPalButtons con tarjeta como fallback
        console.warn('⚠️ Error obteniendo client token, usando PayPalButtons con tarjeta:', err);
        setClientToken(null);
      } finally {
        setIsTokenLoading(false);
        console.log('🏁 Carga de client token finalizada');
      }
    };

    loadClientToken();
  }, [API_URL, isCardVariant]);

  const scriptOptions = useMemo(() => {
    const baseOptions: Record<string, any> = {
      clientId: PAYPAL_CLIENT_ID,
      currency: 'USD',
      intent: 'capture',
    };

    if (isCardVariant) {
      // Incluir ambos componentes: card-fields para campos embebidos y buttons como fallback
      baseOptions.components = 'card-fields,buttons';
      if (clientToken) {
        baseOptions.dataClientToken = clientToken;
      }
    } else {
      // Para variant PayPal, solo necesitamos buttons
      baseOptions.components = 'buttons';
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

  // Si está cargando el token, mostrar loading
  if (isCardVariant && isTokenLoading) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200/50 shadow-sm">
          <div className="mb-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Completa tu pago con tarjeta
            </h3>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <p className="text-gray-700 text-sm">
                Monto: <span className="font-bold text-lg text-blue-600">L. {amount.toFixed(2)}</span>
              </p>
              <span className="text-gray-400">•</span>
              <p className="text-gray-500 text-xs">
                ${amountUSD.toFixed(2)} USD aprox.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-200/50 rounded-lg p-4 flex items-center justify-center gap-2.5">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-800 font-medium">Preparando pago con tarjeta...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay clientToken disponible, usar PayPalButtons con tarjeta
  // Solo usar Card Fields si tenemos token Y el script está listo
  const useCardFields = Boolean(isCardVariant && clientToken && isScriptReady);

  console.log('🎨 Renderizando PayPalCheckout:', {
    useCardFields,
    isCardVariant,
    hasClientToken: !!clientToken,
    isTokenLoading,
    isScriptReady,
    hasError: !!error,
    scriptOptions,
  });

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 bg-red-50/80 border border-red-200/50 rounded-lg p-3.5 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm mb-1">Error</p>
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-4 bg-blue-50/80 border border-blue-200/50 rounded-lg p-3.5 flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <p className="font-medium text-blue-800 text-sm">Procesando pago...</p>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200/50 shadow-sm">
        <div className="mb-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {isCardVariant ? 'Completa tu pago con tarjeta' : 'Completa tu pago con PayPal'}
          </h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <p className="text-gray-700 text-sm">
              Monto: <span className="font-bold text-lg text-blue-600">L. {amount.toFixed(2)}</span>
            </p>
            <span className="text-gray-400">•</span>
            <p className="text-gray-500 text-xs">
              ${amountUSD.toFixed(2)} USD aprox.
            </p>
          </div>
        </div>

        <PayPalScriptProvider 
          options={scriptOptions}
          onLoadStart={() => {
            console.log('📦 PayPal script iniciando carga...');
            setIsScriptReady(false);
          }}
          onLoadError={(err) => {
            console.error('❌ Error cargando PayPal script:', err);
            setError('Error al cargar PayPal. Por favor, recarga la página.');
            setIsScriptReady(false);
          }}
          onLoadSuccess={() => {
            console.log('✅ PayPal script cargado exitosamente');
            setIsScriptReady(true);
          }}
        >
          {useCardFields ? (
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
            <div>
              <div className="bg-blue-50/80 border border-blue-200/50 rounded-lg p-3.5 mb-4 flex items-start gap-2.5">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                  {isCardVariant 
                    ? 'Serás redirigido a PayPal para completar tu pago con tarjeta de forma segura. No necesitas cuenta PayPal.'
                    : 'Serás redirigido a PayPal para completar tu pago de forma segura.'}
                </p>
              </div>
              <PayPalButtons
                createOrder={handleCreateOrder}
                onApprove={handleApprove}
                onError={handleError}
                onCancel={() => {
                  setError('Pago cancelado por el usuario');
                }}
                fundingSource={isCardVariant ? 'card' : undefined}
                style={{
                  layout: 'vertical',
                  color: isCardVariant ? 'black' : 'blue',
                  shape: 'rect',
                  label: isCardVariant ? 'pay' : 'paypal',
                  height: 50,
                }}
                disabled={loading}
                onInit={(data, actions) => {
                  console.log('✅ PayPalButtons inicializado:', { data, actions });
                }}
                onRender={(data, actions) => {
                  console.log('🎨 PayPalButtons renderizado:', { data, actions });
                }}
              />
            </div>
          )}
        </PayPalScriptProvider>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-center">
              {useCardFields
                ? 'Tus datos se procesan de forma segura por PayPal'
                : isCardVariant
                ? 'Puedes pagar con cualquier tarjeta. PayPal procesa el pago de forma segura'
                : 'Pago procesado de forma segura por PayPal'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalCheckout;


