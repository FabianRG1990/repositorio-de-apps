import {
  DestroyRef,
  Injectable,
  InjectionToken,
  computed,
  inject,
  signal,
} from '@angular/core';

/* ---------------------------------------------------------------------------
   Los tipos.

   TypeScript trae `SpeechRecognitionEvent`, `SpeechRecognitionResult` y
   `SpeechRecognitionErrorEvent` en `lib.dom`, pero NO `SpeechRecognition`: la
   API no es un estándar —es un Draft Community Group Report—, MDN la marca
   como "Limited availability" y caniuse le da 0 % de soporte completo. Así
   que la interfaz se declara acá, y a propósito solo con lo que se usa: cada
   línea de esto es superficie que puede no existir en el navegador de turno.
   --------------------------------------------------------------------------- */

interface Reconocimiento extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  /** Sesgo de vocabulario. Puede no existir; se asigna dentro de try/catch. */
  phrases?: unknown;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((evento: SpeechRecognitionEvent) => void) | null;
  onerror: ((evento: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

type FabricaDeReconocimiento = () => Reconocimiento;

interface VentanaConVoz {
  SpeechRecognition?: new () => Reconocimiento;
  webkitSpeechRecognition?: new () => Reconocimiento;
  SpeechRecognitionPhrase?: new (frase: string, peso: number) => unknown;
}

/**
 * De dónde sale el reconocedor.
 *
 * Es un token y no un `new` directo para que las pruebas puedan poner el
 * suyo. El de verdad devuelve `null` cuando el constructor no está, que es la
 * PRIMERA puerta: la segunda —y la que de verdad decide— es que el motor
 * conteste algo, porque Chrome, Firefox y Edge en iOS exponen el constructor
 * y contestan `service-not-allowed`. Preguntar `'webkitSpeechRecognition' in
 * window` da falso positivo ahí (#17).
 */
export const FABRICA_DE_RECONOCIMIENTO =
  new InjectionToken<FabricaDeReconocimiento | null>(
    'Fábrica de reconocimiento de voz',
    {
      providedIn: 'root',
      factory: () => {
        if (typeof window === 'undefined') return null;
        const w = window as unknown as VentanaConVoz;
        const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
        return Constructor ? () => new Constructor() : null;
      },
    },
  );

/**
 * `es-MX` y no `es-CR`.
 *
 * Chrome tiene veinte locales de español e incluye `es-CR`; Apple tiene cinco
 * —CL, CO, MX, ES, US— y Costa Rica no está entre ellos, así que `es-CR`
 * revienta en Safari con `language-not-supported`. `es-419` no existe en
 * ninguna plataforma. `es-MX` es el que funciona en todas y el más cercano al
 * habla del país (#17).
 */
export const IDIOMA = 'es-MX';

/**
 * Los dos plazos que la API no documenta y que están cableados en Chromium:
 * aborta con `no-speech` si no oye voz en 8 s, y en modo continuo cierra la
 * sesión sola tras 15 s de silencio. No están en la especificación ni en la
 * documentación para desarrolladores; se leyeron del código (#17).
 *
 * Por eso hace falta un vigilante: sin él, el micrófono se apaga solo a media
 * frase y quien está hablando no se entera hasta que mira la pantalla.
 */
const REINTENTOS_SIN_VOZ = 3;
const ESPERA_ANTES_DE_REINTENTAR_MS = 250;

/**
 * Vocabulario del taller para sesgar el reconocimiento.
 *
 * Son palabras que un motor entrenado con español general escribe mal —
 * "candela" por "candelas", "faja" por "fajas"— y que acá son el dato. El
 * peso es relativo: 3 sube la probabilidad sin llegar a forzarla.
 *
 * Si el motor no lo soporta contesta `phrases-not-supported` y la sesión se
 * reintenta sin sesgo. No se pierde nada: el sesgo es una mejora, no un
 * requisito.
 */
const VOCABULARIO_DEL_TALLER: readonly string[] = [
  'candela',
  'faja de distribución',
  'guardabarros',
  'amortiguador',
  'alternador',
  'pastillas de freno',
  'bomba de agua',
  'rótula',
  'latonería',
  'enderezado',
  'clutch',
  'croche',
  'marchamo',
  'riteve',
];

export type EstadoDictado =
  'apagado' | 'pidiendo-permiso' | 'escuchando' | 'no-disponible';

/**
 * El motivo por el que el dictado no está funcionando, dicho en taller.
 *
 * Los códigos de la API son ocho y ninguno se puede enseñar tal cual. Lo que
 * importa no es el código sino qué puede hacer quien está de pie frente al
 * Cliente, y en todos los casos la respuesta es la misma: escribir. Por eso
 * cada mensaje termina apuntando al teclado y no a la configuración.
 */
const MOTIVOS: Record<string, string> = {
  'not-allowed':
    'El navegador no dio permiso para el micrófono. Se puede escribir igual.',
  'service-not-allowed':
    'Este navegador no permite dictar. Se puede escribir igual.',
  'language-not-supported':
    'Este navegador no reconoce español. Se puede escribir igual.',
  network: 'El dictado necesita internet y ahora no hay. Se puede escribir.',
  'audio-capture':
    'No se encontró micrófono. Revisá que esté conectado, o escribí.',
  'no-speech': 'No se escuchó nada.',
  aborted: '',
};

/** Errores tras los que no tiene sentido volver a intentar en esta sesión. */
const DEFINITIVOS = new Set([
  'not-allowed',
  'service-not-allowed',
  'language-not-supported',
  'audio-capture',
]);

/**
 * Hablarle a un campo de texto en vez de teclearlo.
 *
 * Es un **acelerador sobre campos que ya funcionan escribiendo** (ADR 0004).
 * Todo acá está construido alrededor de esa frase: el servicio nunca es el
 * camino, nunca bloquea, y cuando falla lo dice en una línea que termina
 * diciendo que se puede escribir. Si el micrófono desapareciera, la Recepción
 * seguiría completa.
 *
 * Un solo campo dicta a la vez. No es una limitación técnica: dos campos
 * escuchando el mismo micrófono se reparten las palabras del Cliente al azar,
 * y eso es peor que no tener dictado.
 */
@Injectable({ providedIn: 'root' })
export class Dictado {
  readonly #fabrica = inject(FABRICA_DE_RECONOCIMIENTO, { optional: true });

  readonly #estado = signal<EstadoDictado>(
    this.#fabrica ? 'apagado' : 'no-disponible',
  );
  readonly #campo = signal<string | null>(null);
  readonly #parcial = signal('');
  readonly #problema = signal<string | null>(null);

  /** En qué estado está el micrófono ahora mismo. */
  readonly estado = this.#estado.asReadonly();
  /** Qué campo está dictando, si alguno. */
  readonly campo = this.#campo.asReadonly();
  /** Lo que se va oyendo y todavía puede cambiar. Se enseña en gris. */
  readonly parcial = this.#parcial.asReadonly();
  /** Por qué no funciona, dicho para alguien de pie frente al Cliente. */
  readonly problema = this.#problema.asReadonly();

  /** Hay con qué dictar. No garantiza que vaya a funcionar: eso solo lo dice
      el primer intento. */
  readonly hayMicrofono = computed(() => this.#estado() !== 'no-disponible');

  #sesion: Reconocimiento | null = null;
  #queriendoEscuchar = false;
  #sinVoz = 0;
  #conSesgo = true;
  #alFinal: ((texto: string) => void) | null = null;
  #reintento: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    /* El micrófono es un recurso del aparato: si la pantalla se destruye con
       la sesión abierta, sigue encendido. `abort` y no `stop` porque lo que
       quedara a medias ya no le sirve a nadie. */
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  /**
   * Empieza a dictar sobre un campo. Si ya estaba dictando ese mismo, para.
   *
   * El mismo botón enciende y apaga a propósito: es un solo gesto y un solo
   * sitio donde mirar. Dos botones obligan a acertarle al correcto mientras
   * se habla.
   */
  alternar(campo: string, alFinal: (texto: string) => void): void {
    if (this.#campo() === campo) {
      this.detener();
      return;
    }
    this.detener();
    this.#comenzar(campo, alFinal);
  }

  detener(): void {
    this.#queriendoEscuchar = false;
    if (this.#reintento) clearTimeout(this.#reintento);
    this.#reintento = null;

    /* Lo que estaba a medio reconocer se entrega antes de cerrar: alguien que
       para de hablar y pulsa el botón espera ver lo que dijo, no perderlo. */
    const pendiente = this.#parcial().trim();
    if (pendiente && this.#alFinal) this.#alFinal(pendiente);

    this.#sesion?.abort();
    this.#sesion = null;
    this.#alFinal = null;
    this.#parcial.set('');
    this.#campo.set(null);
    if (this.#estado() !== 'no-disponible') this.#estado.set('apagado');
  }

  #comenzar(campo: string, alFinal: (texto: string) => void): void {
    if (!this.#fabrica) {
      this.#estado.set('no-disponible');
      return;
    }

    this.#alFinal = alFinal;
    this.#campo.set(campo);
    this.#problema.set(null);
    this.#queriendoEscuchar = true;
    this.#sinVoz = 0;
    this.#conSesgo = true;
    this.#estado.set('pidiendo-permiso');
    this.#abrirSesion();
  }

  #abrirSesion(): void {
    if (!this.#fabrica || !this.#queriendoEscuchar) return;

    const sesion = this.#fabrica();
    this.#sesion = sesion;

    sesion.lang = IDIOMA;
    sesion.continuous = true;
    sesion.interimResults = true;
    sesion.maxAlternatives = 1;
    if (this.#conSesgo) this.#sesgar(sesion);

    sesion.onstart = () => this.#estado.set('escuchando');
    sesion.onspeechstart = () => {
      this.#sinVoz = 0;
    };
    sesion.onresult = (evento) => this.#recibir(evento);
    sesion.onerror = (evento) => this.#fallar(evento.error);
    sesion.onend = () => this.#terminar();

    try {
      sesion.start();
    } catch {
      /* Chrome lanza `InvalidStateError` si ya estaba arrancada. No es un
         fallo del que haya que informar: la sesión buena es la que corre. */
    }
  }

  /** Sesgo de vocabulario, si el navegador lo trae. */
  #sesgar(sesion: Reconocimiento): void {
    const Frase = (window as unknown as VentanaConVoz).SpeechRecognitionPhrase;
    if (!Frase) return;

    try {
      sesion.phrases = VOCABULARIO_DEL_TALLER.map(
        (frase) => new Frase(frase, 3),
      );
    } catch {
      /* Que la propiedad exista no garantiza que el motor la acepte. Si
         revienta al asignarla se sigue sin sesgo, que es el comportamiento de
         siempre. */
      this.#conSesgo = false;
    }
  }

  #recibir(evento: SpeechRecognitionEvent): void {
    let cerrado = '';
    let abierto = '';

    /* Se arranca en `resultIndex` y no en cero: lo anterior ya se entregó, y
       recorrerlo otra vez duplicaría cada frase. */
    for (let i = evento.resultIndex; i < evento.results.length; i++) {
      const resultado = evento.results[i];
      const texto = resultado[0].transcript;
      if (resultado.isFinal) cerrado += texto;
      else abierto += texto;
    }

    this.#parcial.set(abierto);
    if (cerrado.trim()) {
      this.#sinVoz = 0;
      this.#alFinal?.(cerrado.trim());
    }
  }

  #fallar(codigo: string): void {
    /* `no-speech` no es un fallo: es el plazo de 8 s de Chromium venciendo
       porque el Cliente todavía está pensando. Se reintenta calladamente unas
       cuantas veces y solo después se dice algo. */
    if (codigo === 'no-speech') {
      this.#sinVoz++;
      if (this.#sinVoz < REINTENTOS_SIN_VOZ) return;
      this.#problema.set(MOTIVOS['no-speech']);
      this.#queriendoEscuchar = false;
      return;
    }

    if (codigo === 'aborted') return;

    const motivo = MOTIVOS[codigo] ?? 'No se pudo dictar. Se puede escribir.';
    this.#problema.set(motivo);

    if (DEFINITIVOS.has(codigo)) {
      /* Acá es donde se detecta de verdad que no hay dictado: no por preguntar
         si el constructor existe —que en iOS miente— sino porque el motor
         contestó que no. */
      this.#queriendoEscuchar = false;
      this.#estado.set('no-disponible');
      return;
    }

    if (codigo === 'phrases-not-supported') {
      // Se vuelve a abrir sin sesgo; el sesgo era una mejora, no un requisito.
      this.#problema.set(null);
      this.#conSesgo = false;
      return;
    }

    this.#queriendoEscuchar = false;
  }

  /**
   * La sesión se cerró. Si todavía se quiere escuchar, se vuelve a abrir.
   *
   * Este es el vigilante, y es obligatorio: en modo continuo Chromium cierra
   * la sesión sola a los 15 s de silencio. Sin reabrirla, el micrófono se
   * apaga a media conversación y nadie se entera.
   *
   * Va con un respiro y no en el acto: llamar `start()` dentro del propio
   * `end` lanza `InvalidStateError` porque la sesión anterior todavía no
   * terminó de soltarse.
   */
  #terminar(): void {
    if (!this.#queriendoEscuchar) {
      if (this.#estado() !== 'no-disponible') this.#estado.set('apagado');
      this.#campo.set(null);
      return;
    }

    this.#reintento = setTimeout(
      () => this.#abrirSesion(),
      ESPERA_ANTES_DE_REINTENTAR_MS,
    );
  }
}
