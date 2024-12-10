import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FileUpload } from "@/components/FileUpload";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AudioFile {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

const Index = () => {
  const [user, setUser] = useState(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (user) {
      fetchAudioFiles();
    } else {
      setAudioFiles([]);
    }
  }, [user]);

  const fetchAudioFiles = async () => {
    try {
      console.log('Fetching audio files for user:', user?.id);
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audio files:', error);
        toast.error('Failed to load audio files');
        return;
      }

      console.log('Fetched audio files:', data);
      setAudioFiles(data || []);
    } catch (error) {
      console.error('Error in fetchAudioFiles:', error);
      toast.error('Failed to load audio files');
    }
  };

  const handleDelete = async (fileId: string) => {
    console.log('Handling delete for file:', fileId);
    // Remove the file from state immediately for better UX
    setAudioFiles(prev => prev.filter(file => file.id !== fileId));
    // Refetch to ensure we have the latest data
    await fetchAudioFiles();
  };

  const handlePlayStateChange = (isPlaying: boolean) => {
    setIsGlobalPlaying(isPlaying);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      {user && (
        <div id="upload-section" className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Upload Your Audio File
            </h2>
            <FileUpload onUploadComplete={fetchAudioFiles} />
            
            {audioFiles.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">Your Audio Files</h3>
                <div className="space-y-4">
                  {audioFiles.map((file) => (
                    <AudioPlayer
                      key={file.id}
                      fileId={file.id}
                      fileName={file.file_name}
                      filePath={file.file_path}
                      onDelete={handleDelete}
                      isGlobalPlaying={isGlobalPlaying}
                      onPlayStateChange={handlePlayStateChange}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;