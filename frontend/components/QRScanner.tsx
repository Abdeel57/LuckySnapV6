import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'error'>('requesting');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Función para inicializar el escáner (compartida entre useEffect y handleRetry)
    const initializeScanner = useCallback(() => {
        try {
            // Limpiar escáner anterior si existe
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (error) {
                    console.log('Error al limpiar escáner anterior:', error);
                }
                scannerRef.current = null;
            }

            // Limpiar el contenedor del escáner
            const readerElement = document.getElementById('qr-reader');
            if (readerElement) {
                readerElement.innerHTML = '';
            }

            const scanner = new Html5QrcodeScanner(
                'qr-reader',
                {
                    qrbox: { width: 250, height: 250 },
                    fps: 5,
                    aspectRatio: 1.0,
                    supportedScanTypes: []
                },
                false
            );

            scanner.render(
                (decodedText) => {
                    console.log('📱 QR Code scanned:', decodedText);
                    onScan(decodedText);
                    scanner.clear();
                    setIsScanning(false);
                },
                (error) => {
                    // Solo mostrar errores si no es el error de permiso (que ya manejamos arriba)
                    if (error && !error.toString().includes('Permission denied')) {
                        console.log('QR scan error:', error);
                    }
                }
            );

            scannerRef.current = scanner;
            setIsScanning(true);
        } catch (error) {
            console.error('Error al inicializar escáner:', error);
            setPermissionStatus('error');
            setErrorMessage('Error al inicializar el escáner. Por favor, intenta de nuevo.');
        }
    }, [onScan]);

    // Función para solicitar permisos de cámara (compartida entre useEffect y handleRetry)
    const requestCameraPermission = useCallback(async () => {
        try {
            // Verificar si el navegador soporta getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta acceso a la cámara. Por favor, usa un navegador moderno.');
            }

            // Solicitar permiso de cámara explícitamente
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Preferir cámara trasera en móviles
                } 
            });

            // Si tenemos el permiso, detener el stream y proceder con el escáner
            stream.getTracks().forEach(track => track.stop());
            setPermissionStatus('granted');

            // Esperar un momento para que el estado se actualice
            setTimeout(() => {
                initializeScanner();
            }, 100);

        } catch (error: any) {
            console.error('Error al solicitar permisos de cámara:', error);
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setPermissionStatus('denied');
                setErrorMessage('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                setPermissionStatus('error');
                setErrorMessage('No se encontró ninguna cámara disponible. Por favor, conecta una cámara e intenta de nuevo.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                setPermissionStatus('error');
                setErrorMessage('La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que usen la cámara.');
            } else {
                setPermissionStatus('error');
                setErrorMessage(error.message || 'Error al acceder a la cámara. Por favor, intenta de nuevo.');
            }
        }
    }, [initializeScanner]);

    // Solicitar permisos de cámara al montar el componente
    useEffect(() => {
        if (scannerRef.current) {
            return;
        }

        // Solicitar permisos al montar el componente
        requestCameraPermission();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        };
    }, [requestCameraPermission]);

    const handleRetry = async () => {
        setPermissionStatus('requesting');
        setErrorMessage('');
        
        // Limpiar escáner anterior si existe
        if (scannerRef.current) {
            try {
                scannerRef.current.clear();
            } catch (error) {
                console.log('Error al limpiar escáner:', error);
            }
            scannerRef.current = null;
        }

        // Limpiar el contenedor del escáner
        const readerElement = document.getElementById('qr-reader');
        if (readerElement) {
            readerElement.innerHTML = '';
        }

        // Esperar un momento antes de solicitar permisos nuevamente
        await new Promise(resolve => setTimeout(resolve, 300));

        // Solicitar permisos nuevamente usando la función compartida
        await requestCameraPermission();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Escanear Código QR</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                {/* Estado: Solicitando permisos */}
                {permissionStatus === 'requesting' && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <Camera className="w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Solicitando permiso de cámara
                        </h4>
                        <p className="text-sm text-gray-600">
                            Por favor, permite el acceso a la cámara cuando tu navegador lo solicite.
                        </p>
                        <div className="mt-4 flex justify-center space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}

                {/* Estado: Permisos concedidos - Mostrar escáner */}
                {permissionStatus === 'granted' && (
                    <>
                        <div className="text-center mb-4">
                            <QrCode className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                Apunta la cámara hacia el código QR del boleto
                            </p>
                        </div>

                        <div id="qr-reader" className="w-full"></div>
                        
                        {isScanning && (
                            <div className="mt-4 text-center">
                                <div className="inline-flex items-center space-x-2 text-green-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    <span className="text-sm">Escaneando...</span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Estado: Permisos denegados */}
                {permissionStatus === 'denied' && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Permiso de cámara denegado
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                            {errorMessage || 'No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración de tu navegador.'}
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleRetry}
                                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}

                {/* Estado: Error */}
                {permissionStatus === 'error' && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Error al acceder a la cámara
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                            {errorMessage || 'No se pudo acceder a la cámara. Por favor, verifica que tengas una cámara conectada y disponible.'}
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleRetry}
                                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
