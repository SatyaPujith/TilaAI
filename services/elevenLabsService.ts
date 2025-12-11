// ElevenLabs Conversational AI Service
const ELEVENLABS_API_KEY = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY || 'sk_cca085302eaeda54115f0931dbfe426961b408a756e30d28';
const AGENT_ID = (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID || 'agent_9801kc0efv89e7fv850gtsk8k05g';
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

// Get the agent ID for embedding
export const getAgentId = () => AGENT_ID;

// Legacy TTS function for non-conversational use
export const textToSpeech = async (text: string): Promise<Blob | null> => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.5 }
        })
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.blob();
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
};

export const playAudioBlob = (audioBlob: Blob) => {
  const url = URL.createObjectURL(audioBlob);
  const audio = new Audio(url);
  audio.play();
  audio.onended = () => URL.revokeObjectURL(url);
};

// Legacy Speech Recognition
export const startSpeechRecognition = (
  onResult: (transcript: string) => void,
  onEnd: () => void
): any => {
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) return null;

  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.onresult = (event: any) => {
    onResult(event.results[event.results.length - 1][0].transcript);
  };
  recognition.onend = onEnd;
  recognition.start();
  return recognition;
};
