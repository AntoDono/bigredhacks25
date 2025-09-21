/**
 * Voice Recognition Client
 * Simple HTTP client for the Python voice analysis service
 */

const http = require('http');

// Configuration
const VOICE_SERVICE_HOST = 'localhost';
const VOICE_SERVICE_PORT = 8001;
const VOICE_SERVICE_URL = `http://${VOICE_SERVICE_HOST}:${VOICE_SERVICE_PORT}`;

/**
 * Main function to analyze pronunciation similarity
 * @param {string} groundTruthAudio - Base64 encoded ground truth audio (MP3)
 * @param {string} userAudio - Base64 encoded user recording (WAV)
 * @param {string} expectedText - The word/phrase being pronounced
 * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
 * @returns {Promise<{similarity: number, transcription: string, features: object}>}
 */
async function analyzePronunciation(groundTruthAudio, userAudio, expectedText, language = 'en', context = 'practice') {
  try {
    console.log('Sending pronunciation analysis request to Python service...');
    
    const requestData = {
      groundTruthAudio,
      userAudio,
      expectedText,
      language,
      context
    };
    
    const result = await makeHttpRequest('/analyze', 'POST', requestData);
    
    if (result.status === 'error') {
      throw new Error(result.error);
    }
    
    console.log('Pronunciation analysis complete:', {
      similarity: result.similarity,
      transcription: result.transcription,
      confidence: result.confidence
    });
    
    return result;
    
  } catch (error) {
    console.error('Pronunciation analysis failed:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

/**
 * Make HTTP request to the Python voice analysis service
 */
function makeHttpRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VOICE_SERVICE_HOST,
      port: VOICE_SERVICE_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const result = JSON.parse(responseData);
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}. Is the Python voice service running on ${VOICE_SERVICE_URL}?`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Check if the Python voice analysis service is healthy
 */
async function checkServiceHealth() {
  try {
    const result = await makeHttpRequest('/health', 'GET');
    console.log('Voice service health:', result);
    return result;
  } catch (error) {
    console.error('Voice service health check failed:', error.message);
    throw error;
  }
}

/**
 * Start the Python voice analysis service if not running
 */
function startVoiceService() {
  const { spawn } = require('child_process');
  const path = require('path');
  
  console.log('Starting Python voice analysis service...');
  
  const pythonService = spawn('python3', [
    path.join(__dirname, 'voice_analysis_server.py')
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });
  
  pythonService.stdout.on('data', (data) => {
    console.log(`Voice Service: ${data.toString().trim()}`);
  });
  
  pythonService.stderr.on('data', (data) => {
    console.error(`Voice Service Error: ${data.toString().trim()}`);
  });
  
  pythonService.on('close', (code) => {
    console.log(`Voice service exited with code ${code}`);
  });
  
  pythonService.on('error', (error) => {
    console.error('Failed to start voice service:', error);
  });
  
  return pythonService;
}

module.exports = {
  analyzePronunciation,
  checkServiceHealth,
  startVoiceService
};
