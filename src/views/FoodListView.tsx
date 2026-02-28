import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Info, Plus, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FoodListView({ onViewDetails }: { onViewDetails: (id: number) => void }) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const res = await fetch('/api/events');
            return res.json();
        }
    });

    const filteredEvents = useMemo(() => {
        return events.filter((evt: any) => {
            // Search
            const matchesSearch = evt.name.toLowerCase().includes(search.toLowerCase()) ||
                evt.location.toLowerCase().includes(search.toLowerCase());
            // Filter
            const matchesFilter = activeFilter === 'all' ||
                (activeFilter === 'confirmed' && evt.food_certainty === 'confirmed') ||
                (activeFilter === 'conference' && evt.type === 'Conférence');
            return matchesSearch && matchesFilter;
        });
    }, [events, search, activeFilter]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 pb-24 h-full flex flex-col">
            {/* Search & Filters (Sticky-ish) */}
            <div className="space-y-3 flex-shrink-0">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Rechercher (ex: Agora...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-full py-3.5 pl-11 pr-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-stone-800"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all \${activeFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
                    >
                        Tout voir
                    </button>
                    <button
                        onClick={() => setActiveFilter('confirmed')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 \${activeFilter === 'confirmed' ? 'bg-green-500 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
                    >
                        <div className={`w-2 h-2 rounded-full \${activeFilter==='confirmed' ? 'bg-white' : 'bg-green-500'}`} />
                        Confirmé
                    </button>
                    <button
                        onClick={() => setActiveFilter('conference')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all \${activeFilter === 'conference' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
                    >
                        Conférences
                    </button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <Info className="text-orange-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800 mb-2">Aucun repas en cours</h3>
                    <p className="text-sm text-stone-500">Soyez le premier à partager de la nourriture à Lomé !</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-10 mt-10">
                    <p className="text-stone-500 font-medium">Aucun résultat pour cette recherche.</p>
                </div>
            ) : (
                <div className="grid gap-4 flex-1 overflow-y-auto w-full pb-4 pr-1 scroll-smooth">
                    <AnimatePresence>
                        {filteredEvents.map((evt: any, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05, duration: 0.2 }}
                                key={evt.id}
                                onClick={() => onViewDetails(evt.id)}
                                className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-stone-100 cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                {/* Image banner placeholder if no poster */}
                                <div className="h-36 bg-stone-100 relative w-full overflow-hidden group">
                                    {evt.poster_url ? (
                                        <img src={evt.poster_url} alt={evt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                            <span className="text-4xl">🍲</span>
                                        </div>
                                    )}
                                    {/* Certainty badge */}
                                    <div className="absolute top-3 right-3 shadow-md">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full \${
                      evt.food_certainty === 'confirmed' ? 'bg-green-500 text-white' : 
                      evt.food_certainty === 'probable' ? 'bg-amber-400 text-white' : 
                      'bg-stone-600 text-white'
                    }`}>
                                            {evt.food_certainty === 'confirmed' ? '✓ Confirmé' :
                                                evt.food_certainty === 'probable' ? '? Probable' : 'Inconnue'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-stone-800 line-clamp-1 flex-1 pr-2">{evt.name}</h3>
                                        {evt.created_at && (
                                            <span className="text-[10px] font-medium text-stone-400 whitespace-nowrap pt-1">
                                                {formatDistanceToNow(new Date(evt.created_at), { addSuffix: true, locale: fr })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center text-stone-500 text-xs font-medium">
                                            <MapPin size={14} className="mr-1.5 text-stone-400" />
                                            <span className="truncate">{evt.location}</span>
                                        </div>
                                        <div className="flex items-center text-stone-500 text-xs font-medium">
                                            <Clock size={14} className="mr-1.5 text-stone-400" />
                                            <span>{evt.type || 'Repas'} • {evt.time || '12:00'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                                        <div className="flex items-center gap-2">
                                            {/* Participant avatars */}
                                            <div className="flex -space-x-1.5">
                                                {[...Array(Math.min(3, evt.participant_count || 0))].map((_, i) => (
                                                    <div key={i} className="w-5 h-5 rounded-full bg-orange-100 border border-white"></div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-stone-500 font-semibold">
                                                {evt.participant_count || 0} intéressés
                                            </span>
                                        </div>

                                        <div className="text-orange-600 font-bold text-xs bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                            Détails
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
