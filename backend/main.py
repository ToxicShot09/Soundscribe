from fastapi import FastAPI, UploadFile, HTTPException, File, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import os
import tempfile

# Add CUDA diagnostic information
print("----------------------")
print("CUDA Setup Info:")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"CUDA device: {torch.cuda.get_device_name(0)}")
    print(f"CUDA device count: {torch.cuda.device_count()}")
print("----------------------")

# Force CUDA if available
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

print(f"Using device: {device} with dtype: {torch_dtype}")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading models... This might take a few minutes on first run")

# Create models directory
os.makedirs("models", exist_ok=True)

print("Loading Whisper large-v3-turbo model...")

# Use the specific Whisper large-v3-turbo model
model_id = "openai/whisper-large-v3-turbo"

# Load model with optimizations and explicit caching settings
model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, 
    torch_dtype=torch_dtype,
    low_cpu_mem_usage=True,
    use_safetensors=True,
    cache_dir="models"
)
model.to(device)

# Load processor
processor = AutoProcessor.from_pretrained(model_id)

# Create pipeline with optimized configuration
pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    torch_dtype=torch_dtype,
    device=device,
    max_new_tokens=512,
    chunk_length_s=30,
    batch_size=8,  # Reduced batch size for better accuracy
    return_timestamps=True
)

SUPPORTED_LANGUAGES = {
    "af": "Afrikaans",
    "am": "Amharic",
    "ar": "Arabic",
    "as": "Assamese",
    "az": "Azerbaijani",
    "ba": "Bashkir",
    "be": "Belarusian",
    "bg": "Bulgarian",
    "bn": "Bengali",
    "bo": "Tibetan",
    "br": "Breton",
    "bs": "Bosnian",
    "ca": "Catalan",
    "cs": "Czech",
    "cy": "Welsh",
    "da": "Danish",
    "de": "German",
    "el": "Greek",
    "en": "English",
    "es": "Spanish",
    "et": "Estonian",
    "eu": "Basque",
    "fa": "Persian",
    "fi": "Finnish",
    "fo": "Faroese",
    "fr": "French",
    "gl": "Galician",
    "gu": "Gujarati",
    "ha": "Hausa",
    "haw": "Hawaiian",
    "he": "Hebrew",
    "hi": "Hindi",
    "hr": "Croatian",
    "ht": "Haitian Creole",
    "hu": "Hungarian",
    "hy": "Armenian",
    "id": "Indonesian",
    "is": "Icelandic",
    "it": "Italian",
    "ja": "Japanese",
    "jw": "Javanese",
    "ka": "Georgian",
    "kk": "Kazakh",
    "km": "Khmer",
    "kn": "Kannada",
    "ko": "Korean",
    "la": "Latin",
    "lb": "Luxembourgish",
    "ln": "Lingala",
    "lo": "Lao",
    "lt": "Lithuanian",
    "lv": "Latvian",
    "mg": "Malagasy",
    "mi": "Maori",
    "mk": "Macedonian",
    "ml": "Malayalam",
    "mn": "Mongolian",
    "mr": "Marathi",
    "ms": "Malay",
    "mt": "Maltese",
    "my": "Myanmar",
    "ne": "Nepali",
    "nl": "Dutch",
    "nn": "Nynorsk",
    "no": "Norwegian",
    "oc": "Occitan",
    "pa": "Punjabi",
    "pl": "Polish",
    "ps": "Pashto",
    "pt": "Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "sa": "Sanskrit",
    "sd": "Sindhi",
    "si": "Sinhala",
    "sk": "Slovak",
    "sl": "Slovenian",
    "sn": "Shona",
    "so": "Somali",
    "sq": "Albanian",
    "sr": "Serbian",
    "su": "Sundanese",
    "sv": "Swedish",
    "sw": "Swahili",
    "ta": "Tamil",
    "te": "Telugu",
    "tg": "Tajik",
    "th": "Thai",
    "tk": "Turkmen",
    "tl": "Tagalog",
    "tr": "Turkish",
    "tt": "Tatar",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "yi": "Yiddish",
    "yo": "Yoruba",
    "zh": "Chinese"
}

VALID_TASKS = ["transcribe", "translate"]

@app.post("/transcribe/")
async def transcribe_audio(
    file: UploadFile = File(...), 
    language: str = Form(None),
    target_lang: str = Form(None),
    task: str = Form("transcribe")
):
    try:
        # Validate inputs
        if language and language not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Base generation kwargs
            generate_kwargs = {
                "max_new_tokens": 448,
                "do_sample": True,
                "temperature": 0.2,
                "num_beams": 5,
                "length_penalty": 1.0,
                "no_repeat_ngram_size": 3,
            }

            # For translation, we need to:
            # 1. Set the source language (if provided)
            # 2. Force the task to "translate" which will translate to English
            if task == "translate":
                generate_kwargs.update({
                    "task": "translate",  # This tells Whisper to translate to English
                    "language": language if language and language != "auto" else None,
                })
                print(f"Translation kwargs: {generate_kwargs}")
            else:
                generate_kwargs.update({
                    "task": "transcribe",
                    "language": language if language and language != "auto" else None,
                })
                print(f"Transcription kwargs: {generate_kwargs}")

            # Process audio
            result = pipe(
                temp_file_path,
                return_timestamps=True,
                generate_kwargs=generate_kwargs
            )

            print(f"Processing completed. Task: {task}, Result: {result}")

            return {
                "text": result["text"],
                "chunks": result.get("chunks", []),
                "task": task,
                "source_language": language or "auto",
                "target_language": "en" if task == "translate" else None
            }
            
        finally:
            # Cleanup
            os.unlink(temp_file_path)
            
    except Exception as e:
        import traceback
        print(f"Error details: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/languages")
async def get_languages():
    return SUPPORTED_LANGUAGES

# Optional: Add startup and shutdown events for model management
@app.on_event("shutdown")
def shutdown_event():
    # Clear CUDA cache and unload model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    print("Application is shutting down, model resources cleared.")