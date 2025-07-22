let voices: SpeechSynthesisVoice[] = [];

export const loadVoices = () => {
  return new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    const load = () => {
      voices = synth.getVoices();
      if (voices.length > 0) resolve();
    };

    load();

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = load;
    }
  });
};

const languageMap: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  sw: "sw-TZ", // Swahili - Tanzania
  rw: "rw-RW", // Kinyarwanda (often unsupported but added for fallback)
};

export const speak = (text: string, language: string = "en") => {
  if (!window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);

  const langCode = languageMap[language] || "en-US";
  const availableVoices = voices.filter((v) => v.lang.startsWith(langCode.split("-")[0]));

  const voice =
    availableVoices.find((v) =>
      v.name.toLowerCase().includes("female") ||
      v.name.toLowerCase().includes("child") ||
      v.name.toLowerCase().includes("zira") ||
      v.name.toLowerCase().includes("junior")
    ) || availableVoices[0] || voices[0];

  utterance.voice = voice;
  utterance.pitch = 1.6; // Child-like tone
  utterance.rate = 1;
  utterance.lang = langCode;

  synth.cancel();
  synth.speak(utterance);
};
