// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  MapPin,
  Calendar,
  Clock,
  Utensils,
  Users,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Info,
  Search,
  X,
  Map as MapIcon,
  Navigation
} from 'lucide-react';
import { AppEvent, EventDetails, Comment, ChatMessage } from './types';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Mock user email for demo
const USER_EMAIL = "student@univ-lome.tg";
const LOME_CENTER: [number, number] = [6.1725, 1.2314];

const MapCleanup = () => {
  const map = useMap();
  useEffect(() => {
    return () => {
      map.off();
      map.remove();
    };
  }, [map]);
  return null;
};

function SafeMap({
  center,
  zoom,
  children,
  mapKey,
  className = "h-full w-full",
  ...props
}: {
  center: [number, number];
  zoom: number;
  children: React.ReactNode;
  mapKey: string;
  className?: string;
  [key: string]: any;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, [mapKey]);

  if (!ready) {
    return (
      <div className={`${className} flex items-center justify-center bg-stone-50`}>
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      className={className}
      {...props}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {children}
      <MapCleanup />
    </MapContainer>
  );
}

function AppContent() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCertainty, setFilterCertainty] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, reporter_email: USER_EMAIL }),
      });
      if (res.ok) {
        fetchEvents();
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || e.type === filterType;
    const matchesCertainty = filterCertainty === 'all' || e.food_certainty === filterCertainty;
    let matchesLocation = true;
    if (userLocation && e.latitude && e.longitude) {
      const dist = getDistance(userLocation, [e.latitude, e.longitude]);
      matchesLocation = dist < 5; // 5 km radius
    }
    return matchesSearch && matchesType && matchesCertainty && matchesLocation;
  });

  const eventTypes = ['all', 'Club Meeting', 'Seminar / Talk', 'Conférence', 'Hackathon', 'Salon', 'Mariage', 'Concours', 'Meetup', 'Party / Social', 'Formation'];

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Utensils size={18} />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight leading-none text-stone-900">Free Food Togo</h1>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Lomé • Togo</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors">
            <Search size={18} />
          </button>
          <Link
            to="/chat"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${location.pathname === '/chat' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
          >
            <MessageSquare size={18} />
          </Link>
          <div className="h-6 w-[1px] bg-stone-200 mx-1" />
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${location.pathname === '/' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              List
            </Link>
            <Link
              to="/map"
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${location.pathname === '/map' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              Map
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4">
        <Routes>
          <Route path="/" element={
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
               
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {eventTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                          filterType === type
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                            : 'bg-white text-stone-500 border-stone-200 hover:border-emerald-200'
                        }`}
                      >
                        {type === 'all' ? 'Tous les types' : type}
                      </button>
                    ))}
                  </div>
                 
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                      { id: 'all', label: 'Toutes certitudes' },
                      { id: 'confirmed', label: 'Confirmé ✅' },
                      { id: 'probable', label: 'Probable ⏳' },
                      { id: 'unknown', label: 'Inconnu ❓' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setFilterCertainty(opt.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                          filterCertainty === opt.id
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md shadow-stone-200'
                            : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                      () => alert("Impossible d'obtenir la position")
                    );
                  }}
                  className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  Afficher près de moi (5km)
                </button>
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-40 bg-stone-200 animate-pulse rounded-3xl" />
                  ))
                ) : filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => navigate(`/event/${event.id}`)}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 text-stone-500 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <Utensils size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="mb-4">Aucun événement ne correspond à vos critères.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                        setFilterCertainty('all');
                      }}
                      className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            </div>
          } />
         
          <Route path="/map" element={
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {eventTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                          filterType === type
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                            : 'bg-white text-stone-500 border-stone-200 hover:border-emerald-200'
                        }`}
                      >
                        {type === 'all' ? 'Tous les types' : type}
                      </button>
                    ))}
                  </div>
                 
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                      { id: 'all', label: 'Toutes certitudes' },
                      { id: 'confirmed', label: 'Confirmé ✅' },
                      { id: 'probable', label: 'Probable ⏳' },
                      { id: 'unknown', label: 'Inconnu ❓' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setFilterCertainty(opt.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                          filterCertainty === opt.id
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md shadow-stone-200'
                            : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                      () => alert("Impossible d'obtenir la position")
                    );
                  }}
                  className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  Afficher près de moi (5km)
                </button>
              </div>
              <div className="h-[60vh] w-full rounded-3xl overflow-hidden border border-stone-200 shadow-sm relative bg-stone-100">
                <SafeMap
                  mapKey={`main-map-${location.pathname}-${location.key}`}
                  center={userLocation || LOME_CENTER}
                  zoom={13}
                  className="h-full w-full"
                >
                  {userLocation && <Marker position={userLocation} icon={new L.Icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                  })} />}
                  {filteredEvents.map(event => (
                    event.latitude && event.longitude && (
                      <Marker key={event.id} position={[event.latitude, event.longitude]}>
                        <Popup>
                          <div className="p-1">
                            <h4 className="font-bold text-sm mb-1">{event.name}</h4>
                            <p className="text-[10px] text-stone-500 mb-2">{event.location}</p>
                            <button
                              onClick={() => navigate(`/event/${event.id}`)}
                              className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider"
                            >
                              Voir détails
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </SafeMap>
              </div>
            </div>
          } />
          <Route path="/add" element={
            <AddEventScreen onBack={() => navigate(-1)} onSubmit={handleAddEvent} />
          } />
          <Route path="/event/:id" element={
            <DetailsScreenWrapper onBack={() => navigate(-1)} onUpdate={fetchEvents} />
          } />
          <Route path="/chat" element={
            <ChatScreen onBack={() => navigate(-1)} />
          } />
        </Routes>
      </main>
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-stone-200 px-6 py-3 flex justify-around items-center">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-emerald-600' : 'text-stone-400'}`}>
          <Calendar size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Events</span>
        </Link>
        <Link to="/add" className="w-12 h-12 -mt-8 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 border-4 border-stone-50">
          <Plus size={24} />
        </Link>
        <Link to="/map" className={`flex flex-col items-center gap-1 ${location.pathname === '/map' ? 'text-emerald-600' : 'text-stone-400'}`}>
          <MapIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Carte</span>
        </Link>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function DetailsScreenWrapper({ onBack, onUpdate }: { onBack: () => void, onUpdate: () => void }) {
  const { id } = useParams();
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchEventDetails = async (eventId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      setSelectedEvent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) fetchEventDetails(id);
  }, [id]);
  const handleJoin = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: USER_EMAIL }),
      });
      if (res.ok) {
        fetchEventDetails(id);
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleComment = async (content: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: USER_EMAIL, content }),
      });
      if (res.ok) {
        fetchEventDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleReport = async (reason: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: USER_EMAIL, reason }),
      });
      if (res.ok) {
        alert('Événement signalé avec succès');
      }
    } catch (err) {
      console.error(err);
    }
  };
  if (loading) return <div className="h-80 bg-stone-200 animate-pulse rounded-3xl" />;
  if (!selectedEvent) return <div>Événement non trouvé</div>;
  return (
    <DetailsScreen
      event={selectedEvent}
      onBack={onBack}
      onJoin={handleJoin}
      onComment={handleComment}
      onReport={handleReport}
    />
  );
}

