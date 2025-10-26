import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X } from 'lucide-react';

interface QRScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (scannerRef.current) {
            return;
        }

        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            {
                qrbox: { width: 250, height: 250 },
                fps: 5,
                aspectRatio: 1.0,
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
                // Error handling is done by the library
                console.log('QR scan error:', error);
            }
        );

        scannerRef.current = scanner;
        setIsScanning(true);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        };
    }, [onScan]);

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
                
                <div className="text-center mb-4">
                    <QrCode className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                        Apunta la cámara hacia el código QR del boleto
                    </p>
                </div>

                <div id="qr-reader" className="w-full"></div>
                
                {isScanning && (
                    <div className="mt-4 text-center">
                        <div className="inline-flex items-center space-x-2 text-blue-600">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            <span className="text-sm">Escaneando...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
