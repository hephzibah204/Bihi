// A simple image compression utility using canvas
export const compressImage = (file: File, options: { maxWidth: number, quality: number } = { maxWidth: 800, quality: 0.7 }): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scaleRatio = options.maxWidth / img.width;
            canvas.width = options.maxWidth;
            canvas.height = img.height * scaleRatio;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                },
                'image/jpeg',
                options.quality
            );
        };
        img.onerror = (error) => reject(error);
    });
};
