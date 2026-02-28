import { useEffect, useState } from 'react';
import { Clock, MapPin, Users, Info, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function FoodListView() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/events')
            .then(r => r.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch events", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                <p className="text-stone-500 font-medium animate-pulse">Recherche de repas gratuits...</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold tracking-tight text-stone-800">Près de vous</h2>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">{events.length} Annonces</span>
            </div>

            {events.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-stone-100">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="text-orange-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800 mb-2">Aucun repas en cours</h3>
                    <p className="text-sm text-stone-500 mb-6">Soyez le premier à partager de la nourriture à Lomé !</p>
                    <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-2xl w-full flex items-center justify-center gap-2 transition-colors">
                        <Plus size={20} /> Partager un repas
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {events.map((evt, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={evt.id}
                            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            {/* Image banner placeholder if no poster */}
                            <div className="h-32 bg-stone-100 relative w-full overflow-hidden">
                                {evt.poster_url ? (
                                    <img src={evt.poster_url} alt={evt.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                                        <span className="text-4xl">🍲</span>
                                    </div>
                                )}
                                {/* Certainty badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-sm \${
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
                                    <h3 className="font-bold text-lg text-stone-800 line-clamp-1">{evt.name}</h3>
                                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-lg font-medium whitespace-nowrap ml-2">
                                        {evt.type || "Repas"}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-stone-500 text-sm">
                                        <MapPin size={16} className="mr-2 text-orange-500" />
                                        <span className="truncate">{evt.location}</span>
                                    </div>
                                    <div className="flex items-center text-stone-500 text-sm">
                                        <Clock size={16} className="mr-2 text-orange-500" />
                                        <span>Aujourd'hui, {evt.time || '12:00'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                    <div className="flex flex-col">
                                        <div className="flex -space-x-2">
                                            {[...Array(Math.min(3, evt.participant_count || 0))].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-orange-200 border-2 border-white"></div>
                                            ))}
                                            {(!evt.participant_count || evt.participant_count === 0) && (
                                                <div className="w-6 h-6 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-stone-500">0</div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-stone-400 font-medium mt-1">
                                            {evt.participant_count || 0} participants
                                        </span>
                                    </div>

                                    <button className="bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                                        Voir détails
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
