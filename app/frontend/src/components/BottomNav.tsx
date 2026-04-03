import { Calculator, Settings, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Calculator', icon: Calculator },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/history', label: 'History', icon: History },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border pwa-safe-bottom" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target transition-colors ${
                isActive
                  ? 'text-[#D4A017]'
                  : 'text-muted-foreground hover:text-[#D4A017]'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 golden-gradient rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}