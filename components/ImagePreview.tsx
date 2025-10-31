import React from 'react';

interface ImagePreviewProps {
  html?: string; // raw HTML <img> from the API
  base64?: string; // base64 image content
  alt?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ html, base64, alt = 'Generated Image' }) => {
  if (html && html.trim().length) {
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (base64 && base64.trim().length) {
    const src = `data:image/png;base64,${base64}`;
    return <img src={src} alt={alt} className="rounded-lg max-w-full h-auto" />;
  }
  return null;
};

export default ImagePreview;