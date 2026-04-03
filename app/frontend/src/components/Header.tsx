import { User, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogo } from '@/lib/logo-context';

interface HeaderProps {
  user: { id: string; email?: string; name?: string } | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({ user, onLogin, onLogout }: HeaderProps) {
  const { logoUrl } = useLogo();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between pwa-safe-top">
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full golden-gradient flex items-center justify-center">
            <span className="text-[14px] font-bold text-white">B</span>
          </div>
        )}
        <h1 className="golden-text text-[18px] font-bold text-[#291D0A]">
          Design &amp; Service Pricing Calculator
        </h1>
      </div>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5 text-[#D4A017]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogin}
          className="text-[#D4A017] hover:text-[#8B6914]"
        >
          <LogIn className="mr-1 h-4 w-4" />
          Sign In
        </Button>
      )}
    </header>
  );
}