export const decodeAudioData = async (
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Gemini TTS returns raw PCM (24kHz typically)
  // We need to construct an AudioBuffer manually or use decodeAudioData if it had headers.
  // Since Gemini 2.5 TTS examples use raw decoding often, let's stick to the safe decoding flow provided in docs if raw.
  // HOWEVER, the Gemini TTS endpoint usually returns valid audio data (like MP3/WAV wrapped) or raw PCM.
  // The provided doc example uses a manual PCM decode. Let's use that robust method.
  
  const pcmData = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000; // Standard for Gemini TTS
  const frameCount = pcmData.length;
  
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    // Convert 16-bit PCM to float [-1.0, 1.0]
    channelData[i] = pcmData[i] / 32768.0;
  }
  
  return buffer;
};

export const playAudioBuffer = (
  buffer: AudioBuffer,
  context: AudioContext
): AudioBufferSourceNode => {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
  return source;
};