import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFile = acceptedFiles[0];
    if (newFile) {
      if (newFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }

      setIsUploading(true);
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
          toast.error('Please login to upload files');
          return;
        }

        const fileExt = newFile.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, newFile);

        if (uploadError) {
          throw uploadError;
        }

        const { error: dbError } = await supabase
          .from('audio_files')
          .insert({
            file_name: newFile.name,
            file_path: filePath,
            content_type: newFile.type,
            file_size: newFile.size,
            user_id: user.id
          });

        if (dbError) {
          throw dbError;
        }

        toast.success('File uploaded successfully!');

        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
      } finally {
        setIsUploading(false);
      }
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        {...getRootProps()}
        className={`glass group relative cursor-pointer overflow-hidden rounded-2xl p-12 text-center transition-all duration-300
          ${isDragActive ? 'border-primary/60 shadow-xl shadow-violet-600/20' : 'hover:border-primary/40'}
          ${isUploading ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {/* Soft glow that appears on hover/drag */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent transition-opacity duration-300
            ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
          aria-hidden="true"
        />

        <input {...getInputProps()} />

        <div className="relative">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300
            ${isDragActive ? 'bg-gradient-brand shadow-lg shadow-violet-600/40 scale-110' : 'bg-secondary group-hover:bg-gradient-brand group-hover:shadow-lg group-hover:shadow-violet-600/30'}`}
          >
            {isUploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            ) : (
              <UploadCloud className={`h-7 w-7 transition-colors ${isDragActive ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
            )}
          </div>

          {isUploading ? (
            <p className="text-lg font-medium">Uploading…</p>
          ) : isDragActive ? (
            <p className="text-lg font-medium text-gradient">Drop it here</p>
          ) : (
            <>
              <p className="text-lg font-medium">
                Drag & drop an audio file, or <span className="text-gradient font-semibold">browse</span>
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                {['MP3', 'WAV', 'FLAC'].map((format) => (
                  <span key={format} className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                    {format}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">· up to 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
