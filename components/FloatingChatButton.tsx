import React from 'react';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import XIcon from './icons/XIcon';

interface FloatingChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick, isOpen }) => {
    return (
        <button
            onClick={onClick}
            className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label={isOpen ? "Close chat" : "Open chat"}
        >
            <div className="relative w-8 h-8">
                <ChatBubbleLeftRightIcon className={`absolute inset-0 w-8 h-8 transition-all duration-300 ${isOpen ? 'transform rotate-90 opacity-0' : 'transform rotate-0 opacity-100'}`} />
                <XIcon className={`absolute inset-0 w-8 h-8 transition-all duration-300 ${isOpen ? 'transform rotate-0 opacity-100' : 'transform -rotate-90 opacity-0'}`} />
            </div>
        </button>
    );
};

export default FloatingChatButton;