import React, { useEffect, useState, Fragment } from 'react';
import ForgeReconciler, { Text, Select, LoadingButton, Strong, Link, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

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
            setAudioUrl(resp.audioUrl);
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

    return (
        <Fragment>
            <Select
                placeholder="Select Target Language"
                onChange={handleSelectChange}
                options={[
                { label: '🇬🇧 English', value: 'en' },
                { label: '🇪🇸 Spanish', value: 'es' },
                { label: '🇫🇷 French', value: 'fr' },
                { label: '🇩🇪 German', value: 'de' },
                { label: '🇮🇹 Italian', value: 'it' },
                { label: '🇯🇵 Japanese', value: 'ja' },
                { label: '🇰🇷 Korean', value: 'ko' },
                { label: '🇨🇳 Chinese (Simplified)', value: 'zh-CN' },
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
            {translation && (
                <Fragment>
                    <Strong>Translated Text:</Strong>
                    <Text>{translation}</Text>
                    {audioUrl && (
                        <Fragment>
                            <Text>Click to listen to the translated text:</Text>
                            <Link href={audioUrl} target="_blank">Play Audio</Link>
                        </Fragment>
                    )}
                </Fragment>
            )}
        </Fragment>
    );
};

ForgeReconciler.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
