import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File } from 'lucide-react';
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
        
        // Call onUploadComplete if provided
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
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isUploading ? (
          <p className="text-lg text-primary">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-lg text-primary">Drop the audio file here...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">Drag & drop an audio file here, or click to select</p>
            <p className="text-sm text-gray-500">Supports MP3, WAV, FLAC (up to 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};