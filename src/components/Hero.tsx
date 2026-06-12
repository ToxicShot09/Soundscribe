import { Mic, Languages, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from 'react';
import { Waveform } from './Waveform';

const FEATURES = [
  {
    icon: Mic,
    title: "Record or upload",
    description: "Speak straight into your mic, or drop in MP3, WAV, or FLAC files.",
  },
  {
    icon: Languages,
    title: "90+ languages",
    description: "Whisper auto-detects the language — or translates anything to English.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Files live in your own encrypted library. Only you can play or transcribe them.",
  },
];

export const Hero = () => {
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

  const handleTryItNow = () => {
    if (!user) {
      navigate('/login');
    } else {
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background: glows + grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-48 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute top-32 right-[-100px] h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 pt-20 pb-24 text-center sm:pt-28">
        <div className="animate-fade-up mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
          Powered by OpenAI Whisper
        </div>

        <h1 className="animate-fade-up font-display mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl" style={{ animationDelay: '0.1s' }}>
          Turn audio into
          <br />
          <span className="text-gradient">perfect text.</span>
        </h1>

        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg text-muted-foreground" style={{ animationDelay: '0.2s' }}>
          Upload a recording and get an accurate transcript in seconds —
          in 90+ languages, with one-click translation to English.
        </p>

        <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={handleTryItNow}
            className="group flex items-center gap-2 rounded-xl bg-gradient-brand px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-violet-600/30 transition-all hover:shadow-violet-600/50 hover:brightness-110"
          >
            {user ? 'Upload audio' : 'Start transcribing'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={scrollToFeatures}
            className="rounded-xl border border-border bg-secondary/40 px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur transition-colors hover:bg-secondary"
          >
            See features
          </button>
        </div>

        <Waveform className="animate-fade-up mt-14 h-12" />

        <div id="features" className="mx-auto mt-20 grid max-w-4xl gap-5 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-fade-up glass group rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-violet-600/25 transition-transform group-hover:scale-105">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display mb-1.5 text-base font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
