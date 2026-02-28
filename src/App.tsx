import { useState } from 'react';
import { Home, Map as MapIcon, PlusCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';

// Placeholders for views
import FoodListView from './views/FoodListView';
import MapView from './views/MapView';
import ShareFormView from './views/ShareFormView';
import ChatView from './views/ChatView';
import FoodDetailView from './views/FoodDetailView';

export type Tab = 'list' | 'map' | 'share' | 'chat' | 'details';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  const viewDetails = (id: number) => {
    setActiveEventId(id);
    setActiveTab('details');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-orange-50/30 overflow-hidden text-stone-900">

      {/* Header section (Aesthetic) */}
      <header className="px-6 py-5 flex items-center justify-between bg-white/80 glass sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-orange-600">Free Food</h1>
          <p className="text-xs font-medium text-stone-500 tracking-wide uppercase">Lomé, Togo</p>
        </div>
        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shadow-sm">
          FF
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto w-full max-w-lg mx-auto bg-transparent">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full"
          >
            {activeTab === 'list' && <FoodListView onViewDetails={viewDetails} />}
            {activeTab === 'map' && <MapView onViewDetails={viewDetails} />}
            {activeTab === 'share' && <ShareFormView onComplete={() => setActiveTab('list')} />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'details' && activeEventId && (
              <FoodDetailView
                eventId={activeEventId}
                onBack={() => {
                  setActiveTab('list');
                  setActiveEventId(null);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toaster position="top-center" toastOptions={{
        className: 'font-medium rounded-2xl shadow-lg border border-stone-100',
        duration: 3000,
      }} />

      {/* Bottom Navigation */}
      <nav className="glass-bottom-nav flex items-center justify-around py-3 px-4 pb-safe border-t border-stone-200 z-50">
        <NavItem
          icon={<Home size={22} />}
          label="Menu"
          isActive={activeTab === 'list'}
          onClick={() => setActiveTab('list')}
        />
        <NavItem
          icon={<MapIcon size={22} />}
          label="Carte"
          isActive={activeTab === 'map'}
          onClick={() => setActiveTab('map')}
        />
        <NavItem
          icon={<PlusCircle size={28} />}
          label="Partager"
          isActive={activeTab === 'share'}
          onClick={() => setActiveTab('share')}
          isPrimary
        />
        <NavItem
          icon={<MessageCircle size={22} />}
          label="Chat"
          isActive={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, isPrimary = false }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; isPrimary?: boolean }) {
  if (isPrimary) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center -mt-6 transform transition-transform active:scale-95"
      >
        <div className="bg-orange-600 text-white rounded-full p-4 shadow-lg shadow-orange-500/30">
          {icon}
        </div>
        <span className="text-[10px] font-semibold mt-1 text-orange-600">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 \${isActive ? 'text-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
    >
      <div className={`transition-transform duration-300 \${isActive ? 'scale-110 mb-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] uppercase tracking-wider font-bold \${isActive ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
        {label}
      </span>
    </button>
  );
}

export default App;
