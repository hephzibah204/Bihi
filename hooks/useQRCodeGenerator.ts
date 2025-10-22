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
                const url = await QRCodeGenerator.toDataURL(text, { 
                    width: 200, 
                    margin: 2 
                });
                setQrCodeUrl(url);
            } catch (error) {
                console.error('QR Code generation error:', error);
                setQrCodeUrl('');
            } finally {
                setIsLoading(false);
            }
        };

        generateQRCode();
    }, [text]);

    return { qrCodeUrl, isLoading };
};
