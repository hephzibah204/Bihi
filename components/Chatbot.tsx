import React, { useState } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatbotPanel from './ChatbotPanel';

const Chatbot = ({ userRole, demoUserId }: { userRole: string, demoUserId?: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <ChatbotPanel 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)}
                userRole={userRole}
                demoUserId={demoUserId}
            />
            <FloatingChatButton onClick={() => setIsOpen(prev => !prev)} isOpen={isOpen} />
        </div>
    );
};

export default Chatbot;
