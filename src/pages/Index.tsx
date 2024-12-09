import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FileUpload } from "@/components/FileUpload";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AudioFile {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

const Index = () => {
  const [user, setUser] = useState(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
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
    }
  }, [user]);

  const fetchAudioFiles = async () => {
    const { data, error } = await supabase
      .from('audio_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio files:', error);
    } else {
      setAudioFiles(data || []);
    }
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
            <FileUpload />
            
            {audioFiles.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">Your Audio Files</h3>
                <div className="space-y-4">
                  {audioFiles.map((file) => (
                    <AudioPlayer
                      key={file.id}
                      fileName={file.file_name}
                      filePath={file.file_path}
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