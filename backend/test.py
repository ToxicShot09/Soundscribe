import requests

# Your FastAPI endpoint
url = "http://localhost:8000/transcribe"

# Path to your local audio file
file_path = "comethrough.mp3"

# Open and send the file
with open(file_path, 'rb') as f:
    # Explicitly set the content type
    files = {
        'file': (
            'test.mp3',
            f,
            'audio/mpeg'  # Specify the correct MIME type
        )
    }
    response = requests.post(url, files=files)

print(response.json())