import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Map } from 'lucide-react';

// Custom Map Marker Icon
const getIcon = (certainty: string) => {
    const colorClass = certainty === 'confirmed' ? 'bg-green-500' :
        certainty === 'probable' ? 'bg-amber-500' :
            'bg-stone-500';

    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <div class="absolute inset-0 \${colorClass} rounded-full opacity-30 animate-ping"></div>
        <div class="relative z-10 w-8 h-8 flex items-center justify-center \${colorClass} rounded-full border-2 border-white shadow-lg text-white font-bold text-xs">
          FF
        </div>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

export default function MapView({ onViewDetails }: { onViewDetails: (id: number) => void }) {
    const [events, setEvents] = useState<any[]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number]>([6.13748, 1.21200]); // Lomé center
    const [isLocating, setIsLocating] = useState(false);
    const mapRef = useRef<L.Map>(null);

    // Unique ID so React-Leaflet unmounts cleanly and avoids "Map container is already initialized"
    const mapId = "main-map-container";

    useEffect(() => {
        fetch('/api/events')
            .then(r => r.json())
            .then(data => {
                setEvents(data);
            });
    }, []);

    const handleLocateMe = () => {
        setIsLocating(true);
        if (navigator.geolocation && mapRef.current) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setMapCenter(coords);
                mapRef.current?.flyTo(coords, 14, { duration: 1.5 });
                setIsLocating(false);
            }, () => {
                alert("Impossible de localiser.");
                setIsLocating(false);
            });
        } else {
            setIsLocating(false);
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-140px)] bg-stone-100 rounded-t-[3rem] overflow-hidden shadow-inner mt-2">
            <MapContainer
                key={mapId}
                center={mapCenter}
                zoom={13}
                style={{ width: '100%', height: '100%', zIndex: 0 }}
                zoomControl={false}
                ref={mapRef as any}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {events.map((evt) => (
                    evt.latitude && evt.longitude && (
                        <Marker key={evt.id} position={[evt.latitude, evt.longitude]} icon={getIcon(evt.food_certainty)}>
                            <Popup className="food-popup rounded-2xl overflow-hidden border-0">
                                <div className="p-1 min-w-[200px]">
                                    <h3 className="font-bold text-lg mb-1">{evt.name}</h3>
                                    <p className="text-sm text-stone-600 mb-2 truncate">{evt.location}</p>

                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded \${
                      evt.food_certainty === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      evt.food_certainty === 'probable' ? 'bg-amber-100 text-amber-700' : 
                      'bg-stone-100 text-stone-700'
                    }`}>
                                            {evt.food_certainty === 'confirmed' ? '✓ Confirmé' :
                                                evt.food_certainty === 'probable' ? '? Probable' : 'Inconnue'}
                                        </span>
                                        <span className="text-xs font-semibold text-orange-600">
                                            {evt.participant_count || 0} intéressés
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => onViewDetails(evt.id)}
                                        className="w-full bg-orange-600 outline-none text-white text-xs font-bold py-2 rounded-xl mt-1 active:scale-95 transition-transform"
                                    >
                                        Voir détails
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>

            {/* Aesthetic Floating Actions */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] glass px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Map size={16} className="text-orange-500" />
                <span className="text-xs font-bold text-stone-800 tracking-wide uppercase">Explorer Lomé</span>
            </div>

            <button
                onClick={handleLocateMe}
                disabled={isLocating}
                className="absolute bottom-6 right-6 z-[1000] bg-white text-stone-800 p-4 rounded-full shadow-xl hover:bg-stone-50 active:scale-95 transition-all text-orange-600"
            >
                <Navigation size={24} className={isLocating ? 'animate-spin' : ''} />
            </button>
        </div>
    );
}
