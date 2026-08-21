# La capa de datos: Dexie sobre IndexedDB, con centinelas y un punto único de escritura

El glosario pasó a esquema. **Decidimos implementar la persistencia con Dexie 4 sobre IndexedDB**, con `tallerId` en cada fila, identificadores UUIDv7 generados en el cliente, borrado siempre lógico, una cola de operaciones que se llena desde el día uno, y **un único punto de escritura** por el que pasa todo.

Sale del ticket [#74](https://github.com/FabianRG1990/repositorio-de-apps/issues/74), sobre la investigación [#24](https://github.com/FabianRG1990/repositorio-de-apps/issues/24), que ya había elegido la tecnología y enumerado las decisiones caras de revertir. Este ADR registra cómo quedaron implementadas y qué se aprendió al hacerlo.

## Los centinelas: nunca `null` en una columna indexada

Dexie documenta que un índice compuesto _"will only index objects that has valid keys for all contained keypaths"_. Traducido a este dominio: una fila cuya `vigenteHasta` fuera `null` **desaparecería** de la consulta que busca la Placa vigente — y son justamente las filas vivas las que importan. No hay error: devuelve vacío.

Por eso `null` no entra nunca en una columna indexada:

- **`ABIERTO`** (`'9999-12-31T00:00:00.000Z'`) para lo que sigue vigente.
- **`NO_BORRADO`** (`0`) para lo que no está borrado.

Hay una prueba que escribe a mano la fila con `null` que el repositorio nunca escribiría, y comprueba que **la fila existe y aun así el índice no la ve**. Está ahí para que quien venga entienda por qué el centinela no es una manía.

## El punto único de escritura

Todas las escrituras pasan por `Repositorio`, y no es una convención de estilo: sostiene dos invariantes que IndexedDB no puede sostener sola.

1. **La fila de la cola se escribe en la misma transacción que el dato.** Encolar aparte deja estados donde el dato se guardó y la operación se perdió, o al revés.
2. **"Un Vehículo tiene como mucho una Placa vigente".** `UNIQUE(tallerId, placa) WHERE vigente` no es expresable en IndexedDB —no hay índices parciales, solo un flag `unique` binario—, así que la comprueba el repositorio leyendo dentro de la misma transacción `rw`. Si las escrituras se dispersan, esa invariante no se recupera después.

## Lo que costó un bug: la semilla tiene que ser atómica

La semilla se escribió idempotente —"si ya hay Órdenes, no siembres"— y eso **no alcanzó**. Una prueba de punta a punta la pilló: recargando a mitad de siembra, la base quedaba con parte de las Órdenes escritas; al arrancar de nuevo, `count() > 0` daba verdadero, la semilla se saltaba, y el taller se quedaba **para siempre** con una base incompleta.

La comprobación y la escritura van ahora **dentro de la misma transacción**: es todo o nada, y si se interrumpe, IndexedDB la deshace y el siguiente arranque la reintenta entera. La lección general, que vale para cualquier otra: _idempotente_ y _atómica_ no son lo mismo, y una semilla necesita las dos.

Sigue estando **fuera** de la función de migración de Dexie, que es lo que la investigación pedía: lo que corre dentro de una migración se ejecuta una vez por versión y no se puede reintentar.

## Identificadores, tiempo y orden

- **UUIDv7, no v4.** Van ordenados por tiempo, así que los listados "lo más reciente" salen del propio índice de la clave. Cambiar el esquema de IDs más tarde obliga a reescribir cada fila y cada referencia en bases locales que nadie puede alcanzar: es la decisión más cara de revertir de toda la capa.
- **El orden de la cola sale de un contador, no del reloj.** `++secuencia` se incrementa dentro de la misma transacción que la escritura, así que es monótono por construcción. El reloj de pared no sirve: puede retroceder, NTP lo escalona y el usuario lo cambia a mano. Hay una prueba que mueve el reloj hacia atrás entre dos escrituras y comprueba que la cola conserva el orden real.
- **La cola guarda el cambio de campos, no el objeto entero.** Dos personas editando campos distintos de la misma Orden dejan de ser un conflicto. Decidirlo después habría sido reescribir todos los repositorios.
- **`version` en cada fila** desde hoy, que es lo que permitirá detectar la escritura a ciegas cuando exista servidor sin migrar nada.

## El borrado es siempre lógico

Offline, un borrado tiene que ser **un registro y no una ausencia**. Si la fila desaparece, al sincronizar no hay forma de distinguir "esto lo borré" de "esto todavía no me llegó", y el registro resucita. Convertir un borrado físico en lógico después no se puede migrar: la información ya no existe.

Por eso ni siquiera la **Fusión de vehículos** borra al absorbido: queda apuntando al canónico con `canonicoId` y `fusionadoEn`, porque su Folio ya está impreso en papeles que andan por ahí.

## El Folio es presentación, nunca identidad

Se acuña con la letra del Puesto y un consecutivo **propio de ese Puesto**, incrementado dentro de la transacción, para que dos Puestos sin conexión nunca acuñen el mismo. Es la única decisión de esta capa cuyo error **sale del sistema**: el número va impreso en una factura que el Cliente ya tiene en la mano.

## Lo que NO se construyó, a propósito

- **El drenaje de la cola.** Se llena desde el día uno y nadie la vacía. Sin servidor no hay a dónde mandarla, y así queda demostrado que la operación se registró.
- **Resolución de conflictos.** Con un dispositivo y sin servidor no hay conflictos. Lo que sí existe es todo lo necesario para añadirla sin migrar: `version`, `actualizadoEn` y la secuencia.
- **El service worker y `persist()`**, que son del alcance de otro ticket.

## Consequences

- **`OrdenesStore` cambió de respaldo sin cambiar de API.** Ese era el trato cuando se escribió en memoria, y se cumplió: la pantalla sigue pidiendo `ordenes()`, `seleccionada()` y `seleccionar()`, ninguna plantilla se tocó, y **las 26 pruebas de punta a punta que ya existían pasaron sin editarse**. Esa es la verificación de que la frontera estaba bien puesta.
- **La vista se compone al leer**, uniendo Orden, Vehículo, Placa vigente, Cliente y Líneas. El `tiempoParado` se calcula desde `recibidoEn` en vez de guardarse: un número que envejece solo no se persiste.
- **La etiqueta y el tono de cada estado viven en el store, no en la base.** Cambiar cómo se ve un estado no puede ser una migración de todas las bases locales.
- **`liveQuery` reemite cuando la base cambia**, incluso desde otra pestaña, así que la vista sigue al dato sin que nadie refresque a mano.
- **La apariencia del Taller se queda en el almacenamiento local**, y esto **corrige lo que anunciaba el [ADR 0013](./0013-la-apariencia-es-del-taller-y-la-fija-el-dueno.md)**. Se lee antes de pintar el primer fotograma para que no haya parpadeo, y IndexedDB es asíncrono: no llega a tiempo. El día que haya servidor, la fuente de verdad será la base y el almacenamiento local quedará como caché de arranque.
- **Queda comprobado que `fake-indexeddb` soporta los índices compuestos de este esquema**, que era una de las incertidumbres declaradas por la investigación #24.
