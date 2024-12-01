import React, { useEffect, useState, Fragment } from 'react';
import ForgeReconciler, { Text, Select, LoadingButton, Strong, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';
import { Buffer } from 'buffer';
import { render } from '@forge/ui';

const App = () => {
    const [translation, setTranslation] = useState(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [targetLanguageLabel, setTargetLanguageLabel] = useState('English');
    const [targetLanguageValue, setTargetLanguageValue] = useState('en');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const context = useProductContext();

    useEffect(() => {
        console.log(translation);
    }, [translation]);

    useEffect(() => {
        console.log(audioUrl);
    }, [audioUrl]);

    const handleTranslate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(targetLanguageValue);
            const resp = await invoke('translateAndSpeak', { targetLanguageValue });
            setTranslation(resp.translatedText);
            const audioBlob = new Blob([Buffer.from(resp.audioBase64, 'base64')], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioUrl(audioUrl);
        } catch (error) {
            setError(error.message || 'Translation failed');
            console.error('Error translating and speaking:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectChange = async (selectedOption) => {
        setTargetLanguageLabel(selectedOption.label);
        setTargetLanguageValue(selectedOption.value);
    };

    // Custom Macro Component to Embed Audio
    const AudioEmbed = ({ audioUrl }) => {
        return (
            <Fragment>
                <Text>Click play to listen to the translated text:</Text>
                <audio controls src={audioUrl}>
                    Your browser does not support the audio element.
                </audio>
            </Fragment>
        );
    };

    return (
        <Fragment>
            {translation && (
                <Fragment>
                    <Strong>Translated Text:</Strong>
                    <Text>{translation}</Text>
                    {audioUrl && (
                        render(<AudioEmbed audioUrl={audioUrl} />)
                    )}
                </Fragment>
            )}
            <Select
                placeholder="Select Target Language"
                onChange={handleSelectChange}
                options={[
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Italian', value: 'it' },
                { label: 'Japanese', value: 'ja' },
                { label: 'Korean', value: 'ko' },
                { label: 'Chinese (Simplified)', value: 'zh-CN' },
                ]}
            />
            <LoadingButton 
                onClick={async () => {
                    await handleTranslate();
                }}
                isLoading={isLoading}
            >
                Translate Text and Speak
            </LoadingButton>
            {error && <Text>Error: {error}</Text>}
        </Fragment>
    );
};

ForgeReconciler.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
