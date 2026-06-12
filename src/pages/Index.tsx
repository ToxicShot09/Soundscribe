import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FileUpload } from "@/components/FileUpload";
import { AudioRecorder } from "@/components/AudioRecorder";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Library, Music4 } from "lucide-react";

interface AudioFile {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAudioFiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audio files:', error);
        toast.error('Failed to load audio files');
        return;
      }

      setAudioFiles(data || []);
    } catch (error) {
      console.error('Error in fetchAudioFiles:', error);
      toast.error('Failed to load audio files');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchAudioFiles();
    } else {
      setAudioFiles([]);
    }
  }, [user, fetchAudioFiles]);

  // AudioCard performs the actual deletion before calling this.
  const handleDelete = async (fileId: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== fileId));
    await fetchAudioFiles();
  };

  const handlePlayStateChange = (fileId: string | null) => {
    setCurrentPlayingId(fileId);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      {user && (
        <div className="container mx-auto px-4 pb-24">
          <div className="mx-auto max-w-4xl space-y-14">
            <div id="upload-section" className="scroll-mt-24">
              <div className="mb-6 text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  Upload your <span className="text-gradient">audio</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  MP3, WAV, or FLAC — up to 10MB
                </p>
              </div>
              <FileUpload onUploadComplete={fetchAudioFiles} />

              <div className="mx-auto my-5 flex max-w-2xl items-center gap-4" aria-hidden="true">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <AudioRecorder onUploadComplete={fetchAudioFiles} />
            </div>

            <div>
              <div className="mb-6 flex items-center justify-center gap-3">
                <Library className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display text-2xl font-bold tracking-tight">Your library</h3>
                {!isLoadingFiles && audioFiles.length > 0 && (
                  <span className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {audioFiles.length}
                  </span>
                )}
              </div>

              {isLoadingFiles ? (
                <div className="space-y-5">
                  {[0, 1].map((i) => (
                    <div key={i} className="glass h-44 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : audioFiles.length === 0 ? (
                <div className="glass flex flex-col items-center rounded-2xl px-6 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <Music4 className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No recordings yet</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Upload a file or record a clip above and it will show up here, ready to play and transcribe.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  {audioFiles.map((file) => (
                    <AudioPlayer
                      key={file.id}
                      fileId={file.id}
                      fileName={file.file_name}
                      filePath={file.file_path}
                      createdAt={file.created_at}
                      onDelete={handleDelete}
                      currentPlayingId={currentPlayingId}
                      onPlayStateChange={handlePlayStateChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
