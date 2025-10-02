import React, { useState } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatbotPanel from './ChatbotPanel';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <FloatingChatButton onClick={() => setIsOpen(prev => !prev)} isOpen={isOpen} />
        </div>
    );
};

export default Chatbot;
