import { useState, useEffect } from 'react';
import { QRCodeGenerator } from '../utils/qrCodeGenerator';

export const useQRCodeGenerator = (text: string) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateQRCode = async () => {
            if (!text) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // Prefer standard QR via CDN 'qrcode' lib if available
                const ensureLib = () => new Promise<void>((resolve, reject) => {
                    if ((window as any).QRCode) return resolve();
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
                    script.async = true;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load QR library'));
                    document.head.appendChild(script);
                });
                try {
                    await ensureLib();
                    const url = await (window as any).QRCode.toDataURL(text, {
                        width: 256,
                        margin: 8,
                        color: { dark: '#000000', light: '#FFFFFF' }
                    });
                    setQrCodeUrl(url);
                } catch (e) {
                    // Fallback to simple generator
                    const url = await QRCodeGenerator.toDataURL(text, { 
                        width: 256, 
                        margin: 8,
                        color: { dark: '#000000', light: '#FFFFFF' }
                    });
                    setQrCodeUrl(url);
                }
            } catch (error) {
                // Non-fatal: fallback shows placeholder
                setQrCodeUrl('');
            } finally {
                setIsLoading(false);
            }
        };

        generateQRCode();
    }, [text]);

    return { qrCodeUrl, isLoading };
};
