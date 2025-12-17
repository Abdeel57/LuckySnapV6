import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, AlertCircle, RotateCcw } from 'lucide-react';

interface QRScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'error'>('requesting');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [useBackCamera, setUseBackCamera] = useState(true); // true = trasera, false = frontal
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const readerElementRef = useRef<HTMLDivElement>(null);

    // Detectar si es un dispositivo móvil
    useEffect(() => {
        const checkIsMobile = () => {
            const isMobile = window.innerWidth < 768 || 
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobileDevice(isMobile);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Función para obtener lista de cámaras
    const getCameras = async (): Promise<MediaDeviceInfo[]> => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error al obtener cámaras:', error);
            return [];
        }
    };

    // Función para encontrar la cámara trasera
    const findBackCamera = async (): Promise<string | null> => {
        const cameras = await getCameras();
        
        // Intentar encontrar cámara trasera por label
        const backCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') ||
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
            return backCamera.deviceId;
        }
        
        // Si no hay cámara trasera, usar la primera disponible
        if (cameras.length > 0) {
            return cameras[0].deviceId;
        }
        
        return null;
    };

    // Función para encontrar la cámara frontal
    const findFrontCamera = async (): Promise<string | null> => {
        const cameras = await getCameras();
        
        // Intentar encontrar cámara frontal por label
        const frontCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('front') ||
            camera.label.toLowerCase().includes('facing') ||
            camera.label.toLowerCase().includes('user')
        );
        
        if (frontCamera) {
            return frontCamera.deviceId;
        }
        
        // Si hay múltiples cámaras y una es trasera, usar la otra
        if (cameras.length > 1) {
            const backCameraId = await findBackCamera();
            const otherCamera = cameras.find(camera => camera.deviceId !== backCameraId);
            if (otherCamera) {
                return otherCamera.deviceId;
            }
        }
        
        // Si solo hay una cámara, usarla
        if (cameras.length > 0) {
            return cameras[0].deviceId;
        }
        
        return null;
    };

    // Función para inicializar el escáner (compartida entre useEffect y handleRetry)
    const initializeScanner = useCallback(async (preferBackCamera: boolean = true) => {
        try {
            // Limpiar escáner anterior si existe
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                    scannerRef.current.clear();
                } catch (error) {
                    console.log('Error al limpiar escáner anterior:', error);
                }
                scannerRef.current = null;
            }

            // Limpiar el contenedor del escáner
            const readerElement = readerElementRef.current || document.getElementById('qr-reader');
            if (!readerElement) {
                console.error('Contenedor qr-reader no encontrado');
                setPermissionStatus('error');
                setErrorMessage('Error al inicializar el escáner: contenedor no encontrado.');
                return;
            }
            
            readerElement.innerHTML = '';

            // Verificar que el elemento está visible antes de inicializar
            if (readerElement.offsetParent === null) {
                console.warn('Contenedor qr-reader no está visible, esperando...');
                setTimeout(() => initializeScanner(preferBackCamera), 200);
                return;
            }

            // Obtener lista de cámaras disponibles
            const cameras = await getCameras();
            setAvailableCameras(cameras);

            // Crear instancia de Html5Qrcode
            const html5QrCode = new Html5Qrcode('qr-reader');
            scannerRef.current = html5QrCode;

            // Encontrar la cámara según preferencia
            let cameraId: string | null = null;
            try {
                if (preferBackCamera) {
                    cameraId = await findBackCamera();
                } else {
                    cameraId = await findFrontCamera();
                }
            } catch (error) {
                console.log('No se pudo obtener lista de cámaras, usando default:', error);
            }

            // Configuración para iniciar la cámara
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // Video constraints - usar cámara específica o facingMode
            const videoConstraints = cameraId 
                ? { deviceId: { exact: cameraId } }
                : preferBackCamera 
                    ? { facingMode: 'environment' }
                    : { facingMode: 'user' };

            // Iniciar el escáner con la cámara
            await html5QrCode.start(
                videoConstraints,
                config,
                (decodedText) => {
                    console.log('📱 QR Code scanned:', decodedText);
                    onScan(decodedText);
                    setIsScanning(false);
                    // Detener el escáner después de escanear
                    html5QrCode.stop().then(() => {
                        html5QrCode.clear();
                        scannerRef.current = null;
                    }).catch(() => {
                        html5QrCode.clear();
                        scannerRef.current = null;
                    });
                },
                (errorMessage) => {
                    // Ignorar errores de permiso que ya manejamos arriba
                    if (errorMessage && !errorMessage.includes('Permission denied') && !errorMessage.includes('NotAllowedError')) {
                        console.log('QR scan error:', errorMessage);
                    }
                }
            );

            setIsScanning(true);
        } catch (error: any) {
            console.error('Error al inicializar escáner:', error);
            
            // Manejar errores específicos
            if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
                setPermissionStatus('denied');
                setErrorMessage('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
            } else if (error.name === 'NotFoundError' || error.message?.includes('No devices found')) {
                setPermissionStatus('error');
                setErrorMessage('No se encontró ninguna cámara disponible.');
            } else {
                setPermissionStatus('error');
                setErrorMessage('Error al iniciar la cámara. Por favor, intenta de nuevo.');
            }
        }
    }, [onScan]);

    // Función para solicitar permisos de cámara (compartida entre useEffect y handleRetry)
    const requestCameraPermission = useCallback(async () => {
        try {
            // Verificar si el navegador soporta getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta acceso a la cámara. Por favor, usa un navegador moderno.');
            }

            // Solicitar permiso de cámara explícitamente para verificar que está disponible
            // Usamos una solicitud rápida solo para verificar permisos, luego lo detenemos
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Preferir cámara trasera en móviles
                } 
            });

            // Verificar que obtuvimos el permiso, pero detener este stream ya que
            // el escáner HTML5-QRCode obtendrá su propio stream
            stream.getTracks().forEach(track => track.stop());
            
            // Cambiar estado a granted - el useEffect se encargará de inicializar el escáner
            setPermissionStatus('granted');

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
                scannerRef.current.stop()
                    .then(() => {
                        scannerRef.current?.clear();
                        scannerRef.current = null;
                    })
                    .catch(() => {
                        scannerRef.current?.clear();
                        scannerRef.current = null;
                    });
            }
        };
    }, [requestCameraPermission]);

    // Inicializar el escáner cuando el estado cambie a 'granted' y el contenedor esté visible
    useEffect(() => {
        if (permissionStatus === 'granted' && !scannerRef.current) {
            // Esperar a que el DOM se actualice completamente
            const timer = setTimeout(() => {
                const readerElement = document.getElementById('qr-reader');
                if (readerElement && readerElement.offsetParent !== null) {
                    initializeScanner(useBackCamera);
                } else {
                    // Si el elemento aún no está visible, intentar de nuevo
                    const retryTimer = setTimeout(() => {
                        if (!scannerRef.current) {
                            initializeScanner(useBackCamera);
                        }
                    }, 300);
                    
                    // Cleanup del retryTimer
                    setTimeout(() => clearTimeout(retryTimer), 400);
                }
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [permissionStatus, initializeScanner, useBackCamera]);

    const handleRetry = async () => {
        setPermissionStatus('requesting');
        setErrorMessage('');
        
        // Limpiar escáner anterior si existe
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (error) {
                console.log('Error al limpiar escáner:', error);
                try {
                    scannerRef.current.clear();
                } catch (clearError) {
                    console.log('Error al limpiar escáner (fallback):', clearError);
                }
            }
            scannerRef.current = null;
        }

        // Limpiar el contenedor del escáner
        const readerElement = readerElementRef.current || document.getElementById('qr-reader');
        if (readerElement) {
            readerElement.innerHTML = '';
        }

        // Esperar un momento antes de solicitar permisos nuevamente
        await new Promise(resolve => setTimeout(resolve, 300));

        // Solicitar permisos nuevamente usando la función compartida
        await requestCameraPermission();
    };

    // Función para voltear la cámara (solo en dispositivos móviles)
    const handleFlipCamera = async () => {
        if (!isMobileDevice || !scannerRef.current || permissionStatus !== 'granted') {
            return;
        }

        try {
            // Cambiar el estado de la cámara
            const newUseBackCamera = !useBackCamera;
            
            // Detener el escáner actual
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                    scannerRef.current.clear();
                } catch (error) {
                    console.log('Error al detener escáner:', error);
                }
                scannerRef.current = null;
            }

            // Limpiar el contenedor
            const readerElement = readerElementRef.current || document.getElementById('qr-reader');
            if (readerElement) {
                readerElement.innerHTML = '';
            }

            // Esperar un momento antes de reiniciar con la nueva cámara
            await new Promise(resolve => setTimeout(resolve, 200));

            // Actualizar estado y reiniciar el escáner con la nueva cámara
            setUseBackCamera(newUseBackCamera);
            await initializeScanner(newUseBackCamera);
        } catch (error) {
            console.error('Error al voltear la cámara:', error);
            setErrorMessage('Error al cambiar de cámara. Por favor, intenta de nuevo.');
        }
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

                        {/* Contenedor relativo para posicionar el botón de voltear */}
                        <div className="relative">
                            <div id="qr-reader" ref={readerElementRef} className="w-full min-h-[300px]"></div>
                            
                            {/* Botón para voltear la cámara - Solo en dispositivos móviles con múltiples cámaras */}
                            {isMobileDevice && availableCameras.length > 1 && (
                                <button
                                    onClick={handleFlipCamera}
                                    className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={useBackCamera ? "Cambiar a cámara frontal" : "Cambiar a cámara trasera"}
                                    disabled={!isScanning || permissionStatus !== 'granted'}
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
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
