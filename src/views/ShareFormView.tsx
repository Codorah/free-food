import { useState, useRef } from 'react';
import { Camera, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const customMarkerIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div class="w-8 h-8 bg-orange-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<[number, number] | null>(null);

    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position ? <Marker position={position} icon={customMarkerIcon} /> : null;
}

export default function ShareFormView({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [certainty, setCertainty] = useState('unknown');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const submitForm = async () => {
        setLoading(true);
        try {
            let posterUrl = '';
            if (image) {
                const formData = new FormData();
                formData.append('image', image);
                const imgRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const imgData = await imgRes.json();
                posterUrl = imgData.url;
            }

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || "Nourriture Gratuite",
                    description: description || null,
                    location: locationName || "Lomé",
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    type: 'Divers',
                    food_certainty: certainty,
                    poster_url: posterUrl || null,
                    reporter_email: 'anonymous@freefood.tg'
                })
            });

            if (!res.ok) throw new Error("Erreur serveur");

            // Invalidate events list cache
            queryClient.invalidateQueries({ queryKey: ['events'] });

            toast.success("Bon plan validé ! Merci.");
            onComplete(); // Instantly redirect to menu (liste)

        } catch (err) {
            console.error(err);
            toast.error("Échec de la publication.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full bg-white flex flex-col pt-4">
            <div className="px-6 mb-6">
                <h2 className="text-2xl font-black text-stone-800">Partager<br />un bon plan</h2>

                {/* Aesthetic Progress Bar */}
                <div className="flex items-center gap-2 mt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full \${step >= i ? 'bg-orange-600' : 'bg-stone-100'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Qu'est-ce qu'on mange ?</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Restes de pizza (Conférence tech)"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner mb-4"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />

                                <label className="block text-sm font-bold text-stone-700 mb-2">Description / Infos</label>
                                <textarea
                                    placeholder="Ex: Demandez à voir M. Koffi, c'est dans des belles assiettes."
                                    className="w-full h-24 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Photo (Optionnel mais recommandé)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all \${imagePreview ? 'border-orange-500 bg-orange-50 p-1' : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-400'}`}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                                    ) : (
                                        <>
                                            <Camera size={32} className="mb-2 text-stone-400" />
                                            <span className="text-sm font-medium">Ajouter une photo</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                            </div>

                            <button
                                disabled={!name}
                                onClick={() => setStep(2)}
                                className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all relative overflow-hidden group"
                            >
                                <span className="relative z-10">Continuer</span>
                                <div className="absolute inset-0 h-full w-full bg-stone-800 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 h-full flex flex-col">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Où est-ce exactement ?</label>
                                <input
                                    type="text"
                                    placeholder="Nom du lieu (ex: Salle 204)"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 mb-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 min-h-[250px] relative rounded-3xl overflow-hidden border-2 border-stone-100 shadow-inner">
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass px-4 py-2 rounded-full text-xs font-bold shadow-md pointer-events-none">
                                    Appuyez sur la carte
                                </div>
                                <MapContainer center={[6.13748, 1.21200]} zoom={13} style={{ width: '100%', height: '100%', zIndex: 0 }} zoomControl={false} key="share-map">
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <LocationSelector onLocationSelect={(lat, lng) => setCoords({ lat, lng })} />
                                </MapContainer>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setStep(1)} className="font-bold text-stone-500 py-4 px-6 rounded-2xl bg-stone-100">
                                    Retour
                                </button>
                                <button
                                    disabled={!locationName || !coords}
                                    onClick={() => setStep(3)}
                                    className="flex-1 bg-stone-900 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all"
                                >
                                    Continuer
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-4">Êtes-vous sûr qu'il y a de la nourriture ?</label>

                                <div className="space-y-3">
                                    {[
                                        { id: 'confirmed', label: '✓ Confirmé', desc: "Je vois la nourriture de mes propres yeux", color: 'border-green-500 bg-green-50 text-green-800' },
                                        { id: 'probable', label: '? Probable', desc: "J'ai entendu dire qu'il en restait", color: 'border-amber-400 bg-amber-50 text-amber-800' },
                                        { id: 'unknown', label: 'Inconnue', desc: "Je ne suis pas sûr, il faut vérifier", color: 'border-stone-300 bg-stone-50 text-stone-800' }
                                    ].map((opt) => (
                                        <div
                                            key={opt.id}
                                            onClick={() => setCertainty(opt.id)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 \${certainty === opt.id ? opt.color : 'border-stone-100 hover:border-stone-300 bg-white'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center \${certainty === opt.id ? 'border-current' : 'border-stone-300'}`}>
                                                {certainty === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                                            </div>
                                            <div>
                                                <div className="font-bold mb-0.5">{opt.label}</div>
                                                <div className="text-xs opacity-80">{opt.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 mt-auto">
                                <button onClick={() => setStep(2)} className="font-bold text-stone-500 py-4 px-6 rounded-2xl bg-stone-100">
                                    Retour
                                </button>
                                <button
                                    onClick={submitForm}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center bg-orange-600 text-white font-bold py-4 rounded-2xl transform active:scale-[0.98] transition-all shadow-lg shadow-orange-500/30 overflow-hidden relative"
                                >
                                    {loading ? <Loader2 className="animate-spin relative z-10" /> : <span className="relative z-10">Publier l'annonce</span>}
                                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
