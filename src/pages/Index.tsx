import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FileUpload } from "@/components/FileUpload";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useEffect, useState, useCallback } from "react";
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

  const fetchAudioFiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching audio files for user:', user.id);
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

      console.log('Fetched audio files:', data);
      setAudioFiles(data || []);
    } catch (error) {
      console.error('Error in fetchAudioFiles:', error);
      toast.error('Failed to load audio files');
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchAudioFiles();
    } else {
      setAudioFiles([]);
    }
  }, [user, fetchAudioFiles]);

  const handleDelete = async (fileId: string) => {
    try {
      // Wait for the deletion to complete before updating UI
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to ensure deletion completes
      
      // Update UI after successful deletion
      setAudioFiles(prev => prev.filter(file => file.id !== fileId));
      
      // Refetch to ensure consistency with server
      await fetchAudioFiles();
    } catch (error) {
      console.error('Error handling deletion:', error);
      // Refetch to restore state in case of error
      await fetchAudioFiles();
    }
  };

  const handlePlayStateChange = (isPlaying: boolean) => {
    setIsGlobalPlaying(isPlaying);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <Hero />
      {user && (
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-100">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                Upload Your Audio File
              </h2>
              <FileUpload onUploadComplete={fetchAudioFiles} />
            </div>
            
            {audioFiles.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-gray-800 text-center">
                  Your Audio Library
                </h3>
                <div className="grid gap-6">
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