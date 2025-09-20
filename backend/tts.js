const textToSpeechLib = require('@google-cloud/text-to-speech');

/**
 * Initialize Google Cloud Text-to-Speech client
 */
function createTTSClient() {
    return new textToSpeechLib.TextToSpeechClient();
}

/**
 * Build the synthesis request configuration
 * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
 * @param {string} text - Text to convert to speech
 * @returns {Object} - Request configuration object
 */
function buildSynthesisRequest(languageCode, text) {
    return {
        input: { text: text },
        voice: { 
            languageCode: languageCode, 
            ssmlGender: 'NEUTRAL' 
        },
        audioConfig: { 
            audioEncoding: 'MP3' 
        },
    };
}

/**
 * Convert audio buffer to base64 string
 * @param {Buffer} audioContent - Audio data buffer
 * @returns {string} - Base64 encoded audio
 */
function convertToBase64(audioContent) {
    return audioContent.toString('base64');
}

/**
 * Main text-to-speech function
 * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES', 'fr-FR')
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} - Base64 encoded audio data
 */
async function textToSpeech(languageCode, text) {
    try {
        // Validate inputs
        if (!languageCode || !text) {
            throw new Error('Language code and text are required');
        }

        // Validate that the credentials file exists if using file path
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const fs = require('fs');
            if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
                console.warn(`Google Cloud credentials file not found at: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
                console.warn('Make sure GOOGLE_APPLICATION_CREDENTIALS points to a valid JSON service account key file.');
                return null;
            }
        }

        // Create client
        const client = createTTSClient();
        
        // Build request
        const request = buildSynthesisRequest(languageCode, text);
        
        // Perform the text-to-speech request
        const [response] = await client.synthesizeSpeech(request);
        
        // Convert to base64
        const base64Audio = convertToBase64(response.audioContent);
        
        return base64Audio;
        
    } catch (error) {
        console.error('Error in text-to-speech:', error);
        // Don't throw error, just return null so the app continues working
        console.warn('TTS failed, continuing without audio');
        return null;
    }
}

module.exports = {
    textToSpeech
};
