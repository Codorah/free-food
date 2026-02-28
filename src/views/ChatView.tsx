import { useState, useEffect, useRef } from 'react';
import { Send, UserCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ChatView() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchMessages = () => {
        fetch('/api/chat')
            .then(res => res.json())
            .then(data => {
                setMessages(data);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            })
            .catch(err => console.error("Error fetching chat", err));
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        try {
            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: 'anonymous@freefood.tg', content: input })
            });
            setInput('');
            fetchMessages();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full bg-stone-50 flex flex-col pt-4">
            <div className="px-6 mb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-stone-800">Chat Communautaire</h2>
                <p className="text-sm text-stone-500 font-medium tracking-wide">Discutez en direct</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-stone-400 text-sm mt-10">
                        Aucun message. Soyez le premier à parler !
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.user_email === 'anonymous@freefood.tg';
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id || idx}
                                className={`flex flex-col max-w-[80%] \${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                                {!isMe && (
                                    <div className="flex items-center gap-1.5 mb-1 ml-1 text-xs text-stone-400 font-medium">
                                        <UserCircle2 size={12} />
                                        <span>User</span>
                                    </div>
                                )}
                                <div className={`px-4 py-3 \${
                  isMe 
                    ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-orange-500/20' 
                    : 'bg-white text-stone-800 rounded-2xl rounded-tl-sm shadow-sm border border-stone-100'
                }`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                                {isMe && (
                                    <span className="text-[10px] text-stone-400 mt-1 mr-1">À l'instant</span>
                                )}
                            </motion.div>
                        );
                    })
                )}
                <div ref={bottomRef} className="h-10" />
            </div>

            {/* Input area fixed slightly above bottom nav for padding */}
            <div className="absolute bottom-[88px] left-0 right-0 p-4 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
                <form onSubmit={sendMessage} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Écrivez un message..."
                        className="w-full bg-white border border-stone-200 shadow-sm rounded-full py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-stone-800"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-90 transition-all"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
