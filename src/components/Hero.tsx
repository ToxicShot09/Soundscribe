import { FileAudio, Languages, Clock } from 'lucide-react';

export const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Transform Audio into Text
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Instantly transcribe and translate your audio files using advanced AI technology.
          Fast, accurate, and secure.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <FileAudio className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multiple Formats</h3>
            <p className="text-gray-600">Support for MP3, WAV, FLAC, and more</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <Languages className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multi-Language</h3>
            <p className="text-gray-600">Translate into multiple languages</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fast Processing</h3>
            <p className="text-gray-600">Get results in minutes</p>
          </div>
        </div>

        <button className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors">
          Try it Now
        </button>
      </div>
    </div>
  );
};