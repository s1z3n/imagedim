import React, { useRef, useEffect } from 'react';
import type { Content } from "@google/genai";

interface ChatPanelProps {
    chatHistory: Content[];
    chatInput: string;
    setChatInput: (value: string) => void;
    onSendMessage: () => void;
    isReplying: boolean;
}

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start">
        <div className="bg-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);

const ChatPanel: React.FC<ChatPanelProps> = ({ chatHistory, chatInput, setChatInput, onSendMessage, isReplying }) => {
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [chatHistory]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex-grow flex flex-col min-h-0">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex-shrink-0">2. Chat for Dimensions</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4" >
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-3 py-2 max-w-xs md:max-w-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                {isReplying && (
                    <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto flex items-center space-x-2 flex-shrink-0">
                <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a dimension..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    disabled={isReplying}
                />
                <button 
                    onClick={onSendMessage}
                    disabled={isReplying || !chatInput.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-indigo-400"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
