import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { AudioWaveform } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirects on sign-in, and also on page load if already logged in
    // (supabase-js v2 fires INITIAL_SESSION).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-32 left-1/2 h-96 w-[640px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <Link to="/" className="relative mb-8 flex items-center gap-2.5 group">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
          <AudioWaveform className="h-6 w-6 text-white" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight">Soundscribe</span>
      </Link>

      <div className="glass relative w-full max-w-md rounded-2xl p-8">
        <h2 className="font-display mb-1 text-center text-2xl font-bold">Welcome back</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Sign in to your audio library
        </p>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(258 90% 66%)",
                  brandAccent: "hsl(258 90% 60%)",
                  brandButtonText: "white",
                  inputBackground: "hsl(244 14% 10%)",
                  inputBorder: "hsl(244 14% 18%)",
                  inputBorderFocus: "hsl(258 90% 66%)",
                  inputBorderHover: "hsl(244 14% 26%)",
                  inputText: "hsl(240 10% 96%)",
                  inputLabelText: "hsl(240 8% 64%)",
                  inputPlaceholder: "hsl(240 8% 44%)",
                  messageText: "hsl(240 8% 64%)",
                  anchorTextColor: "hsl(240 8% 64%)",
                  anchorTextHoverColor: "hsl(258 90% 76%)",
                },
                radii: {
                  borderRadiusButton: "10px",
                  inputBorderRadius: "10px",
                },
              },
            },
          }}
          theme="dark"
          providers={[]}
        />
      </div>

      <p className="relative mt-8 text-xs text-muted-foreground">
        Free to use · Your files stay private
      </p>
    </div>
  );
};

export default Login;
