import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, MapPin, Users, Send, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const icon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="w-6 h-6 bg-orange-600 rounded-full border-2 border-white shadow-lg"></div>',
    iconSize: [24, 24]
});

export default function FoodDetailView({ eventId, onBack }: { eventId: number, onBack: () => void }) {
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');

    const { data: event, isLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            const res = await fetch(`/api/events/${eventId}`);
            if (!res.ok) throw new Error("Event not found");
            return res.json();
        }
    });

    const joinMutation = useMutation({
        mutationFn: async () => {
            await fetch(`/api/events/${eventId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: 'anonymous@freefood.tg' })
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success("RSVP confirmé !");
        }
    });

    const commentMutation = useMutation({
        mutationFn: async (content: string) => {
            await fetch(`/api/events/${eventId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: 'anonymous@freefood.tg', content })
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            toast.success("Commentaire envoyé");
            setComment('');
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full bg-white z-50 fixed inset-0">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!event) return null;

    const hasJoined = event.participants?.includes('anonymous@freefood.tg');
    const participantCount = event.participants?.length || 0;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 bg-white z-[60] flex flex-col overflow-hidden"
        >
            {/* Header Image */}
            <div className="relative h-64 flex-shrink-0 bg-stone-100">
                <button
                    onClick={onBack}
                    className="absolute top-6 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-stone-800 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>

                {event.poster_url ? (
                    <img src={event.poster_url} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center">
                        <span className="text-6xl">🍲</span>
                    </div>
                )}

                <div className="absolute top-6 right-4 z-10">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-md \${
            event.food_certainty === 'confirmed' ? 'bg-green-500 text-white' : 
            event.food_certainty === 'probable' ? 'bg-amber-400 text-white' : 
            'bg-stone-600 text-white'
          }`}>
                        {event.food_certainty === 'confirmed' ? '✓ Confirmé' :
                            event.food_certainty === 'probable' ? '? Probable' : 'Inconnue'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 bg-white rounded-t-[2rem] -mt-8 relative z-20">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-black text-stone-800 leading-tight pr-4">{event.name}</h1>
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 flex-shrink-0 rounded-lg font-medium">
                        {event.type || "Repas"}
                    </span>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-sm font-medium text-stone-600">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                            <Clock size={16} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-stone-800">{event.time || '12:00'}</p>
                            <p className="text-[10px] text-stone-400 font-normal">Aujourd'hui</p>
                        </div>
                    </div>

                    <div className="flex items-center text-sm font-medium text-stone-600">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                            <Users size={16} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-stone-800">{participantCount} RSVP</p>
                            <p className="text-[10px] text-stone-400 font-normal">Sont en route</p>
                        </div>
                    </div>
                </div>

                {event.description && (
                    <div className="mb-8">
                        <h3 className="font-bold text-stone-800 mb-2">À propos</h3>
                        <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl">{event.description}</p>
                    </div>
                )}

                <div className="mb-8">
                    <h3 className="font-bold text-stone-800 mb-2">Localisation</h3>
                    <div className="flex items-center text-sm text-stone-600 mb-3 ml-1">
                        <MapPin size={16} className="mr-2 text-stone-400" />
                        {event.location}
                    </div>
                    {event.latitude && event.longitude && (
                        <div className="h-32 rounded-2xl overflow-hidden border border-stone-100 relative shadow-inner">
                            <div className="absolute inset-0 z-10 pointer-events-none border border-black/5 rounded-2xl"></div>
                            <MapContainer
                                center={[event.latitude, event.longitude]}
                                zoom={15}
                                style={{ width: '100%', height: '100%', zIndex: 0 }}
                                zoomControl={false}
                                dragging={false}
                                scrollWheelZoom={false}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <Marker position={[event.latitude, event.longitude]} icon={icon} />
                            </MapContainer>
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div>
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center justify-between">
                        Commentaires ({event.comments?.length || 0})
                    </h3>
                    <div className="space-y-4 mb-4">
                        {event.comments?.map((c: any) => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                                    <UserCircle2 size={18} />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-xs text-stone-800">Utilisateur</span>
                                        <span className="text-[10px] text-stone-400">
                                            {formatDistanceToNow(new Date(c.created_at || Date.now()), { addSuffix: true, locale: fr })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-600 mt-0.5">{c.content}</p>
                                </div>
                            </div>
                        ))}
                        {event.comments?.length === 0 && (
                            <p className="text-xs text-stone-400 italic text-center py-2">Aucun commentaire pour l'instant.</p>
                        )}
                    </div>

                    <form
                        onSubmit={(e) => { e.preventDefault(); if (comment.trim()) commentMutation.mutate(comment); }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Poser une question..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!comment.trim() || commentMutation.isPending}
                            className="bg-stone-900 text-white p-3 rounded-xl disabled:opacity-50 transition-all active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Floating Action Button (RSVP) */}
            <div className="absolute bottom-6 left-6 right-6 z-30">
                <button
                    onClick={() => !hasJoined && joinMutation.mutate()}
                    disabled={hasJoined || joinMutation.isPending}
                    className={`w-full font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 \${
            hasJoined 
              ? 'bg-green-50 text-green-700 border-2 border-green-200 opacity-90' 
              : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/30'
          }`}
                >
                    {hasJoined ? (
                        <>En route ! ✓</>
                    ) : (
                        <>J'y vais !</>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
