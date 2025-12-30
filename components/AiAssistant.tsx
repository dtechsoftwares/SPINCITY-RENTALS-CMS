
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Contact, Rental, Repair, InventoryItem, User } from '../types';

interface AiAssistantProps {
    contacts: Contact[];
    rentals: Rental[];
    inventory: InventoryItem[];
    repairs: Repair[];
    currentUser: User;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ contacts, rentals, inventory, repairs, currentUser }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            const systemPrompt = `
                You are a Business Intelligence Assistant for Spin City Rentals. 
                Business Data Context:
                - Total Clients: ${contacts.length}
                - Total Equipment: ${inventory.length}
                - Active Rentals: ${rentals.filter(r => r.status === 'Active').length}
                - Equipment In Repair: ${inventory.filter(i => i.status === 'In Repair').length}
                - Pending Maintenance Tasks: ${repairs.filter(r => r.status === 'Open').length}
                
                Current User: ${currentUser.name} (${currentUser.role}).
                Answer based solely on this data. Be concise, professional, and helpful. 
                If asked about revenue, assume plan prices in data are monthly.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
                    { role: 'user', parts: [{ text: userMsg }] }
                ],
                config: {
                    systemInstruction: systemPrompt
                }
            });

            const aiText = response.text || "I processed that request but have no text output.";
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Unable to connect to AI engine. Check your API key." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 flex flex-col h-full bg-gray-100">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center text-brand-text">
                        <svg className="w-8 h-8 mr-3 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Business Intelligence AI
                    </h1>
                    <p className="text-gray-500 mt-1">Real-time analysis of your SpinCity fleet and clients.</p>
                </div>
                <button onClick={() => setMessages([])} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 uppercase border border-gray-200 rounded-lg bg-white transition-colors">Clear Chat</button>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-6">
                            <div className="w-20 h-20 bg-lime-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <svg className="w-10 h-10 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-700">Data Assistant Online</h3>
                            <p className="max-w-xs mt-2 text-sm">Ask about your machine utilization, client growth, or repair summaries.</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${m.role === 'user' ? 'bg-brand-green text-white rounded-tr-none' : 'bg-white text-brand-text border border-gray-200 rounded-tl-none'}`}>
                                <p className="text-sm leading-relaxed">{m.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 flex space-x-2 shadow-sm">
                                <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex space-x-4">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="e.g. How many machines are currently generating revenue?"
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green-dark disabled:bg-gray-300 shadow-md transition-all active:scale-95"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
