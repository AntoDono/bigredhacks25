#!/usr/bin/env python3
"""
Voice Analysis Service - Flask App
All-in-one voice recognition and analysis service
"""

import os
import sys
import json
import base64
import tempfile
import warnings
from pathlib import Path
from typing import Dict, Any

# Mock missing audio modules before any other imports
# sys.modules['aifc'] = type(sys)('aifc')  # Empty module
# sys.modules['audioop'] = type(sys)('audioop')  # Empty module

import numpy as np
import librosa
from scipy.spatial.distance import cosine
from google.cloud import speech
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Suppress warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

app = Flask(__name__)
CORS(app)

# Increase maximum content length to handle large audio payloads
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

# Global speech client
speech_client = None

def init_speech_client():
    """Initialize Google Cloud Speech client."""
    global speech_client
    try:
        speech_client = speech.SpeechClient()
        print("✅ Google Cloud Speech client initialized")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Google Cloud Speech: {e}")
        return False

def extract_audio_features(audio_path: str) -> Dict[str, Any]:
    """Extract comprehensive audio features using librosa."""
    try:
        # Load audio using librosa with error handling for different formats
        # Librosa can handle WebM, WAV, MP3, etc.
        y, sr = librosa.load(audio_path, sr=22050)
        
        if len(y) == 0:
            raise ValueError("Audio file is empty")
        
        print(f"Successfully loaded audio: {len(y)} samples at {sr} Hz")
        
        # Extract MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1).tolist()
        mfcc_std = np.std(mfccs, axis=1).tolist()
        
        # Extract spectral features
        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        zero_crossing_rate = float(np.mean(librosa.feature.zero_crossing_rate(y)))
        
        # Extract tempo with error handling
        try:
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            tempo = float(tempo.item()) if hasattr(tempo, 'item') else float(tempo)
        except:
            tempo = 120.0
        
        # Extract pitch
        try:
            pitches, _ = librosa.piptrack(y=y, sr=sr, threshold=0.1)
            pitch_values = pitches[pitches > 0]
            pitch_mean = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0
        except:
            pitch_mean = 0.0
        
        # Energy
        rms = float(np.mean(librosa.feature.rms(y=y)))
        duration = float(len(y) / sr)
        
        return {
            'mfcc_mean': mfcc_mean,
            'mfcc_std': mfcc_std,
            'spectral_centroid': spectral_centroid,
            'zero_crossing_rate': zero_crossing_rate,
            'tempo': tempo,
            'pitch_mean': pitch_mean,
            'rms_energy': rms,
            'duration': duration
        }
        
    except Exception as e:
        print(f"Error extracting features from {audio_path}: {e}")
        # Try to detect the format for better error reporting
        detected_format = detect_audio_format(audio_path)
        print(f"Detected format: {detected_format}")
        raise RuntimeError(f"Failed to extract audio features: {e}")

def detect_audio_format(audio_path: str) -> str:
    """Detect the actual audio format regardless of file extension."""
    try:
        with open(audio_path, 'rb') as f:
            header = f.read(12)
        
        # Check for WebM signature
        if header.startswith(b'\x1a\x45\xdf\xa3'):
            return 'webm'
        # Check for WAV signature
        elif header.startswith(b'RIFF') and b'WAVE' in header:
            return 'wav'
        # Check for MP3 signature
        elif header.startswith(b'ID3') or header[0:2] == b'\xff\xfb' or header[0:2] == b'\xff\xf3':
            return 'mp3'
        # Check for MPEG ADTS (another MP3 variant)
        elif header[0:2] == b'\xff\xf0' or header[0:2] == b'\xff\xf1':
            return 'mp3'
        else:
            return 'unknown'
    except Exception as e:
        print(f"Failed to detect audio format: {e}")
        return 'unknown'

