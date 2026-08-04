// El lib.dom.d.ts que trae este TypeScript ya incluye los tipos de
// eventos/resultados del Web Speech API (SpeechRecognitionEvent,
// SpeechRecognitionErrorEvent, SpeechRecognitionResult...) pero NO la
// interfaz principal `SpeechRecognition` ni su constructor con prefijo
// `webkit` — sigue sin estandarizarse del todo (ver ticket "Cobertura de
// Web Speech API en navegadores/dispositivos objetivo"). Se declara aquí
// a mano, siguiendo la forma real de la API en Chrome/Edge.
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}
