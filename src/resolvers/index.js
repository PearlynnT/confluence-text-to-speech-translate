import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';
import FormData from 'form-data';

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
  
    // Upload audio file as attachment
    const fileName = `${pageId}_${targetLanguage}_${Date.now()}.mp3`;
    const formData = new FormData();
    formData.append('file', Buffer.from(audioResponse.audioContent), {
        filename: fileName,
        contentType: 'audio/mp3',
    });
    const attachmentResponse = await api.asApp().requestConfluence(route`/wiki/rest/api/content/${pageId}/child/attachment`, {
        method: 'POST',
        headers: {
            'X-Atlassian-Token': 'no-check',
            ...formData.getHeaders(),
        },
        body: formData,
    });

    if (!attachmentResponse.ok) {
        console.error('Attachment upload failed:', await attachmentResponse.text());
        throw new Error(`Failed to upload audio attachment: ${attachmentResponse.status} ${attachmentResponse.statusText}`);
    }

    const attachmentData = await attachmentResponse.json();
    const relativeAudioUrl = attachmentData.results[0]._links.download;

    // Construct full audio URL
    const ATLASSIAN_SITE  = process.env.ATLASSIAN_SITE;
    const audioUrl = `https://${ATLASSIAN_SITE}/wiki${relativeAudioUrl}`;

    return {
        translatedText: translatedText,
        audioUrl: audioUrl
    };
});

export const handler = resolver.getDefinitions();