def transcribe_audio(audio_path: str, language: str = 'en-US') -> Dict[str, Any]:
    """Transcribe audio using Google Cloud Speech."""
    if not speech_client:
        raise RuntimeError("Google Cloud Speech not available")
    
    try:
        with open(audio_path, 'rb') as f:
            audio_content = f.read()
        
        if len(audio_content) == 0:
            raise ValueError("Audio file is empty")
            
    except Exception as e:
        raise RuntimeError(f"Failed to read audio file: {e}")
    
    # Map language codes
    lang_map = {
        'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
        'it': 'it-IT', 'pt': 'pt-BR', 'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN'
    }
    lang_code = lang_map.get(language, language)
    
    # Detect actual file format
    actual_format = detect_audio_format(audio_path)
    print(f"Detected audio format: {actual_format}")
    
    # Detect actual sample rate from the audio file
    actual_sample_rate = None
    try:
        import soundfile as sf
        audio_info = sf.info(audio_path)
        actual_sample_rate = int(audio_info.samplerate)
        print(f"Detected sample rate: {actual_sample_rate} Hz")
    except Exception:
        # soundfile doesn't support all formats (like WebM), try librosa as fallback
        try:
            y_temp, sr_temp = librosa.load(audio_path, sr=None)
            actual_sample_rate = int(sr_temp)
            print(f"Detected sample rate: {actual_sample_rate} Hz")
        except Exception:
            # Just omit sample rate and let Google Cloud auto-detect
            print("Using Google Cloud auto-detection for sample rate")
            actual_sample_rate = None
    
    audio = speech.RecognitionAudio(content=audio_content)
    
    # Choose encoding based on actual format, not file extension
    if actual_format == 'webm':
        encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
    elif actual_format == 'mp3':
        encoding = speech.RecognitionConfig.AudioEncoding.MP3
    elif actual_format == 'wav':
        encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
    else:
        # Default to WEBM_OPUS for unknown formats since most user recordings are WebM
        encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
        print(f"Unknown format, defaulting to WEBM_OPUS encoding")
    
    # Build config dynamically
    config_params = {
        'encoding': encoding,
        'language_code': lang_code,
    }
    
    # Only add sample_rate_hertz if we detected it and it's not WebM (WebM doesn't need explicit sample rate)
    if actual_sample_rate is not None and actual_format != 'webm':
        config_params['sample_rate_hertz'] = actual_sample_rate
    
    config = speech.RecognitionConfig(**config_params)
    
    response = speech_client.recognize(config=config, audio=audio)
    
    if not response.results:
        return {'text': '', 'confidence': 0.0}
    
    result = response.results[0].alternatives[0]
    return {
        'text': result.transcript.strip(),
        'confidence': getattr(result, 'confidence', 0.0)
    }

def calculate_similarity(gt_features: Dict, user_features: Dict, transcription: Dict, expected: str) -> Dict[str, float]:
    """Calculate similarity scores."""
    
    # Check for silence in user audio (very low energy and no transcription)
    user_is_silence = (user_features['rms_energy'] < 0.01 and 
                      (not transcription['text'].strip() or transcription['text'].strip() == ''))
    
    if user_is_silence:
        print(f"🔇 Detected silence in user audio (energy: {user_features['rms_energy']:.4f}, transcription: '{transcription['text']}')")
        # Return very low similarity for silence
        return {
            'spectral': 0.0,
            'prosodic': 0.0,
            'phonetic': 0.0,
            'transcription': 0.0,
            'overall': 0.0
        }
    
    # MFCC similarity
    gt_mfcc = np.array(gt_features['mfcc_mean'])
    user_mfcc = np.array(user_features['mfcc_mean'])
    spectral_sim = 1 - cosine(gt_mfcc, user_mfcc)
    
    # Prosodic similarity
    duration_diff = abs(gt_features['duration'] - user_features['duration'])
    max_duration = max(gt_features['duration'], user_features['duration'])
    duration_sim = 1 - (duration_diff / max_duration) if max_duration > 0 else 0
    
    tempo_diff = abs(gt_features['tempo'] - user_features['tempo'])
    max_tempo = max(gt_features['tempo'], user_features['tempo'])
    tempo_sim = 1 - (tempo_diff / max_tempo) if max_tempo > 0 else 0
    
    energy_diff = abs(gt_features['rms_energy'] - user_features['rms_energy'])
    max_energy = max(gt_features['rms_energy'], user_features['rms_energy'])
    energy_sim = 1 - (energy_diff / max_energy) if max_energy > 0 else 0
    
    prosodic_sim = (duration_sim + tempo_sim + energy_sim) / 3
    
    # Phonetic similarity (simplified)
    phonetic_sim = spectral_sim * 0.8 + prosodic_sim * 0.2
    
    # Transcription similarity
    transcription_sim = 0.0
    if transcription['text'].strip():
        transcribed = transcription['text'].lower().strip()
        expected_lower = expected.lower().strip()
        if transcribed == expected_lower:
            transcription_sim = 1.0
        else:
            # Simple edit distance
            m, n = len(transcribed), len(expected_lower)
            dp = [[0] * (n + 1) for _ in range(m + 1)]
            for i in range(m + 1): dp[i][0] = i
            for j in range(n + 1): dp[0][j] = j
            
            for i in range(1, m + 1):
                for j in range(1, n + 1):
                    if transcribed[i-1] == expected_lower[j-1]:
                        dp[i][j] = dp[i-1][j-1]
                    else:
                        dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
            
            transcription_sim = max(0.0, 1.0 - dp[m][n] / max(m, n))
    
    # Overall similarity
    overall = spectral_sim * 0.4 + prosodic_sim * 0.3 + phonetic_sim * 0.25 + transcription_sim * 0.05
    
    # Debug logging
    print(f"📊 Similarity breakdown:")
    print(f"   Spectral: {spectral_sim:.3f} (40% weight)")
    print(f"   Prosodic: {prosodic_sim:.3f} (30% weight)")
    print(f"   Phonetic: {phonetic_sim:.3f} (25% weight)")
    print(f"   Transcription: {transcription_sim:.3f} (5% weight)")
    print(f"   Overall: {overall:.3f}")
    
    return {
        'spectral': spectral_sim,
        'prosodic': prosodic_sim,
        'phonetic': phonetic_sim,
        'transcription': transcription_sim,
        'overall': max(0.0, min(1.0, overall))
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'voice-analysis',
        'google_cloud_available': speech_client is not None
    })

