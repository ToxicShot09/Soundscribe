export interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
  task?: string;
  source_language?: string;
  target_language?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function transcribeAudio(
  audioUrl: string,
  sourceLang?: string,
  targetLang?: string
): Promise<TranscriptionResult> {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch audio file');
    }
    
    const audioBlob = await response.blob();
    const formData = new FormData();
    formData.append('file', audioBlob);
    
    // Set source language if specified and not auto
    if (sourceLang && sourceLang !== 'auto') {
      formData.append('language', sourceLang);
    }
    
    // Set target language and task
    if (targetLang && targetLang !== 'none') {
      formData.append('target_lang', targetLang);
      formData.append('task', 'translate');
    } else {
      formData.append('task', 'transcribe');
    }

    const transcriptionResponse = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('Server error:', error);
      throw new Error('Transcription failed');
    }

    return await transcriptionResponse.json();
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export async function getSupportedLanguages(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${API_URL}/languages`);
    if (!response.ok) {
      throw new Error('Failed to fetch languages');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching languages:', error);
    throw new Error('Failed to fetch supported languages');
  }
}