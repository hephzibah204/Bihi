import { useState, useEffect } from 'react';

// In a real app, you would use the qrcode library loaded from CDN
declare global {
    interface Window {
        QRCode: any;
    }
}

export const useQRCodeGenerator = (text: string) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        if (text && window.QRCode) {
            window.QRCode.toDataURL(text, (err, url) => {
                if (err) {
                    console.error(err);
                    return;
                }
                setQrCodeUrl(url);
            });
        }
    }, [text]);

    return qrCodeUrl;
};
