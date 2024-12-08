import { Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <Headphones className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AudioTranscribe</span>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary transition-colors">
              Features
            </a>
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};