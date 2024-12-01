import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
const KEY_FILE = process.env.KEY_FILE;
const keyPath = path.join(__dirname, `../../${KEY_FILE}`);

const textToSpeechClient = new TextToSpeechClient({
    keyFilename: keyPath,
});

const resolver = new Resolver();

resolver.define('translateAndSpeak', async ({ context, payload }) => {
    const targetLanguage = payload.targetLanguageValue;
    const pageId = context.extension.content.id;
    console.log(pageId);

    // Get the current page content
    const res = await api.asApp().requestConfluence(route`/wiki/api/v2/pages/${pageId}?body-format=storage`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    console.log(`Response: ${res.status} ${res.statusText}`);
    if (!res.ok) {
        throw new Error('Failed to fetch page content');
    }

    const data = await res.json();
    const htmlContent = data.body.storage.value || '';
    // Use a regular expression to extract the text within <p> tags
    const textMatch = htmlContent.match(/<p>(.*?)<\/p>/); // todo
    const text = textMatch ? textMatch[1] : '';
    console.log(text);

    // Translate Text
    const translateResponse = await api.fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}&target=${targetLanguage}&q=${encodeURIComponent(text)}`
    );
    const translationData = await translateResponse.json();
    const translatedText = translationData.data.translations[0].translatedText;
    console.log(translatedText);

    // Convert translated text to speech
    const [audioResponse] = await textToSpeechClient.synthesizeSpeech({
        input: { text: translatedText },
        voice: { languageCode: targetLanguage, ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
    });
  
    // Convert audio content to base64
    const audioBase64 = Buffer.from(audioResponse.audioContent).toString('base64');

    return {
        translatedText: translatedText,
        audioBase64: audioBase64
    };
});

export const handler = resolver.getDefinitions();
