
import React from 'react';
import { useParams } from 'react-router-dom';
import KBIndexPage from './KBIndexPage';
import KBPostPage from './KBPostPage';

const KnowledgeBaseViewer = () => {
    const { id: articleId } = useParams();

    // If an ID is present in the URL, show the specific post page. Otherwise, show the index.
    return articleId ? <KBPostPage /> : <KBIndexPage />;
};

export default KnowledgeBaseViewer;
