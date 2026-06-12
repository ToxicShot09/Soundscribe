import { AudioWaveform, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="glass sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
              <AudioWaveform className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Soundscribe</span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-5">
            <a
              href="#features"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:block max-w-[200px] truncate rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110"
              >
                Sign in
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
