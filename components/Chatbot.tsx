import React, { useState } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatbotPanel from './ChatbotPanel';

const Chatbot = ({ userRole, demoUserId, activeView }: { userRole: string, demoUserId?: string, activeView: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
            <ChatbotPanel 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)}
                userRole={userRole}
                demoUserId={demoUserId}
                activeView={activeView}
            />
            <FloatingChatButton onClick={() => setIsOpen(prev => !prev)} isOpen={isOpen} />
        </div>
    );
};

export default Chatbot;