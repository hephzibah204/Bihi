import React, { useState, useEffect } from 'react';
import KBIndexPage from './KBIndexPage';
import KBPostPage from './KBPostPage';

const KnowledgeBaseViewer = () => {
    const [articleId, setArticleId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setArticleId(params.get('id'));
    }, []);

    // Simple router: if an ID is present, show the post page, otherwise show the index.
    return articleId ? <KBPostPage /> : <KBIndexPage />;
};

export default KnowledgeBaseViewer;
