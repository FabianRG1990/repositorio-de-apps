# Arquitectura de datos y persistencia offline para Bitácora

> Investigación del ticket [#24](https://github.com/FabianRG1990/repositorio-de-apps/issues/24) (mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14)).
> Fecha: 2026-08-18. Investigado **desde cero** contra fuentes primarias: especificaciones (WHATWG Storage, W3C IndexedDB, RFC 9562, RFC 9110), documentación oficial de Angular, NgRx, Dexie, RxDB y SQLite, el registro de npm, la API de GitHub y el **código instalado en `node_modules` de este mismo monorepo**.
> **No hereda decisiones de `apps/bahia`.** El patrón vigente en esa app se audita en §7 como una candidata más, con la evidencia que se pudo verificar leyendo su código.

## Pregunta

¿Qué arquitectura de datos y persistencia debe usar una app **Angular** que corre sin backend, tiene que **funcionar offline** (abrir, ver y crear registros sin conexión, con guardado local durable y sincronización posterior), y debe dejar una **costura limpia** hacia un backend real futuro?

Cuatro ejes: (1) el almacén local en el navegador, (2) el estado en Angular, (3) el shell offline, (4) la costura de sincronización.

---

## Resumen ejecutivo

1. **El requisito "abrir sin conexión" y el requisito "guardar sin conexión" son dos problemas independientes, y sólo uno de los dos está resuelto hoy en el monorepo.** Guardar datos localmente lo resuelve IndexedDB; **cargar la app sin red lo resuelve únicamente un service worker**, y en este repo **no existe ninguno**: no hay `ngsw-config.json`, ni `manifest.webmanifest`, ni la opción `serviceWorker` en ningún `project.json`. Sin esa pieza, una app con IndexedDB perfectamente poblada muestra el dinosaurio del navegador al recargar sin red. Es la brecha más grande y también la más barata de cerrar.

2. **El modelo de datos que ya fijó la investigación de placa vs. VIN exige consultas reales, no un key-value.** [`placa-vs-vin-costa-rica.md`](./placa-vs-vin-costa-rica.md) fija `id` sintético como PK, **historial de placa con vigencia** (`{vehiculoId, placa, vigenteDesde, vigenteHasta}`), `UNIQUE(tallerId, placa) WHERE vigenteHasta IS NULL`, relación cliente↔vehículo con rango temporal, y **fusión de vehículos**. Eso son búsquedas por índice compuesto y por rango, no `getAll()` seguido de `.filter()` en JavaScript. **Esto descarta el almacén key-value plano** como opción seria y es el criterio que más pesa en el eje 1.

3. **Un dato incómodo que ninguna base resuelve: IndexedDB no tiene índices únicos parciales.** La especificación sólo ofrece un flag `unique` binario sobre el keyPath ([IndexedDB 3.0](https://w3c.github.io/IndexedDB/)). El `UNIQUE(tallerId, placa) WHERE vigenteHasta IS NULL` **no es expresable como constraint** en IndexedDB, con o sin wrapper. Se tiene que **imponer en código**, lo que a su vez obliga a que todas las escrituras pasen por **un único punto de estrangulamiento** (un repositorio). Esa conclusión es independiente de la librería elegida y es una de las decisiones caras de revertir.

4. **La sospecha del ticket sobre RxDB era correcta, con un matiz que lo hace más interesante de lo esperado.** El core es Apache-2.0, pero **los RxStorage de IndexedDB y OPFS son de pago**: plan Pro, **99 USD/mes facturado anualmente** ([rxdb.info/premium](https://rxdb.info/premium/)). Los storages gratuitos en navegador son Memory, LocalStorage y **Dexie** ([rxdb.info/rx-storage](https://rxdb.info/rx-storage.html)). O sea: RxDB gratis en el navegador es **RxDB (51,0 KB gzip) encima de Dexie encima de IndexedDB**. **El matiz:** la replicación **sí está en el tier gratuito** y es agnóstica del backend. Así que RxDB no es "Dexie con impuesto", es "Dexie más un motor de sincronización gratuito por ~20 KB extra". Aun así se descarta **hoy**, porque sin backend ese motor no sincroniza nada — pero es la primera opción a reconsiderar el día que exista servidor (§6.2).

5. **SQLite WASM sobre OPFS es la opción técnicamente más potente y la peor encajada en este proyecto.** Da SQL real, joins y —lo más relevante— **índices únicos parciales**, justo el constraint que el modelo pide. Pero la documentación oficial impone que **ambos VFS de OPFS corren únicamente en un Web Worker**, y el VFS `opfs` exige además **cabeceras COOP/COEP**; el alternativo `opfs-sahpool` las evita pero **no admite conexiones simultáneas** ([sqlite.org/wasm](https://sqlite.org/wasm/doc/trunk/persistence.md)). Pesa **~555 KB gzip medidos** (18× Dexie). Y hay un costo local decisivo: los tests de este repo corren en **jsdom con `fake-indexeddb`**, que no implementa OPFS. Adoptarlo significa **quedarse sin tests unitarios de la capa de datos** o convertirlos en e2e. Para una demo de venta, es un precio desproporcionado.

6. **En el eje del estado hay un hecho duro que decide la discusión: `@ngrx/signals` no tiene versión estable compatible con Angular 22.** El `latest` de npm es **21.1.1**, cuyo peer es `@angular/core: ^21.0.0`; lo único que soporta v22 es la línea de prelanzamiento, hoy en **22.0.0-rc.0**. Este repo está pineado en **22.0.0-beta.0**, dos prelanzamientos por detrás. No es un error del equipo: es que **en Angular 22, hoy, NgRx SignalStore sólo existe en prerelease**.

7. **Y del otro lado, Angular 22 ya trae en el framework lo que se necesita.** `resource()` es **estable desde v22.0** y su `loader` admite cualquier operación asíncrona, no sólo HTTP ([angular.dev/api/core/resource](https://angular.dev/api/core/resource)). Zoneless es el default desde v21. Simultáneamente, **Angular no publica ninguna guía ni recomendación de state management** — el índice completo de su documentación no tiene la sección. Ninguna autoridad exige un store.

8. **Dexie es el único candidato con documentación oficial de punta a punta para exactamente este caso.** Publica guía de Angular que enseña el patrón con signals — `toSignal(from(liveQuery(() => db.tabla.toArray())), { initialValue: [] })` — y lo justifica por la detección de cambios zoneless ([dexie.org/docs/Tutorial/Angular](https://dexie.org/docs/Tutorial/Angular)). `liveQuery` observa los rangos de índice consultados y **propaga cambios incluso entre pestañas** ([dexie.org/docs/liveQuery()](<https://dexie.org/docs/liveQuery()>)). Ninguna librería de estado publica un patrón equivalente para respaldo en base local.

9. **El service worker de Angular está congelado, y aun así es la elección correcta.** La primera línea de su documentación dice literalmente: _"We will not be accepting any new features other than security fixes"_ ([angular.dev/ecosystem/service-workers](https://angular.dev/ecosystem/service-workers)). Es un techo real. Pero (a) el `ngsw-config.json` por defecto ya precachea `index.html`, `/*.css` y `/*.js` en modo `prefetch`, que es exactamente el requisito "que la app cargue offline"; (b) `@angular/build:application` — el builder que este repo ya usa — acepta `serviceWorker: <ruta>` como opción nativa; y (c) Angular documenta cómo extenderlo con `importScripts('./ngsw-worker.js')` si algún día hace falta. **Workbox es la única alternativa viable, pero no tiene punto de enganche en el builder de Angular 22** (Vite es sólo dev-server y "cannot be directly configured"), así que exigiría un script post-build propio. No se justifica hoy.

10. **La costura hacia el backend no se construye: se reserva.** Cuesta casi nada dejarla lista el día uno y es carísima de retrofittear. Cinco decisiones de esquema, todas verificables contra fuentes primarias: **IDs UUIDv7 generados en cliente** (RFC 9562 §6.11: _"Time-ordered monotonic UUIDs benefit from greater database-index locality"_, frente a la _"poor database-index locality"_ de v4 en §2.1 — y ojo, `crypto.randomUUID()` **sólo emite v4**); **borrado lógico con tombstone**, porque el propio protocolo de replicación de RxDB exige que _"documents are never deleted, instead the `_deleted` field is set to `true`"_; **`actualizadoEn` + `id` como orden determinista** de última escritura; **`tallerId` en toda fila desde el principio**; y una **tabla outbox** escrita en la _misma transacción_ que la entidad — algo que IndexedDB permite porque sus transacciones abarcan varios object stores.

11. **Lo que NO hay que construir en la fase 1:** resolución de conflictos, relojes lógicos, CRDTs, y drenaje por Background Sync. Los conflictos no existen sin servidor y sin segundo dispositivo. Y `SyncManager` **no es Baseline: no existe en Firefox ni en Safari** ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)), así que ni siquiera en el futuro será el mecanismo principal — el drenaje real será código de la app reaccionando a `online`. Se deja **comentado en el código** cuál sería la implementación completa, según el criterio de recortes del proyecto.

12. **Recomendación: candidata A — Dexie 4 + signals planos + `@angular/service-worker`, con outbox y esquema listo para sincronizar** (§5.1, §6 y §9). Es la única combinación donde cada pieza tiene documentación oficial para el uso exacto que se le va a dar, no exige ninguna dependencia en prerelease, mantiene la capa de datos testeable bajo el `vitest` + `jsdom` + `fake-indexeddb` que ya existe, y cuesta ~32 KB gzip. La alternativa seria es la candidata B (`idb` + SignalStore), que ahorra 30 KB y paga con índices manuales, prerelease de NgRx y trabajo de reactividad hecho a mano.

---

## Convención de confianza de las fuentes

| Etiqueta          | Significado                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `[SPEC]`          | Especificación normativa (WHATWG, W3C, IETF) leída directamente.                                       |
| `[DOCS]`          | Documentación oficial del proyecto que es autoridad sobre el hecho.                                    |
| `[CÓDIGO]`        | Código fuente leído — del repo upstream o de `node_modules` de este monorepo. La evidencia más fuerte. |
| `[REGISTRO]`      | Registro de npm o API de GitHub, consultados el 2026-08-18.                                            |
| `[MEDICIÓN]`      | Medición ejecutada durante esta investigación (bundlephobia, lectura del repo).                        |
| `[NO CONFIRMADO]` | No se pudo verificar. **No usar como base de decisión.**                                               |

**Nota metodológica.** El presupuesto de búsqueda web de la sesión se agotó (200/200) a mitad del trabajo. El efecto fue positivo para el rigor — obligó a ir a URLs canónicas, a la API de GitHub, al registro de npm y al código instalado, en vez de a resúmenes — y negativo para el descubrimiento de fuentes que no se conocían de antemano. Está marcado dónde quedó un hueco (§10).

---

## Restricciones de entrada

No son hallazgos de esta investigación; son condiciones que vienen dadas y que acotan el espacio de soluciones.

| Restricción                                                                                            | Origen                                                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| La demo de fase 1 corre en **escritorio con internet**, un solo taller sembrado, sin backend ni login. | Mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14) |
| Aun así la app **debe servir offline**: abrir, ver y crear órdenes sin conexión.                       | Mapa #14                                                                  |
| El modelo deja **`taller_id`** listo para multi-tenant futuro, sin construir la UI de selección.       | Mapa #14                                                                  |
| **Economizar en lo que no se note en la demo**, dejando comentada la implementación completa correcta. | Criterio de recortes del proyecto                                         |
| Vehículo con **`id` sintético como PK**; placa **mutable e historiada**; hace falta **fusión**.        | [`placa-vs-vin-costa-rica.md`](./placa-vs-vin-costa-rica.md) §10          |
| Monorepo Nx **23.1.0**, Angular **22.0.4**, TypeScript **6.0.3**, Vitest **4**, yarn **4.14.1**.       | `package.json` `[CÓDIGO]`                                                 |
| Los tests corren en **jsdom** con **`fake-indexeddb/auto`**.                                           | `apps/bahia/src/test-setup.ts` `[CÓDIGO]`                                 |

La cuarta y la quinta filas están en tensión, y resolverla es buena parte del trabajo de este documento: el modelo de datos es genuinamente complejo (historial temporal, fusión de entidades, multi-tenant) pero la demo no puede pagar una infraestructura proporcional a esa complejidad.

---

## 1. Eje 1 — Persistencia local en el navegador

### 1.1 Durabilidad real: cuándo evicta el navegador

Esta es la pregunta que decide si "guardado local durable" es verdad o es marketing. La respuesta corta: **por defecto, no es durable**, y hay una llamada de una línea que lo cambia.

El **Storage Standard** de WHATWG `[SPEC]` define dos modos de bucket ([storage.spec.whatwg.org](https://storage.spec.whatwg.org/)):

- El modo inicial es **`"best-effort"`** (§4.5).
- Un bucket pasa a **`"persistent"`** sólo si se concede el permiso `"persistent-storage"`, y entonces _"the user agent cannot clear storage marked as persistent without involvement from the origin or user"_ (§5).
- Bajo presión de almacenamiento, el agente debe _"clear network state and local storage buckets whose mode is `'best-effort'`"_ (§7.1). Los buckets persistentes sólo se ofrecen al usuario si la presión continúa.

`navigator.storage.persist()` pide ese permiso; `persisted()` consulta el estado (§8). MDN confirma que es **Baseline desde diciembre de 2021**, que **exige contexto seguro (HTTPS)** y que —detalle importante— **no está disponible en Web Workers** ([MDN `StorageManager.persist`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)).

Cómo se concede, por navegador `[DOCS]` ([MDN, cuotas y criterios de expulsión](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)):

| Navegador       | Cuota best-effort                      | Cómo concede `persist()`                                                                                                | Expulsión proactiva                                                                    |
| --------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Chrome/Edge** | Hasta **60 %** del disco               | **Sin prompt**, por heurísticas: nivel de interacción, **si está instalada o en marcadores**, permiso de notificaciones | LRU sólo bajo presión de disco                                                         |
| **Firefox**     | El menor entre 10 % del disco y 10 GiB | **Muestra un prompt** al usuario                                                                                        | LRU bajo presión                                                                       |
| **Safari**      | ~60 % del disco (macOS 14 / iOS 17+)   | Sin prompt, por historial de interacción; WebKit cita _"whether the website is opened as a Home Screen Web App"_        | **Borra el almacenamiento creado por scripts tras 7 días sin interacción del usuario** |

El caso de Safari es el más severo y merece las citas textuales. El anuncio original de WebKit `[DOCS]` ([webkit.org/blog/10218](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)) fija la regla y su alcance: el borrado ocurre _"after seven days of Safari use without user interaction on the site"_, y la lista incluye _"Indexed DB, LocalStorage, Media keys, SessionStorage"_ más _"Service Worker registrations and cache"_. La interacción que resetea el contador es un clic, toque o entrada de teclado — **hacer scroll no cuenta**.

**La exención confirmada es la instalación como app de pantalla de inicio**, y WebKit la enuncia dos veces: esas apps _"not part of Safari"_ llevan su propio contador y _"We do not expect the first-party in such a web application to have its website data deleted."_

> ⚠️ **Contradicción entre dos fuentes primarias, sin resolver.** El post de política de almacenamiento de 2023 dice que un origen queda excluido de la expulsión _"if it has active page at the time of eviction, **or its storage is in persistent mode**"_ ([webkit.org/blog/14403](https://webkit.org/blog/14403/updates-to-storage-policy/)) — lo que implicaría que `persist()` protege del corte de 7 días. **MDN afirma lo contrario**: que la expulsión proactiva de Safari _"applies regardless of persistent vs. best-effort mode"_. No se encontró ninguna fuente de WebKit posterior a agosto de 2023 que zanje el punto. **Conclusión defensiva: tratar la instalación en pantalla de inicio como la única exención verificada, y no confiar en que `persist()` baste en iOS.**

Y un matiz que evita el pánico, del propio MDN: cuando una expulsión ocurre, **se borra todo el origen de una vez** (IndexedDB, Cache API, OPFS) para no dejar estados inconsistentes; pero _"Research from the Chrome team shows that data is very rarely deleted by the browser."_

> **Una nota sobre lo que NO se pudo confirmar, porque circula como verdad:** no existe fuente primaria de una regla de borrado a los 7 días en **Firefox** para orígenes de primera parte. MDN atribuye esa regla **sólo a Safari**. Lo que Mozilla sí documenta es un barrido cada 24 h de dominios **clasificados como rastreadores**, con excepción de 45 días si hubo interacción directa. **No aplica a una app de primera parte.**

> **Implicaciones de diseño, todas baratas:**
>
> 1. Llamar a `navigator.storage.persist()` al arrancar y **registrar el resultado**. Son tres líneas. En Firefox conviene pedirlo tras un gesto del usuario y con contexto en pantalla, no en el arranque en frío — un prompt sin explicación se deniega por reflejo.
> 2. **Instalar la PWA no es cosmético: es lo que compra la durabilidad.** La concesión en Chrome depende de _"installed or bookmarked"_ y en WebKit de _"opened as a Home Screen Web App"_. Eso conecta el eje 1 con el eje 3.
> 3. Detectar en el arranque que **el almacenamiento fue borrado** (un marcador de esquema que ya no está) y ofrecer recuperación, en vez de mostrar una app vacía como si nada hubiera pasado.
> 4. **La verdadera red de seguridad es la exportación a fichero**, porque ninguna política de expulsión puede tocar un archivo que el usuario guardó. Ojo con la API: `showSaveFilePicker()` está marcada por MDN como _"not Baseline… does not work in some of the most widely-used browsers"_, así que la exportación debe hacerse con `Blob` + `<a download>`, no con File System Access.
>
> Para la demo de fase 1 (escritorio, con internet, sesión corta) el riesgo real es cercano a cero. Para un taller usando la app de verdad durante meses en un iPad, la diferencia entre `best-effort` y `persistent` es la diferencia entre conservar y perder el historial.

### 1.2 Por qué no `localStorage`

Descartado sin discusión, con tres razones de especificación: **es síncrono** (bloquea el hilo principal en cada escritura), **almacena sólo strings**, y el tope combinado es de **10 MiB por origen** (5 de `localStorage` + 5 de `sessionStorage`), lanzando `QuotaExceededError` al pasarse `[DOCS]` ([MDN, cuotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). Sin índices y sin consultas, cualquier búsqueda es leer y parsear todo. No sirve para registros estructurados.

### 1.3 Lo que IndexedDB da y lo que no

`[SPEC]` [IndexedDB 3.0, Editor's Draft](https://w3c.github.io/IndexedDB/) (13 de agosto de 2025):

- **Transacciones multi-store**: el _scope_ de una transacción es _"a set of object stores that the transaction may interact with"_. **Esto es lo que hace posible el patrón outbox en el navegador** (§4.2): escribir la entidad y su operación pendiente atómicamente.
- **Durabilidad configurable**: `strict` (verifica escritura a disco), `relaxed` (basta con los buffers del SO) y `default`. La guía de la spec: usar `relaxed` para caché y datos efímeros, y `strict` _"in cases where reducing the risk of data loss outweighs the impact to performance"_.
- **Índices y keyPaths compuestos**: soportados, incluyendo rutas con puntos.
- **NO hay índices únicos parciales ni condicionales.** Sólo existe un flag `unique` binario sobre el keyPath. Es una limitación de la plataforma, **no de ninguna librería**.

Ese último punto es el hallazgo estructural del eje. El modelo de placa exige `UNIQUE(tallerId, placa) WHERE vigenteHasta IS NULL`. **Ninguna opción basada en IndexedDB —cruda, `idb`, Dexie o RxDB— puede expresarlo declarativamente.** Sólo SQLite lo haría (con un índice parcial de SQL). La consecuencia práctica es que la unicidad se valida en código, y por tanto **todas las escrituras deben pasar por un único punto**, que es justamente lo que un repositorio aporta.

### 1.4 Comparativa de opciones

Datos de npm y GitHub consultados el 2026-08-18 `[REGISTRO]`; tamaños de bundlephobia `[MEDICIÓN]`.

| Opción                 | Versión         | Licencia                                 | gzip             | Consultas / índices                                              | Mantenimiento                       | Sincronización                                                 | Veredicto                                              |
| ---------------------- | --------------- | ---------------------------------------- | ---------------- | ---------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **IndexedDB crudo**    | IDB 3.0 (ED)    | —                                        | **0 KB**         | Índices y rangos; API por eventos, verbosa                       | Plataforma                          | Nada; todo a mano                                              | Base de todo, pero no se usa directo                   |
| **`idb`**              | 8.0.3           | ISC                                      | **1,5 KB**       | Los de IndexedDB, envueltos en promesas                          | **Sin releases desde 2025-05-07**   | Nada                                                           | Viable y mínimo; todo lo demás es tuyo                 |
| **Dexie.js**           | **4.4.5**       | **Apache-2.0**                           | **31,1 KB**      | Esquema declarativo, **índices compuestos**, rangos, `liveQuery` | **Muy activo** (release 2026-08-14) | `liveQuery`; guía Angular oficial. Sin ruta OSS de sync propia | **Recomendado**                                        |
| **RxDB**               | 17.4.0          | Apache-2.0 (core)                        | 51,0 KB          | Consultas tipo Mongo, esquema JSON                               | Muy activo                          | **Replicación gratuita** y agnóstica del backend               | Storages rápidos **de pago**; reconsiderar con backend |
| **SQLite WASM (OPFS)** | 3.53.0-build1   | Apache-2.0 / dominio público             | **~555 KB**      | **SQL real**: joins, FK, **índices únicos parciales**            | Oficial del proyecto SQLite         | A mano                                                         | Potente; **desencajado** (ver §1.6)                    |
| **PGlite**             | 0.5.5           | Apache-2.0                               | **~5,44 MB**     | Postgres 18.3 completo                                           | Activo pero **alpha**               | Vía Electric (servidor)                                        | Descartado por peso; OPFS roto en Safari               |
| **`wa-sqlite`**        | GitHub 1.1.2    | MIT                                      | —                | SQL, todos los VFS sin COOP/COEP                                 | Activo (2026-08-11)                 | A mano                                                         | **npm congelado en 1.0.0**: habría que vendorizar      |
| **`sql.js`**           | 1.14.2          | MIT                                      | ~322 KB          | SQL, **sólo en memoria**                                         | Activo                              | Ninguna                                                        | No persiste por sí solo                                |
| **`absurd-sql`**       | 0.0.54          | sin campo de licencia                    | —                | SQL sobre IndexedDB                                              | **Abandonado** (2021/2023)          | —                                                              | Descartado                                             |
| **Triplit**            | 1.0.50          | **AGPL-3.0-only**                        | —                | Consultas relacionales + sync                                    | **Dormido ~12 meses**               | Integrada                                                      | **Copyleft en código que va al navegador**: bloqueante |
| **Electric**           | 1.5.26          | Apache-2.0                               | —                | **Sin almacén local propio**                                     | Activo                              | Sólo lectura, exige Postgres + servicio                        | No aplica sin backend                                  |
| **PowerSync**          | web 2.2.0       | cliente Apache-2.0, **servicio FSL-1.1** | —                | SQLite real                                                      | Activo                              | Integrada                                                      | Exige servicio + base de origen                        |
| **Evolu**              | 8.2.0           | **MIT** (relay incluido)                 | —                | SQLite + Kysely                                                  | Activo                              | **Relay MIT autoalojable**                                     | Única sync 100 % libre; **2,2 k descargas/sem**        |
| **Automerge / Yjs**    | 3.4.1 / 13.6.32 | MIT                                      | ~1,54 MB / 28 KB | CRDT, **sin consultas**                                          | Activos                             | CRDT                                                           | Resuelven un problema que no tenemos (§4.4)            |
| **TinyBase**           | 9.5.1           | MIT                                      | 16,6 KB          | Consultas reales, pero **todo en RAM**                           | Activo                              | Adaptadores                                                    | Persiste como blob JSON: no escala                     |
| **`@signaldb/core`**   | 1.8.1           | MIT                                      | 41,0 KB          | Selectores tipo Mongo, **en RAM**                                | Activo                              | Adaptadores                                                    | ~1,9 k descargas/sem: bus factor                       |

#### RxDB: la verificación de licencia que pedía el ticket

Confirmado, y es más matizado de lo que sugiere el titular. El `LICENSE.txt` del repo es **Apache-2.0** `[CÓDIGO]`, pero la matriz de storages `[DOCS]` ([rxdb.info/rx-storage](https://rxdb.info/rx-storage.html)) separa:

- **Gratis**: core (esquemas, consultas, hooks), **replicación y sync en tiempo real**, y los storages Memory, LocalStorage, **Dexie.js**, MongoDB, DenoKV, FoundationDB.
- **Premium**: **IndexedDB**, **OPFS**, SQLite, Filesystem, Worker, SharedWorker, Sharding, Memory-Mapped, optimizador de metadatos, cifrado WebCrypto y búsqueda de texto completo.

La página de precios `[DOCS]` ([rxdb.info/premium](https://rxdb.info/premium/)) sitúa _RxStorage IndexedDB_ y _RxStorage OPFS_ en el plan **Pro, 99 USD/mes facturado anualmente** (sin opción mensual ni prueba gratuita); el plan **Pro Plus, 239 USD/mes**, añade Worker, SharedWorker y Sharding. El paquete `rxdb-premium` de npm es un **placeholder que no se puede instalar**: el acceso real es por GitHub con token.

La recomendación de la propia documentación para navegador lo remata: _"use either the dexie.js storage (free) or the IndexedDB RxStorage if you have premium access"_.

**Lectura correcta, y conviene ser preciso porque es fácil quedarse con la mitad:** lo que cuesta dinero es el **rendimiento** (acceso nativo a IndexedDB/OPFS, y sacar la base a un Worker), no la sincronización. **La replicación es gratuita y agnóstica del backend** — RxDB documenta que _"the complex parts are in RxDB, not in the Backend"_ ([rxdb.info/replication](https://rxdb.info/replication.html)). Por tanto RxDB gratis en navegador = Dexie por debajo + un motor de sync completo por ~20 KB gzip adicionales.

**Se descarta hoy** porque sin backend ese motor no replica nada y sólo se pagaría el peso. **Pero es la primera candidata a reconsiderar cuando exista servidor**, y esa es una conclusión distinta de "RxDB es de pago, descartado".

#### La otra cara: Dexie no tiene ruta libre de sincronización propia

Simétricamente, hay que decir lo que le falta a la recomendada. `dexie-observable` y `dexie-syncable` —los add-ons que permitirían escribir un backend propio— **están congelados en `4.0.1-beta.13` desde 2023-01-17 y nunca llegaron a estable**; `dexie-syncable` tiene **204 descargas semanales**. El propio README de Dexie los declara: _"⚠️ These packages are legacy and no longer maintained… **deprecated**… should not be used in new projects. For local-first sync, use `dexie-cloud-addon` instead."_ `[CÓDIGO]`

Y Dexie Cloud es producto comercial: el cliente es Apache-2.0, pero **el servidor es propietario**, con una licencia que no es OSI (_"Do whatever you like with the software as long as you do not compete with Dexie Cloud"_). Precios: SaaS gratis limitado a **3 usuarios de producción**, Pro a 0,12 €/usuario/mes, y on-premises **3.495 € (binario)** o **7.995 € (con código fuente)**, pago único `[DOCS]` ([dexie.org/cloud/pricing](https://dexie.org/cloud/pricing)).

**Consecuencia práctica, y es la razón por la que el eje 4 se diseña como se diseña:** con Dexie, la sincronización futura contra un backend propio **se escribe a mano**. Por eso importa tanto que el esquema y el outbox estén bien puestos desde el día uno — no hay librería gratuita que los rescate después. Las alternativas libres si eso pesara demasiado son **RxDB** (replicación gratis) o **Evolu** (MIT, relay autoalojable, pero sólo ~2,2 k descargas semanales).

#### Verificación de licencia de Dexie

Dado que el ticket pedía revisar licencias con cuidado, se verificó también la de la recomendada: el `LICENSE` de Dexie es Apache-2.0 verbatim, `package.json` y `NOTICE` coinciden, y **el fichero `LICENSE` tiene un único commit en toda su historia: _"Initial commit"_, 2014-02-26** `[CÓDIGO]`. Doce años sin tocarse. **Sin doble licencia, sin relicenciamiento a BSL/SSPL, sin cláusulas comerciales.**

### 1.5 Dexie frente a `idb`: la comparación real

Es la decisión de fondo del eje, porque son las dos opciones sanas. La diferencia es **30 KB gzip contra trabajo manual y reactividad**.

Lo que Dexie aporta y hay que escribir a mano con `idb`:

- **Esquema e índices declarativos.** `version(1).stores({ vehiculos: 'id, tallerId, [tallerId+placa]' })` frente a orquestar `createObjectStore` y `createIndex` dentro de `onupgradeneeded`.
- **Índices compuestos con consultas de rango** `[DOCS]` ([dexie.org/docs/Compound-Index](https://dexie.org/docs/Compound-Index)): `where('[tallerId+placa]').equals([t, p])`, y **índices virtuales** que permiten consultar por las partes iniciales de un índice compuesto. La limitación documentada: _"Only the leading parts of a compound index can be used alone - never the trailing parts"_ — lo que obliga a diseñar el orden de las columnas del índice pensando en las consultas.
- **`liveQuery`** `[DOCS]` ([dexie.org/docs/liveQuery()](<https://dexie.org/docs/liveQuery()>)): rastrea qué rangos de índice tocó la consulta y la reejecuta cuando una mutación los interseca. _"Mutated rangesets are also broadcast across browsing contexts to wake up liveQueries in other tabs or workers"_ — reactividad **entre pestañas**, gratis. Con `idb` esto no existe: hay que releer manualmente después de cada escritura, y coordinar pestañas con `BroadcastChannel`.
- **Migraciones versionadas con `upgrade()`** `[DOCS]` ([dexie.org/docs/Version/Version.upgrade()](<https://dexie.org/docs/Version/Version.upgrade()>)), transaccionales.

A favor de `idb`: **1,5 KB frente a 31,1 KB**, cero dependencias, y una superficie de API tan pequeña que no hay nada que aprender. En contra: **lleva 15 meses sin release** (8.0.3, 2025-05-07) — no está archivado y es una envoltura fina y esencialmente terminada, así que es defendible, pero es un dato honesto.

**Testabilidad, que en este repo no es un detalle:** `fake-indexeddb` documenta explícitamente el soporte de Dexie — _"If you import `fake-indexeddb/auto` before importing `dexie`, it should work"_ — y pasa 1369 de 1651 tests de Web Platform Tests `[DOCS]` ([github.com/dumbmatter/fakeIndexedDB](https://github.com/dumbmatter/fakeIndexedDB)). El `test-setup.ts` del repo ya hace ese import. **Dexie entra en la infraestructura de tests existente sin tocar nada.**

### 1.6 Por qué SQLite WASM no encaja, aunque técnicamente sea el mejor

Duele descartarlo, porque es el único que expresaría el modelo de datos completo de forma declarativa: `UNIQUE(tallerId, placa) WHERE vigenteHasta IS NULL` es un índice parcial de una línea en SQL, y la fusión de vehículos es un `UPDATE ... SET vehiculo_id = ?` con integridad referencial real.

Los obstáculos, todos de fuente oficial `[DOCS]` ([sqlite.org/wasm](https://sqlite.org/wasm/doc/trunk/persistence.md)):

| Obstáculo               | VFS `opfs`                                                                          | VFS `opfs-sahpool`                                              |
| ----------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Hilo**                | Sólo Worker: _"only available in Worker-thread contexts, not the main UI thread"_   | Sólo Worker                                                     |
| **Cabeceras COOP/COEP** | **Obligatorias** (sin ellas no hay `SharedArrayBuffer` y el VFS no carga)           | **No requeridas** — _"Does not require COOP/COEP HTTP headers"_ |
| **Concurrencia**        | _"no two database handles can have the same OPFS-hosted database open at one time"_ | _"Does not support multiple simultaneous connections"_          |
| **Rendimiento**         | Moderado                                                                            | _"Easily the highest OPFS performance"_                         |
| **Soporte**             | Chromium 2022+, Firefox 111+, Safari 16.4+                                          | Navegadores desde marzo de 2023                                 |

La propia documentación de SQLite orienta la elección: _"clients which value performance more than concurrency, \**or are unable to set the COOP/COEP response headers, should use the 'opfs-sahpool' VFS'"_. Y advierte de entrada: _"⚠️Forewarning: desktop-grade concurrency is not a real thing in browser environments."_

Traducido al proyecto: obliga a montar un Worker y un protocolo de mensajes con la UI (todo el acceso a datos pasa a ser asíncrono y serializado), y a elegir entre cabeceras especiales o una sola conexión. **Peso medido: 400 KB gzip de `sqlite3.wasm` + 155 KB gzip del glue = ~555 KB gzip**, unas 18 veces Dexie.

Hay además un detalle multi-pestaña que suele descubrirse tarde: **IndexedDB es multi-conexión de forma nativa** y `liveQuery` propaga cambios entre pestañas gratis; con SQLite sobre OPFS hay que construir elección de líder o pausado cooperativo. En un taller donde alguien abre dos pestañas, eso deja de ser teórico.

Y el golpe de gracia es local: **OPFS no existe en jsdom**. Los tests del repo corren en jsdom con `fake-indexeddb`, que es un polyfill de IndexedDB, no de OPFS. Adoptar SQLite WASM significa **perder los tests unitarios de la capa de datos** o montar un runner de navegador (Playwright ya está en el repo, pero eso convierte cada test de repositorio en un test e2e). Para una demo de venta cuyo criterio explícito es economizar en lo que no se nota, es un coste desproporcionado.

> **Dos trampas si algún día se adopta:** (a) el README de npm ejemplifica `sqlite3.oo1.OpfsDb`, que es **el VFS que exige cabeceras** — la ruta sin cabeceras (`installOpfsSAHPoolVfs()`) sólo está documentada en `persistence.md` de sqlite.org; (b) el mismo README declara que _"The Worker1 and Promiser1 APIs are, as of 2026-04-15, **deprecated**… their use is actively discouraged"_, y buena parte de los tutoriales que circulan usan Promiser1.

> **Qué se pierde al no elegirlo, dicho claro:** los joins y las constraints declarativas. Con Dexie, la unicidad condicional y la integridad referencial de la fusión de vehículos son **código de aplicación, no garantías del motor**. Es aceptable si —y sólo si— todas las escrituras pasan por un repositorio. Es la razón principal por la que la recomendación insiste en ese punto único de estrangulamiento.

---

## 2. Eje 2 — Estado en Angular 22

### 2.1 Qué recomienda hoy el equipo de Angular: nada, y eso es un dato

Verificaciones sobre angular.dev, que hoy documenta la **v22.1.2** `[DOCS]`:

| API                                  | Estado en v22           | Fuente                                                                           |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------- |
| `signal()`, `computed()`, `effect()` | Estable                 | [angular.dev/guide/signals](https://angular.dev/guide/signals)                   |
| `linkedSignal()`                     | **Estable desde v20.0** | [api/core/linkedSignal](https://angular.dev/api/core/linkedSignal)               |
| **`resource()`**                     | **Estable desde v22.0** | [api/core/resource](https://angular.dev/api/core/resource)                       |
| `httpResource()`                     | Estable desde v22.0     | [api/common/http/httpResource](https://angular.dev/api/common/http/httpResource) |
| Signal Forms (`form()`)              | Estable desde v22.0     | [api/forms/signals/form](https://angular.dev/api/forms/signals/form)             |
| Zoneless                             | **Default desde v21+**  | [angular.dev/guide/zoneless](https://angular.dev/guide/zoneless)                 |

Dos hechos con peso decisorio:

1. **`resource()` sirve para leer de IndexedDB, no sólo de HTTP.** Su `loader` recibe `{ params, previous, abortSignal }` y devuelve una promesa; `httpResource` es una capa aparte en `@angular/common/http`. La documentación advierte que está _"intended for read operations, not operations which perform mutations"_ — o sea: las lecturas se modelan con `resource()`, las escrituras son métodos imperativos. Eso encaja exactamente con una capa de repositorio.

2. **Angular no publica ninguna guía de state management.** El índice completo de la documentación ([angular.dev/llms.txt](https://angular.dev/llms.txt)) no contiene la sección; el style guide no la menciona; el roadmap tampoco. Es una **afirmación negativa con fuente primaria**: no existe ninguna autoridad de Angular que exija, recomiende ni desaconseje una librería de store. La primitiva oficial son signals + inyección de dependencias.

### 2.2 NgRx: el hecho duro es de versiones

`[REGISTRO]` npm, 2026-08-18 — `https://registry.npmjs.org/-/package/@ngrx/signals/dist-tags` devuelve literalmente `{"latest":"21.1.1","next":"22.0.0-rc.0"}`.

| Paquete         | `latest` estable | peer `@angular/core` | `next`          |
| --------------- | ---------------- | -------------------- | --------------- |
| `@ngrx/signals` | **21.1.1**       | **`^21.0.0`**        | **22.0.0-rc.0** |
| `@ngrx/store`   | 21.1.1           | `^21.0.0`            | 22.0.0-rc.0     |

Historial de la major 22: `beta.0` el 2026-07-21, `beta.1` el 2026-08-04, `rc.0` el 2026-08-06. **No existe una 22.0.0 estable.**

Las consecuencias son concretas y no interpretables:

- En Angular 22, **NgRx SignalStore sólo se puede usar en prelanzamiento**. No hay ruta estable. La propia guía de migración de NgRx instruye `ng update @ngrx/store@22.0.0-beta.0` `[DOCS]`.
- Este repo está en `22.0.0-beta.0`, **dos prelanzamientos por detrás de `rc.0`**. Si se sigue esta vía, actualizar a `rc.0` es estrictamente mejor.
- Hay un breaking change relevante en la major 22: las porciones de estado de tipo unión con literales de objeto ahora producen un `DeepSignal` por miembro en vez de un único `Signal` de la unión.
- El subpath `@ngrx/signals/resource` (nuevo en la 22) está **declarado experimental** por el propio equipo: _"its APIs are subject to change... without standard breaking change announcements"_ `[DOCS]`.

Sobre qué recomienda el equipo de NgRx: **no hay una declaración de "SignalStore es el default"**. La página principal presenta _"Learn Global Store"_ y _"Learn SignalStore"_ como dos llamadas de igual peso, y la guía de Store traza la división sin depreciar nada: _"NgRx Store is mainly for managing global state across an entire application. In cases where you need to manage temporary or local component state, consider using NgRx Signals."_ `[CÓDIGO]` (fuente del sitio en `ngrx/platform`). El Store clásico **no está deprecado**.

### 2.3 Alternativas

| Opción                         | Última versión       | Licencia   | Angular 22         | Estado                                                                                                                                                         |
| ------------------------------ | -------------------- | ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Signals planos + servicios** | —                    | —          | ✅                 | 0 KB. Primitiva del framework. Sin convenciones oficiales ni devtools.                                                                                         |
| **`@ngrx/signals`**            | 21.1.1 / 22.0.0-rc.0 | MIT        | ⚠️ sólo prerelease | 2,4 KB gzip (core). Maduro, buen ecosistema.                                                                                                                   |
| **NGXS**                       | **22.0.0**           | MIT        | ✅ **estable**     | 10,9 KB gzip. Decoradores + RxJS; capa de signals encima, no signal-native.                                                                                    |
| **Akita**                      | 8.0.1 (2023-02)      | Apache-2.0 | ❌                 | **Repo archivado. Muerto.**                                                                                                                                    |
| **Elf**                        | 2.5.1 (2024-02)      | MIT        | ❌                 | **Repo devuelve 404.** Descartado.                                                                                                                             |
| **signalstory**                | 21.0.0               | MIT        | ❌ peer `^21`      | Signal-native pero **52 estrellas**. Bus factor inaceptable.                                                                                                   |
| **TanStack Query Angular**     | 5.101.4              | MIT        | ✅                 | _"currently in an experimental stage... breaking changes will happen in minor AND patch releases"_. Además es para _server state_: sin backend pierde sentido. |
| **rx-angular/state**           | 21.1.2               | MIT        | ❌ peer `^21`      | RxJS-first: va contra la dirección zoneless/signals.                                                                                                           |

NGXS es la única alternativa madura **ya estable en Angular 22**, pero paga con decoradores, RxJS y 4,5× el peso de `@ngrx/signals` — dirección contraria a donde va el framework.

### 2.4 El argumento que decide el eje

Si la base de datos local es la **única fuente de verdad** y además es **reactiva** (`liveQuery` re-emite cuando cambian los rangos consultados), entonces la función clásica de un store —mantener una copia en memoria y mantenerla sincronizada— **desaparece**. Lo que queda es:

- **Estado del servidor / persistido** → lo posee Dexie; se lee con `toSignal(from(liveQuery(...)))` o con `resource()`.
- **Estado de UI efímero** (filtros, pestaña activa, borrador del formulario) → `signal()` en un servicio o en el componente.

Ese segundo grupo es exactamente el caso donde la propia guía de NgRx dice _"consider using NgRx Signals"_ o donde bastan signals planos. Para una app de este tamaño, **añadir una dependencia en prerelease para gestionar filtros y pestañas no se sostiene**.

> **Matiz honesto:** un store aporta cosas que los signals planos no dan solos — convenciones uniformes entre entidades, un lugar obvio donde poner la lógica, y devtools. Si el equipo valora la uniformidad por encima de la ligereza, la candidata B es una elección defendible. Lo que **no** es defendible es adoptarla sin saber que hoy no tiene versión estable en Angular 22.

---

## 3. Eje 3 — El shell offline

### 3.1 El estado del repo: no hay nada

`[MEDICIÓN]` Búsqueda en `apps/`: **cero** ficheros `ngsw*`, **cero** `manifest*`, **cero** `service-worker*`; ningún `project.json` menciona `serviceWorker`. **Ninguna app del monorepo carga sin conexión hoy.** Los datos de `apps/bahia` sobreviven a un cierre del navegador, pero la app no arranca sin red. Es la brecha entre "persistencia" y "offline", y conviene no confundirlas.

### 3.2 `@angular/service-worker`: congelado pero suficiente

La primera línea de la documentación oficial `[DOCS]` ([angular.dev/ecosystem/service-workers](https://angular.dev/ecosystem/service-workers)):

> "The Angular Service Worker is a basic caching utility for simple offline support with a limited featureset. **We will not be accepting any new features other than security fixes.** For more advanced caching and offline capabilities, we recommend exploring native browser APIs directly."

No es deprecación —`@angular/service-worker@22.1.2` se publicó el 2026-08-13 `[REGISTRO]` y sigue recibiendo arreglos de seguridad— pero sí es un techo declarado. Aun así, para este requisito alcanza, por tres razones verificadas.

**(a) El `ngsw-config.json` por defecto ya hace exactamente lo que se pide.** Plantilla real leída del repo de angular-cli `[CÓDIGO]`:

```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.csr.html",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/**/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ]
}
```

`index.html` y todos los bundles de JS y CSS se precachean en la instalación, y `navigationUrls` cae por defecto a `index.html` para cualquier ruta profunda de la SPA. **Arranque en frío sin red: sí, de fábrica.**

Con dos huecos que hay que conocer:

- **Las fuentes y las imágenes son `lazy`**: se cachean sólo después de pedirse una vez. Quien nunca vio un icono estando online, no lo tendrá offline. Se arregla pasando ese grupo a `prefetch`, a cambio de una instalación más pesada.
- **Los recursos de otro origen no se cubren.** Los globs sólo alcanzan la salida del build; una fuente de Google Fonts necesita una entrada `resources.urls` explícita. Es el fallo silencioso más común.

**(b) El builder que este repo ya usa lo soporta de forma nativa.** `[CÓDIGO]` En `node_modules/@angular/build/src/builders/application/schema.json`, la opción `serviceWorker` es `oneOf: [string (ruta al ngsw-config.json), false]`, con default `false`. `apps/bahia` construye con `@angular/build:application`, así que habilitarlo es **una línea** en `project.json`.

> ⚠️ **Trampa de monorepo, verificada en el código del builder.** `application/options.js` resuelve la ruta con `path.join(workspaceRoot, ...)` — es decir, **relativa a la raíz del workspace, no del proyecto**. En este repo el valor correcto es `"apps/bitacora/ngsw-config.json"`. Poner `"ngsw-config.json"` a secas resuelve silenciosamente contra la raíz y falla. Nótese además que la opción `ngswConfigPath` de builders antiguos **ya no existe** en este esquema.

**(c) Es extensible pese al congelamiento.** Angular documenta cómo añadir código propio al service worker: crear un fichero que llame `importScripts('./ngsw-worker.js')` como primera instrucción, añadirlo a los assets y registrarlo con `provideServiceWorker('custom-sw.js', ...)` `[DOCS]`. Los casos de uso que la propia documentación menciona incluyen push y **background sync**. Esto importa para la decisión: **el congelamiento no obliga a migrar si algún día hace falta la cola de sincronización en el service worker**.

### 3.3 Workbox: la alternativa, y por qué no hoy

Workbox está vivo —v7.4.1 del 2026-05-04, MIT, 12 979 estrellas, sin archivar `[REGISTRO]`— y es más potente: cinco estrategias de caché, expiración con LRU, `workbox-background-sync`.

El problema es de encaje, no de calidad. Angular declara que _"The usage of Vite in the Angular CLI is currently within a development server capacity only"_ y que Vite _"cannot be directly configured"_ `[DOCS]`. La compilación de producción es esbuild invocado directamente, **sin punto de enganche para plugins**. De ahí:

- **`vite-plugin-pwa` queda cerrado**: no puede participar en un build de producción de Angular, y además Angular no figura entre los frameworks que documenta.
- `workbox-webpack-plugin` es irrelevante: no hay webpack.
- La única vía viable es **`workbox-build` con `injectManifest()` como script de post-build de Node** sobre `dist/apps/<app>/browser`, más el registro y la UX de actualización escritos a mano.

Es una cantidad de maquinaria propia que no se justifica para "que la app cargue sin red", especialmente cuando el modelo de versionado atómico de ngsw (todos los recursos de una versión o ninguno) es una ventaja de corrección que habría que reconstruir a mano.

### 3.4 Comparativa

| Criterio                                | `@angular/service-worker`                      | Workbox vía `injectManifest`                        | `vite-plugin-pwa`             |
| --------------------------------------- | ---------------------------------------------- | --------------------------------------------------- | ----------------------------- |
| Encaje con `@angular/build:application` | **Nativo** (opción `serviceWorker`)            | Script de post-build propio                         | **Imposible** (Vite dev-only) |
| Coste de puesta en marcha               | Una línea + `ngsw-config.json`                 | Script + SW propio + registro + UX de update        | —                             |
| Carga offline del shell                 | **Sí, por defecto**                            | Sí (`precacheAndRoute` + `createHandlerBoundToURL`) | —                             |
| Control de caché en runtime             | `dataGroups`: `performance` / `freshness`      | Completo, 5 estrategias por ruta                    | —                             |
| Versionado                              | **Atómico**, sin mezcla de versiones           | Lo diseñás vos                                      | —                             |
| Background Sync                         | Vía `importScripts` documentado                | `workbox-background-sync`                           | —                             |
| Salud del proyecto                      | **Congelado**: sólo arreglos de seguridad      | Activo, cadencia lenta (equipo Aurora de Chrome)    | Angular no soportado          |
| Generador en Nx 23                      | **No existe** (28 generadores, ninguno de PWA) | No                                                  | No                            |

### 3.5 Nx: qué hay y qué no

`[MEDICIÓN]` Enumerados los generadores de `@nx/angular`: **no hay generador de PWA ni de service worker**. Sí existen `ngrx-root-store`, `ngrx-feature-store` y `web-worker`. Nx no documenta `ngsw-config.json` en ninguna parte.

Dos consecuencias operativas:

- La configuración se añade a mano (o con `ng add @angular/pwa`, cuyo esquema escribe el `ngsw-config.json` en la raíz del proyecto y engancha **sólo la configuración `production`**).
- **Cuidado con la caché de Nx:** `nx.json` define `production` derivando de `default` = `["{projectRoot}/**/*", ...]`, y `sharedGlobals` está **vacío**. Un `ngsw-config.json` dentro del proyecto **sí** invalida la caché al editarse; uno compartido en la raíz **no**, y se serviría un `ngsw.json` obsoleto desde caché. **Mantener el fichero dentro de `apps/bitacora/`.**

### 3.6 Cómo se prueba

- Los service workers exigen **contexto seguro**; `http://localhost` cuenta como tal `[DOCS]` (MDN). Cualquier prueba por IP de LAN necesita HTTPS real.
- El registro generado está condicionado a `enabled: !isDevMode()`, así que `ng serve` en desarrollo **no** lo activa. Sirve `--configuration=production`, o mejor: **este repo ya tiene el target adecuado**, `serve-static` (`@nx/web:file-server` sobre `dist/apps/<app>/browser`, con `spa: true`) `[CÓDIGO]`.
- Verificación: DevTools → Network → **Offline**, recargar, y confirmar que las peticiones aparecen servidas por `(ServiceWorker)`. La documentación de Angular insiste en usar **ventana de incógnito**, porque el estado residual de un SW anterior es la primera causa de resultados engañosos.

### 3.7 El manifiesto no es cosmético

Los criterios de instalabilidad de Chromium exigen `name` o `short_name`, iconos de **192 y 512 px**, `start_url`, `display`, y HTTPS `[DOCS]` (MDN / web.dev). Un service worker **no** es requisito para instalar.

Pero la conexión con el eje 1 es lo importante: Chrome concede `navigator.storage.persist()` por heurísticas que incluyen **si el sitio está instalado o en marcadores**, y WebKit cita _"whether the website is opened as a Home Screen Web App"_. **Instalar la PWA es lo que compra la durabilidad del almacenamiento.** Por eso el manifiesto entra en el alcance mínimo aunque la demo corra en escritorio.

---

## 4. Eje 4 — La costura de sincronización

Nada de esta sección construye un backend. Todo es **esquema y disciplina de escritura**: barato ahora, carísimo después.

### 4.1 IDs generados en cliente

Sin servidor, los IDs los genera el cliente por necesidad: un registro creado offline debe poder ser referenciado (por una orden, por una factura) antes de que exista servidor alguno.

**Qué versión de UUID.** RFC 9562 `[SPEC]` ([rfc-editor.org/rfc/rfc9562](https://www.rfc-editor.org/rfc/rfc9562.html)) es explícito:

- §5.7: _"UUIDv7 features a time-ordered value field derived from the widely implemented and well-known Unix Epoch timestamp source"_, y _"Implementations SHOULD utilize UUIDv7 instead of UUIDv1 and UUIDv6 if possible."_
- §6.11: _"Time-ordered monotonic UUIDs benefit from greater database-index locality because the new values are near each other in the index."_
- §2.1, sobre v4: _"UUID versions that are not time ordered, such as UUIDv4... have poor database-index locality. This means that new values created in succession are not close to each other in the index; thus, they require inserts to be performed at random locations."_

> ⚠️ **Trampa concreta:** `crypto.randomUUID()` genera **únicamente v4** — _"used to generate a v4 UUID using a cryptographically secure random number generator"_ `[DOCS]` (MDN). Es lo que usa hoy `apps/bahia` (`vehiculos-data.service.ts`). Para v7 hace falta una librería: `uuid@14.0.2` (MIT, 3,8 KB gzip, _"Support for all RFC9562 UUID versions"_) o `uuidv7@1.2.1` (Apache-2.0, **1,7 KB gzip**, 0 dependencias).

Beneficio real y verificable en esta app: **los índices por `[tallerId+id]` y los listados "órdenes más recientes" quedan ordenados por construcción**, sin un índice extra sobre la fecha de creación. Con v4, cada inserción cae en una posición aleatoria del índice.

**Coste de reversión: muy alto.** Cambiar el esquema de IDs cuando ya hay registros locales exige reescribir cada fila y cada referencia entre entidades, en la base de un usuario a la que no se tiene acceso. Es la decisión más cara de la lista.

**Y una nota de seguridad para el día que haya backend:** el servidor no puede confiar ciegamente en un ID de cliente. Debe validar el formato y, sobre todo, **acotarlo al tenant** — un cliente no puede escribir un ID que colisione con el de otro taller.

### 4.2 La cola de operaciones (outbox)

El patrón canónico `[DOCS]` ([microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)):

> "The solution is for the service that sends the message to first store the message in the database as part of the transaction that updates the business entities. A separate process then sends the messages to the message broker."

**Traducción al navegador, y funciona porque IndexedDB lo permite:** las transacciones de IndexedDB abarcan **varios object stores** `[SPEC]`. Entonces la escritura de la entidad y la inserción de su operación pendiente ocurren **atómicamente**. O se guardan las dos, o ninguna. Esa es la propiedad que hace que la cola no mienta nunca.

Forma mínima de la tabla:

| Campo                     | Para qué                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| `id`                      | UUIDv7 — **es también la clave de idempotencia** que viajará al servidor |
| `secuencia`               | Entero local monótono. Da **orden determinista de reenvío**              |
| `entidad`, `entidadId`    | Contra qué recurso va                                                    |
| `operacion`               | `crear` / `actualizar` / `borrar`                                        |
| `payload`                 | El cambio                                                                |
| `intentos`, `ultimoError` | Para backoff y para diagnosticar                                         |
| `creadoEn`                | Antigüedad de la cola                                                    |

**Idempotencia**, con la referencia que mejor la documenta `[DOCS]` ([Stripe](https://docs.stripe.com/api/idempotent_requests)): el servidor guarda el estado y el cuerpo de la primera respuesta por clave, y las repeticiones devuelven el mismo resultado; las claves duran 24 h; y —detalle valioso— _"The idempotency layer compares incoming parameters to those of the original request and errors if they're not the same"_. Como la entrega es _al menos una vez_, sin idempotencia los reintentos duplican registros.

**Drenaje.** `SyncManager` (Background Sync) parece la respuesta y no lo es: MDN lo marca como _"Limited availability"_, **no Baseline**, sin soporte en Firefox ni Safari, y su especificación es un borrador de la WICG `[DOCS]`. Incluso Workbox lo degrada reintentando al arrancar el service worker. **Conclusión de planificación: el mecanismo real y portátil es código de la app que drena la cola al arrancar y al evento `online`; Background Sync es, como mucho, una optimización en Chromium.**

**Reintentos:** backoff exponencial **con jitter** y un tope de intentos, más un estado de "muerta" para que una operación envenenada no bloquee la cola. `[NO CONFIRMADO]` — no se pudo leer la fuente de AWS sobre jitter (el artículo se movió de dominio y el nuevo no devuelve contenido); el patrón es de consenso amplio, pero **queda sin cita primaria en este documento**.

### 4.3 Marcas de tiempo, borrado y orden

El protocolo de replicación de RxDB `[DOCS]` ([rxdb.info/replication](https://rxdb.info/replication.html)) es la especificación pública más concreta de esta costura, y **vale citarla aunque RxDB esté descartado**, porque enumera exactamente lo que el esquema debe cumplir:

- Los documentos deben ser **_"deterministically sortable by their last write time"_**, usando `updatedAt` **más** la clave primaria como desempate.
- **_"documents are never deleted, instead the `_deleted` field is set to `true`"_**.
- El pull se hace por **checkpoint** (un `{id, updatedAt}` del último documento recibido), y el push devuelve los conflictos para que el cliente los resuelva.

De ahí salen tres campos obligatorios en **toda** entidad sincronizable, desde el primer día: `creadoEn`, `actualizadoEn`, `borradoEn` (o `borrado: boolean`).

> **Por qué el tombstone es innegociable:** offline, **un borrado tiene que ser un registro, no una ausencia**. Si se borra la fila y nada más, al sincronizar el servidor no puede distinguir "esto lo borré" de "esto todavía no lo recibí", y el registro **resucita**. Convertir un borrado físico en lógico después de que existan datos exige reconstruir un historial que ya se perdió. Firestore, como referencia de implementación, funciona igual: cachea local, encola escrituras y sincroniza al volver `[DOCS]`.

**Sobre los relojes:** `actualizadoEn` con la hora del cliente sirve para **mostrar** y para ordenar localmente, pero **no como árbitro de conflictos**: el reloj del usuario es ajustable y puede estar desfasado. Cuando haya servidor, la autoridad de orden debe ser suya. La forma estándar y ya especificada de detectar escrituras a ciegas es el control de concurrencia optimista de HTTP: `ETag` + `If-Match`, con **412 Precondition Failed** si la versión no coincide `[SPEC]` (RFC 9110, vía [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)). Dejar un campo `version` por fila desde hoy es gratis y evita la migración después.

`[NO CONFIRMADO]` No se pudieron citar de fuente primaria los relojes lógicos (Lamport 1978, Hybrid Logical Clocks) ni una fuente rigurosa sobre _lost updates_ de LWW. **No hacen falta para la fase 1** y se anotan como lectura pendiente si algún día hay edición concurrente real.

### 4.4 Qué NO construir ahora

- **Resolución de conflictos.** Sin servidor y con un dispositivo, no hay conflictos. Firestore, con toda su madurez, se conforma con _"for multiple changes to the same document, it's last write wins"_ `[DOCS]`. Basta con **dejar el punto de extensión** (una función `resolverConflicto` que hoy devuelve el estado local) y comentarlo.
- **CRDTs** (Automerge, Yjs). Resuelven fusión automática sin coordinación, a cambio de metadatos que crecen y de **no poder imponer invariantes arbitrarias**. Una orden de trabajo con estados y totales tiene invariantes; un documento colaborativo no. No es el problema de esta app.
- **Dexie Cloud, ElectricSQL, PowerSync, Triplit.** Todos exigen un componente de servidor (y Triplit es **AGPL-3.0**, copyleft: riesgo real para un producto comercial). Aportan valor cuando exista backend, no antes.

### 4.5 Multi-tenant: `tallerId` desde el día uno

El mapa lo pide y es correcto. El coste de añadirlo hoy es **un campo y un índice**; el de añadirlo después es una migración sobre bases locales de usuarios reales a las que nadie puede acceder.

Lo que sí hay que pensar bien es el **orden dentro del índice compuesto**: `[tallerId+placa]`, no `[placa+tallerId]`. Dexie documenta que _"Only the leading parts of a compound index can be used alone - never the trailing parts"_ `[DOCS]`, así que liderar por tenant permite además recorrer todo el taller con el mismo índice. Esta es una decisión de diseño de índice que se paga cara si se elige mal, porque cambiarla es una migración de esquema.

`[NO CONFIRMADO]` No se pudo citar la fuente primaria de AWS/Azure sobre particionado multi-tenant. El razonamiento anterior se sostiene en la documentación de Dexie sobre índices compuestos, que sí es primaria.

### 4.6 Migraciones en el cliente: la parte irreversible

Dexie ejecuta las migraciones en `version(n).stores({...}).upgrade(trans => ...)`, dentro de una transacción `[DOCS]`; en IndexedDB crudo es `onupgradeneeded`.

Lo que hace especial este contexto: **no se puede forzar el refresco de la base de un usuario**. Cada migración debe funcionar contra **cualquier** versión anterior que exista en cualquier navegador, sin supervisión y sin posibilidad de rollback. Esto tiene una consecuencia inmediata para el proyecto:

> ⚠️ **Nunca sembrar datos dentro de la función de migración.** Es un error fácil y de arreglo caro: acopla los datos de demostración al versionado del esquema, de modo que un usuario con base preexistente nunca recibe la semilla nueva, y un cambio de semilla obliga a subir la versión del esquema. La semilla va en un paso idempotente **posterior** a la apertura ("si la tabla está vacía, sembrar"). Este es exactamente el patrón que hoy tiene `apps/bahia` (§7) y que no conviene repetir.

---

## 5. Arquitecturas candidatas

Tres combinaciones completas, no piezas sueltas. Las tres comparten el eje 3 (`@angular/service-worker` + manifiesto + `persist()`) y el eje 4 (UUIDv7, outbox, tombstones, `tallerId`), porque en esos dos ejes la evidencia no ofrece alternativas razonables. Lo que cambia es el almacén y el estado.

### 5.1 Candidata A — Dexie + signals planos

```
Componentes (signals)
   ↑ toSignal(from(liveQuery(...)))         ← lecturas reactivas
Repositorios (uno por agregado)             ← ÚNICO punto de escritura
   ├─ valida unicidad condicional (placa vigente)
   ├─ escribe entidad + fila de outbox en LA MISMA transacción
   └─ genera UUIDv7, sella creadoEn/actualizadoEn, tallerId
Dexie 4 (esquema declarativo, índices compuestos)
IndexedDB  ·  navigator.storage.persist()
```

Estado de UI efímero: `signal()` en servicios. Sin librería de store.

| Pros                                                                                         | Contras                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Índices compuestos declarativos: el modelo de placa se expresa casi directamente             | +31,1 KB gzip — el coste más alto de las tres en bundle                              |
| `liveQuery` da reactividad **y sincronización entre pestañas** sin escribir nada             | La unicidad condicional sigue siendo código, no constraint (limitación de IndexedDB) |
| **Guía oficial de Angular con signals** publicada por Dexie; nada improvisado                | Una dependencia más que mantener                                                     |
| Cero dependencias en prerelease                                                              | Sin devtools de estado                                                               |
| Compatible con `fake-indexeddb`: entra en los tests existentes sin tocar nada                |                                                                                      |
| Proyecto muy activo (release 4 días antes de esta investigación), Apache-2.0, 0 dependencias |                                                                                      |

**Coste de reversión: bajo.** Si mañana se quiere un store, se añade encima sin tocar los repositorios. Si se quiere cambiar Dexie por `idb`, sólo cambian los repositorios — la UI consume signals y no sabe de la base. Migrar a SQLite WASM sí sería caro, pero lo sería desde cualquier punto de partida.

### 5.2 Candidata B — `idb` + NgRx SignalStore

```
Componentes
   ↑ signals del store
SignalStore por entidad (withEntities)      ← copia en memoria
   ↑ rxMethod / métodos
DataService/Repositorio por entidad
   └─ mismas responsabilidades que en A
idb 8 (object stores + createIndex manuales)
IndexedDB
```

Es, en lo esencial, el patrón que hoy usa `apps/bahia`, **corregido**: con índices reales (hoy no tiene ninguno), con outbox, con tombstones y con service worker.

| Pros                                                     | Contras                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **1,5 KB gzip** de capa de datos: casi 30 KB menos que A | **`@ngrx/signals` no tiene versión estable para Angular 22** — obliga a `22.0.0-rc.0`                |
| Convenciones uniformes; sitio obvio para la lógica       | Índices y migraciones a mano, verbosos y fáciles de olvidar                                          |
| `withEntities` da colecciones normalizadas hechas        | **Sin reactividad de base de datos**: hay que releer tras cada escritura y coordinar pestañas a mano |
| Ecosistema y experiencia acumulada                       | NgRx **no publica** ningún patrón oficial de persistencia local                                      |
|                                                          | `idb` lleva 15 meses sin release                                                                     |
|                                                          | Doble fuente de verdad (memoria + IndexedDB) que hay que mantener coherente                          |

**Coste de reversión: medio.** Quitar el store después es refactor de toda la capa de presentación. Y el riesgo de prerelease no es reversible por decisión propia: depende de cuándo publique NgRx la 22.0.0 estable.

> Sobre `withStorageSync` de `@angular-architects/ngrx-toolkit`, que parece atajar esto: serializa **todo el estado a un blob JSON bajo una sola clave**. Eso no es "estado respaldado por una base de datos" — es `localStorage` con IndexedDB detrás, sin índices ni carga parcial. Además su versión actual aún no soporta `@ngrx/signals` 22. **No resuelve este problema.**

### 5.3 Candidata C — SQLite WASM (OPFS) en un Worker

```
Componentes (signals)
   ↑ resource() sobre mensajes al worker
Repositorios (API asíncrona, serializa mensajes)
   ↕ postMessage / Comlink
Web Worker  →  SQLite WASM, VFS opfs-sahpool
OPFS  ·  navigator.storage.persist()
```

| Pros                                                                                        | Contras                                                                                        |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **SQL real**: joins, `FOREIGN KEY`, y el índice único parcial que el modelo de placa pide   | **Sólo Worker** (documentación oficial): toda la capa de datos pasa a mensajería               |
| El modelo de placa/propiedad/fusión se expresa declarativamente, con integridad garantizada | `opfs` exige **COOP/COEP**; `opfs-sahpool` los evita pero **no admite conexiones simultáneas** |
| La base se puede volcar como fichero `.sqlite` — migración a servidor trivial               | **~2,7 MB de WASM**                                                                            |
| Conocimiento SQL transferible al backend futuro                                             | **Los tests de la capa de datos dejan de correr en jsdom**: OPFS no existe ahí                 |
|                                                                                             | Sin reactividad: hay que construir la invalidación a mano                                      |

**Coste de reversión: alto en ambos sentidos.** Es la opción con la que es más caro entrar (worker, mensajería, tests) y de la que es más caro salir (el SQL escrito no se traslada a IndexedDB).

### 5.4 Comparación

| Criterio                                   | **A — Dexie + signals**   | **B — idb + SignalStore** | **C — SQLite WASM** |
| ------------------------------------------ | ------------------------- | ------------------------- | ------------------- |
| Coste en bundle (capa de datos)            | 31,1 KB                   | **1,5 KB** (+2,4 store)   | ~2,7 MB             |
| Expresa el modelo de placa/fusión          | Bien (índices compuestos) | Regular (manual)          | **Perfecto (SQL)**  |
| Unicidad condicional como constraint       | No                        | No                        | **Sí**              |
| Reactividad de la base                     | **Sí, entre pestañas**    | No                        | No                  |
| Dependencias en prerelease                 | **Ninguna**               | **`@ngrx/signals` rc**    | Ninguna             |
| Testeable con la infraestructura actual    | **Sí**                    | **Sí**                    | **No**              |
| Documentación oficial para este uso exacto | **Sí (Dexie→Angular)**    | Parcial                   | Parcial             |
| Complejidad de arranque                    | Baja                      | Media                     | **Alta**            |
| Coste de reversión                         | **Bajo**                  | Medio                     | Alto                |

---

## 6. Recomendación

**Candidata A: Dexie 4 + signals planos + `@angular/service-worker`, con repositorios como único punto de escritura y el esquema de sincronización reservado desde el día uno.**

Los cinco argumentos, en orden de peso:

1. **Es la única donde cada pieza tiene documentación oficial para el uso exacto que se le va a dar.** Dexie publica la guía de Angular con `toSignal` y zoneless; Angular publica `resource()` estable para fuentes asíncronas cualesquiera; Angular publica el service worker y su configuración por defecto ya cumple el requisito. No hay ningún tramo improvisado.

2. **No introduce ninguna dependencia en prelanzamiento.** Es el argumento más incómodo contra la candidata B y no es una opinión: `@ngrx/signals@latest` es 21.1.1 con peer `^21.0.0`. Para una demo de venta cuyo fallo es inaceptable, depender de una `rc` para gestionar filtros de UI no se sostiene.

3. **El modelo de datos ya fijado exige índices compuestos, y Dexie los declara en una línea.** Con `idb` son `createIndex` manuales dentro de `onupgradeneeded`, exactamente el sitio donde los olvidos se pagan con migraciones.

4. **`liveQuery` elimina toda una categoría de bugs.** La reactividad "reescribí, ahora acordate de releer y de avisarle a la otra pestaña" es una fuente de errores clásica. Que la base emita el cambio la borra del mapa, y encima llega gratis entre pestañas.

5. **Entra en la infraestructura de tests que ya existe.** `fake-indexeddb` documenta el soporte de Dexie y el `test-setup.ts` del repo ya lo importa.

**El precio, dicho sin adornos: 31,1 KB gzip.** Contra el presupuesto `initial` de 1 MB que ya tiene configurado el repo, es un 3 %. Es un precio justo por índices declarativos, migraciones transaccionales y reactividad entre pestañas.

### 6.1 Alcance mínimo para la fase 1

Coherente con "economizar en lo que no se note, dejando comentada la implementación completa".

**Se construye:**

1. Esquema de Dexie con `tallerId` e índices compuestos en toda entidad; `id` UUIDv7; `creadoEn` / `actualizadoEn` / `borradoEn` en todas.
2. Un repositorio por agregado. **Todas** las escrituras pasan por ahí: sella marcas de tiempo, valida la unicidad condicional de la placa vigente y escribe la fila de outbox **en la misma transacción**.
3. Tabla `outbox` que se llena de verdad desde el día uno — **pero que nadie drena**. Es la prueba de que la costura funciona, y hace la demo más creíble ("mirá, quedó encolado").
4. `ng add @angular/pwa` con la ruta corregida a `apps/bitacora/ngsw-config.json`, el grupo de fuentes e imágenes pasado a `prefetch`, y el manifiesto con iconos de 192 y 512 px.
5. `navigator.storage.persist()` al arrancar, con el resultado registrado.
6. Semilla idempotente **fuera** de la función de migración.
7. Borrado **siempre** lógico.

**Se deja comentado, no construido:** el drenaje de la cola con backoff y jitter; el `conflictHandler` (con una implementación de una línea que devuelve el estado local); el `pullHandler`/`pushHandler` por checkpoint; la UI de selección de taller; y `SwUpdate` para avisar de versión nueva.

### 6.2 Qué reconsiderar el día que exista backend

La recomendación es para hoy. Estas tres cosas cambian de signo cuando haya servidor, y conviene tenerlas anotadas para no re-litigar la decisión desde cero:

1. **RxDB vuelve a la mesa.** Su replicación es gratuita y agnóstica del backend, y su protocolo por checkpoint es el que este documento ya toma como referencia de esquema (§4.3). Como el storage gratuito de RxDB **es Dexie**, migrar sería adoptar una capa por encima, no reescribir la base. El coste sería ~20 KB gzip adicionales y aceptar que los storages rápidos son de pago.
2. **La sincronización a mano deja de ser barata.** Mientras no haya servidor, el outbox es cuatro campos y una transacción. Con servidor aparecen reintentos, idempotencia, checkpoints, conflictos y migraciones coordinadas cliente-servidor. Ahí es donde una librería empieza a pagar sola.
3. **`persist()` y la instalación pasan de recomendables a obligatorios**, porque el dato local deja de ser una copia sembrada y pasa a ser trabajo del taller que todavía no llegó al servidor.

Ninguna de las tres invalida elegir Dexie hoy: las tres se apoyan sobre el mismo esquema, que es justamente lo que este documento pide acertar desde el principio.

---

## 7. Auditoría del patrón vigente en `apps/bahia`

Se incluye porque el ticket lo nombra explícitamente y porque conviene que la comparación se haga con hechos y no con impresiones. Todo lo que sigue es `[CÓDIGO]`, leído de este repo.

**Qué es:** `idb` 8.0.3 con una base única (`bahia-db`, versión 2), seis object stores, un `DataService` por entidad que devuelve `Observable` vía `defer(...)`, y un SignalStore de `@ngrx/signals` por entidad encima.

**Qué hace bien:**

- La costura está **identificada y comentada** en el propio código: _"esta es la costura hacia un backend real: cuando exista, solo cambian los DataServices (a HttpClient), no los stores ni la UI"_. La intención arquitectónica es correcta.
- Las migraciones distinguen instalación fresca de actualización mediante `oldVersion`, con un comentario que explica por qué.
- Hay tests, y el `test-setup.ts` resuelve IndexedDB en jsdom con `fake-indexeddb/auto`.

**Qué no cubriría los requisitos de Bitácora, verificado:**

| Hallazgo                                                                                                                   | Por qué importa aquí                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Cero índices.** Búsqueda de `createIndex` en todo `apps/`: **sin resultados**. Todos los stores son `{ keyPath: 'id' }`. | Es un **key-value puro**. `getAll()` trae todo y se filtra en JS. El modelo de placa historiada no se sostiene así.     |
| **No hay service worker ni manifiesto.**                                                                                   | La app **no carga sin conexión**. Persiste datos, que es otra cosa.                                                     |
| **No hay outbox, ni tombstones, ni `creadoEn`/`actualizadoEn`.**                                                           | La costura declarada en el comentario **no está reservada en el esquema**: cambiar `DataService` a HttpClient no basta. |
| **`crypto.randomUUID()`** → UUID **v4**.                                                                                   | Localidad de índice pobre (RFC 9562 §2.1). Fácil de cambiar hoy, caro con datos.                                        |
| **La semilla vive dentro de `upgrade()`.**                                                                                 | Acopla datos de demo a versionado de esquema (§4.6). Un usuario con base previa nunca recibe semilla nueva.             |
| **`@ngrx/signals@22.0.0-beta.0`**, cuando ya existe `rc.0`.                                                                | Prerelease, y además desactualizada.                                                                                    |

**Lectura justa:** para lo que Bahía es —persistir el estado de una demo con entidades planas y sin requisito de carga offline— el patrón es proporcionado y está razonablemente documentado. **No es un mal patrón; es un patrón para otro problema.** Bitácora tiene tres requisitos que Bahía no tiene: cargar sin red, un modelo con historial temporal y fusión, y una costura de sincronización real. Ninguno de los tres está cubierto, y dos de ellos (índices y esquema de sincronización) son caros de retrofittear.

Esta auditoría **no** es un argumento contra la candidata B: B es "el patrón de Bahía corregido", y con índices, outbox y service worker sería una arquitectura válida. El argumento contra B es el de la §5.2 —prerelease, reactividad manual, índices a mano—, no su parentesco.

---

## 8. Decisiones caras de revertir

Ordenadas por coste de reversión, de mayor a menor. Son las que hay que acertar el día uno.

| #   | Decisión                                                                                 | Por qué es cara                                                                                                                     | Qué hacer                                                        |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **Esquema de IDs (v4 vs v7, cliente vs servidor)**                                       | Cambiarlo exige reescribir cada fila y cada referencia entre entidades, en bases locales de usuarios inalcanzables                  | **UUIDv7 en cliente**, vía `uuidv7` (1,7 KB)                     |
| 2   | **Borrado lógico con tombstone**                                                         | Un borrado físico no deja rastro; al sincronizar, el registro **resucita**. El historial perdido no se reconstruye                  | `borradoEn` en toda entidad desde el principio                   |
| 3   | **Presencia de `tallerId` y el orden del índice compuesto**                              | Añadir la columna es migración; **cambiar el orden del índice también**, y las consultas dependen de las partes iniciales           | `tallerId` en toda fila; índices **liderados por tenant**        |
| 4   | **Punto único de escritura (repositorio)**                                               | IndexedDB no tiene unicidad parcial: si las escrituras se dispersan, la invariante de "una placa vigente" **no se puede recuperar** | Repositorio por agregado, sin excepciones                        |
| 5   | **Semántica de marcas de tiempo** (`creadoEn`/`actualizadoEn`/`version`, reloj de quién) | Retrofittear un orden de última escritura sobre datos existentes es adivinar                                                        | Los tres campos desde el día uno; la autoridad será del servidor |
| 6   | **Outbox escrito en la misma transacción que la entidad**                                | Encolar aparte crea estados donde el dato se guardó y la operación se perdió (o al revés)                                           | Una sola transacción, siempre                                    |
| 7   | **PK sintética del vehículo, placa historiada** (ya fijado por la investigación previa)  | Una PK sobre placa parte el historial el día que un cliente personaliza su matrícula                                                | Respetar lo que fija `placa-vs-vin-costa-rica.md`                |
| 8   | **Elección de almacén (IndexedDB vs OPFS/SQLite)**                                       | El SQL escrito no se traslada; el esquema de IndexedDB tampoco                                                                      | IndexedDB vía Dexie                                              |

**Baratas de revertir, y por tanto no urgentes:** añadir una librería de estado encima (la UI consume signals, no sabe de dónde vienen); cambiar `@angular/service-worker` por Workbox (es configuración de build, no toca los datos); afinar `ngsw-config.json`; y ajustar la política de reintentos del drenaje.

---

## 9. Esquema propuesto (concreto)

Traducción directa de todo lo anterior, respetando `placa-vs-vin-costa-rica.md` §10. Ilustrativo, no normativo — el modelo de dominio se fija en su propio ticket.

> ⚠️ **Trampa que condiciona todo el esquema, y es la razón por la que esta sección existe.** Dexie documenta que _"Compound indexes will only index objects that has valid keys for all contained keypaths"_ ([dexie.org/docs/Compound-Index](https://dexie.org/docs/Compound-Index)). Es decir: **una fila cuyo `vigenteHasta` sea `null` o `undefined` desaparece silenciosamente de cualquier índice compuesto que lo incluya.** Justamente las filas que más importan —las placas vigentes y los registros no borrados— serían invisibles. La solución es **no usar `null` nunca en una columna indexada**: se codifica el "abierto" con un **centinela** (una fecha lejana, `'9999-12-31'`) y el "no borrado" con `0`. Es un detalle de una línea que, si se descubre tarde, produce un bug de datos silencioso y muy difícil de diagnosticar.

```ts
const ABIERTO = '9999-12-31T00:00:00.000Z'; // centinela: nunca null en columna indexada
const NO_BORRADO = 0;

db.version(1).stores({
  // Toda entidad: id (UUIDv7), tallerId, creadoEn, actualizadoEn, borradoEn
  vehiculos: 'id, tallerId, [tallerId+borradoEn], canonicoId, fusionadoEn',

  // Historial de placa con vigencia.
  // OJO: la unicidad condicional UNIQUE(tallerId, placa) WHERE vigenteHasta IS NULL
  // NO es expresable en IndexedDB — la spec sólo ofrece un flag `unique` binario y
  // no tiene índices parciales. Se valida en el repositorio, dentro de la misma
  // transacción 'rw'. En SQLite sería un CREATE UNIQUE INDEX ... WHERE de una línea.
  vehiculoPlacas: 'id, vehiculoId, [tallerId+placa], [vehiculoId+vigenteHasta]',

  // Propiedad con rango temporal — el defecto de Shopmonkey, corregido.
  propiedades: 'id, [vehiculoId+hasta], [clienteId+hasta]',

  ordenes:
    'id, tallerId, vehiculoId, [tallerId+estado], [tallerId+actualizadoEn]',
  clientes: 'id, tallerId, [tallerId+borradoEn]',

  // La costura. Se llena en fase 1; nadie la drena todavía.
  outbox: '++secuencia, id, entidad, entidadId, creadoEn',
});
```

Notas de diseño, cada una con su razón:

- **`vigenteHasta` y `borradoEn` usan centinelas, nunca `null`** — por la trampa de arriba.
- `[tallerId+placa]` **lidera por tenant** (§4.5), lo que permite además recorrer el taller entero con el mismo índice.
- `[vehiculoId+vigenteHasta]` resuelve "¿cuál es la placa vigente de este vehículo?" en una búsqueda de rango.
- `canonicoId` + `fusionadoEn` reservan la **fusión de vehículos** que el sector no documenta y que en Costa Rica hará falta, porque la placa cambia.
- `outbox` usa `++secuencia` autoincremental: da **orden determinista de reenvío** sin depender de ningún reloj.
- **Consulta "¿qué vehículo tenía la placa P en la fecha D?"**: el índice acota por `[tallerId+placa]` y el segundo predicado temporal se filtra en JS. IndexedDB admite **un solo rango por consulta**, así que dos condiciones de rango independientes (`vigenteDesde <= D` y `vigenteHasta > D`) no se sirven por índice ni con Dexie ni sin él. Con un puñado de placas por vehículo, el filtro en memoria es irrelevante; conviene saberlo igual.

> ⚠️ **Nota de compatibilidad con Safari.** Una corrida de Web Platform Tests del 2026-08-18 sobre `/IndexedDB` da Chrome 152 **100 %**, Firefox 153 **99,86 %** y **Safari 26.6 88,23 %**. Los fallos de Safari se concentran en las lecturas por lote de IndexedDB 3.0. **Acción concreta: no usar `getAllRecords()` ni las formas con objeto de opciones de `getAll`/`getAllKeys`.** Las formas clásicas de `getAll`/`getAllKeys` son seguras desde Safari 10.1. Dexie usa las clásicas, así que no hay problema — pero sí lo habría escribiendo IndexedDB a mano.

---

## 10. Incertidumbres

Lo que **no** quedó resuelto. Ninguna invalida la recomendación; se listan para no construir sobre arena.

| Incertidumbre                                                                     | Estado y por qué importa                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fecha de la 22.0.0 estable de `@ngrx/signals`**                                 | `[NO CONFIRMADO]`. La `rc.0` es del 2026-08-06 y en la v21 pasaron 2 días de rc a estable, pero eso es inferencia. **Si sale mañana, el argumento 2 contra la candidata B se debilita** — no desaparece (seguirían la reactividad manual y los índices a mano). |
| **Fuente primaria de backoff exponencial con jitter**                             | `[NO CONFIRMADO]`. El artículo de AWS cambió de dominio y el nuevo no devuelve contenido. Patrón de consenso, sin cita en este documento.                                                                                                                       |
| **Relojes lógicos (Lamport, HLC) y _lost updates_ de LWW**                        | `[NO CONFIRMADO]`. No hacen falta en fase 1. Lectura pendiente si aparece edición concurrente real.                                                                                                                                                             |
| **Fuente primaria sobre particionado multi-tenant** (AWS SaaS Lens / Azure)       | `[NO CONFIRMADO]`. La recomendación de liderar el índice por tenant se apoya en la documentación de Dexie sobre índices compuestos, que sí es primaria.                                                                                                         |
| **Declaración del equipo Angular sobre "signals + servicios bastan"**             | `[NO CONFIRMADO]`. Lo verificable es la **ausencia** de guía de state management, que es un argumento estructural pero no una recomendación explícita.                                                                                                          |
| **Que `ng serve --configuration=production` sirva el SW**                         | Verificado leyendo el código del builder, **no ejecutándolo**. Merece una comprobación empírica de cinco minutos antes de dar por buena la instrucción.                                                                                                         |
| **Tamaño gzip real de Dexie en este proyecto**                                    | 31,1 KB es el bundle completo de bundlephobia. Con tree-shaking sobre el subconjunto de API que se use, será menor — **no se midió** contra un build real.                                                                                                      |
| **Estado de estabilidad de `rxdb/plugins/reactivity-angular`**                    | `[NO CONFIRMADO]`. Irrelevante dado que RxDB queda descartado por licencia.                                                                                                                                                                                     |
| **Comportamiento de `persist()` en la demo concreta**                             | No se ejecutó. Chrome concede por heurísticas no documentadas numéricamente; conviene registrar el resultado y observarlo en el equipo de la demo.                                                                                                              |
| **Si `fake-indexeddb` cubre los índices compuestos que usa el esquema propuesto** | Documenta soporte de Dexie y pasa el 83 % de los WPT, pero **los índices compuestos no se mencionan explícitamente**. Verificar con un test temprano.                                                                                                           |
| **¿`persist()` exime del corte de 7 días de Safari?**                             | `[NO CONFIRMADO]` — **dos fuentes primarias se contradicen** (§1.1). Sin post de WebKit posterior a agosto de 2023 que lo zanje. Mitigado tratando la instalación como única exención verificada.                                                               |
| **Heurísticas exactas de Chrome para conceder persistencia**                      | `[NO CONFIRMADO]`. Los ficheros de Chromium que las implementan devuelven 404; la lista de tres heurísticas viene de una página de web.dev **actualizada por última vez en 2020**.                                                                              |
| **Regla de 7 días en Firefox**                                                    | **Refutada por ausencia de fuente**: MDN la atribuye sólo a Safari. Circula como verdad y **no lo es** para orígenes de primera parte.                                                                                                                          |
| **Tamaño gzip de PGlite**                                                         | Tres fuentes oficiales dicen 3 MB / 3,7 MB / "under 3mb"; la medición da **~5,44 MB** porque el `pglite.data` obligatorio no se cuenta. Irrelevante: descartado igual.                                                                                          |
| **Licencia real de `ngx-indexed-db`**                                             | `[NO CONFIRMADO]`: npm dice ISC, GitHub dice MIT. Irrelevante aquí (su peer excluye Angular 22), pero anotado por higiene.                                                                                                                                      |

---

## 11. Fuentes

### Especificaciones y RFC

| Fuente                                    | Enlace                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| WHATWG Storage Standard                   | <https://storage.spec.whatwg.org/>                                         |
| W3C Indexed Database API 3.0              | <https://w3c.github.io/IndexedDB/>                                         |
| RFC 9562 — UUID (v7, localidad de índice) | <https://www.rfc-editor.org/rfc/rfc9562.html>                              |
| RFC 9110 — ETag / If-Match (vía MDN)      | <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag> |
| Web Background Synchronization (WICG)     | <https://wicg.github.io/background-sync/spec/>                             |

### MDN

| Tema                                 | Enlace                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Cuotas y criterios de expulsión      | <https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria> |
| `StorageManager.persist()`           | <https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist>                           |
| `Crypto.randomUUID()` (sólo v4)      | <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID>                                |
| Background Synchronization API       | <https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API>                   |
| Origin Private File System (OPFS)    | <https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system>       |
| Service Worker API (contexto seguro) | <https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API>                               |
| PWA instalables                      | <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable>  |

### Navegadores

| Fuente                                                            | Enlace                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| WebKit — Updates to Storage Policy (2023)                         | <https://webkit.org/blog/14403/updates-to-storage-policy/>                                                |
| WebKit — Full third-party cookie blocking (regla de 7 días, 2020) | <https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/>                                |
| WebKit — Tracking Prevention (política vigente)                   | <https://webkit.org/tracking-prevention/>                                                                 |
| WebKit — OPFS y File System Access                                | <https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/>               |
| Mozilla — Redirect tracking protection (FF 79)                    | <https://blog.mozilla.org/security/2020/08/04/firefox-79-includes-protections-against-redirect-tracking/> |
| web.dev — Storage for the web                                     | <https://web.dev/articles/storage-for-the-web>                                                            |
| web.dev — Persistent storage                                      | <https://web.dev/articles/persistent-storage>                                                             |
| web.dev — Install criteria                                        | <https://web.dev/articles/install-criteria>                                                               |
| Chrome DevTools — PWA                                             | <https://developer.chrome.com/docs/devtools/progressive-web-apps>                                         |
| Web Platform Tests — resultados de `/IndexedDB`                   | <https://wpt.fyi/results/IndexedDB>                                                                       |

### Angular

| Tema                                        | Enlace                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Service workers (aviso de congelamiento)    | <https://angular.dev/ecosystem/service-workers>                                                      |
| Service workers — getting started           | <https://angular.dev/ecosystem/service-workers/getting-started>                                      |
| Service workers — configuración             | <https://angular.dev/ecosystem/service-workers/config>                                               |
| Service workers — comunicación              | <https://angular.dev/ecosystem/service-workers/communications>                                       |
| Service workers — devops                    | <https://angular.dev/ecosystem/service-workers/devops>                                               |
| Service workers — scripts propios           | <https://angular.dev/ecosystem/service-workers/custom-service-worker-scripts>                        |
| Signals                                     | <https://angular.dev/guide/signals>                                                                  |
| `resource()` — guía y API                   | <https://angular.dev/guide/signals/resource> · <https://angular.dev/api/core/resource>               |
| `linkedSignal()`                            | <https://angular.dev/api/core/linkedSignal>                                                          |
| Zoneless                                    | <https://angular.dev/guide/zoneless>                                                                 |
| Roadmap                                     | <https://angular.dev/roadmap>                                                                        |
| Índice de la documentación                  | <https://angular.dev/llms.txt>                                                                       |
| Migración del build system (Vite dev-only)  | <https://angular.dev/tools/cli/build-system-migration>                                               |
| Plantilla por defecto de `ngsw-config.json` | `angular/angular-cli` → `packages/schematics/angular/service-worker/files/ngsw-config.json.template` |

### NgRx

| Tema                                    | Enlace                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Guía de SignalStore                     | <https://github.com/ngrx/platform/blob/main/projects/www/src/app/pages/guide/signals/signal-store/index.md>  |
| Guía de Store (división de roles)       | <https://github.com/ngrx/platform/blob/main/projects/www/src/app/pages/guide/store/index.md>                 |
| `@ngrx/signals/resource` (experimental) | <https://github.com/ngrx/platform/blob/main/projects/www/src/app/pages/guide/signals/resource-extensions.md> |
| Migración a v22                         | <https://github.com/ngrx/platform/blob/main/projects/www/src/app/pages/guide/migration/v22.md>               |
| dist-tags en npm                        | <https://registry.npmjs.org/-/package/@ngrx/signals/dist-tags>                                               |

### Almacenes locales

| Tema                                                | Enlace                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| Dexie — introducción                                | <https://dexie.org/docs/Dexie.js>                                     |
| Dexie — tutorial de Angular (signals)               | <https://dexie.org/docs/Tutorial/Angular>                             |
| Dexie — `liveQuery()`                               | <https://dexie.org/docs/liveQuery()>                                  |
| Dexie — índices compuestos                          | <https://dexie.org/docs/Compound-Index>                               |
| Dexie — `Version.upgrade()`                         | <https://dexie.org/docs/Version/Version.upgrade()>                    |
| Dexie — `Version.stores()` (leyenda de índices)     | <https://dexie.org/docs/Version/Version.stores()>                     |
| Dexie — `Collection.modify()` (atomicidad)          | <https://dexie.org/docs/Collection/Collection.modify()>               |
| Dexie Cloud — consistencia                          | <https://dexie.org/cloud/docs/consistency>                            |
| Dexie Cloud — precios y licencia del servidor       | <https://dexie.org/cloud/pricing>                                     |
| RxDB — matriz de RxStorage                          | <https://rxdb.info/rx-storage.html>                                   |
| RxDB — precios (IndexedDB/OPFS de pago)             | <https://rxdb.info/premium/>                                          |
| RxDB — protocolo de replicación                     | <https://rxdb.info/replication.html>                                  |
| SQLite WASM — persistencia y OPFS                   | <https://sqlite.org/wasm/doc/trunk/persistence.md>                    |
| SQLite — índices parciales                          | <https://www.sqlite.org/partialindex.html>                            |
| SQLite — claves foráneas (desactivadas por defecto) | <https://www.sqlite.org/foreignkeys.html>                             |
| `idb`                                               | <https://github.com/jakearchibald/idb>                                |
| `fake-indexeddb`                                    | <https://github.com/dumbmatter/fakeIndexedDB>                         |
| TinyBase — persistencia (todo en RAM)               | <https://tinybase.org/guides/persistence/an-intro-to-persistence/>    |
| Electric — introducción (motor de sólo lectura)     | <https://electric.ax/docs/intro>                                      |
| PowerSync — licencia del servicio (FSL)             | <https://github.com/powersync-ja/powersync-service/blob/main/LICENSE> |
| Evolu — relay autoalojable                          | <https://www.evolu.dev/docs/relay>                                    |

### Patrones de sincronización

| Tema                             | Enlace                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| Transactional Outbox             | <https://microservices.io/patterns/data/transactional-outbox.html>      |
| Stripe — peticiones idempotentes | <https://docs.stripe.com/api/idempotent_requests>                       |
| Firestore — persistencia offline | <https://firebase.google.com/docs/firestore/manage-data/enable-offline> |

### Workbox

| Tema                                   | Enlace                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Workbox — repositorio                  | <https://github.com/GoogleChrome/workbox>                                   |
| Workbox — módulos                      | <https://developer.chrome.com/docs/workbox/modules>                         |
| Workbox — generateSW vs injectManifest | <https://developer.chrome.com/docs/workbox/the-ways-of-workbox>             |
| Workbox — background sync              | <https://developer.chrome.com/docs/workbox/modules/workbox-background-sync> |

### Nx

| Tema                            | Enlace                                                           |
| ------------------------------- | ---------------------------------------------------------------- |
| Generador de aplicación Angular | <https://nx.dev/technologies/angular/api/generators/application> |
| Ejecutor de aplicación Angular  | <https://nx.dev/technologies/angular/api/executors/application>  |

### Código de este monorepo `[CÓDIGO]`

| Fichero                                                             | Qué evidencia                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `package.json`                                                      | Angular 22.0.4, Nx 23.1.0, TS 6.0.3, `@ngrx/signals@22.0.0-beta.0`       |
| `apps/bahia/project.json`                                           | `@angular/build:application`; sin `serviceWorker`; target `serve-static` |
| `apps/bahia/src/app/data-access/persistence/bahia-db.ts`            | Seis stores sin índices; semilla dentro de `upgrade()`                   |
| `apps/bahia/src/app/data-access/services/vehiculos-data.service.ts` | `crypto.randomUUID()` (v4); `getAll()` sin filtro                        |
| `apps/bahia/src/test-setup.ts`                                      | `fake-indexeddb/auto` en jsdom                                           |
| `node_modules/@angular/build/src/builders/application/schema.json`  | Opción `serviceWorker: oneOf[string, false]`                             |
| `node_modules/@angular/build/src/builders/application/options.js`   | Ruta resuelta contra la **raíz del workspace**                           |
| `.github/workflows/ci.yml`                                          | `nx format:check` en CI                                                  |
