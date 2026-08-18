# Reconocimiento de voz en el navegador para la app de taller

> Investigación del ticket [#17](https://github.com/FabianRG1990/repositorio-de-apps/issues/17) (mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14)).
> Fecha: 2026-08-17. Investigado **desde cero** contra fuentes primarias (spec del W3C Audio CG, código fuente de Chromium, bug trackers de Chromium y WebKit, documentación de Apple y de MDN/BCD). No reutiliza hallazgos de `apps/bahia`.

## Pregunta

¿Qué tan confiable es el reconocimiento de voz basado en navegador (Web Speech API y alternativas) en los navegadores/dispositivos donde se hará esta demo?

Contexto: app Angular de órdenes de trabajo para talleres. El dictado sirve para capturar diagnósticos y observaciones con las manos sucias, en el piso del taller. Idioma crítico: **español latinoamericano** (es-CR / es-MX). Escenario a proteger: **demo de venta en vivo**, donde una falla es inaceptable.

---

## Resumen ejecutivo

_(pendiente)_

---

## 1. Estado del estándar

La Web Speech API **no es un estándar del W3C**. El documento vigente es un *Draft Community Group Report* del Audio Community Group, con fecha 10 de agosto de 2026, editado por Evan Liu (Google) ([spec](https://webaudio.github.io/web-speech-api/)). Chrome Platform Status clasifica su madurez como *"Specification being incubated in a Community Group"* ([chromestatus 6090916291674112](https://chromestatus.com/feature/6090916291674112)).

Consecuencias prácticas:

- **No hay texto normativo sobre duración de sesión, timeouts ni silencios.** La spec define `continuous` sólo en términos de "cero o más resultados finales" vs "no más de un resultado final" ([§4.1.1](https://webaudio.github.io/web-speech-api/#dom-speechrecognition-continuous)). Todo lo demás es decisión del navegador, y en la práctica está *hardcodeado* en el código fuente (ver §4).
- **La spec es agnóstica respecto de dónde ocurre el reconocimiento**: *"The API itself is agnostic of the underlying speech recognition and synthesis implementation and can support both server-based and client-based/embedded recognition"* ([§1](https://webaudio.github.io/web-speech-api/#introduction)). No garantiza funcionamiento offline.
- MDN clasifica la API como **"Limited availability — This feature is not Baseline because it does not work in some of the most widely-used browsers"** ([MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)).
- caniuse reporta **0 % de soporte completo** y 87,55 % de soporte *parcial* a nivel global ([caniuse: speech-recognition](https://caniuse.com/speech-recognition)).

Atributos recientes de la spec relevantes para este proyecto: `processLocally` (exigir procesamiento local), `phrases` / `SpeechRecognitionPhrase` (sesgo contextual de vocabulario, con `boost` entre 0.0 y 10.0), `unspokenPunctuation` (puntuación automática) y los estáticos `available()` / `install()` para paquetes de idioma on-device, protegidos por la *Permissions-Policy* `on-device-speech-recognition` (allowlist por defecto `'self'`).

---

## 2. Matriz de soporte por navegador / SO

Fuente principal: [MDN browser-compat-data, `api/SpeechRecognition.json`](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json) (consultado 2026-08-17) y [caniuse](https://caniuse.com/speech-recognition).

| Navegador / SO | ¿Existe la API? | `continuous` | `processLocally` / on-device | Notas |
|---|---|---|---|---|
| **Chrome escritorio** (Win/macOS/Linux) | Sí. `webkitSpeechRecognition` desde Chrome 25; `SpeechRecognition` sin prefijo desde **139** | Sí (desde Chrome 33) | Sí, desde **139** (sólo escritorio) | Camino por defecto = **servidores de Google** |
| **Chrome Android** | Sí (desde Chrome 31) | **No.** BCD: *"The property can be set, but has no effect."* | **No** (`android: null` en todos los features de Chrome Status) | Depende de que exista un `RecognitionService` **de Google** en el dispositivo |
| **Edge escritorio** (Win/macOS ≥ 87) | Sí | Sí | Sólo Canary/Dev 150+ tras flag | Backend **Azure Cognitive Services**, no Google. Desactivable por política de empresa |
| **Edge Android / iOS** | Microsoft declara la política como *"Not supported"* en ambos | — | — | Ver §4 |
| **Safari macOS** (≥ 14.1, abril 2021) | Sí, **sólo con prefijo** `webkitSpeechRecognition` | Desde **Safari 17** | Automático: intenta on-device y cae a servidor de Apple | **Requiere Siri o Dictado activados en el sistema**; HTTPS obligatorio desde Safari 26 |
| **Safari iOS/iPadOS** (≥ 14.5) | Sí, sólo con prefijo | Desde Safari 17 | Igual que macOS | **Bloqueado en PWA agregada a pantalla de inicio y en `SafariViewController`** |
| **Chrome / Firefox / Edge en iOS** | **La API está expuesta pero no funciona** | — | — | Devuelve `service-not-allowed`. La detección por `'webkitSpeechRecognition' in window` da **falso positivo** |
| **Firefox (todas las plataformas)** | **No.** Detrás del flag `media.webspeech.recognition.enable` | — | — | caniuse: *"actual support is waiting for permissions to be sorted out"* |
| **Android WebView** | **No.** Chrome Status marca `webview: null` para *Web Speech API (input)* | — | — | Relevante si algún día se empaqueta como híbrido |
| **Samsung Internet / Opera Mobile** | Parcial (espejo de Chromium) | Igual que Chrome Android | No | — |

Detalles duros que sostienen la tabla:

- **Chrome Android nunca recibió las mejoras.** Todas las entradas de Chrome Platform Status para reconocimiento de voz muestran `android: null`: *On-device Web Speech API* (escritorio 139), *Web Speech API contextual biasing* (escritorio 142), *On-Device Recognition Quality* (escritorio 150), *Unspoken Punctuation* (escritorio 151), *MediaStreamTrack support* (escritorio 135). La inversión de Google en esta API es de escritorio.
- **Chrome exige origen seguro (HTTPS).** Chrome Status *"Remove Insecure usage of the Speech Recognition API"*, estado *Enabled by default*: *"Remove access to the Speech Recognition API on insecure origins."* ([chromestatus 5639479519870976](https://chromestatus.com/feature/5639479519870976)). Una demo servida por `http://` en LAN no funciona (salvo `localhost`).
- **Safari en PWA: bloqueado.** En [bugs.webkit.org #225298](https://bugs.webkit.org/show_bug.cgi?id=225298), un ingeniero de Apple responde textualmente: *"Yes, SpeechRecognition API is not available in SafariViewController and web apps added to Home Screen for now. There are some implementation details we need to figure out before we can enable it."* El bug sigue en estado **RESOLVED LATER** (`rdar://115302548`) y el último comentario público es de marzo de 2025 sin resolución. ⚠️ Hay indicios en el bug [321436](https://bugs.webkit.org/show_bug.cgi?id=321436) (agosto 2026) de que en iOS 26 el reconocimiento ya arranca en modo standalone/PWA, pero es la afirmación de un reportante, no de Apple; **hay que probarlo en el dispositivo real antes de asumirlo**.
- **Safari exige Dictado/Siri activados.** El blog de WebKit lo dice al anunciar la función: *"Safari supports speech recognition powered by the same speech engine as Siri. […] **Note that users will need Siri enabled in System Preferences on macOS or Settings in iOS or iPadOS for the API to be available to be used.**"* ([New WebKit Features in Safari 14.1](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)). Si el usuario tiene Siri y Dictado desactivados —común en equipos corporativos— la API falla con `service-not-allowed`.
- **Chrome/Firefox/Edge en iOS: falso positivo de feature detection.** Todos usan WebKit obligatoriamente ([App Store Review Guidelines §2.5.6](https://developer.apple.com/app-store/review/guidelines/); el *entitlement* de motores alternativos sólo aplica en UE y Japón). En [bugs.webkit.org #239816](https://bugs.webkit.org/show_bug.cgi?id=239816), un ingeniero de Chrome iOS reporta: *"The Web Speech API is available in Safari on iOS, but is not enabled for other WKWebView embedders"* y *"the current state in WKWebView is very confusing for web developers using feature detection, since `webkitSpeechRecognition` is exposed on window, but doesn't work."* El bug se cerró **WORKSFORME** sin que el reportante confirmara solución. **Detectar por evento de error, nunca por presencia del constructor.**

---

## 3. Requisitos de red: qué pasa sin internet

**El camino por defecto en Chrome envía el audio a servidores de Google.** Esto está en el código fuente de Chromium, no es una inferencia:

- El endpoint está declarado en [`content/browser/speech/network_speech_recognition_engine_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/network_speech_recognition_engine_impl.cc):
  ```cpp
  const char kWebServiceBaseUrl[] =
      "https://www.google.com/speech-api/full-duplex/v1";
  ```
- La anotación de tráfico del mismo archivo (revisada por Google el 2024-02-21) dice: *"Chrome provides translation from speech audio recorded with a microphone to text, by using the Google speech recognition web service. Audio is sent to Google's servers (upstream) and text is returned (downstream)."*, con `data: "Audio recorded with the microphone…"` y `destination: GOOGLE_OWNED_SERVICE`.
- MDN lo confirma para desarrolladores: *"By default, using speech recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline."* ([Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)).
- Google lo reconoce en la motivación de la feature on-device: *"most implementers of the API perform speech recognition using a cloud service"* ([chromestatus 6090916291674112](https://chromestatus.com/feature/6090916291674112)).

**Comportamiento sin conexión en Chrome:** cualquier fallo de la petición upstream/downstream desemboca en `AbortWithError()`, que emite el código de error `network` (`media::mojom::SpeechRecognitionErrorCode::kNetwork`). Es decir, sin internet se dispara un evento `error` con `event.error === "network"`, sin ningún resultado parcial.

**En Apple el reconocimiento también es de red por defecto.** La documentación de Apple para `SFSpeechRecognizer` —el servicio de sistema que WebKit expone (activar Siri o Dictado es el prerrequisito documentado en el bug 225298)— dice literalmente: *"Because speech recognition is a network-based service, limits are enforced so that the service can remain freely available to all apps."* y *"For some languages, the recognizer might require an Internet connection."* ([developer.apple.com/documentation/speech/sfspeechrecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer)).

**Conclusión de red:** para la demo, la Web Speech API **requiere internet estable** en todos los navegadores relevantes, con la única excepción del modo `processLocally` de Chrome escritorio 139+ (ver §6).

---

## 4. Dictado continuo: límites reales

La spec no define ningún límite. Los límites están en las implementaciones y **no están documentados en la documentación pública para desarrolladores**; se leen en el código.

### Chrome (camino de red)

De [`content/browser/speech/speech_recognizer_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/speech_recognizer_impl.cc) y su header:

| Constante / comportamiento | Valor | Efecto |
|---|---|---|
| `kNoSpeechTimeoutMs` | **8 000 ms** | Si no se detecta voz en los primeros 8 s tras `start()`, aborta con error `no-speech` |
| `kEndpointerEstimationTimeMs` | 300 ms | Calibración de ruido ambiente al inicio |
| Silencio en modo **no continuo** | 0,5 s (si lleva < 3 s) / 1 s (si lleva ≥ 3 s) | Comentario en el código: *"the session is automatically ended after: 0.5 seconds of silence if time < 3 seconds; 1 seconds of silence if time >= 3 seconds"* |
| Silencio en modo **continuo** | **15 s** | Comentario en el código: *"In continuous recognition, the session is automatically ended after 15 seconds of silence."* |
| Frecuencia de muestreo | 16 kHz | `kAudioSampleRate = 16000` |

Es decir: en Chrome escritorio **no hay un tope de duración por reloj**, pero la sesión muere sola tras 15 s de silencio en modo continuo, y muere a los 8 s si el usuario tarda en empezar a hablar. En un taller, entre "abro la orden" y "empiezo a describir la falla" es fácil superar 8 s → `no-speech`.

Estos límites aplican **tanto al camino de red como al on-device**: ambos motores se envuelven en el mismo `SpeechRecognizerImpl`, que hace la captura y el *endpointing* en el navegador. Android es la excepción: usa un `SpeechRecognizerImplAndroid` separado, y el propio código lo explica —*"This is not the case of Android where, not only the speech recognition, but also the audio capture and endpointing activities [are] performed outside of the browser (delegated via JNI to the Android API implementation)"*.

Además, los estados finales (`no-speech`, `aborted`, `network`, …) también pueden venir **decididos por el servidor**: el código mapea `proto::SpeechRecognitionEvent::STATUS_*` recibido del backend de Google directamente a códigos de error de la API. El cliente no controla ese endpointing.

### Chrome Android: `continuous` no funciona

MDN browser-compat-data marca `SpeechRecognition.continuous` como **no soportado en Chrome Android**, con la nota explícita: *"The property can be set, but has no effect."*

El código fuente explica por qué. En [`SpeechRecognitionImpl.java`](https://chromium.googlesource.com/chromium/src/+/main/content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java):

- Chrome delega en el `SpeechRecognizer` de Android y pasa un extra **privado y no documentado**: `mIntent.putExtra("android.speech.extra.DICTATION_MODE", continuous)` — nótese que es un literal de cadena, no una constante pública de `RecognizerIntent`.
- El listener asume una sola respuesta: *"We assume that onResults is called only once, at the end of a session, thus we terminate. If one day the recognition provider changes dictation mode behavior to call onResults several times, we should terminate only if (!mContinuous)."* Es decir, en cuanto el motor de Android entrega resultados, Chrome **termina la sesión**, continuo o no.
- Hay un `TODO(crbug.com/40479664): Fix this properly` sobre la selección de proveedor.

El bug canónico es [crbug 41297427](https://issues.chromium.org/issues/41297427), *"The recognition is closed quickly when the user makes a very small break. In fact, the continuous mode doesn't work"*. Fue reportado el **25 de enero de 2017**, confirmado por el equipo de Chromium tres días después (*"We are able to repro this on Chrome Stable"*), y sigue en estado **New, sin asignar, P2**. El último comentario es del **17 de junio de 2026**: *"Can an update please be provided for this? Need this to be addressed, attempting to use this in production…"*. **Nueve años y medio sin arreglar.** No es razonable planificar sobre la expectativa de que se arregle.

El código también prueba que **el modo on-device es imposible en Android**, no sólo "no lanzado": en [`speech_recognition_manager_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/speech_recognition_manager_impl.cc), `UseOnDeviceSpeechRecognition()` devuelve `false` incondicionalmente bajo `BUILDFLAG(IS_ANDROID)`.

### Chrome Android: la API puede no existir del todo

El mismo archivo condiciona la disponibilidad a que haya un servicio de reconocimiento **de Google** instalado:

```java
/** Returns null if there is no Google LLC provided RecognitionService available on device. */
private static @Nullable ComponentName createRecognitionProvider() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S || DeviceInfo.isAutomotive()) {
        return getComponent(SSBG_PACKAGE_NAME, -1);          // com.google.android.tts
    } else {
        return getComponent(AGSA_PACKAGE_NAME, AGSA_MIN_VERSION); // com.google.android.googlequicksearchbox
    }
}
```

Si `initialize()` no encuentra `com.google.android.tts` (Android 12+) o la app de Google con versión ≥ 300207030 (Android 11 y anteriores), **la Web Speech API queda deshabilitada en ese dispositivo**. Un teléfono sin servicios de Google, con la app de Google desactivada, o con "Speech Services by Google" deshabilitado, no dicta. Y hay un comentario adicional: *"Caveat: Continuous mode may not work as expected with a different provider."*

### Safari / iOS: el límite de 1 minuto NO aplica, pero hay fallos silenciosos

Este punto **desmiente lo que circula en foros**. Es cierto que Apple documenta para `SFSpeechRecognizer`:

> *"Plan for a one-minute limit on audio duration. […] the framework stops speech recognition tasks that last longer than one minute."* y *"The current rate limit for the number of `SFSpeechRecognitionRequest` calls a device can make is 1000 requests per hour. […] this limit is on the number of requests that a device can make and is not tied to the application making it."*
> ([SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer), [Technical Q&A QA1951](https://developer.apple.com/library/archive/qa/qa1951/_index.html))

**Pero WebKit anula ese límite mediante SPI privada y lo sube a una hora.** En [`Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm):

```objc
// Set the maximum duration to be an hour; we can adjust this if needed.
static constexpr size_t maximumRecognitionDuration = 60 * 60;
...
if ([_recognizer supportsOnDeviceRecognition])
    [_request setRequiresOnDeviceRecognition:YES];
[_request setShouldReportPartialResults:interimResults];
[_request setTaskHint:SFSpeechRecognitionTaskHintDictation];
[_request setDetectMultipleUtterances:YES];
[_request _setMaximumRecognitionDuration:maximumRecognitionDuration];
```

Del mismo fragmento se deduce además que **WebKit prefiere on-device cuando el dispositivo lo soporta**, y **cae a los servidores de Apple sin avisar cuando no** (`supportsOnDeviceRecognition == NO`). Apple lo confirma en su aviso legal: *"If you choose to allow apps to use Speech Recognition for transcription, the audio data to be transcribed may be sent to Apple."* ([Ask Siri, Dictation & Privacy](https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/)).

`continuous` está genuinamente implementado en WebKit (viaja como `doMultipleRecognitions`) y funciona desde Safari 17 según MDN BCD. **El riesgo real en Safari no es el tiempo: son los fallos silenciosos.** Bugs abiertos relevantes:

| Bug | Estado | Impacto para la demo |
|---|---|---|
| [321436](https://bugs.webkit.org/show_bug.cgi?id=321436) — el reconocimiento deja de producir resultados tras reproducir un `<audio>`/`<video>` en iOS Safari | **NEW**, reportado 2026-08-10, iOS 26 / Safari 26 | 🔴 **Crítico.** Muere **sin disparar `onresult`, `onerror` ni `onend`**. Si la demo reproduce cualquier vídeo antes del dictado, el micrófono queda muerto |
| [288963](https://bugs.webkit.org/show_bug.cgi?id=288963) — `continuous` + `interimResults` en iOS | **NEW**, iOS 18 | 🔴 Precisión degradada a lo largo de la sesión; el reporter observa caídas a la nube |
| [296557](https://bugs.webkit.org/show_bug.cgi?id=296557) — sonidos del sistema persistentes tras usar la API | **NEW** (Major), iOS 18.5/18.6 | 🟠 Ruido audible en plena demo |
| [221312](https://bugs.webkit.org/show_bug.cgi?id=221312) — `start`/`end` no se emiten en pares | **NEW** | 🟡 Máquinas de estado de la UI se quedan colgadas |
| [228209](https://bugs.webkit.org/show_bug.cgi?id=228209) — el propio test de WebKit "start recognition after getUserMedia" es *flaky timeout* | **NEW** | 🟡 Fiabilidad conocida como imperfecta por el propio proyecto |

Otras causas verificadas de corte en Safari: página no visible (`SpeechRecognitionPermissionManager` devuelve `NotAllowed, "Page is not visible to user"`), página muteada para captura de audio, y `suspend()` del `ActiveDOMObject` (bfcache).

Desde **Safari 26 la API exige contexto seguro (HTTPS)**: *"Fixed making the SpeechRecognition interface available only within a secure context."* ([WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).

### Edge: es un backend distinto (Azure), sólo escritorio

Microsoft documenta su propia implementación en la política empresarial [`SpeechRecognitionEnabled`](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/speechrecognitionenabled) (actualizada 2026-06-15):

> *"Set whether websites can use the W3C Web Speech API to recognize speech from the user. **The Microsoft Edge implementation of the Web Speech API uses Azure Cognitive Services, so voice data leaves the machine.**"*

Y declara soporte: **Windows ≥ 87, macOS ≥ 87, Android: Not supported, iOS: Not supported**.

Dos consecuencias:

1. **caniuse está desactualizado en este punto.** Su nota *"Edge and Opera appear to have support for the SpeechRecognition API but no events for it appear to fire"* contradice la documentación oficial de Microsoft; la entrada de caniuse todavía enlaza a la URL vieja de la spec (`w3c.github.io/speech-api`) y a `bugs.chromium.org`, señales de que no se ha revisado.
2. **Un administrador de TI puede apagar la función** con Group Policy o una clave de registro (`SOFTWARE\Policies\Microsoft\Edge\SpeechRecognitionEnabled = 0`). En una demo sobre la laptop corporativa del cliente, esto es un modo de fallo real y no diagnosticable desde el código.

El modelo local de Edge existe pero **sólo en Edge Canary/Dev 150.0.4076+ y detrás de un flag** (`edge://flags` → *Speech Recognition with on-device model*), y sus idiomas son en-US, de-DE, it-IT, pt-PT, **es-ES**, ko-KR — **no hay ningún locale de español latinoamericano** ([Convert speech to text with the SpeechRecognition API](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api)). La misma página advierte: *"The transcription might also stop automatically after a long period of silence in the input audio."*

---

## 5. Calidad en español

### Chrome

- **Chrome soporta 20 locales de español, incluido `es-CR`.** La tabla `langs` de la demo oficial de Google referida por el blog de Chrome for Developers ([Voice driven web apps](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api/)) lista, en [google.com/intl/en/chrome/demos/speech.html](https://www.google.com/intl/en/chrome/demos/speech.html): `es-AR, es-BO, es-CL, es-CO, es-CR, es-DO, es-EC, es-ES, es-GT, es-HN, es-MX, es-NI, es-PA, es-PE, es-PR, es-PY, es-SV, es-US, es-UY, es-VE` (96 locales en total).
- **`es-419` NO aparece** en esa lista. Para Chrome hay que usar un locale concreto: `es-CR` para Costa Rica, `es-MX` para México.
- **No existe una lista oficial publicada como documentación** de idiomas de la Web Speech API en Chrome; el blog de Chrome remite al código fuente de la demo. Esto es una fuente de segunda mano de Google sobre sí mismo: es lo mejor disponible, pero no es un contrato.
- El sesgo de vocabulario (`phrases`) —lo que permitiría cargar términos de taller ("múnison", "rótula", "bujía", "empaque de cabeza", "cárter")— sólo existe en **Chrome escritorio 142+**, no en Android ni Safari ([chromestatus 5225615177023488](https://chromestatus.com/feature/5225615177023488)).

### Apple (Safari macOS/iOS): `es-CR` no existe

Apple documenta que el reconocimiento usa exactamente los mismos locales que el dictado del teclado: *"Speech recognition supports the same locales that are supported by the keyboard's dictation feature. For a list of these locales, see QuickType Keyboard: Dictation."* ([supportedLocales()](https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportedlocales())).

La lista oficial de [apple.com/ios/feature-availability](https://www.apple.com/ios/feature-availability/#dictation), sección *Dictation*, contiene **exactamente cinco locales de español**:

| Locale | Dictation | On-Device Dictation |
|---|---|---|
| Spanish (Chile) `es-CL` | ✅ | ✅ |
| Spanish (Colombia) `es-CO` | ✅ | ✅ |
| Spanish (Mexico) `es-MX` | ✅ | ✅ |
| Spanish (Spain) `es-ES` | ✅ | ✅ |
| Spanish (United States) `es-US` | ✅ | ✅ |
| **Spanish (Costa Rica)** | ❌ **no existe** | ❌ |
| **Spanish (Latin America) / `es-419`** | ❌ no está en Dictation | ❌ |
| **Spanish (Argentina)** | ❌ no está en Dictation | ❌ |

Cuidado con una trampa de esa misma página: *"Spanish (Latin America)"* y *"Spanish (Argentina)"* **sí aparecen**, pero en otras secciones (Siri, traducción, Apple Music), no en *Dictation*.

**Consecuencia directa de implementación:** si se envía `lang = "es-CR"` a Safari, WebKit lo pasa sin sanitizar a `NSLocale` y luego comprueba `[recognizer isAvailable]`; al fallar, emite el error `service-not-allowed` con el mensaje *"Speech recognition service is not available"*. Es decir, **`es-CR` funciona en Chrome y revienta en Safari.** El locale común a ambas plataformas es **`es-MX`**.

### Edge

Sólo `es-ES` en el modelo local (y sólo en Canary/Dev tras un flag). El camino en la nube va a Azure Cognitive Services; Microsoft no publica en esa página la lista de locales del camino en la nube.

### Precisión real en español

⚠️ **No encontré ninguna métrica de precisión (WER) publicada por Google, Apple ni Microsoft** para el reconocimiento de la Web Speech API en español. Ninguno de los tres publica benchmarks de sus motores de dictado web. Cualquier afirmación sobre "qué tan bien entiende el español" tendría que venir de una prueba propia, no de la documentación.

---

## 6. El modo on-device de Chrome: por qué no lo salva

Chrome 139 (escritorio) añadió `processLocally`, `SpeechRecognition.available()` y `SpeechRecognition.install()`. En teoría resuelve el problema offline. En la práctica, para una demo de venta:

- **Sólo escritorio.** `android: null`, `webview: null`, `ios: null` en Chrome Platform Status. No sirve para el celular/tablet del taller.
- **Google lo deshabilitó silenciosamente en producción durante ~2 meses.** En [issues.chromium.org/issues/444393111](https://issues.chromium.org/issues/444393111), un usuario reporta que `available({processLocally:true})` pasó de `available` a `unavailable` al actualizar Chrome de 140.0.7339.82 a 140.0.7339.133. La respuesta de Evan Liu (Google, editor de la spec) es concluyente:

  > *"Status: Won't Fix (Intended Behavior). On-device Web Speech was temporarily disabled until 142.0.7403.0 due to a regression that was found when specifying languages. You can enable it locally with the `--enable-features=OnDeviceWebSpeech` feature flag, or alternatively wait for the fix to rollout."*

  El bug quedó cerrado como **"Won't fix (Intended behavior)"**, y el reportante confirmó recuperación recién en noviembre de 2025 con Chrome 142.
- **Depende de descargar un paquete de idioma.** MDN: *"If you run the `start()` method after specifying `processLocally = true` but the correct language pack isn't installed, the function call will fail with a `language-not-supported` error."* La instalación puede requerir permiso explícito del usuario según la spec.

Traducción para la demo: una actualización menor de Chrome puede desactivar la funcionalidad la mañana de la presentación, y Google considera eso comportamiento aceptable.

---

## 7. Alternativas evaluadas

_(pendiente)_

---

## 8. Riesgos para una demo en vivo y mitigaciones

_(pendiente)_

---

## 9. Incertidumbres

_(pendiente)_

---

## 10. Fuentes

_(pendiente)_