@app.route('/analyze', methods=['POST'])
def analyze_pronunciation():
    """Main pronunciation analysis endpoint."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['groundTruthAudio', 'userAudio', 'expectedText']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        gt_audio_b64 = data['groundTruthAudio']
        user_audio_b64 = data['userAudio']
        expected_text = data['expectedText']
        language = data.get('language', 'en')
        context = data.get('context', 'practice')  # 'battle' or 'practice'
        
        print(f"🌍 Language requested for analysis: {language}")
        print(f"📝 Expected text: '{expected_text}'")
        print(f"🎯 Context: {context}")
        
        # Use temporary files that get cleaned up automatically
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as gt_temp_file:
            gt_temp_file.write(base64.b64decode(gt_audio_b64))
            gt_path = gt_temp_file.name
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as user_temp_file:
            user_temp_file.write(base64.b64decode(user_audio_b64))
            user_path = user_temp_file.name
        
        try:
            print(f"Created temporary files: {gt_path}, {user_path}")
            
            # Extract features
            gt_features = extract_audio_features(gt_path)
            user_features = extract_audio_features(user_path)
            
            # Transcribe
            transcription = transcribe_audio(user_path, language)
            
            # Calculate similarity
            similarity = calculate_similarity(gt_features, user_features, transcription, expected_text)
            
            # Determine if pronunciation is correct based on context
            is_correct = False
            if context == 'battle':
                # In battle mode, use similarity threshold (0.7)
                is_correct = similarity['overall'] >= 0.7
                print(f"🎯 Battle mode: Overall similarity {similarity['overall']:.3f} >= 0.7? {is_correct}")
            else:
                # In practice mode, use exact transcription matching
                transcribed = transcription['text'].lower().strip()
                expected_lower = expected_text.lower().strip()
                is_correct = transcribed == expected_lower
                print(f"📚 Practice mode: '{transcribed}' == '{expected_lower}'? {is_correct}")
            
            return jsonify({
                'similarity': similarity['overall'],
                'transcription': transcription['text'],
                'confidence': transcription['confidence'],
                'features': {
                    'spectral': similarity['spectral'],
                    'prosodic': similarity['prosodic'],
                    'phonetic': similarity['phonetic'],
                    'overall': similarity['overall']
                },
                'is_correct': bool(is_correct),  # Convert to regular Python bool
                'context': context,
                'status': 'success'
            })
            
        finally:
            # Clean up temporary files
            try:
                os.unlink(gt_path)
                os.unlink(user_path)
                print(f"Cleaned up temporary files")
            except Exception as cleanup_error:
                print(f"Failed to clean up temporary files: {cleanup_error}")
                        
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    print("🎙️ Starting Voice Analysis Service...")
    
    # Initialize Google Cloud Speech
    speech_available = init_speech_client()
    if not speech_available:
        print("⚠️ Google Cloud Speech not available - transcription will fail")
        print("Set GOOGLE_APPLICATION_CREDENTIALS environment variable")
    
    print("🚀 Voice Analysis Service running on http://localhost:7759")
    app.run(host='localhost', port=7759, debug=False)
