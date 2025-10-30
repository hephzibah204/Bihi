// components/HtmlContent.tsx
import React, { useEffect } from 'react';
import sanitizeHtml from '../utils/sanitizeHtml';

interface HtmlContentProps {
  html: string;
  className?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

const GLOBAL_STYLE_ID = 'prose-content-styles';

function ensureGlobalStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(GLOBAL_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
  .prose-content { color: #1f2937; line-height: 1.65; }
  .prose-content h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0; }
  .prose-content h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0; }
  .prose-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0; }
  .prose-content p { margin: 0.5rem 0; }
  .prose-content ul { list-style: disc; margin: 0.5rem 1.25rem; padding-left: 1.25rem; }
  .prose-content ol { list-style: decimal; margin: 0.5rem 1.25rem; padding-left: 1.25rem; }
  .prose-content li { margin: 0.25rem 0; }
  .prose-content table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.95rem; }
  .prose-content th, .prose-content td { border: 1px solid #e5e7eb; padding: 0.5rem 0.65rem; text-align: left; }
  .prose-content thead th { background: #f9fafb; font-weight: 600; }
  .prose-content strong { font-weight: 600; }
  .prose-content hr { border: 0; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
  .prose-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 0.75rem; color: #374151; }
  `;
  document.head.appendChild(style);
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ html, className = '', ...rest }) => {
  useEffect(() => { ensureGlobalStyles(); }, []);
  return (
    <div
      className={`prose-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      {...rest}
    />
  );
};

export default HtmlContent;
