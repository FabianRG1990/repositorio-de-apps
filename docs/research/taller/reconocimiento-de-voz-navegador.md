# Reconocimiento de voz en el navegador para la app de taller

> Investigación del ticket [#17](https://github.com/FabianRG1990/repositorio-de-apps/issues/17) (mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14)).
> Fecha: 2026-08-17. Investigado **desde cero** contra fuentes primarias (spec del W3C Audio CG, código fuente de Chromium, bug trackers de Chromium y WebKit, documentación de Apple y de MDN/BCD). No reutiliza hallazgos de `apps/bahia`.

## Pregunta

¿Qué tan confiable es el reconocimiento de voz basado en navegador (Web Speech API y alternativas) en los navegadores/dispositivos donde se hará esta demo?

Contexto: app Angular de órdenes de trabajo para talleres. El dictado sirve para capturar diagnósticos y observaciones con las manos sucias, en el piso del taller. Idioma crítico: **español latinoamericano** (es-CR / es-MX). Escenario a proteger: **demo de venta en vivo**, donde una falla es inaceptable.

---

## Resumen ejecutivo

**Veredicto: la Web Speech API es suficientemente confiable para una demo en vivo sólo bajo condiciones muy acotadas — Chrome o Edge de escritorio, con internet, sobre HTTPS, en español `es-MX` — y no es confiable en el resto de escenarios**, empezando por el que más se parece al pitch de este producto (un celular Android o un iPhone en el piso del taller).

Los ocho hechos que sostienen ese veredicto, todos verificados en fuente primaria:

1. **No es un estándar.** Es un *Draft Community Group Report*, no una Recomendación del W3C. MDN la clasifica como *"Limited availability"* y caniuse reporta **0 % de soporte completo** a nivel mundial.
2. **Por defecto el audio sale del dispositivo.** Chromium envía el audio a `https://www.google.com/speech-api/full-duplex/v1`; Edge lo envía a Azure Cognitive Services (documentado por Microsoft); Apple intenta on-device y cae a sus servidores sin avisar. **Sin internet, Chrome emite `error: "network"` y no hay resultado.**
3. **El dictado continuo no funciona en Chrome Android.** No es un bug pendiente de triaje: [crbug 41297427](https://issues.chromium.org/issues/41297427) lleva **abierto desde enero de 2017**, sin asignar, con un desarrollador pidiendo novedades en junio de 2026. Además, el modo on-device está deshabilitado a nivel de código en Android.
4. **Hay timeouts no documentados, escritos a mano en Chromium**: la sesión aborta con `no-speech` si no se detecta voz en **8 s**, y en modo continuo se cierra sola tras **15 s de silencio**. Nada de esto aparece en la spec ni en la documentación para desarrolladores.
5. **En iOS, la API no funciona en PWA instalada ni en `SafariViewController`** (declaración de un ingeniero de Apple, bug abierto desde 2021), y **Chrome/Firefox/Edge de iOS exponen el constructor pero devuelven `service-not-allowed`** — es decir, la detección por `'webkitSpeechRecognition' in window` da falso positivo.
6. **En Safari el riesgo no es el tiempo, son los fallos silenciosos.** WebKit sube el límite de Apple de 1 minuto a 1 hora vía SPI privada, pero hay un bug abierto ([321436](https://bugs.webkit.org/show_bug.cgi?id=321436), agosto 2026) por el que el reconocimiento muere tras reproducir un `<audio>` o `<video>` **sin disparar `onresult`, `onerror` ni `onend`**.
7. **`es-CR` funciona en Chrome y revienta en Safari.** Chrome soporta 20 locales de español incluido `es-CR`; Apple soporta exactamente cinco (CL, CO, MX, ES, US) y **no incluye Costa Rica**. El locale común es **`es-MX`**.
8. **La ruta on-device de Chrome no resuelve el problema offline en español latino.** Su motor (SODA) sólo tiene **`es-ES` y `es-US`**; `es-MX` y `es-CR` no existen on-device. Y además no es una red de seguridad fiable: Google la deshabilitó en producción durante unos dos meses en 2025 por una regresión y cerró el reporte como *"Won't Fix (Intended Behavior)"*.

**Qué implica para el alcance del dictado.** El dictado debe diseñarse como un **acelerador opcional sobre un campo de texto que siempre funciona**, con reinicio automático de sesión, detección de soporte por resultado real (no por presencia del constructor) y `lang = "es-MX"`. Como *escenario de demo*, la ruta segura es Chrome o Edge de escritorio con internet propio. Si el pitch exige demostrarlo en móvil o sin conexión, la Web Speech API no alcanza y hay que ir a un modelo en el cliente.

**Sobre las alternativas en el navegador:** hay dos viables y el resultado es contraintuitivo. Whisper `tiny` y `base` **no sirven para español** (14–20 % de WER en habla espontánea); el primer escalón defendible es `small`, que en q4f16 pesa 200 MB. Pero **Vosk español pesa 34,5 MB, tiene mejor WER que Whisper `base`, hace streaming incremental real, admite sesgo de vocabulario y no necesita WebGPU, SharedArrayBuffer ni cabeceras COOP/COEP** — justamente las tres cosas que rompen una demo en un equipo ajeno. Su riesgo es de mantenimiento (npm 0.0.8, sin commits desde diciembre de 2025), no técnico. Detalle completo en §7.

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
| **Chrome escritorio** (Win/macOS/Linux) | Sí. `webkitSpeechRecognition` desde Chrome 25; `SpeechRecognition` sin prefijo desde **139** | Sí (desde Chrome 33) | Sí, desde **139**, sólo escritorio y **sólo `es-ES` / `es-US`** en español | Camino por defecto = **servidores de Google** |
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

**En Edge el audio va a Azure.** Microsoft lo documenta en su política empresarial: *"The Microsoft Edge implementation of the Web Speech API uses Azure Cognitive Services, so voice data leaves the machine."*

**Conclusión de red:** para la demo, la Web Speech API **requiere internet estable** en todos los navegadores relevantes. La única excepción es el modo `processLocally` de Chrome escritorio 139+ — que en español **sólo ofrece `es-ES` y `es-US`** (ver §6). No hay ninguna combinación de navegador que dé dictado offline en español latinoamericano.

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

**El corte histórico de 60 segundos.** Existe una confirmación oficial de Glen Shires (ingeniero de Chromium) en la lista `chromium-html5`, del 28 de febrero de 2013: *"Yes, there is a 60 second timeout in this first release, and there is currently no way to increase that period of time."* ⚠️ **No se pudo verificar si ese tope del servicio sigue vigente en 2026** — vive en el servidor de Google y no es auditable desde el código abierto. Lo que sí está verificado es **cómo se manifiesta si ocurre**: `EVENT_DOWNSTREAM_CLOSED` → `AbortWithError()` → error `network`. Es decir, un corte del servidor a mitad de dictado **no se ve como `no-speech`, se ve como un error de red**.

**Bug abierto que contradice el comportamiento esperado en escritorio.** [crbug 40786350](https://issues.chromium.org/issues/40786350), *"Continuously listening to speech doesn't work"*: con `continuous = true` la sesión se detiene tras 3–4 s de silencio, no 15. Un **ingeniero de test de Chromium lo reprodujo** en Mac 11.5 y Linux en cuatro canales (Canary, Dev, Beta y Stable) y anotó que es reproducible desde M-82. **Sigue abierto.** O sea: incluso el límite de 15 s documentado en el código no es lo que los usuarios observan.

**No hay SLA ni términos de servicio.** No existe ningún documento público de Google que garantice disponibilidad, cuota o soporte del endpoint `full-duplex/v1` para uso comercial. Es un servicio no contractual del que depende el producto.

### Chrome Android: `continuous` no funciona

MDN browser-compat-data marca `SpeechRecognition.continuous` como **no soportado en Chrome Android**, con la nota explícita: *"The property can be set, but has no effect."*

El código fuente explica por qué. En [`SpeechRecognitionImpl.java`](https://chromium.googlesource.com/chromium/src/+/main/content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java):

- Chrome delega en el `SpeechRecognizer` de Android y pasa un extra **privado y no documentado**: `mIntent.putExtra("android.speech.extra.DICTATION_MODE", continuous)` — nótese que es un literal de cadena, no una constante pública de `RecognizerIntent`.
- El listener asume una sola respuesta: *"We assume that onResults is called only once, at the end of a session, thus we terminate. If one day the recognition provider changes dictation mode behavior to call onResults several times, we should terminate only if (!mContinuous)."* Es decir, en cuanto el motor de Android entrega resultados, Chrome **termina la sesión**, continuo o no.
- Hay un `TODO(crbug.com/40479664): Fix this properly` sobre la selección de proveedor.

El bug canónico es [crbug 41297427](https://issues.chromium.org/issues/41297427), *"The recognition is closed quickly when the user makes a very small break. In fact, the continuous mode doesn't work"*. Fue reportado el **25 de enero de 2017**, confirmado por el equipo de Chromium tres días después (*"We are able to repro this on Chrome Stable"*), y sigue en estado **New, sin asignar, P2**. El último comentario es del **17 de junio de 2026**: *"Can an update please be provided for this? Need this to be addressed, attempting to use this in production…"*. **Nueve años y medio sin arreglar.** No es razonable planificar sobre la expectativa de que se arregle.

El código también prueba que **el modo on-device es imposible en Android**, no sólo "no lanzado": en [`speech_recognition_manager_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/speech_recognition_manager_impl.cc), `UseOnDeviceSpeechRecognition()` devuelve `false` incondicionalmente bajo `BUILDFLAG(IS_ANDROID)`, y `components/soda/BUILD.gn` arranca con `assert(!is_android);`.

### Chrome Android: pierde la sesión en segundo plano, y confunde los errores

**1. No hay reconocimiento en segundo plano, y la sesión no se recupera.** Comentario en `speech_recognition_manager_impl.cc`:

> *"On Android, background speech recognition is not permitted. (Desktop intentionally allows background recognition). The session is terminated and remains terminated even if the page becomes visible again. The web application must explicitly call `start()` again to initiate a new session."*

Cambiar de pestaña, atender una notificación o que se apague la pantalla **mata la sesión definitivamente** en Android. En escritorio no.

**2. `not-allowed` no siempre significa "permiso denegado".** El mapeo de errores de Android traduce `SpeechRecognizer.ERROR_RECOGNIZER_BUSY` a `not-allowed`. Si otra app del teléfono tiene ocupado el reconocedor, la web recibe un error **indistinguible de que el usuario rechazara el micrófono**, y cualquier mensaje de ayuda que se muestre será incorrecto.

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
- **No existe una lista oficial publicada como documentación** de idiomas de la Web Speech API en Chrome; el blog de Chrome remite explícitamente al código fuente de la demo (*"Chrome speech recognition supports numerous languages (see the 'langs' table in the demo source)"*). Es lo mejor disponible, pero no es un contrato.
- **Ese soporte es sólo para la ruta en la nube.** El motor on-device (SODA) sólo tiene `es-ES` y `es-US` (ver §6). En cuanto se exige `processLocally = true`, el español latinoamericano desaparece.
- **Mito desmentido: no hay cuota de 50 peticiones/día.** Ese límite existe, pero aplica a *builds propios de Chromium con una API key propia*, no a la Web Speech API en el Chrome de release. Glen Shires (Chromium) en `chromium-dev`: el límite de 50/día es para la HTTPS Speech API, *"only available for development and personal use"*, y lista como alternativa sin ese límite *"JavaScript Web Speech API: available to websites running on Chrome (Desktop and Android)"*. Christian Biesinger (Chromium) lo confirma: *"if you want to use the Web speech API that's different, there's no limit to that."* ⚠️ Eso **no** significa que no exista throttling antiabuso no documentado.
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
- **Depende de descargar un paquete de idioma de ~60 MB.** Cifra dada por Evan Liu (responsable de la feature) en el *Intent to Ship* de blink-dev: *"each language pack is ~60MB"*. MDN añade: *"If you run the `start()` method after specifying `processLocally = true` but the correct language pack isn't installed, the function call will fail with a `language-not-supported` error."*
- **El motor on-device es SODA, y su único español es `es-ES` y `es-US`.** La lista completa está en [`components/soda/constants.cc`](https://chromium.googlesource.com/chromium/src/+/main/components/soda/constants.cc) (`kSodaLanguageToBcp47Map`): `cmn-hans-cn, cmn-hant-tw, da-dk, de-be, de-ch, de-de, en-au, en-gb, en-ie, en-in, en-sg, en-us, **es-es, es-us**, fr-be, fr-ca, fr-ch, fr-fr, hi-in, id-id, it-it, ja-jp, ko-kr, nb-no, nl-nl, pl-pl, pt-br, ru-ru, sv-se, th-th, tr-tr, vi-vn`. **No hay `es-MX`, `es-CR` ni `es-419` on-device.** Pedirlos con `processLocally = true` devuelve `available() === "unavailable"` o el error `language-not-supported`.
- **En Android es imposible por construcción**: `components/soda/BUILD.gn` empieza con `assert(!is_android);`. En ChromeOS está desactivado por defecto (`kOnDeviceWebSpeech` es `FEATURE_DISABLED_BY_DEFAULT` bajo `BUILDFLAG(IS_CHROMEOS)` en [`media/base/media_switches.cc`](https://chromium.googlesource.com/chromium/src/+/main/media/base/media_switches.cc)).

Traducción para la demo: una actualización menor de Chrome puede desactivar la funcionalidad la mañana de la presentación, y Google considera eso comportamiento aceptable. Y aunque funcione, **el español que ofrece es el de España**, no el latinoamericano.

---

## 7. Alternativas que corren 100 % en el navegador

El mapa excluye cualquier fallback que necesite un backend propio (Whisper API, Google STT, Azure vía servidor). Se evaluaron sólo opciones que corren en el cliente.

### 7.1 Calidad de Whisper en español: el dato que decide

Del paper original de OpenAI, [arXiv:2212.04356](https://arxiv.org/abs/2212.04356), apéndice D.2 (verificado leyendo las tablas del [texto completo en HTML](https://arxiv.org/html/2212.04356v1)). **WER (%) en español, menor es mejor:**

| Modelo | FLEURS (es) | Common Voice 9 (es) | MLS (es) | VoxPopuli (es) |
|---|---|---|---|---|
| tiny | 15,9 | **30,3** | 19,2 | 19,7 |
| base | 9,9 | **19,6** | 12,8 | 14,4 |
| small | 5,6 | **10,3** | 7,8 | 11,1 |
| medium | 3,6 | 6,9 | 5,3 | 9,6 |
| large-v2 | 3,0 | 5,6 | 4,2 | 8,2 |

FLEURS y MLS son lectura limpia; **VoxPopuli es el más parecido a habla espontánea**, y es el número con el que hay que fijar expectativas. Lectura directa:

- **`tiny` y `base` no sirven para dictar diagnósticos en español.** Con 19,7 % y 14,4 % de WER en habla espontánea, una de cada 5–7 palabras sale mal. En una demo de venta eso se ve como un producto roto.
- **`small` es el primer escalón defendible** (11,1 % espontáneo, 5,6 % en lectura limpia).
- `distil-whisper` está descartado por su propia *model card*: *"Distil-Whisper is currently only available for English speech recognition."*

### 7.2 Comparativa de opciones en cliente

| | **transformers.js + Whisper** | **whisper.cpp WASM** | **vosk-browser** | **Moonshine** |
|---|---|---|---|---|
| Descarga real (español usable) | base q8 **77 MB** · **small q4f16 200 MB** · small q8 249 MB (+ ~2,8 MB de tokenizer) | tiny-q5_1 32 MB · base-q5_1 60 MB · **small-q5_1 190 MB** | **34,5 MB** (`vosk-model-small-es`) | — |
| Requisitos de plataforma | WASM (por defecto) o WebGPU. Multihilo exige `crossOriginIsolated` → cabeceras COOP/COEP | **SharedArrayBuffer obligatorio** (`USE_PTHREADS=1`) → COOP/COEP obligatorio; **reserva 1 GB** (`INITIAL_MEMORY=1024MB`); requiere WASM SIMD | Sólo un WebWorker. **Sin SharedArrayBuffer, sin COOP/COEP, sin WebGPU** | WebGPU o WASM |
| Dictado continuo real | Parcial: ventanas re-transcritas + streaming de tokens. El pipeline es por *chunk* | Sí (`stream.wasm`), con calidad recortada a propósito (`audio_ctx=768`, `no_context`, ventana de 5 s) | **Sí, incremental de verdad**: `acceptWaveform` + eventos `partialresult` / `result` | Sí |
| Calidad en español | Ver tabla §7.1 | Los mismos modelos, **peor** en modo streaming (magnitud no publicada) | 16,02 (Common Voice) / 11,21 (MLS) | **Ninguna: sólo inglés** |
| Safari iOS | WASM sí; **WebGPU sólo iOS 26+** | Muy dudoso (1 GB + COOP/COEP) | El mejor candidato, sin requisitos exóticos | — |
| Vocabulario técnico | **No.** `prompt_ids` está documentado pero comentado en el código; issues [#923](https://github.com/huggingface/transformers.js/issues/923) y [#1028](https://github.com/huggingface/transformers.js/issues/1028) abiertos desde 2024 | Sólo recompilando el binding | **Sí** (`new KaldiRecognizer(sampleRate, grammar)`), pero no admite palabras fuera del léxico sin reconstruir el grafo | — |
| Salud del proyecto | HF oficial, 16,3k ⭐, v4.2.0, muy activo | 53k ⭐, v1.9.2, muy activo, pero el binding lo mantienes tú | **528 ⭐, npm 0.0.8, sin releases, sin commits desde dic-2025** | 11k ⭐, activo |

Fuentes de tamaños: API de Hugging Face con `?blobs=true` sobre `onnx-community/whisper-*` y `ggerganov/whisper.cpp`; `Content-Length` real de los `.tar.gz`/`.zip` de [alphacephei.com/vosk/models](https://alphacephei.com/vosk/models). WER de Vosk: la propia tabla de alphacephei.

### 7.3 Hallazgos contraintuitivos

1. **`whisper-small` en q4f16 pesa 200 MB, menos que los 206 MB que la demo oficial de Hugging Face descarga para `whisper-base`.** La decisión "usemos base para ahorrar peso" no se sostiene con los bytes reales: por el mismo tamaño se pasa de 14,4 % a 11,1 % de WER espontáneo en español.
2. **Vosk español (34,5 MB) es mejor que Whisper `base` (77–206 MB) en español**, tiene streaming incremental real —que además *se ve* mejor en vivo, porque el texto aparece palabra a palabra— y es la única opción con sesgo de vocabulario funcionando hoy. Su debilidad no es técnica sino de mantenimiento: versión 0.0.8, un solo mantenedor, sin commits desde diciembre de 2025.
3. **Moonshine y sherpa-onnx WASM están descartados por idioma**, no por rendimiento: Moonshine es explícitamente sólo inglés según su *model card*, y sherpa-onnx no publica modelo de español para su build WASM.

### 7.4 Trampas de implementación documentadas

- **transformers.js asume inglés si no se especifica el idioma.** En `modeling_whisper.js`: `// TODO: Implement language detection` seguido de `logger.warn('No language specified - defaulting to English (en).'); language = 'en';`. Hay que pasar siempre `language: 'spanish', task: 'transcribe'`.
- **Sin cabeceras COOP/COEP, ONNX Runtime Web corre en un solo hilo.** La documentación oficial de ONNX Runtime Web dice: *"Only when the browser supports WebAssembly multi-threading and `crossOriginIsolated` mode is enabled, multi-threading will be enabled."* Angular tiene que emitir `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp` tanto en el dev-server como en el hosting.
- **Para el escenario sin internet**, no se debe depender de la Cache API ni de `huggingface.co`: hay que servir los modelos como assets estáticos de la app y fijar `allowRemoteModels = false`, `allowLocalModels = true`, `localModelPath`.

### 7.5 Coste real de la alternativa on-device

Una descarga de 34 MB (Vosk) o 200 MB (Whisper small) es aceptable *si se descarga antes de la demo*, y es inaceptable si se descarga durante. En ambos casos el modelo debe venir empaquetado o precargado con antelación, nunca "en vivo".

---

## 8. Riesgos para una demo en vivo y mitigaciones

Ordenados por probabilidad × impacto en el escenario "presentación de venta en el taller del cliente".

| # | Riesgo | Probabilidad | Cómo se manifiesta | Mitigación |
|---|---|---|---|---|
| 1 | **No hay internet o el wifi del taller es malo** | Alta | Evento `error` con `error === "network"`, sin resultado parcial | Demo con hotspot propio del celular; **nunca** el wifi del cliente. Detectar `network` y mostrar fallback a teclado en < 1 s |
| 2 | **Se demuestra en un celular/tablet Android** | Alta si el pitch es "en el piso del taller" | `continuous` no hace nada; la sesión se cierra en la primera pausa | **No demostrar el dictado en Android.** Si es inevitable, diseñar el flujo como "una frase por toque", no dictado continuo |
| 3 | **Se demuestra sobre una PWA instalada en iPhone** | Alta si el pitch incluye "instálala como app" | La API no arranca en modo pantalla de inicio (bug 225298) | Demostrar en **Safari con pestaña normal**. Verificar en el dispositivo real el día anterior |
| 4 | **El usuario tarda más de 8 s en empezar a hablar** | Alta | `error: "no-speech"` a los 8 s | Arrancar `start()` **en el mismo gesto** en que el presentador va a hablar, no al abrir la pantalla. Reiniciar automáticamente al recibir `no-speech` |
| 5 | **Pausa de más de 15 s mientras se piensa el diagnóstico** | Alta | La sesión se cierra sola (`end`) en Chrome | Watchdog que reinicia `start()` al recibir `end` sin que el usuario haya pulsado Detener, acumulando el texto en el textarea |
| 6 | **La página reproduce audio o vídeo antes del dictado (iOS)** | Media | El reconocimiento muere **sin ningún evento** ([bug 321436](https://bugs.webkit.org/show_bug.cgi?id=321436)) | No poner vídeos en el flujo de la demo. Watchdog por *timeout* (si no llega `result` ni `error` en N segundos, reiniciar). **No confiar en `onerror`** |
| 7 | **Siri/Dictado desactivados en el Mac o iPhone del cliente** | Media | `error: "service-not-allowed"` | Checklist previo al equipo con el que se demuestra. Copy de error explícito: "activa Dictado en Ajustes" |
| 8 | **Laptop corporativa con Edge y política `SpeechRecognitionEnabled = 0`** | Media | La API no funciona, sin diagnóstico posible desde JS | Llevar **el propio equipo** a la demo |
| 9 | **La demo se sirve por `http://` en la LAN del taller** | Media | La API no existe (Chrome y Safari 26+ exigen origen seguro) | HTTPS siempre, o `localhost` |
| 10 | **Se usa `lang = "es-CR"` en un iPhone** | Alta si no se corrige | `service-not-allowed` en Safari, funciona en Chrome | Usar **`es-MX`** como locale único multiplataforma |
| 11 | **Chrome actualiza y desactiva la ruta on-device** | Baja pero demostrada | `available()` devuelve `unavailable`; con `processLocally` la sesión no arranca | No apoyar la demo en `processLocally`. Verlo como mejora futura, no como base |
| 12 | **Detección de soporte con `'webkitSpeechRecognition' in window`** | Alta (error de implementación) | Falso positivo en Chrome/Edge/Firefox de iOS → la UI ofrece dictado que nunca funciona | Detectar por **resultado del primer intento**, no por presencia del constructor |
| 13 | **Android sin servicios de Google** (Huawei, ROM, app de Google desactivada) | Baja-media | La API simplemente no existe | Feature detection real + fallback a teclado |
| 14 | **En Android, cambiar de app o que se apague la pantalla** | Alta en un taller | La sesión muere y **no se recupera al volver**; hay que llamar `start()` otra vez | Detectar `visibilitychange` y reiniciar explícitamente |
| 15 | **Otra app del teléfono tiene ocupado el reconocedor** | Media | Llega `not-allowed`, **indistinguible de "el usuario negó el micrófono"** | No mostrar el mensaje "activa el micrófono" ante `not-allowed` en Android; usar un texto neutro y ofrecer reintentar |
| 16 | **Se exige `processLocally` para "funcionar sin internet"** | Media | El único español on-device de Chrome es `es-ES`; con `es-MX` devuelve `unavailable` | Si el requisito real es offline en español latino, la Web Speech API no lo cubre: hay que ir a modelo en cliente (§7) |

**Regla de diseño que se deriva de todo lo anterior:** el dictado debe ser un **acelerador opcional sobre un campo de texto que siempre funciona**, nunca la única vía de captura. Si la demo se cae en el dictado y el presentador puede seguir escribiendo sin fricción, no hay falla de demo. Si el dictado es el camino crítico, cualquiera de los 13 riesgos de arriba mata la presentación.

---

## 9. Incertidumbres — lo que NO se pudo verificar

Estas son las preguntas que quedaron abiertas contra fuentes primarias. Ninguna se resolvió con suposiciones.

1. **No existe ninguna métrica de precisión publicada por Google, Apple ni Microsoft** para el reconocimiento de la Web Speech API en español. Los tres exponen la API y ninguno publica WER. Sólo hay números para modelos abiertos (Whisper, Vosk). Cualquier afirmación sobre "qué tan bien entiende el español la Web Speech API" requiere una prueba propia.
2. **PWA en iOS 26.** La declaración de Apple de que la API no funciona en apps agregadas a pantalla de inicio es de 2021 y el bug sigue abierto. Un reportante de agosto de 2026 sugiere que en iOS 26 ya arranca en modo standalone, pero no hay confirmación de Apple. **Hay que probarlo en un iPhone real.**
3. **Cuota diaria de reconocimientos por dispositivo en Apple.** Apple dice que existe pero nunca publica el número. Tampoco documenta si aplica al reconocimiento on-device.
4. **Locales de la ruta en la nube de Edge.** Microsoft documenta los seis idiomas del modelo local, pero no la lista de locales de Azure Cognitive Services que usa el camino por defecto.
5. **Vigencia del tope de 60 s del servidor de Google.** Confirmado oficialmente en 2013 por un ingeniero de Chromium; no hay forma de auditar si sigue vigente hoy, porque vive en el servidor. Sí está verificado que, de ocurrir, se manifiesta como error `network`.
6. **Throttling antiabuso del endpoint de Google.** Está desmentido el mito de las 50 peticiones/día (aplica a builds propios de Chromium), pero **no hay documento público que descarte límites por IP o por volumen**. Tampoco hay SLA ni términos de servicio para uso comercial.
7. **Discrepancia entre el código y los reportes en escritorio.** El código dice 15 s de silencio en modo continuo; [crbug 40786350](https://issues.chromium.org/issues/40786350) reporta cortes a los 3–4 s, reproducidos por un ingeniero de Chromium en cuatro canales, y sigue abierto. No se pudo determinar cuál es el comportamiento efectivo en Chrome 154.
8. **Latencia real** de Whisper en el navegador. Ni Hugging Face ni ONNX Runtime publican cifras de latencia o RTF; hay que medirlo en el equipo concreto de la demo.
9. **Límite de memoria de una pestaña de Safari iOS** para modelos de 200 MB o más. No está documentado por Apple. Riesgo abierto para la ruta Whisper en iPhone.
10. **Chrome Android sin servicios de Google.** El código deja claro que la API se deshabilita, pero no se probó en un dispositivo real (Huawei o similar).
11. **caniuse contra Microsoft en el punto de Edge.** caniuse dice que los eventos no se disparan; Microsoft documenta soporte desde Edge 87 con backend Azure. Se optó por la documentación de Microsoft, pero **no se verificó ejecutando Edge**.
12. **Ninguna afirmación de este documento se verificó ejecutando código.** Todo es investigación documental contra fuentes primarias. Antes de comprometer el alcance del dictado hay que hacer una prueba de humo en los dispositivos concretos de la demo.

---

## 10. Fuentes

**Especificación y datos de compatibilidad**

- Web Speech API — *Draft Community Group Report*, 10 ago 2026: https://webaudio.github.io/web-speech-api/
- MDN `browser-compat-data`, `api/SpeechRecognition.json`: https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json
- MDN, *Using the Web Speech API*: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
- MDN, `SpeechRecognition`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- caniuse, *Speech Recognition API*: https://caniuse.com/speech-recognition

**Chromium / Chrome**

- `content/browser/speech/network_speech_recognition_engine_impl.cc` (endpoint de Google, anotación de tráfico): https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/network_speech_recognition_engine_impl.cc
- `content/browser/speech/speech_recognizer_impl.cc` y `.h` (timeouts de 8 s y 15 s): https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/speech_recognizer_impl.cc
- `content/browser/speech/speech_recognition_manager_impl.cc` (selección de motor, `UseOnDeviceSpeechRecognition`): https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/speech_recognition_manager_impl.cc
- `SpeechRecognitionImpl.java` (proveedor de Google obligatorio en Android, `DICTATION_MODE`): https://chromium.googlesource.com/chromium/src/+/main/content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java
- `components/soda/constants.cc` (idiomas del motor on-device SODA): https://chromium.googlesource.com/chromium/src/+/main/components/soda/constants.cc
- `media/base/media_switches.cc` (`kOnDeviceWebSpeech` desactivado en ChromeOS): https://chromium.googlesource.com/chromium/src/+/main/media/base/media_switches.cc
- `third_party/blink/renderer/modules/speech/speech_recognition.idl` (superficie de API real): https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/speech/speech_recognition.idl
- crbug 41297427 — *continuous no funciona en Android*, abierto desde 2017: https://issues.chromium.org/issues/41297427
- crbug 40786350 — *Continuously listening to speech doesn't work* (escritorio), abierto: https://issues.chromium.org/issues/40786350
- crbug 444393111 — *on-device deshabilitado hasta Chrome 142*, cerrado como *Intended behavior*: https://issues.chromium.org/issues/444393111
- blink-dev, *Intent to Ship: On-device Web Speech API* (tamaño del pack, plataformas): https://groups.google.com/a/chromium.org/g/blink-dev/c/VNOok2dbmHM
- chromium-html5, Glen Shires sobre el timeout de 60 s (2013): https://groups.google.com/a/chromium.org/g/chromium-html5/c/s2XhT-Y5qAc
- chromium-dev, sobre la cuota de 50 req/día y la Web Speech API: https://groups.google.com/a/chromium.org/g/chromium-dev/c/TJRsxtxkB_Y
- Chrome for Developers, *New in Chrome 139*: https://developer.chrome.com/blog/new-in-chrome-139
- Chrome Platform Status: [On-device Web Speech API](https://chromestatus.com/feature/6090916291674112) · [contextual biasing](https://chromestatus.com/feature/5225615177023488) · [Remove insecure usage](https://chromestatus.com/feature/5639479519870976) · [Web Speech API (input)](https://chromestatus.com/feature/5908775487668224)
- Tabla de idiomas de la demo oficial de Chrome: https://www.google.com/intl/en/chrome/demos/speech.html

**Apple / WebKit**

- `Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm` (límite de 1 h, preferencia on-device): https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm
- WebKit blog, *New WebKit Features in Safari 14.1* (requiere Siri): https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/
- WebKit blog, *WebKit Features in Safari 26.0* (contexto seguro, WebGPU): https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- bugs.webkit.org: [225298](https://bugs.webkit.org/show_bug.cgi?id=225298) (PWA/SafariViewController) · [239816](https://bugs.webkit.org/show_bug.cgi?id=239816) (WKWebView) · [321436](https://bugs.webkit.org/show_bug.cgi?id=321436) (muere tras reproducir audio) · [288963](https://bugs.webkit.org/show_bug.cgi?id=288963) (continuous + interim) · [296557](https://bugs.webkit.org/show_bug.cgi?id=296557)
- Apple, `SFSpeechRecognizer`: https://developer.apple.com/documentation/speech/sfspeechrecognizer
- Apple, `supportedLocales()`: https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportedlocales()
- Apple, Technical Q&A QA1951 (1000 peticiones/hora por dispositivo): https://developer.apple.com/library/archive/qa/qa1951/_index.html
- Apple, *iOS Feature Availability* — sección Dictation (locales de español): https://www.apple.com/ios/feature-availability/#dictation
- Apple, *Ask Siri, Dictation & Privacy*: https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/
- App Store Review Guidelines §2.5.6 (todos los navegadores en iOS usan WebKit): https://developer.apple.com/app-store/review/guidelines/

**Microsoft / Edge**

- *Convert speech to text with the SpeechRecognition API*: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api
- Política `SpeechRecognitionEnabled` (backend Azure, plataformas soportadas): https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/speechrecognitionenabled

**Alternativas en cliente**

- Radford et al., *Robust Speech Recognition via Large-Scale Weak Supervision*, arXiv:2212.04356 (apéndice D.2): https://arxiv.org/abs/2212.04356 · [HTML](https://arxiv.org/html/2212.04356v1)
- transformers.js: https://github.com/huggingface/transformers.js
- whisper.cpp: https://github.com/ggml-org/whisper.cpp
- vosk-browser: https://github.com/ccoreilly/vosk-browser
- Modelos y WER de Vosk: https://alphacephei.com/vosk/models
- Adaptación de vocabulario en Vosk: https://alphacephei.com/vosk/adaptation
- `distil-whisper/distil-small.en` (sólo inglés): https://huggingface.co/distil-whisper/distil-small.en
- `moonshine-ai/moonshine-base` (sólo inglés): https://huggingface.co/moonshine-ai/moonshine-base
- ONNX Runtime Web, *env flags and session options* (multihilo y `crossOriginIsolated`): https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html
- caniuse, WebGPU: https://caniuse.com/webgpu