interface EventCardProps {
  event: AppEvent;
  onClick: () => void;
}
const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const certaintyColors = {
    confirmed: 'bg-emerald-500 text-white border-emerald-500',
    probable: 'bg-amber-500 text-white border-amber-500',
    unknown: 'bg-stone-500 text-white border-stone-500'
  };
  const certaintyLabels = {
    confirmed: 'Confirmed',
    probable: 'Probable',
    unknown: 'Unknown'
  };
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm cursor-pointer group"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={event.poster_url || `https://picsum.photos/seed/${event.id}/800/450?blur=2`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={event.name}
          onError={(e) => {
            e.currentTarget.src = `https://picsum.photos/seed/${event.id}/800/450?blur=2`;
          }}
        />
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${certaintyColors[event.food_certainty]}`}>
            <CheckCircle2 size={12} />
            {certaintyLabels[event.food_certainty]}
          </div>
        </div>
        {event.type && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/20">
              {event.type}
            </div>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-display font-bold text-xl mb-3 text-stone-900 group-hover:text-emerald-600 transition-colors leading-tight">{event.name}</h3>
       
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-stone-500 text-sm font-medium">
            <div className="w-5 h-5 flex items-center justify-center text-emerald-500">
              <MapPin size={16} />
            </div>
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2.5 text-stone-500 text-sm font-medium">
            <div className="w-5 h-5 flex items-center justify-center text-emerald-500">
              <Calendar size={16} />
            </div>
            <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at {event.time || 'TBA'}</span>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-stone-50 flex items-center justify-between">
          <button className="text-sm font-bold text-stone-900 flex items-center gap-1 hover:text-emerald-600 transition-colors">
            View Details <ChevronRight size={16} className="mt-0.5" />
          </button>
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-bold uppercase tracking-wider">
            <Users size={14} />
            <span>{event.participant_count}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function ChatScreen({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: USER_EMAIL, content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-stone-50 flex items-center justify-between bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Community Chat</h2>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Lomé Campus</p>
          </div>
        </div>
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-stone-50/30">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.user_email === USER_EMAIL ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                m.user_email === USER_EMAIL
                  ? 'bg-white text-stone-800 rounded-tr-none border border-emerald-100'
                  : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-1.5">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                    {m.user_email.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-stone-300">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-5 bg-white border-t border-stone-50 space-y-3">
        <input
          type="text"
          placeholder="Your name"
          readOnly
          value={USER_EMAIL.split('@')[0]}
          className="w-full px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-stone-400 outline-none"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Message..."
            className="flex-1 px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-orange-500 transition-all text-sm placeholder:text-stone-300"
          />
          <button
            onClick={handleSendMessage}
            className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-orange-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationPicker({ onSelect, initialPos }: { onSelect: (lat: number, lng: number) => void, initialPos?: [number, number] }) {
  const [position, setPosition] = useState<[number, number] | null>(initialPos || null);
  const location = useLocation();

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return position ? <Marker position={position} /> : null;
  };
  const LocateBtn = () => {
    const map = useMap();
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.locate().on('locationfound', (ev) => {
            map.flyTo(ev.latlng, map.getZoom());
            setPosition([ev.latlng.lat, ev.latlng.lng]);
            onSelect(ev.latlng.lat, ev.latlng.lng);
          });
        }}
        className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-2xl shadow-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
      >
        <Navigation size={20} />
      </button>
    );
  };
  return (
    <div className="h-60 w-full rounded-2xl overflow-hidden border border-stone-200 relative bg-stone-50">
      <SafeMap
        mapKey={`picker-${location.key}`}
        center={initialPos || LOME_CENTER}
        zoom={13}
        className="h-full w-full"
      >
        <MapEvents />
        <LocateBtn />
      </SafeMap>
      <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-stone-500 border border-stone-200 shadow-sm">
        Cliquez sur la carte pour placer le marqueur
      </div>
    </div>
  );
}

function AddEventScreen({ onBack, onSubmit }: { onBack: () => void, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: 0,
    longitude: 0,
    date: '',
    time: '',
    type: 'Club Meeting',
    food_certainty: 'probable',
    description: '',
    poster_url: '',
    estimated_until: ''
  });
  const eventTypes = ['Club Meeting', 'Seminar / Talk', 'Conférence', 'Hackathon', 'Salon', 'Mariage', 'Concours', 'Meetup', 'Party / Social', 'Formation'];
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-900 font-bold">
          <ArrowLeft size={20} />
          <span className="text-xl font-display">Share Free Food</span>
        </button>
        <button className="text-orange-500 font-bold text-sm">Drafts</button>
      </div>
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-[32px] border border-stone-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Where is the food?</h3>
              <p className="text-[10px] text-stone-400">Tap on the map exactly where people can find the food.</p>
            </div>
          </div>
          <LocationPicker onSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })} />
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-900 ml-1">Location Name</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Student Union Room 204"
              className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm placeholder:text-stone-300"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-900 ml-1">What's going on?</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Leftover pizza from CS Club"
              className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm placeholder:text-stone-300"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-900 ml-1">More details</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What kind of food? How much is left? Any entry requirements?"
              className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm placeholder:text-stone-300 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-900 ml-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-900 ml-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-900 ml-1">Reste probablement jusqu'à</label>
            <input
              type="datetime-local"
              value={formData.estimated_until || ''}
              onChange={e => setFormData({ ...formData, estimated_until: e.target.value })}
              className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-900 ml-1">Event Photo URL</label>
            <input
              type="text"
              value={formData.poster_url}
              onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
              placeholder="Paste an image link (e.g., from Imgur)"
              className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm placeholder:text-stone-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-900 ml-1">Event Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm appearance-none"
              >
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-900 ml-1">Food Certainty</label>
              <select
                value={formData.food_certainty}
                onChange={e => setFormData({ ...formData, food_certainty: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm appearance-none"
              >
                <option value="confirmed">Confirmed (Definitely there)</option>
                <option value="probable">Probable (Should be some)</option>
                <option value="unknown">Unknown (Not sure yet)</option>
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={() => onSubmit(formData)}
          disabled={!formData.name || !formData.location || !formData.date || !formData.latitude}
          className="w-full py-5 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-orange-100 hover:opacity-90 transition-all disabled:opacity-50 disabled:shadow-none mt-4"
        >
          Share Event
        </button>
        <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 border border-orange-100">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0">
            <Info size={14} />
          </div>
          <p className="text-[11px] text-orange-900 leading-relaxed">
            By posting, you agree to provide accurate information. Misleading posts may lead to temporary suspension of your account. Keep the campus fed! 🍕
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailsScreen({ event, onBack, onJoin, onComment, onReport }: { event: EventDetails, onBack: () => void, onJoin: () => void, onComment: (c: string) => void, onReport: (r: string) => void }) {
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const isJoined = event.participants.some(p => p.user_email === USER_EMAIL);
  const location = useLocation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => setShowReport(true)} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-rose-500">
          <AlertTriangle size={20} />
        </button>
      </div>
      {showReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold mb-4">Signaler cet événement</h3>
            <textarea
              rows={3}
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Raison du signalement..."
              className="w-full p-3 border border-stone-200 rounded-xl mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowReport(false)} className="flex-1 py-2 bg-stone-100 rounded-xl">
                Annuler
              </button>
              <button 
                onClick={() => {
                  if (reportReason.trim()) {
                    onReport(reportReason);
                    setShowReport(false);
                    setReportReason('');
                  }
                }} 
                className="flex-1 py-2 bg-rose-500 text-white rounded-xl"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
      {event.poster_url && (
        <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-lg">
          <img src={event.poster_url} className="w-full h-full object-cover" alt="Poster" />
        </div>
      )}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-200">
              {event.type || 'Événement'}
            </span>
            <span className="px-3 py-1 bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-stone-200">
              {event.food_certainty}
            </span>
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight">{event.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Calendar size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Date</span>
            </div>
            <p className="font-semibold">{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Heure</span>
            </div>
            <p className="font-semibold">{event.time || '--:--'}</p>
          </div>
        </div>
        {event.estimated_until && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Probablement jusqu'à</span>
            </div>
            <p className="font-semibold">
              {new Date(event.estimated_until).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <MapPin size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Lieu</span>
          </div>
          <p className="font-semibold">{event.location}</p>
        </div>
        {event.latitude && event.longitude && (
          <div className="h-40 w-full rounded-2xl overflow-hidden border border-stone-100 shadow-sm bg-stone-50">
            <SafeMap
              mapKey={`detail-map-${event.id}-${location.key}`}
              center={[event.latitude, event.longitude]}
              zoom={15}
              className="h-full w-full"
              dragging={false}
              scrollWheelZoom={false}
              zoomControl={false}
            >
              <Marker position={[event.latitude, event.longitude]} />
            </SafeMap>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Description</h3>
          <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm text-stone-600 leading-relaxed">
            {event.description || "Aucune description fournie."}
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {event.participants.slice(0, 3).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[10px] font-bold">
                  U{i}
                </div>
              ))}
              {event.participants.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  +{event.participants.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-emerald-700">{event.participants.length} étudiants y vont</span>
          </div>
          <button
            onClick={onJoin}
            disabled={isJoined}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              isJoined
                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700'
            }`}
          >
            {isJoined ? 'Inscrit' : "J'y vais !"}
          </button>
        </div>
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1 flex items-center gap-2">
            <MessageSquare size={14} />
            Commentaires ({event.comments.length})
          </h3>
         
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Poser une question ou donner un avis..."
              className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm"
            />
            <button
              onClick={() => {
                if (comment.trim()) {
                  onComment(comment);
                  setComment('');
                }
              }}
              className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-stone-800 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {event.comments.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{c.user_email.split('@')[0]}</span>
                  <span className="text-[10px] text-stone-400">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-sm text-stone-600">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDistance(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}