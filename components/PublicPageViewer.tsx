import React, { useEffect } from 'react';
import { Page } from '../types';

interface PublicPageViewerProps {
    page: Page;
}

const PublicPageViewer: React.FC<PublicPageViewerProps> = ({ page }) => {
    useEffect(() => {
        document.title = page.metaTitle || page.title;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', page.metaDescription || '');

    }, [page]);

    return (
        <article className="prose dark:prose-invert max-w-none">
            <h1>{page.title}</h1>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
    );
};

export default PublicPageViewer;