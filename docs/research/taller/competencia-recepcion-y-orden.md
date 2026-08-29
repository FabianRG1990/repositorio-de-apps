# La recepción del vehículo y la orden de trabajo en la competencia (Bitácora)

> Investigación de producto del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14).
> Fecha de verificación: **2026-08-29**. Precios y funciones cambian sin aviso; cada afirmación lleva su URL.
>
> **Este documento empieza donde termina [`que-hace-indispensable.md`](./que-hace-indispensable.md)** (#15, 2026-08-17). El bucle inspección → cotización → aprobación, los cuatro números del taller, por qué se abandona un sistema, el patrón de entidades canónicas y el relevamiento de Latinoamérica ya están ahí y **no se repiten**: se citan y se sigue. Lo nuevo acá es el **detalle mecánico de las dos pantallas que nos importan** —recibir el carro y trabajar la Orden— y el contraste campo por campo contra lo que Bitácora ya tiene construido.
>
> Tampoco se re-litiga la identidad del Vehículo: [`placa-vs-vin-costa-rica.md`](./placa-vs-vin-costa-rica.md) (#35) ya cerró que la llave es un `id` sintético, la Placa el identificador operativo y el VIN un atributo de decodificación. Ni el eje de la Especialidad: [`organizacion-multiespecialidad.md`](./organizacion-multiespecialidad.md) (#16) ya cerró que vive en la Línea de servicio.

---

## Convención de confianza de las fuentes

| Etiqueta            | Significado                                                                                                      | Cómo leerlo                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **[PRODUCTO]**      | Centro de ayuda, manual, esquema de API o página de precios del propio fabricante, **leída para este documento** | Fuente primaria sobre cómo funciona el producto. Fiable sobre el _qué hace_, no sobre si eso importa |
| **[MARKETING]**     | Afirmación promocional del fabricante                                                                            | Solo posicionamiento. Nunca se usa como evidencia de que la función exista tal como se describe      |
| **[LEY]**           | Texto normativo leído íntegro                                                                                    | Confianza alta sobre lo que dice la norma; la interpretación jurídica no es de este documento        |
| **[BITÁCORA]**      | Código, esquema o ADR de `apps/bitacora`, leído para este documento                                              | Fuente primaria sobre nosotros. Se cita el archivo, no el recuerdo                                   |
| **[NO VERIFICADO]** | No se pudo abrir la fuente primaria                                                                              | **Se declara y no se rellena.** Ver §3, que lista producto por producto qué quedó afuera y por qué   |

---

## 1. Pregunta

¿Qué hacen exactamente, y con evidencia de primera mano, los mejores sistemas de gestión de talleres en **(a) la recepción del vehículo** y **(b) la orden de trabajo** — y qué de eso le falta a Bitácora para competir y superarlos?

Cuatro sub-preguntas concretas, todas mecánicas y ninguna de estrategia:

1. **¿Cuántos campos exige de verdad un competidor antes de dejar abrir una Orden?** Bitácora exige cuatro cosas. ¿Es poco, es mucho, o es la pregunta equivocada?
2. **¿Qué capturan del Estado de entrada?** Odómetro, combustible, daños previos, objetos dentro, Fotos, firma. Bitácora captura los cinco primeros y ninguna firma.
3. **¿Cómo guardan la constancia de la Autorización?** No si autorizan por línea —eso ya se sabía—, sino **qué queda escrito** cuando meses después alguien discute.
4. **¿Alguno funciona sin conexión?** Bitácora corre 100 % sobre IndexedDB sin backend ([ADR 0014](../../../apps/bitacora/docs/adr/0014-capa-de-datos-sobre-indexeddb.md)). Si eso es un hueco del rubro entero, es el foso; si no lo es, es una limitación disfrazada de decisión.

---

## 2. Resumen ejecutivo

1. **El mínimo real para abrir una orden en el líder de facilidad de uso es _un_ campo, y Bitácora exige cuatro.** Shop-Ware, agregando un vehículo a mano dentro de la orden: _"Notice the only field required is the make."_ La placa y el odómetro de entrada aparecen después como _"additional details"_ ([support.shop-ware.com — Adding a New Vehicle](https://support.shop-ware.com/s/article/Add-New-Vehicle), leído 2026-08-29). Bitácora, en cambio, no deja pasar del primer paso sin **Placa, marca y nombre del Cliente**, ni del segundo sin **al menos un Reporte del Cliente** (`recepcion.ts`, `faltaParaSeguir`). Somos el producto más exigente de los seis en el momento de más prisa del día.

2. **Y la razón por la que ellos exigen poco no es que les importe menos: es que _movieron_ la obligatoriedad al cierre y la volvieron configuración del taller.** Tekmetric expone **nueve interruptores** en _RO Advanced Settings_ que deciden qué impide **postear** la orden — entre ellos `Odometer In & Out`, `Tech on Labor`, `Job Category` y `Digital Signature for Digital Authorization` — y lo dice textualmente: _"the RO will not post unless you have mileage entered in the odometer fields"_ ([support.tekmetric.com — Repair Order Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings), leído 2026-08-29). **Nadie bloquea la creación; todos bloquean el cierre.** Bitácora hace lo contrario: bloquea la creación y no bloquea nada al cerrar.

3. **La Placa como llave operativa no es una rareza tica: es lo que hace el producto más viejo del rubro.** Mitchell 1 Manager SE, al dar de alta un vehículo, manda _"Type in a unique License number"_ y deja el VIN detrás de un botón secundario, el _Vehicle Detail_, junto al tipo de motor y de transmisión ([buymitchell1.net — Vehicle Screen](https://buymitchell1.net/managerhelp/Vehiclescr.htm) y [Entering a New Vehicle](https://buymitchell1.net/managerhelp/Enteringanwvechicle.htm), leídos 2026-08-29). Shop-Ware llega al mismo sitio por el otro lado: _"Shop-Ware allows you to add vehicles without a VIN."_ El modelo de Bitácora —Placa obligatoria con historial de vigencia, VIN nulable— coincide con los dos.

4. **El Estado de entrada casi no existe en la competencia verificada, y lo poco que existe es el odómetro.** En los cinco productos que se pudieron leer, el único dato de ingreso con campo propio y documentado es el kilometraje: el campo **In** de la pantalla de Orden de Mitchell 1 ([Order Screen](https://buymitchell1.net/managerhelp/Orderscreen.htm)), el `Odometer: Enter vehicle mileage in/out` de Tekmetric Mobile ([Tekmetric Mobile](https://support.tekmetric.com/hc/en-us/articles/26781766611351-Tekmetric-Mobile)), el `odometer in` de Shop-Ware. **No se encontró en ninguno de los seis un campo documentado para el nivel de combustible, para los daños previos ni para los objetos que el Cliente dejó adentro.** Eso vive, cuando vive, dentro de la inspección digital — que es otra cosa: la inspección la hace el Técnico para vender trabajo, no el Asesor para protegerse. Bitácora tiene los cuatro como campos de la Orden ([ADR 0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md), `esquema.ts`).

5. **La constancia de Autorización más fuerte del mercado no es una firma: es un archivo de lo que el Cliente vio.** Garage Hive guarda versiones archivadas del documento publicado, incluido el texto de presentación: _"The Intro Text you send with an Online Authorisation is saved against the published document. You can check exactly what was sent later from the Archived Versions, which helps if there's ever a question about what the customer was told."_ Además registra **cuándo se abrió** el documento y **revoca la versión anterior** si se edita después de publicado ([docs.garagehive.com — Previewing and Publishing Online Documents](https://docs.garagehive.com/p/gFfa6lg5AJdkz7/Previewing-and-Publishing-Online-documents), leído 2026-08-29). Bitácora guarda **quién autorizó, por qué medio y cuándo** ([ADR 0021](../../../apps/bitacora/docs/adr/0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md)), pero **no guarda el texto que se mandó** — y el mensaje de WhatsApp se arma y se va sin dejar copia. Esta es la brecha de paridad más cara del documento.

6. **Garage Hive tiene además la única función de venta que nadie más tiene: la alternativa.** _"The **Create Alternative** action creates a new group that is identical to the selected group, which you can edit to make it cheaper, discounted, or otherwise. The group can now be published online alongside the selected group, with the option for the customer to choose."_ ([docs.garagehive.com — Working With Group Items Actions](https://docs.garagehive.com/p/gxoOzrGJdo-BE4/Working-With-Group-Items-Actions)). Autorizar deja de ser sí/no y pasa a ser una elección entre dos precios. En Bitácora una Línea de servicio solo puede estar autorizada, declinada o **Sin respuesta**: no hay forma de ofrecer dos versiones del mismo trabajo.

7. **El mismo Garage Hive ata la Autorización al texto exacto que se publicó, que es la invariante del [ADR 0021](../../../apps/bitacora/docs/adr/0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md) vista desde afuera:** _"If you change a group description or price after it has been published and the customer approves it, it is not automatically marked as authorised on the document."_ Nosotros llegamos a la misma conclusión —no se puede editar un trabajo ya escrito— por el camino de prohibir la edición. Ellos la permiten y **rompen la autorización**. La suya es la solución más usable; la nuestra es más barata de construir.

8. **El canal de mensajes de Tekmetric es infraestructura estadounidense y no sirve en Costa Rica.** Tekmessage corre sobre **A2P 10DLC**, el registro de números de diez dígitos de los operadores de EE. UU.: _"10DLC refers to a system in the United States… All Tekmessage users sending messages to US phone numbers need to register… Starting February 1, 2025, carriers will be blocking all unregistered 10DLC traffic."_ ([support.tekmetric.com — Register your Tekmessage Number with 10DLC](https://support.tekmetric.com/hc/en-us/articles/7623733464087-Register-your-Tekmessage-Number-with-10DLC), leído 2026-08-29). El texto bidireccional que Tekmetric cobra en su tier de **US$439/mes** es una función que un taller tico no puede encender. La decisión de [ADR 0007](../../../apps/bitacora/docs/adr/0007-autorizacion-por-whatsapp.md) —enlace `wa.me` desde el teléfono del Asesor— no es un remiendo por no tener backend: es el canal correcto para el mercado.

9. **Ningún centro de ayuda de los verificados tiene un artículo sobre trabajar sin conexión.** Búsqueda restringida a `site:support.tekmetric.com` y `site:support.shopmonkey.io` con los términos `offline`, `internet connection`, `outage`, el 2026-08-29: **cero resultados en ambos**. Lo que sí dicen es lo contrario — Tekmetric Mobile se describe con _"real-time synchronization"_ y _"An active Tekmetric subscription is required"_. **El hueco existe y sigue abierto**, con el matiz honesto de §11.3: ausencia de artículo no es prueba de ausencia de función.

10. **Las tres C están en el producto, pero como dos cajas de texto, no como entidad.** Tekmetric Mobile lista, dentro de la Orden, _"Customer Concerns: Add and/or View Customer Concerns"_ y _"Technician Concerns: Add and/or View Technician Concerns"_ — separadas, lo cual es correcto y es más de lo que hace Shopmonkey, que tiene `Order.complaint` y `Order.recommendation` como dos campos planos de la orden (§6.2 de #15). **Ninguno modela la queja como varias instancias con su propia Especialidad**, que es exactamente lo que hace el Reporte del Cliente de Bitácora ([ADR 0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md)). Es una ventaja real y no la estamos usando para nada todavía.

11. **Los papeles del taller: ellos tienen dos documentos con interruptores; nosotros tres documentos distintos.** Shopmonkey imprime **Invoice** y **Work Order**, y la diferencia entre el papel del Cliente y el del Taller es una casilla — _"Include pricing: Toggle on to include pricing on this order"_ — más otras dos de horas y citas; la factura suma _"Include authorization history"_ e _"Include inspections"_ ([support.shopmonkey.io — Print Invoices & Work Orders](https://support.shopmonkey.io/hc/en-us/articles/44010321676052-Print-Invoices-Work-Orders), leído 2026-08-29). La decisión del [ADR 0020](../../../apps/bitacora/docs/adr/0020-la-orden-se-lee-en-su-ventana-y-se-imprime-en-tres-papeles.md) —_"cambia el contenido porque cambia quién lo lee"_— es más fina que la del líder. Pero ellos tienen algo que nosotros no: **la historia de autorizaciones se puede imprimir**.

12. **Los precios de los tres que publican no se movieron desde el 2026-08-17, y ahora se ve el descuento anual.** Verificado hoy: Tekmetric **US$199 / 349 / 439** mensual y **179 / 309 / 409** anual; Shopmonkey **US$239 / 399 / 499** mensual y **215 / 359 / 449** anual; AutoLeap **US$199 / 349 / 449** mensual y **179 / 309 / 409** anual. Mitchell 1, Shop-Ware y Garage Hive **no publican precio** (no verificado). El piso del rubro sigue siendo ~US$180–240/mes por taller.

---

## 3. Qué se verificó de primera mano y qué no

Esta sección va antes que los hallazgos a propósito. Un documento de comparación que no diga dónde no miró es propaganda.

### 3.1 Verificado leyendo la fuente primaria el 2026-08-29

| Producto                  | Qué se leyó                                                                                                                                                                            | Cobertura                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Tekmetric**             | _RO Advanced Settings_, _RO Labels and Workflow Statuses_, _Tekmetric Mobile_, _Register your Tekmessage Number with 10DLC_, _Repair Order Workflow Overview_, página de precios       | **Alta.** Recepción, obligatoriedad, estados, mensajería y precio     |
| **Shopmonkey**            | _Request Customer Authorization_, _Customer E-Signatures to Authorize Services_, _Print Invoices & Work Orders_, _Create an Estimate_, página de precios; más el esquema público (#15) | **Alta.** Autorización, impresión y precio                            |
| **Mitchell 1 Manager SE** | _Order Screen_, _Vehicle Screen_, _Customer Screen_, _Entering a New Vehicle_                                                                                                          | **Alta en recepción**, nula en precio (no lo publican)                |
| **Garage Hive**           | _Previewing and Publishing Online Documents_, _Working With Group Items Actions_, _How to Group Document Lines_, _How to Create Service Types_                                         | **Alta en autorización**, nula en precio y en check-in                |
| **Shop-Ware**             | _Adding a New Vehicle_, _Add a Service to a Work Order_                                                                                                                                | **Media.** Dos artículos; alcanza para el mínimo de campos y poco más |
| **AutoLeap**              | Solo la página de precios                                                                                                                                                              | **Baja.** Su base de conocimiento vive dentro del producto            |

### 3.2 Declarado NO VERIFICADO

Se enumeran porque el encargo los pedía y porque un hueco nombrado se puede cerrar después:

- **Protractor**, **Identifix Shop Manager**, **R.O. Writer** — **[NO VERIFICADO]**. No se abrió ninguna fuente primaria para este documento. Lo que #15 cita de ellos sigue vigente y no se amplía acá.
- **CCC ONE**, **Mitchell Cloud Estimating**, **Web-Est**, **Audatex/Qapter** — **[NO VERIFICADO]** para este documento. #15 §7 y #16 §3.1 ya documentan su modelo de colisión con fuente primaria; **nada nuevo se agrega acá**, y en particular **no se verificó su pantalla de recepción**.
- **MAM Autowork Online**, **TechMan**, **Workshop Software** — **[NO VERIFICADO]**. No se abrió su documentación.
- **Todo el mercado hispanohablante** (TallerOne, Taller Alpha, Appli-Car, AutoSoft Taller, TallerPro, y los productos españoles) — **[NO VERIFICADO]** para este documento. El relevamiento de #15 §8 es lo único que hay, y es de nivel de mercado, no de pantalla.
- **Precios de Mitchell 1, Shop-Ware, Garage Hive y de cualquier producto latinoamericano** — **[NO VERIFICADO]**. No se inventa ninguna cifra.
- **Autorox** apareció en la búsqueda como producto con integración de WhatsApp declarada, pero **no se abrió su documentación** y no se cita como evidencia.

### 3.3 Lo que ninguna búsqueda puede darnos

Ninguno de los seis deja ver el producto corriendo sin ser cliente. Todo lo de acá viene de lo que el fabricante **escribió** sobre su producto, no de haberlo usado. Donde una captura de pantalla habría sido necesaria —la densidad de la pantalla de recepción, cuántos clics cuesta— este documento no puede responder; [`acabado-visual-listas-densas.md`](./acabado-visual-listas-densas.md) §4.2 sí lo hizo para el tablero, con capturas oficiales.

---

## 4. La recepción del vehículo, mecánica fina

### 4.1 Cuántos campos exigen antes de dejar abrir la Orden

Este es el hallazgo más accionable del documento, y el resultado es incómodo para nosotros.

**[PRODUCTO] Shop-Ware — un campo.** Tres formas de meter el vehículo en la Orden: por VIN, por año/marca/modelo, o a mano. De la tercera: _"A vehicle can also be added manually through the RO by clicking the three dots in the upper right of the Vehicle section and choose to add vehicle manually. **Notice the only field required is the make.**"_ Y lo demás llega después: _"Once the vehicle has been added, you are able to fill out additional details such as the color of the car, **the plate number, odometer in**, etc."_ — [Adding a New Vehicle](https://support.shop-ware.com/s/article/Add-New-Vehicle)

Que la **placa** sea un dato adicional y la **marca** el único obligatorio es exactamente al revés de como funciona un mostrador costarricense, y es un buen recordatorio de que el producto está diseñado para un mercado donde el VIN llega con el carro.

**[PRODUCTO] Shopmonkey — cero campos, y esto se puede afirmar por esquema y no por omisión.** El artículo _Create an Estimate_ describe cuatro sitios desde donde se crea un estimado (el botón `+` de cualquier página, el botón de la página de Workflow, al agendar una cita, desde la búsqueda global y desde las páginas de Cliente, flotilla o vehículo) y **no menciona ni un solo campo obligatorio** — [Create an Estimate](https://support.shopmonkey.io/hc/en-us/articles/38743909407380-Create-an-Estimate).

Que un artículo no mencione algo es evidencia débil, así que se fue a la API pública, que sí marca la obligatoriedad campo por campo. **En `POST /v3/order` ninguno de los ~20 parámetros del cuerpo aparece marcado `Required`** — ni `customerId`, ni `vehicleId`, ni `complaint` ([Create Order](https://shopmonkey.dev/resources/order#create-order)). Y en `Create Vehicle` **el único campo obligatorio de todo el recurso es `size`** —`HeavyDuty`, `LightDuty` u `Other`—, mientras que `vin`, `make`, `model` y `customerId` son opcionales ([Create Vehicle](https://shopmonkey.dev/resources/vehicle#create-vehicle)). La Orden nace literalmente vacía y se le cuelga todo encima.

**[NO VERIFICADO]** cuántos campos exige de verdad el formulario de la pantalla: la API es el contrato del servidor, y un formulario puede ser más estricto que su propio esquema. Pero el piso está probado, y es cero.

**[PRODUCTO] Tekmetric — cero al crear, hasta nueve al cerrar, y lo decide el taller.** _RO Advanced Settings_ es literalmente una pantalla de configuración cuyo propósito declarado es _"Control which data on the repair order is required in order to complete work and post the RO"_. Los nueve interruptores:

| Interruptor                                     | Qué bloquea si está encendido                                         |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| **Odometer In & Out**                           | _"the RO will not post unless you have mileage entered"_              |
| **RO Marketing Source**                         | De dónde salió el trabajo — el equivalente del `attributionSource`    |
| **Tech on Labor**                               | Un Técnico asignado en **cada línea** de labor                        |
| **Job Category**                                | Una categoría por trabajo — el sitio donde vive su Especialidad       |
| **Purchase Orders for All Parts**               | Orden de compra con proveedor para cada repuesto                      |
| **Billing for All Parts**                       | Cada repuesto pedido asignado, devuelto o pasado a inventario         |
| **Payment Card Type**                           | Tipo de tarjeta al cobrar                                             |
| **DOT Codes for Tires**                         | Número DOT de cada llanta, por cumplimiento                           |
| **Digital Signature for Digital Authorization** | _"customers will be required to sign digital estimates they approve"_ |

Y la forma en que se cobra el incumplimiento no es un botón apagado: _"your service writer(s) will see **warning icons** throughout the estimate. This will allow them to quickly identify what information is missing."_ — [Repair Order Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings)

**[PRODUCTO] Mitchell 1 — el orden es Cliente → Vehículo → Orden, en tres paneles.** _"This is the panel that will be displayed first when you create a new Estimate, Repair Order, or Invoice"_ dice de la pantalla de Cliente; la de Vehículo se alcanza desde la pestaña de al lado y hereda el Cliente. El mínimo del vehículo es **número de licencia + año, marca y modelo**, y todo lo demás —submodelo, número de unidad, fecha de fabricación, fecha de inspección, VIN, motor, transmisión, frenos— está marcado _(Optional)_ o detrás del botón _Vehicle Detail_. — [Customer Screen](https://buymitchell1.net/managerhelp/Customerscreen.htm), [Entering a New Vehicle](https://buymitchell1.net/managerhelp/Enteringanwvechicle.htm)

**[BITÁCORA] — cuatro cosas, y las cuatro bloquean.** `recepcion.ts` no deja avanzar del paso _El carro_ sin **Placa**, **marca** y **nombre del Cliente**, ni del paso _Qué le pasa_ sin **al menos un Reporte del Cliente con texto**. Modelo, año, teléfono y Quien entrega son opcionales; el paso _Cómo entró_ entero es opcional. El acierto de forma es que el motivo se dice en una frase — _"Falta la placa."_, _"Anotá al menos una cosa de las que dijo el cliente."_ — en vez de apagar un botón sin explicación, que es la queja que #15 §2 documenta contra el rubro.

> **La lectura correcta no es "exigimos de más".** Es que **la obligatoriedad está en el momento equivocado y en el sitio equivocado**. En el momento: ellos dejan abrir y cobran al cerrar, porque el carro ya está adentro y la Orden tiene que existir aunque falte todo. En el sitio: en Tekmetric qué es obligatorio lo decide el Dueño en Ajustes; en Bitácora está escrito en un `switch` de un componente. El [ADR 0023](../../../apps/bitacora/docs/adr/0023-lo-que-se-configura-tiene-que-verse.md) ya dice que lo que se configura tiene que verse — acá hay algo que se debería poder configurar y ni siquiera se ve.

### 4.2 Cómo identifican el vehículo

| Producto        | Llave de mostrador                                      | Decodificador de VIN                                | Consulta por placa                                                          |
| --------------- | ------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| **Mitchell 1**  | **Licencia, y exige que sea única**                     | Sí, _"VIN Decode feature"_, en el panel secundario  | **[NO VERIFICADO]**                                                         |
| **Shop-Ware**   | VIN o año/marca/modelo; la placa es dato posterior      | Sí; si el VIN calza con varios modelos, pide elegir | Sí, **por integración con myCARFAX**, no propia                             |
| **Tekmetric**   | **[NO VERIFICADO]**                                     | El VIN aparece en _View RO Details_ de la app móvil | **[NO VERIFICADO]**                                                         |
| **Shopmonkey**  | `id` sintético; VIN, placa y HIN son índices (#15 §6.2) | Sí (catálogo VCdb)                                  | Campos `licensePlate` + `licensePlateState` + `licensePlateCountry`         |
| **Garage Hive** | **[NO VERIFICADO]**                                     | **[NO VERIFICADO]**                                 | **[NO VERIFICADO]**                                                         |
| **Bitácora**    | **Placa obligatoria, con historial de vigencia**        | **No hay**                                          | **No hay** — y #35 verificó que **no existe fuente pública tica** que sirva |

Dos cosas que sí se pueden concluir:

- **Nadie llavea por VIN, ni siquiera los que lo tienen a mano.** Mitchell 1 exige unicidad de **licencia**, no de VIN; Shop-Ware admite vehículos sin VIN explícitamente. Coincide con lo que #35 ya había cerrado y con `esquema.ts`, donde `Vehiculo.vin` es `string | null` sin índice único.
- **La consulta por placa que sí existe es comprada, no propia.** Shop-Ware la ofrece _"If your myCARFAX integration is enabled"_. AutoLeap pone _CARFAX Integration_ en su tier de entrada ([página de precios](https://autoleap.com/pricing/), 2026-08-29). Eso es una dependencia de un proveedor de datos norteamericano que en Costa Rica no tiene equivalente: #35 verificó seis fuentes públicas ticas y **ninguna es consultable por un backend**. **No es una brecha que podamos cerrar comprando.**

### 4.3 El Estado de entrada: lo que capturan cuando el carro entra

Lo que se encontró, con campo propio y documentado:

- **[PRODUCTO] Odómetro, en los tres.** Mitchell 1: _"Enter the incoming odometer reading in the **In** field"_ ([Order Screen](https://buymitchell1.net/managerhelp/Orderscreen.htm)). Tekmetric Mobile: _"Odometer: Enter vehicle mileage in /out"_ ([Tekmetric Mobile](https://support.tekmetric.com/hc/en-us/articles/26781766611351-Tekmetric-Mobile)), con el interruptor que lo vuelve obligatorio para postear. Shop-Ware: `odometer in` entre los _additional details_.
- **[PRODUCTO] Identificadores físicos del carro dentro del taller.** Mitchell 1 pide _"a **Hat #**, and/or **Ref #**, in accordance with your shop's policy for identifying customer vehicles"_ — el número del gancho de la llave. Es el dato más de patio que se encontró en toda la investigación, y **Bitácora no tiene nada equivalente**: el Folio hace ese papel, pero el Folio se acuña en la app y no cuelga de la llave.
- **[PRODUCTO] El motivo de la visita como catálogo.** Mitchell 1: _"Specify a reason for the visit using the **Source** pulldown menu"_, con lista editable. Tekmetric lo llama `RO Marketing Source` y puede exigirlo. **Los dos lo tratan como marketing** —de dónde vino el trabajo—, no como la queja.
- **[PRODUCTO] Fotos y video, sí, pero dentro de la inspección.** Tekmetric Mobile: _"Rate a task, add media, add notes"_, más marcado sobre la imagen con _"shapes, arrows, and or text"_. Es del Técnico y cuelga de la tarea de inspección, no del ingreso.

Lo que **no** se encontró en ninguno de los seis, con búsqueda dirigida:

- **Nivel de combustible.** Ningún campo documentado, en ninguno.
- **Daños previos al ingreso** como campo de la orden. Existe el hallazgo de inspección, que es otra cosa: nace del Técnico revisando, no del Asesor caminando alrededor del carro con el Cliente al lado.
- **Objetos que el Cliente dejó adentro.**
- **Firma del Cliente al recibir.** La única firma documentada en los seis es la de **autorizar trabajo** (§5.2), y llega después.

**[BITÁCORA]** `Orden` lleva `odometro`, `combustible` en cuartos de tanque, `danosPrevios` y `objetosDentro` como prosa dictable, más `Foto[]` colgando de la Orden, reducidas a 1600 px y WebP 0,72 ([ADR 0006](../../../apps/bitacora/docs/adr/0006-fotos-en-la-orden.md), [ADR 0022](../../../apps/bitacora/docs/adr/0022-las-fotos-se-comprimen-y-el-almacenamiento-se-pide.md)). Los cuartos de tanque salen de un razonamiento que ninguna competencia tuvo que hacer porque ninguna guarda el dato: _"es lo que la aguja permite leer"_.

> **Este es el hallazgo más favorable para nosotros de todo el documento, y hay que leerlo con cuidado.** No es que ellos no puedan capturar daños previos: es que lo hacen con una plantilla de inspección configurable, que sirve para eso y para veinte cosas más. Nosotros tenemos **cuatro campos con nombre propio** y ellos tienen **un motor de listas**. La ventaja nuestra es que el Asesor no tiene que configurar nada para que el taller quede protegido el primer día; la de ellos es que el taller que sí configura llega más lejos. Presentarlo como "ellos no capturan el estado de entrada" sería deshonesto.

### 4.4 La firma, y qué vale de verdad en Costa Rica

**[PRODUCTO]** Lo que ofrecen es firma electrónica **para autorizar trabajo**, no para recibir el carro:

- Shopmonkey: _"Requesting customer authorization with an electronic signature gives your customer a quick and easy way to give their approval while giving your shop **a written record of the authorization**."_ Y no viene de fábrica: _"If you're interested in adding the E-Signatures feature to your shop, please reach out to our support team"_ ([Customer E-Signatures to Authorize Services](https://support.shopmonkey.io/hc/en-us/articles/38743424357652-Customer-E-Signatures-to-Authorize-Services)).
- Tekmetric: interruptor `Digital Signature for Digital Authorization`, _"customers will be required to sign digital estimates they approve"_.
- AutoLeap: _"Verified eSignatures"_ en el tier de entrada ([precios](https://autoleap.com/pricing/), 2026-08-29) — **[MARKETING]**, no se pudo verificar qué significa "verified".

**Ninguno de los tres declara en la documentación leída bajo qué régimen legal vale esa firma.** No se encontró mención de ESIGN ni de UETA en las páginas leídas: es **[NO VERIFICADO]**, y probablemente vive en sus términos de servicio, que no se abrieron.

**[LEY]** Lo que sí se pudo leer entero es el régimen que nos aplica, la **Ley 8454 de Certificados, Firmas Digitales y Documentos Electrónicos** de Costa Rica:

- **Artículo 3 — equivalencia funcional:** _"Cualquier manifestación con carácter representativo o declarativo, expresada o transmitida por un medio electrónico o informático, se tendrá por jurídicamente equivalente a los documentos que se otorguen, residan o transmitan por medios físicos."_
- **Artículo 4 — fuerza probatoria:** _"Los documentos electrónicos se calificarán como públicos o privados, y se les reconocerá fuerza probatoria en las mismas condiciones que a los documentos físicos."_
- **Artículo 8 — qué es una firma digital:** el conjunto de datos _"que permita verificar su integridad, así como identificar en forma unívoca y vincular jurídicamente al autor"_; y es **certificada** solo cuando la ampara un certificado vigente de un certificador registrado.
- **Artículo 9 — valor equivalente:** _"Los documentos y las comunicaciones suscritos mediante firma digital, tendrán el mismo valor y la eficacia probatoria de su equivalente firmado en manuscrito."_
- **Artículo 10 — presunción de autoría:** solo la da la **firma digital certificada**.

Fuente: [SINALEVI — Ley de Certificados, Firmas Digitales y Documentos Electrónicos](https://sinalevi.go.cr/ResultadosNormativa/Informacion?param1=55666&param2=143022&param3=1), leída 2026-08-29.

> **La consecuencia para el producto es concreta y va contra el instinto.** Un garabato en una tableta **no es una firma digital** del artículo 8 —no verifica integridad ni vincula unívocamente al autor— así que no arrastra la presunción de autoría del artículo 10. Pero el registro electrónico **sí es un documento privado con fuerza probatoria** por los artículos 3 y 4. Es decir: **la constancia que Bitácora ya guarda no vale cero, y la firma en tableta que no tenemos no valdría mucho más.** Lo que sube el valor probatorio no es el garabato: es **la integridad y el detalle de lo que quedó registrado** — y ahí Garage Hive nos gana (§5.2), no por firmar, sino por archivar lo que el Cliente vio.

### 4.5 El Cliente y Quien entrega

**[PRODUCTO]** No se encontró en ninguno de los seis un concepto equivalente a **Quien entrega** — la persona que físicamente deja el carro en esta Visita y a quien se le avisa. Lo que hay es otra cosa:

- Mitchell 1 tiene el par Cliente/Vehículo con la operación _Change Customer_ para _"select a different customer and vehicle to substitute for the current combination assigned to this order"_, y **Unit # / Fleet ID** en el vehículo para flotillas ([Vehicle Screen](https://buymitchell1.net/managerhelp/Vehiclescr.htm)).
- Shopmonkey resuelve la flotilla con `VehicleOwner` muchos-a-muchos y `ownerCount` (#15 §6.2). Se revisaron para este documento los tres esquemas públicos donde tendría que vivir —[Order](https://shopmonkey.dev/resources/order), [Customer](https://shopmonkey.dev/resources/customer) y [Vehicle](https://shopmonkey.dev/resources/vehicle)— y **no existe ningún campo de contacto alterno, conductor ni "quién lo dejó"**: lo único que hay es el arreglo `owners` del vehículo, que es historial de propiedad, no de entrega física.
- Shop-Ware pone un _fleet number_ en el vehículo.

**Todos resuelven "este carro es de una flotilla" y ninguno resuelve "hoy lo trajo Marvin y hay que llamarlo a él".** Es el caso que el glosario de Bitácora nombra explícitamente — _"en una flotilla es un chofer distinto cada vez"_ — y `Orden.quienEntrega` lo guarda por Visita, que es donde corresponde.

**Con dos salvedades honestas:** es un campo de texto libre, no una Persona, así que no se puede llamar dos veces a la misma sin volver a escribirla; y es opcional en la Recepción. La ventaja es de modelo, no todavía de producto.

### 4.6 Cómo capturan la queja del Cliente

**[PRODUCTO] Tekmetric** es el que más se acerca: la app móvil expone dentro de la Orden _"Customer Concerns: Add and/or View Customer Concerns"_ y, aparte, _"Technician Concerns: Add and/or View Technician Concerns"_ ([Tekmetric Mobile](https://support.tekmetric.com/hc/en-us/articles/26781766611351-Tekmetric-Mobile)). Que sean **dos listas distintas** es correcto y es el mismo corte que hace el [ADR 0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md): lo que dice el Cliente no es lo que encuentra el Taller.

**[PRODUCTO] Shopmonkey** tiene `Order.complaint` y `Order.recommendation`, **dos campos planos en la orden** (#15 §6.2). Una sola queja por orden.

**[PRODUCTO] Mitchell 1** no tiene queja: tiene **Source**, un desplegable de _reason for visit_ que es de marketing.

**[PRODUCTO] Garage Hive** ataca el problema por el otro lado. No captura la queja: agrupa las **líneas del documento** en _Group Items_ _"under the same job or category"_ y las crea automáticamente desde lo marcado como _"requires attention"_ en un checklist o en defectos de ITV ([How to Group Document Lines](https://docs.garagehive.com/p/ON2BmTskQ8JbTm/How-to-Group-Document-Lines)). La unidad de conversación con el Cliente es el **grupo de trabajos**, no la queja.

**[BITÁCORA]** `ReporteDelCliente` es una tabla con `ordenId`, `textual` sin normalizar, `capturadoPor: 'dictado' | 'tecleado'`, `cuando[]`, `desdeCuando` como texto libre, `senales[]`, `especialidadSugerida`, `sugerenciaCorregida` y `posicion`. Varios por Orden, cada uno con su Especialidad sugerida.

> **Somos el único de los seis que modela la queja como entidad múltiple con Especialidad.** Y es la ventaja peor aprovechada que tenemos: hoy el Reporte se captura, se imprime en el papel del Taller y **no hace nada más**. No propone Líneas de servicio, no filtra el tablero, no alimenta ninguna cuenta. Es un activo de modelo esperando una pantalla.

---

## 5. La orden de trabajo

### 5.1 Dónde vive la Especialidad

Cerrado en [`organizacion-multiespecialidad.md`](./organizacion-multiespecialidad.md) §4 con seis productos: **la Especialidad vive en la línea, no en la orden**, unánimemente. Lo único que este documento agrega es una confirmación operativa que no estaba: Tekmetric permite **exigir** la categoría del trabajo antes de cerrar — _"you will not be able to complete the work or post the RO unless you have a job category assigned to each job"_ ([RO Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings)).

O sea: no solo la categoría vive en el trabajo, sino que el taller puede **volver obligatorio** que cada trabajo la lleve. En Bitácora `LineaServicio.especialidad` no es nulable, así que la invariante es más fuerte por construcción — pero también significa que **no se puede anotar un trabajo antes de saber de qué oficio es**, y en un diagnóstico eso pasa.

### 5.2 La Autorización y, sobre todo, la constancia

Que se autoriza línea por línea ya lo sabíamos (#15 §6.5, #16 §4). Lo nuevo es **qué queda escrito**.

**[PRODUCTO] Shopmonkey — dos caminos y el medio se registra.** Por el lado del Cliente: se manda el estimado con dos interruptores, _Request Authorization_ y _Request E-signature_; el Cliente _"can authorize the service by selecting the checkbox to the right of the service"_ y confirma con **Authorize Service(s)** — es decir, **autorización parcial de verdad, trabajo por trabajo**. Por el lado del Taller: pestaña **Authorizations → Authorize**, _"Approve or decline each service, and **select the method in which the customer has authorized** the services"_ ([Request Customer Authorization](https://support.shopmonkey.io/hc/en-us/articles/38743372579988-Request-Customer-Authorization)). Es exactamente la forma de `Autorizacion { autorizadaPor, medio, autorizadaEn }` de Bitácora.

**[PRODUCTO] Garage Hive — la constancia más completa que se encontró.** Cuatro mecanismos, todos verificados hoy en [Previewing and Publishing Online Documents](https://docs.garagehive.com/p/gFfa6lg5AJdkz7/Previewing-and-Publishing-Online-documents):

1. **Se archiva lo que el Cliente vio, con el texto de presentación.** _"The Intro Text you send with an Online Authorisation is saved against the published document. You can check exactly what was sent later from the Archived Versions, which helps if there's ever a question about what the customer was told. If you leave the intro text blank, the archive shows it as blank."_
2. **Se registra cuándo lo abrió.** _"you can see how many edit versions of the document are available, **when the published online document was opened**, when it will expire."_
3. **Editar después de publicar invalida lo mandado.** _"If the document is edited after it has been published, it must be republished. The previously sent document version is **revoked** and customer needs to use the latest online document link."_ Y en el otro artículo: _"If you change a group description or price after it has been published and the customer approves it, it is not automatically marked as authorised."_
4. **La foto viaja con el documento y se congela.** _"The image is copied onto the document when you send it, so it stays the same even if the vehicle on the job is changed later."_

Y una función de venta que nadie más tiene: **Create Alternative**, un grupo gemelo más barato publicado **junto** al original, _"with the option for the customer to choose"_.

**[BITÁCORA]** `Autorizacion { lineaId, autorizadaPor, medio, autorizadaEn }` con la invariante del [ADR 0021](../../../apps/bitacora/docs/adr/0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md): nunca autorizada y declinada a la vez, autorizar dos veces no apila, deshacer la declinación no devuelve la autorización anterior. El estado **Sin respuesta** existe y es lo único que entra en el mensaje de WhatsApp. Pero:

- **No se guarda el texto que se mandó.** El enlace `wa.me` se arma, abre WhatsApp y se pierde. Si el Cliente dice _"a mí nunca me pasaron ese precio"_, la Orden puede decir quién autorizó pero no puede reproducir lo que se ofreció.
- **No se sabe si lo leyeron.** El [ADR 0009](../../../apps/bitacora/docs/adr/0009-aviso-de-listo-con-constancia.md) lo dice de frente: _"La constancia dice que se mandó el mensaje, no que lo leyeron."_ Garage Hive sí lo sabe.
- **No hay alternativa.** Una Línea tiene un monto y una respuesta.

### 5.3 El Trabajo declinado

Cerrado en #15 §6.5 con fuente primaria de Shopmonkey (`deferredReason`, `revived`, `revivedFromId`) y de Tekmetric (declinado vs. borrador). Lo nuevo de este documento son **dos** cosas:

**[PRODUCTO] Mitchell 1 lo llama _Recommendations_ y lo pone en el Vehículo, no en la Orden.** _"Type in any recommendations to be viewed at the next customer visit"_, y la señal es visual: _"Any time there is a recommendation present for the vehicle, the Vehicle tab is highlighted in a different color (normally green)"_ ([Vehicle Screen](https://buymitchell1.net/managerhelp/Vehiclescr.htm), [Entering a New Vehicle](https://buymitchell1.net/managerhelp/Enteringanwvechicle.htm)). Es la misma idea del glosario —_"vuelve a proponerse cuando el Vehículo regresa"_— resuelta con una pestaña de color en un producto de escritorio.

**[PRODUCTO] Shopmonkey lo imprime.** El interruptor _"Include authorization history"_ mete el historial de autorizaciones en la factura impresa ([Print Invoices & Work Orders](https://support.shopmonkey.io/hc/en-us/articles/44010321676052-Print-Invoices-Work-Orders)).

**[BITÁCORA]** `LineaServicio.declinadaEn` + `motivoDeclinacion`, con índice `[tallerId+declinadaEn]`, y `recepcion.ts` lo resucita **al reconocer la Placa** durante la Recepción — que es el momento exacto en que el carro regresa. Además el papel del Cliente lleva lo declinado **en recuadro** ([ADR 0020](../../../apps/bitacora/docs/adr/0020-la-orden-se-lee-en-su-ventana-y-se-imprime-en-tres-papeles.md)) y Próximas visitas trae a la vista lo declinado de cada carro ([ADR 0024](../../../apps/bitacora/docs/adr/0024-el-ciclo-no-es-una-linea-recta-y-entregar-es-su-propio-verbo.md)).

**Estamos a la par en el mecanismo y por debajo en dos detalles:** no distinguimos _declinado por el Cliente_ de _propuesto y nunca mostrado_ —el estado **Sin respuesta** existe pero no sobrevive al cierre de la Orden como razón de diferimiento—, y la Línea resucitada **no apunta a la original**, así que no se puede decir _"esto se recomendó hace ocho meses"_.

### 5.4 Los estados de la Orden

**[PRODUCTO] Tekmetric — tres columnas fijas, estados no configurables, etiquetas sí.** La distinción es explícita: _"labels are configurable and can be fully customized by column to fit the needs of your shop while **statuses cannot be changed**"_. Los estados, por columna:

- **Estimates:** `Requires authorization` (hay trabajo pero no se le ha mandado al Cliente) · `Pending` (mandado, esperando) · `Declined` (todos los trabajos declinados).
- **Work-In-Progress:** `Not started` (aprobado pero el reloj no arrancó) · `X of Y hours (sublets)`.
- **Completed:** `Balance due` · `Ready to post`.
- **De pago, transversales:** `Credit due` · `Partially paid` · `Paid`.

Y se mueven solos: _"when an RO is approved by you or your customer, it will automatically move from the Estimates to Work-In-Progress column"_ ([RO Labels and Workflow Statuses](https://support.tekmetric.com/hc/en-us/articles/360039292193-RO-Labels-and-Workflow-Statuses)). El taller ajusta hasta **20 etiquetas por columna, de 22 caracteres**.

**[PRODUCTO] Shopmonkey** separa tipo de documento (`Estimate | RepairOrder | Invoice`) de posición en un tablero **configurable por local** (#15 §6.1).

**[BITÁCORA]** Seis estados —`recibido`, `diagnostico`, `en-proceso`, `esperando-repuesto`, `listo`, `entregado`— que **se mueven en cualquier dirección**, con `entregado` y el Aviso de listo como verbos propios ([ADR 0024](../../../apps/bitacora/docs/adr/0024-el-ciclo-no-es-una-linea-recta-y-entregar-es-su-propio-verbo.md)).

> **Los dos modelos son opuestos y los dos tienen razón.** Tekmetric fija los estados y automatiza el movimiento, pero deja al taller escribir sus propias etiquetas: el sistema manda y el taller decora. Bitácora fija los rótulos y deja libre el movimiento: el taller manda y el sistema describe. **La consecuencia práctica es que sus estados le sirven a él para reportar y los nuestros no**: un estado que se mueve libre y a mano no sostiene un cálculo de tiempo por etapa. El `workflowStatusDuration` de Shopmonkey (#15 §6.1) mide cuánto lleva la orden en cada columna; nosotros solo medimos el Tiempo parado total.

### 5.5 La comunicación con el Cliente

**[PRODUCTO] Todo pasa por dentro del producto, con número del taller, y por SMS.** Tekmetric vende _Two-Way Texting_ en el tier de US$439; Shopmonkey pone texto y correo bidireccional en el de US$239; Garage Hive publica documentos con SMS y correo, con textos guardados reutilizables.

**Y ahí está el hallazgo:** ese canal es **infraestructura de EE. UU. y Canadá**. Tekmessage exige registro **A2P 10DLC** ante _The Campaign Registry_, _"a system in the United States"_, con bloqueo total del tráfico no registrado desde el 1.° de febrero de 2025; el registro _"is not required in Canada"_ salvo que se mande a números de EE. UU. ([Register your Tekmessage Number with 10DLC](https://support.tekmetric.com/hc/en-us/articles/7623733464087-Register-your-Tekmessage-Number-with-10DLC)).

**No se encontró en ninguno de los seis una integración documentada de WhatsApp.**

**[BITÁCORA]** Enlace `wa.me` prellenado desde el teléfono del Asesor, sin servidor, para la Autorización ([ADR 0007](../../../apps/bitacora/docs/adr/0007-autorizacion-por-whatsapp.md)) y para el Aviso de listo ([ADR 0009](../../../apps/bitacora/docs/adr/0009-aviso-de-listo-con-constancia.md)), con `AvisoDeListo { avisadoA, medio, avisadoEn }` como hecho registrado.

> **Lo que era una limitación resulta ser posicionamiento.** El ADR 0007 eligió `wa.me` porque no hay backend. Pero el canal correcto para Costa Rica **no es el SMS con número propio del taller**, que es lo que ellos cobran caro y que su propia documentación reconoce como un trámite ante los operadores estadounidenses. Es WhatsApp. Lo que nos falta no es el canal: es **guardar copia de lo que se mandó** (§5.2).

### 5.6 Los papeles de la Orden

**[PRODUCTO] Shopmonkey — dos documentos, seis interruptores.** Del artículo [Print Invoices & Work Orders](https://support.shopmonkey.io/hc/en-us/articles/44010321676052-Print-Invoices-Work-Orders):

| Documento      | Interruptores                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Invoice**    | Include messages · **Include authorization history** · Include appointments · Include inspections · Include line item type |
| **Work Order** | Include labor hours · **Include pricing** · Include appointments                                                           |

Y una advertencia que delata el diseño: _"Once these settings are selected, the same settings will be applied for all new orders created thereafter."_ **Es una preferencia global, no una decisión por impresión.**

**[BITÁCORA]** Tres documentos con contenido distinto — Taller sin montos y con la queja en las palabras del Cliente, Cliente con lo hecho y lo declinado en recuadro, Archivo con todo y el Estado de entrada ([ADR 0020](../../../apps/bitacora/docs/adr/0020-la-orden-se-lee-en-su-ventana-y-se-imprime-en-tres-papeles.md)) — impresos con `window.print()` y una hoja de estilo, sin librería ni servidor.

**Estamos mejor en el corte y peor en dos detalles:** su factura puede llevar el historial de autorizaciones y la inspección; nuestros papeles no llevan ninguna de las dos, y las Fotos no salen impresas en ninguno.

### 5.7 Técnicos, relojes y horas

Cerrado en #15 §6.4 y #16 §4. Lo que este documento agrega es cuándo el Técnico cobra: Tekmetric deja elegir entre **Job Completed**, **RO Completed** y **RO Posted or sent to A/R**, y advierte que _"The setting you select will affect your Technician Billed Hours report and how the data is generated"_ ([RO Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings)).

**[BITÁCORA]** Un **Responsable** por Orden, no un ejecutor por Línea ([ADR 0003](../../../apps/bitacora/docs/adr/0003-tablero-unico-y-un-responsable-por-orden.md)). `horasFacturadas` y `horasReales` existen separadas desde el día uno —lo correcto según #15 §6.4— pero `horasReales` **sigue en cero**: no hay reloj y no hay quién la llene ([ADR 0021](../../../apps/bitacora/docs/adr/0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md)). Esta es una brecha declarada, no un descubrimiento.

### 5.8 Sin conexión

La pregunta más importante y la que menos evidencia positiva tiene, en las dos direcciones.

**Lo que se buscó y no apareció:** búsquedas restringidas a `site:support.tekmetric.com` y `site:support.shopmonkey.io` con `offline`, `internet connection` y `outage`, el 2026-08-29. **Cero resultados en ambos casos.**

En el caso de Shopmonkey la búsqueda se rehízo contra el buscador interno del propio centro de ayuda —`support.shopmonkey.io/api/v2/help_center/articles/search.json`, la API de Zendesk que indexa sus artículos—, que es más fiable que un buscador externo porque no depende de qué haya rastreado Google. `offline` devolvió **un solo artículo, sobre disputas de pagos con tarjeta**, sin relación; `connection` devolvió 40 resultados, todos de configuración de lectores de tarjeta y de integraciones. **Ninguno sobre operar la aplicación sin internet.** La app móvil _Shopmonkey for Techs_ tampoco lo menciona en su propio artículo.

**Lo que sí dicen sus propias páginas:**

- Tekmetric Mobile: _"real-time synchronization, keeping your entire team informed"_ y _"An active Tekmetric subscription is required"_ — **[MARKETING]/[PRODUCTO]**, describe sincronización continua, no almacenamiento local.
- Shopmonkey y Garage Hive corren en el navegador contra su servidor; Garage Hive sobre Microsoft Dynamics 365 Business Central.
- **Mitchell 1 Manager SE es la única excepción posible**, porque es una aplicación de Windows instalada con base local. **[NO VERIFICADO]:** su ayuda no dice qué funciona sin internet y qué no. Lo verificable es que sus funciones de catálogo y de correo son en línea.

**[BITÁCORA]** Todo se escribe en Dexie sobre IndexedDB, con la cola de operaciones llenándose desde el día uno aunque nadie la drene ([ADR 0014](../../../apps/bitacora/docs/adr/0014-capa-de-datos-sobre-indexeddb.md)). El Folio se acuña con la letra del Puesto y consecutivo propio, precisamente para que dos Puestos incomunicados no choquen ([ADR 0010](../../../apps/bitacora/docs/adr/0010-folio-con-prefijo-de-puesto.md)). Imprimir funciona sin conexión ([ADR 0020](../../../apps/bitacora/docs/adr/0020-la-orden-se-lee-en-su-ventana-y-se-imprime-en-tres-papeles.md)). Registrar la Autorización y el Aviso de listo funciona sin conexión; **mandar el mensaje no**, porque eso lo hace WhatsApp.

> **Conclusión honesta:** que no exista el artículo no prueba que no exista la función, y la evidencia negativa por búsqueda es la más débil de este documento (§11.3). Pero **la evidencia positiva tampoco aparece por ningún lado**, y lo que sí aparece —_"real-time synchronization"_, suscripción activa requerida, 10DLC— apunta al otro lado. **Con lo verificado, la numeración de Folios por Puesto para trabajar desconectado no tiene análogo conocido en el rubro.**

---

## 6. Tabla comparativa: producto × capacidad

Leyenda: **Sí** = verificado en fuente primaria · **No** = verificado que no lo tiene · **?** = no verificado, no se afirma nada · **Parcial** = lo hace de otra forma, explicada en la nota.

| Capacidad                                            | Tekmetric                         | Shopmonkey                        | Shop-Ware         | Mitchell 1 SE               | Garage Hive                   | AutoLeap           | **Bitácora**                              |
| ---------------------------------------------------- | --------------------------------- | --------------------------------- | ----------------- | --------------------------- | ----------------------------- | ------------------ | ----------------------------------------- |
| Campos obligatorios para **crear**                   | 0                                 | 0                                 | **1** (marca)     | Licencia + año/marca/modelo | ?                             | ?                  | **4** (placa, marca, cliente, ≥1 Reporte) |
| Obligatoriedad **configurable** por el taller        | **Sí** (9 interruptores)          | ?                                 | ?                 | ?                           | ?                             | ?                  | **No** (fija en el código)                |
| Se bloquea al **cerrar**, no al crear                | **Sí**                            | ?                                 | ?                 | ?                           | ?                             | ?                  | **No**                                    |
| Placa como llave del mostrador                       | ?                                 | Índice, no llave                  | Dato posterior    | **Sí, única**               | ?                             | ?                  | **Sí, con vigencia**                      |
| Decodificador de VIN                                 | ?                                 | Sí                                | **Sí**            | **Sí**                      | ?                             | ?                  | **No**                                    |
| Consulta por placa                                   | ?                                 | ?                                 | Sí (myCARFAX)     | ?                           | ?                             | Sí (CARFAX)        | **No** (no hay fuente tica, #35)          |
| Odómetro de entrada                                  | **Sí**                            | Sí                                | **Sí**            | **Sí** (campo `In`)         | ?                             | ?                  | **Sí**                                    |
| Combustible al recibir                               | No encontrado                     | No encontrado                     | No encontrado     | No encontrado               | ?                             | ?                  | **Sí** (cuartos de tanque)                |
| Daños previos como campo de la Orden                 | Parcial (en la inspección)        | Parcial (en la inspección)        | Parcial           | No encontrado               | Parcial (checklist)           | Parcial            | **Sí**                                    |
| Objetos dentro del carro                             | No encontrado                     | No encontrado                     | No encontrado     | No encontrado               | ?                             | ?                  | **Sí**                                    |
| Fotos al recibir                                     | Parcial (vía inspección)          | Parcial (vía inspección)          | ?                 | Adjuntos por línea          | Sí (imagen del vehículo)      | Parcial            | **Sí, en la Orden**                       |
| Firma del Cliente **al recibir**                     | No encontrado                     | No encontrado                     | ?                 | ?                           | ?                             | ?                  | **No**                                    |
| Firma electrónica **al autorizar**                   | **Sí** (exigible)                 | **Sí** (se pide a soporte)        | ?                 | ?                           | ?                             | Sí (marketing)     | **No**                                    |
| Dueño ≠ **Quien entrega** en esta Visita             | No encontrado                     | No (es `ownerCount`)              | No (fleet number) | No (_Change Customer_)      | ?                             | ?                  | **Sí**                                    |
| Queja del Cliente como **entidad múltiple**          | Parcial (dos listas)              | No (2 campos planos)              | ?                 | No (_Source_)               | No (grupos)                   | ?                  | **Sí, con Especialidad**                  |
| Dictado por voz en la recepción                      | ?                                 | ?                                 | ?                 | ?                           | ?                             | ?                  | **Sí** (ADR 0004)                         |
| Especialidad en la línea, no en la Orden             | **Sí** (exigible)                 | **Sí**                            | ?                 | ?                           | Sí (grupos)                   | ?                  | **Sí**                                    |
| Autorización **por trabajo**                         | **Sí**                            | **Sí**                            | ?                 | ?                           | **Sí** (por grupo)            | ?                  | **Sí**                                    |
| Autorización **parcial** por el Cliente              | Sí                                | **Sí** (casilla por servicio)     | ?                 | ?                           | **Sí**                        | ?                  | **Sí** (el Asesor la transcribe)          |
| Constancia con **medio** y persona                   | ?                                 | **Sí**                            | ?                 | ?                           | Sí                            | ?                  | **Sí**                                    |
| **Copia de lo que se le mandó al Cliente**           | ?                                 | Parcial (imprimible)              | ?                 | ?                           | **Sí** (archivo de versiones) | ?                  | **No**                                    |
| Saber si el Cliente **abrió** el documento           | ?                                 | ?                                 | ?                 | ?                           | **Sí**                        | ?                  | **No**                                    |
| Editar tras publicar **rompe** la autorización       | ?                                 | ?                                 | ?                 | ?                           | **Sí**                        | ?                  | Parcial (no se puede editar)              |
| **Alternativa** más barata para que el Cliente elija | ?                                 | ?                                 | ?                 | ?                           | **Sí**                        | ?                  | **No**                                    |
| Trabajo declinado con motivo                         | **Sí**                            | **Sí**                            | ?                 | Sí (_Recommendations_)      | Sí (ámbar)                    | ?                  | **Sí**                                    |
| Se resucita en la próxima Visita                     | Sí (historial en la RO)           | **Sí** (`revivedFromId`)          | ?                 | **Sí** (pestaña verde)      | ?                             | ?                  | **Sí** (al reconocer la Placa)            |
| La línea revivida **apunta a la original**           | ?                                 | **Sí**                            | ?                 | ?                           | ?                             | ?                  | **No**                                    |
| Estados de la Orden                                  | 8 fijos + etiquetas configurables | 3 tipos + tablero configurable    | ?                 | ?                           | ?                             | ?                  | **6, libres en cualquier dirección**      |
| Duración por etapa medida                            | Parcial                           | **Sí** (`workflowStatusDuration`) | ?                 | ?                           | ?                             | ?                  | **No** (solo Tiempo parado total)         |
| Tablero **ordenado por Tiempo parado**               | No (#72 §4.1)                     | No                                | No (por técnico)  | No                          | No (por técnico)              | No                 | **Sí**                                    |
| **Aviso de listo como constancia**                   | ?                                 | ?                                 | ?                 | ?                           | ?                             | ?                  | **Sí**                                    |
| **Vehículo sin recoger** señalado en el tablero      | ?                                 | Parcial (órdenes inactivas)       | ?                 | ?                           | ?                             | ?                  | **Sí, con umbral configurable**           |
| Canal de mensajes propio                             | SMS (solo EE. UU./Canadá)         | SMS + correo                      | ?                 | Correo con PDF              | SMS + correo                  | ?                  | **WhatsApp** (fuera del sistema)          |
| Documentos impresos distintos                        | ?                                 | **2** con interruptores           | ?                 | Estimado/Orden/Factura      | Documento en línea            | ?                  | **3, con contenido distinto**             |
| Historial de autorizaciones imprimible               | ?                                 | **Sí**                            | ?                 | ?                           | ?                             | ?                  | **No**                                    |
| Multi-técnico por línea                              | **Sí** (exigible)                 | **Sí**                            | ?                 | ?                           | Sí (TCards)                   | Sí                 | **No**                                    |
| Horas reales contra facturadas                       | **Sí**                            | **Sí**                            | ?                 | Sí                          | ?                             | Sí                 | **Campos sí, datos no**                   |
| Repuestos: catálogo y pedido                         | **Sí**                            | **Sí**                            | Sí (MOTOR)        | Sí                          | Sí (TecDoc)                   | Sí                 | **No**                                    |
| Facturación / contabilidad                           | Sí                                | Sí (QBO)                          | ?                 | Sí                          | Sí (BC)                       | Sí (QBO)           | **No**                                    |
| Factura electrónica de Hacienda CR                   | No                                | No                                | No                | No                          | No                            | No                 | **No** (pendiente, #15 §12.7)             |
| **Funciona sin conexión**                            | No documentado                    | No documentado                    | No documentado    | **?** (escritorio)          | No documentado                | No documentado     | **Sí, por diseño**                        |
| **Folio numerado por Puesto**                        | ?                                 | ?                                 | ?                 | ?                           | ?                             | ?                  | **Sí**                                    |
| Precio de lista publicado                            | **US$199/349/439**                | **US$239/399/499**                | **No publica**    | **No publica**              | **No verificado**             | **US$199/349/449** | n/a                                       |

---

## 7. Brechas de paridad

Lo que **todos o casi todos** tienen y nosotros no, ordenado por lo que cuesta no tenerlo. El costo se estima por lo que se pierde en la conversación de venta o en la defensa del Taller, no por dificultad de construcción.

### 7.1 No guardamos copia de lo que se le mandó al Cliente — **la más cara**

Garage Hive archiva la versión publicada y el texto de presentación; Shopmonkey puede imprimir el historial de autorizaciones. Nosotros armamos un mensaje de WhatsApp que se va y **no queda copia en la Orden**.

Es la brecha más cara porque golpea justo donde el [ADR 0021](../../../apps/bitacora/docs/adr/0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md) dice que la constancia tiene valor: _"existe para que alguien pueda apoyarse en ella meses después"_. Hoy la constancia dice **quién** y **cuándo**, no **qué**. Y por §4.4, el valor probatorio del documento electrónico viene de su contenido, no de la firma.

Lo barato de cerrar: el texto ya se construye para el enlace `wa.me`. Guardarlo es una columna más.

### 7.2 La obligatoriedad está fija en el código y en el momento equivocado

Tekmetric la vuelve nueve interruptores del Dueño y la cobra al cerrar. Nosotros la escribimos en un `switch` y la cobramos al crear. Cuesta en el peor momento posible: con el Cliente de pie enfrente y el carro entrando.

### 7.3 No hay decodificador de VIN ni ninguna ayuda para llenar el vehículo

Cuatro de los seis tienen decodificador; dos tienen consulta por placa comprada. Nosotros no tenemos nada, y el paso _El carro_ exige marca. El agravante es de mercado: #35 verificó que **no existe fuente pública tica consultable**, así que esto no se cierra comprando una integración. Se cierra con memoria: la Placa ya reconocida trae el carro entero, y eso ya funciona.

### 7.4 No hay firma electrónica de ningún tipo

Tres de los seis la tienen para autorizar. La leemos con el matiz de §4.4 —no arrastra presunción de autoría en Costa Rica— pero **es una casilla en una comparación de venta**, y la ausencia se nota antes de que nadie discuta su valor legal.

### 7.5 Un solo Responsable, sin reloj y con `horasReales` en cero

Los cinco que se pudieron verificar asignan Técnico por línea y miden dos relojes. Es una decisión consciente ([ADR 0003](../../../apps/bitacora/docs/adr/0003-tablero-unico-y-un-responsable-por-orden.md)) y el precio también: sin ejecutor por Línea no hay eficiencia por persona ni por Especialidad, que es medio panel de KPIs.

### 7.6 No medimos la duración de cada estado

`workflowStatusDuration` de Shopmonkey da el cycle time gratis. Nuestro estado se mueve libre y a mano ([ADR 0024](../../../apps/bitacora/docs/adr/0024-el-ciclo-no-es-una-linea-recta-y-entregar-es-su-propio-verbo.md)), así que aunque guardáramos la duración sería sospechosa. Es una consecuencia del diseño, no un olvido — y por eso es la más difícil de cerrar sin contradecir una decisión.

### 7.7 Repuestos, inventario y facturación

No los tenemos y no están en alcance. Se listan porque en la comparación de venta pesan, y porque la factura electrónica de Hacienda es **requisito de entrada** en el mercado tico según #15 §12.7, no un extra.

---

## 8. Ventajas que ya tenemos

Cada una con la evidencia de que la competencia verificada **no** la tiene.

### 8.1 El Folio numerado por Puesto, para trabajar sin conexión

**Nadie más que se haya podido verificar numera las órdenes por terminal.** No apareció ni una mención en las fuentes leídas. Lo que existe en el rubro es prefijo por **sucursal**, que resuelve un problema distinto (multi-local), no el de dos aparatos incomunicados acuñando el mismo número.
Evidencia nuestra: [ADR 0010](../../../apps/bitacora/docs/adr/0010-folio-con-prefijo-de-puesto.md), `Puesto { letra, consecutivo }` en `esquema.ts`.

### 8.2 Funcionar sin conexión

Cero artículos sobre offline en los centros de ayuda de Tekmetric y Shopmonkey (§5.8), contra _"real-time synchronization"_ y suscripción activa requerida. Nosotros escribimos en IndexedDB por diseño.
**Advertencia de honestidad:** esto es hoy tanto una ventaja como una limitación — no hay servidor, así que tampoco hay respaldo ni un carro visible desde dos aparatos. La ventaja es real **si el producto llega a tener backend sin perder la escritura local**; si no, es una restricción con buena prensa.

### 8.3 El tablero ordenado por Tiempo parado

Ninguno de los cinco tableros mirados de primera mano en [`acabado-visual-listas-densas.md`](./acabado-visual-listas-densas.md) §4.1–4.2 ordena por cuánto lleva el carro adentro: Shop-Ware ordena **por técnico**, Tekmetric por columnas fijas, y ni siquiera Linear —la referencia moderna— deja ordenar por su _time in status_.
Evidencia nuestra: [ADR 0003](../../../apps/bitacora/docs/adr/0003-tablero-unico-y-un-responsable-por-orden.md) y `ordenes.store.ts`, que ordena descendente por `tiempoParado`.

### 8.4 El Aviso de listo como constancia, y el Vehículo sin recoger señalado

No se encontró en ninguno de los seis un hecho registrado de "se le avisó a esta persona, este día, por este medio", ni un indicador de tablero para el carro terminado que nadie recoge. Lo más cercano es _Inactive Orders_ de Shopmonkey, que es otra cosa: mide inactividad del documento, no un carro ocupando espacio después de avisado.
Evidencia nuestra: [ADR 0009](../../../apps/bitacora/docs/adr/0009-aviso-de-listo-con-constancia.md), [ADR 0024](../../../apps/bitacora/docs/adr/0024-el-ciclo-no-es-una-linea-recta-y-entregar-es-su-propio-verbo.md), `AvisoDeListo` en `esquema.ts`, y el umbral `diasParaSinRecoger` configurable por el Dueño.

### 8.5 El Estado de entrada con nombre propio, sin configurar nada

Ningún competidor verificado tiene campo para combustible ni para objetos dentro del carro (§4.3). Los daños previos existen, pero dentro de una plantilla de inspección que alguien tiene que armar. En Bitácora el Taller queda protegido el primer día sin configurar nada.

### 8.6 El Reporte del Cliente como entidad múltiple con Especialidad

Tekmetric separa quejas del Cliente de quejas del Técnico —bien— pero ninguno de los seis modela **varias quejas por Orden, cada una con su Especialidad**. Es la ventaja de modelo más limpia que tenemos y la menos explotada (§4.6).

### 8.7 WhatsApp como canal, contra SMS registrado en EE. UU.

El canal que ellos cobran caro no se puede encender en Costa Rica (§5.5). El nuestro es el que el Cliente ya tiene abierto.

### 8.8 Tres papeles con contenido distinto

Shopmonkey resuelve con interruptores globales lo que nosotros resolvemos con tres documentos pensados para tres lectores (§5.6).

---

## 9. Dónde podemos superarlos

Huecos del rubro entero, no diferencias de implementación. Cada uno con lo que costaría y con la advertencia de dónde la evidencia es débil.

### 9.1 Guardar lo que el Cliente vio, pero por WhatsApp

Garage Hive es el único que archiva lo publicado, y lo hace porque publica un documento en su servidor. **Nosotros podemos archivar el texto sin servidor**: el mensaje de WhatsApp se arma en el aparato, así que guardarlo en la Orden es una escritura local más. Quedaríamos con la constancia más fuerte del rubro **en el canal que el rubro no usa**, y sin infraestructura.
Sigue faltando lo que ellos sí tienen y nosotros no podemos: saber si lo abrieron.

### 9.2 La alternativa más barata, que solo Garage Hive tiene

Ofrecer dos versiones de la misma Línea de servicio para que el Cliente elija convierte la Autorización de un sí/no en una venta. En un modelo donde el Asesor **transcribe** la respuesta ([ADR 0007](../../../apps/bitacora/docs/adr/0007-autorizacion-por-whatsapp.md)) esto es barato: no hace falta que el Cliente toque nada, solo que el mensaje lleve dos precios y que la Línea sepa cuál se aceptó.

### 9.3 El Reporte del Cliente que propone la Línea de servicio

Hoy la Sugerencia adivina la Especialidad de la queja y ahí se queda. El paso siguiente —que el Reporte proponga una Línea de servicio con su Especialidad ya puesta, siempre corregible— **no lo hace nadie**, porque nadie tiene la queja modelada como entidad con Especialidad. Cierra el bucle que #15 §1 identificó como la razón de compra del rubro, empezando desde el mostrador en vez de desde la inspección.

### 9.4 El taller mixto mecánica + pintura

#15 §7.4 y #16 §5.9 ya cerraron que **nadie lo resuelve**, y que la razón es el dominio de la aseguradora sobre el estimado de colisión en EE. UU. **Nada de lo verificado hoy lo contradice.** Sigue siendo el hueco más grande y el más incierto: depende de la pregunta abierta de #15 §12.1 sobre la dinámica de seguros en Costa Rica, que sigue sin responder.

### 9.5 Numerar por Puesto como argumento de venta, no como detalle técnico

Ningún competidor lo tiene y ninguno lo necesita, porque todos asumen conexión. En un taller con dos tabletas y una conexión mala, **es la diferencia entre trabajar y no trabajar**. Ya está construido ([ADR 0010](../../../apps/bitacora/docs/adr/0010-folio-con-prefijo-de-puesto.md)); lo que falta es que Fase 1 tenga más de un Puesto para poder enseñarlo.

### 9.6 El Vehículo sin recoger como reporte, no solo como insignia

Ya lo señalamos en el tablero. Nadie más lo hace. El paso siguiente es lo que un Dueño preguntaría: **cuántos días-carro de espacio se está comiendo el taller en carros que ya están listos**. Es un número que ningún competidor verificado puede dar y que sale de datos que ya tenemos.

---

## 10. Precio y empaquetado, verificado hoy

**[PRODUCTO] Tekmetric** — https://www.tekmetric.com/pricing (2026-08-29)

| Tier           | Mensual   | Anual     | Qué agrega                                                                                                      |
| -------------- | --------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| **Start**      | US$199    | US$179    | Inventario y proveedores · **Inspecciones digitales** · Smart Jobs · **Autorizaciones digitales y facturación** |
| **Grow**       | US$349    | US$309    | Guía de labor · Programas de mantenimiento · **Relojes de tiempo y de trabajo** · Reportes                      |
| **Scale**      | US$439    | US$409    | **Texto bidireccional** · Tablero en tiempo real · Tablero de técnicos · Analítica de empleados                 |
| **Enterprise** | a cotizar | a cotizar | Pagos integrados · gerente de cuenta · revisiones trimestrales                                                  |

Complementos: multi-taller **+US$70/mes/taller**, suite de llantas **+US$39**, marketing **+US$345/mes/taller**.

**[PRODUCTO] Shopmonkey** — https://www.shopmonkey.io/pricing (2026-08-29). Declara _"Save up to 10% with annual pricing"_.

| Tier       | Mensual | Anual  | Qué agrega                                                                                            |
| ---------- | ------- | ------ | ----------------------------------------------------------------------------------------------------- |
| **Basic**  | US$239  | US$215 | Texto y correo bidireccional · DVI · firma electrónica · pagos · pedido de repuestos                  |
| **Clever** | US$399  | US$359 | **Flujo de trabajo configurable** · guías de labor · inventario · QBO · **reloj de tiempo** · ALLDATA |
| **Genius** | US$499  | US$449 | Reseñas de Google · diagramas y procedimientos · seguimiento automático de estimados                  |

Tres cosas del empaquetado de Shopmonkey que no se ven en la tabla y que cambian la comparación de precio:

- **La inspección digital está capada en el tier de entrada**: Basic trae **dos plantillas** de DVI; se vuelven ilimitadas hasta Clever, US$160/mes más arriba.
- **La consulta por placa es del tier más caro y además necesita Carfax activado.** El decodificador de VIN sí está en todos los tiers; poder escribir la placa en el buscador y que resuelva el vehículo es exclusivo de Genius — [Add Vehicles](https://support.shopmonkey.io/hc/en-us/articles/38743934303252-Add-Vehicles).
- **Cobran US$500 una sola vez por migrar los datos**, al pie de _Data Migration Assistance_. Es el número que #15 §5 describía como la barrera de salida del rubro, ahora con precio.

Y por fuera de cualquier plan: CRM Essentials US$314–349/mes, Bookkeeping US$314–349/mes, Accounting US$89–99/mes, Heavy Duty a cotizar. **[NO VERIFICADO]** el costo de los SMS por mensaje o por paquete: no está en la página pública.

**[PRODUCTO] AutoLeap** — https://autoleap.com/pricing/ (2026-08-29)

| Tier           | Mensual   | Anual  | Qué agrega                                                                                               |
| -------------- | --------- | ------ | -------------------------------------------------------------------------------------------------------- |
| **Essentials** | US$199    | US$179 | Tablero configurable · ROs ilimitadas · **CARFAX** · canned jobs · **firmas verificadas** · DVI estándar |
| **Pro**        | US$349    | US$309 | (no detallado en el bloque leído)                                                                        |
| **Elite**      | US$449    | US$409 | **DVI de nueva generación** · reseñas de Google · tablero en tiempo real                                 |
| **Enterprise** | a cotizar | —      | Reportes entre locales · integraciones ERP · hasta 10 000 locales                                        |

**No publican precio: Mitchell 1 Manager SE, Shop-Ware, Garage Hive.** **[NO VERIFICADO]**, sin estimación.

**Lo que cambió desde el 2026-08-17:** nada en las cifras mensuales. Lo nuevo es que las tres páginas muestran ahora el precio anual al lado del mensual, con **~10 % de descuento** en los tres. La conclusión de #15 §3 se sostiene entera: **la inspección digital y la autorización electrónica son piso**, los relojes y la analítica son la palanca, y la reactivación del Cliente es el techo.

Y una lectura nueva para nosotros: **la firma electrónica está en el tier de entrada de los tres** (Tekmetric la incluye en _Digital Authorizations_, Shopmonkey en Basic, AutoLeap en Essentials). Es piso, no diferenciador — lo cual confirma §7.4: nos falta una casilla de piso.

---

## 11. Contradicciones e incertidumbres

1. **La cobertura es desigual y el documento lo refleja.** Tekmetric, Shopmonkey y Mitchell 1 se pudieron leer bien; Shop-Ware a medias; Garage Hive solo en autorización; AutoLeap casi nada. **Las columnas con `?` de la tabla de §6 son huecos de investigación, no ausencias de función**, y leerlas como ausencias sería el error más fácil de cometer con este documento.

2. **Todo lo de Shopmonkey sigue sesgado por ser el único con esquema público.** #15 §9.6 ya lo advirtió y sigue vigente: cuando un patrón "se repite entre los líderes", muchas veces significa que se pudo leer en Shopmonkey y se infirió en los demás.

3. **La evidencia negativa por búsqueda es débil, y la de offline es la más débil de todas.** _"Cero resultados en `site:support.tekmetric.com offline`"_ prueba que no hay un artículo indexado con esa palabra, no que el producto no funcione sin conexión. La conclusión de §5.8 se sostiene por la suma de la ausencia con lo que sus páginas sí afirman, no por la ausencia sola.

4. **"No se encontró campo para combustible / objetos dentro" es una afirmación sobre la documentación, no sobre el producto.** Un campo puede existir y no estar documentado. Es el hallazgo más favorable para nosotros de todo el documento y por eso el que hay que sostener con más cuidado: lo verificable es que **ninguno lo documenta**, no que ninguno lo tenga.

5. **El valor legal de la firma en tableta en Costa Rica es una lectura de la Ley 8454, no una opinión jurídica.** Los artículos 3, 4, 8, 9 y 10 se leyeron íntegros; la conclusión de §4.4 —que el registro electrónico tiene fuerza probatoria pero no presunción de autoría sin certificado— es inferencia de este documento. **Antes de usarla como argumento de venta hay que confirmarla con alguien que sepa.**

6. **No se verificó bajo qué régimen legal declaran valor sus firmas electrónicas.** ESIGN y UETA no aparecen en las páginas leídas. Es **[NO VERIFICADO]** y probablemente esté en sus términos de servicio.

7. **Tekmetric puede tener consulta por placa y no se verificó.** Sería raro que el líder no la tenga cuando AutoLeap y Shop-Ware sí. La celda queda en `?` a propósito.

8. **La ausencia de WhatsApp en los seis puede ser de mercado, no de producto.** Ninguno de los seis vende en un mercado donde WhatsApp domine. La conclusión correcta no es _"nadie sabe hacer WhatsApp"_, sino _"ninguno de los seis líderes anglosajones lo necesita"_. El mercado hispanohablante quedó **[NO VERIFICADO]** en este documento, y es precisamente donde WhatsApp sí estaría — la búsqueda encontró al menos un producto (Autorox) que lo anuncia, sin verificar.

9. **La ventaja de "funcionar sin conexión" tiene una contracara que no se puede ocultar.** Hoy no hay backend, así que no hay respaldo, ni una Orden visible desde dos aparatos, ni Fotos que sobrevivan a que se borre el navegador — el [ADR 0022](../../../apps/bitacora/docs/adr/0022-las-fotos-se-comprimen-y-el-almacenamiento-se-pide.md) tuvo que pedir almacenamiento persistente justamente por eso. Presentar el offline como ventaja neta sin decir esto sería vender humo.

10. **Contradicción interna nuestra, resuelta pero vale anotarla.** El [ADR 0011](../../../apps/bitacora/docs/adr/0011-proxima-visita-la-pone-el-asesor.md) descartó calcular la Próxima visita por kilometraje argumentando que _"exige anotar el kilometraje en cada entrada — un dato nuevo en la recepción"_, y concluyó que _"no se registra kilometraje, y eso cierra una puerta"_. El [ADR 0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md) **sí metió el odómetro** en la Recepción. **La puerta que el 0011 dio por cerrada está abierta desde entonces**, y ningún ADR lo dice.

---

## 12. Preguntas abiertas para el mapa

1. **¿La obligatoriedad de la Recepción debería ser configuración del Dueño, como en Tekmetric?** Y si sí, ¿bloquea crear o bloquea cerrar? Es la decisión más barata de tomar y la más cara de dejar para después: cambia la pantalla que más se usa.
2. **¿Guardamos el texto del mensaje de WhatsApp en la Orden?** Cierra la brecha más cara (§7.1) y es una columna. La pregunta real es si se guarda el texto o si se guarda una versión del documento, que es lo que hace Garage Hive.
3. **¿Vale la pena una firma en tableta sabiendo lo que la Ley 8454 dice de ella?** Es piso comercial (§10) y es probatoriamente débil (§4.4). Puede ser correcto construirla **por venta** aunque no agregue valor legal — pero eso hay que decidirlo con esa lectura enfrente, no por imitación.
4. **¿La Línea de servicio revivida debe apuntar a la original?** Shopmonkey lo hace con `revivedFromId`. Es un campo y habilita _"esto se lo recomendamos hace ocho meses"_, que es la frase que cierra la venta.
5. **¿Ofrecemos alternativa de precio en una Línea?** (§9.2) Nadie más que Garage Hive lo tiene y en nuestro modelo transcrito es barato.
6. **¿Cuánto de lo `?` de la tabla de §6 hay que cerrar antes de decidir?** Concretamente: la recepción de Tekmetric y de Garage Hive, y el precio de Shop-Ware y Garage Hive. Es media jornada de lectura y quitaría la mitad de las incertidumbres del documento.
7. **¿Se toma en serio el mercado hispanohablante como competencia?** Quedó **[NO VERIFICADO]** entero. Es donde estaría el único competidor con WhatsApp y con factura electrónica de Hacienda — es decir, el único que compite por el mismo taller que nosotros.

---

## Fuentes

Todas leídas el **2026-08-29** salvo indicación distinta. Agrupadas por tipo y por confianza.

### Documentación de producto (primaria)

| Fuente                                                                                                                                                                                | Qué aporta a este documento                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tekmetric — [Repair Order Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings)**                                         | Los nueve interruptores de obligatoriedad al postear · _"the RO will not post unless you have mileage entered"_ · los tres momentos de pago al Técnico |
| **Tekmetric — [RO Labels and Workflow Statuses](https://support.tekmetric.com/hc/en-us/articles/360039292193-RO-Labels-and-Workflow-Statuses)**                                       | Los ocho estados exactos por columna · _"statuses cannot be changed"_ mientras las etiquetas sí · 20 etiquetas de 22 caracteres por columna            |
| **Tekmetric — [Tekmetric Mobile](https://support.tekmetric.com/hc/en-us/articles/26781766611351-Tekmetric-Mobile)**                                                                   | `Customer Concerns` y `Technician Concerns` como listas separadas · odómetro in/out · marcado sobre la imagen · _"real-time synchronization"_          |
| **Tekmetric — [Register your Tekmessage Number with 10DLC](https://support.tekmetric.com/hc/en-us/articles/7623733464087-Register-your-Tekmessage-Number-with-10DLC)**                | La mensajería es A2P 10DLC de EE. UU. · bloqueo del tráfico no registrado desde 2025-02-01 · no aplica en Canadá salvo envío a EE. UU.                 |
| **Tekmetric — [Repair Order Workflow Overview for Service Writers](https://support.tekmetric.com/hc/en-us/articles/360043239813-Repair-Order-Workflow-Overview-for-Service-Writers)** | Las cinco etapas oficiales del ciclo, en video propio: write up → DVI → repuestos → trabajo → checkout                                                 |
| **Shopmonkey — [Request Customer Authorization](https://support.shopmonkey.io/hc/en-us/articles/38743372579988-Request-Customer-Authorization)**                                      | Autorización parcial con casilla por servicio · los dos interruptores del envío · autorización por el Taller con **medio** registrado                  |
| **Shopmonkey — [Customer E-Signatures to Authorize Services](https://support.shopmonkey.io/hc/en-us/articles/38743424357652-Customer-E-Signatures-to-Authorize-Services)**            | _"a written record of the authorization"_ · la función no viene de fábrica, se pide a soporte                                                          |
| **Shopmonkey — [Print Invoices & Work Orders](https://support.shopmonkey.io/hc/en-us/articles/44010321676052-Print-Invoices-Work-Orders)**                                            | Dos documentos y sus seis interruptores · _"Include pricing"_ y _"Include authorization history"_ · la preferencia es global, no por impresión         |
| **Shopmonkey — [Create an Estimate](https://support.shopmonkey.io/hc/en-us/articles/38743909407380-Create-an-Estimate)**                                                              | Cinco puntos de entrada y **ningún campo obligatorio** mencionado                                                                                      |
| **Shop-Ware — [Adding a New Vehicle](https://support.shop-ware.com/s/article/Add-New-Vehicle)**                                                                                       | _"the only field required is the make"_ · vehículos sin VIN · placa y odómetro como _additional details_ · consulta por placa vía myCARFAX             |
| **Shop-Ware — [Add a Service to a Work Order](https://support.shop-ware.com/s/article/Add-a-Service-to-a-Work-Order)**                                                                | El Cliente y el Vehículo van antes que el servicio · canned jobs, servicios pasados, Estimator de MOTOR                                                |
| **Mitchell 1 — [Order Screen](https://buymitchell1.net/managerhelp/Orderscreen.htm)**                                                                                                 | El campo **In** del odómetro · **Hat #** y **Ref #** · el desplegable **Source** de motivo de visita · el correo con PDF adjunto                       |
| **Mitchell 1 — [Vehicle Screen](https://buymitchell1.net/managerhelp/Vehiclescr.htm)**                                                                                                | _"Type in a unique License number"_ · el VIN Decode · **Recommendations** con la pestaña que cambia de color                                           |
| **Mitchell 1 — [Entering a New Vehicle](https://buymitchell1.net/managerhelp/Enteringanwvechicle.htm)**                                                                               | El mínimo real: licencia + año/marca/modelo; todo lo demás _(Optional)_ o tras el botón **Vehicle Detail**                                             |
| **Mitchell 1 — [Customer Screen](https://buymitchell1.net/managerhelp/Customerscreen.htm)**                                                                                           | El orden Cliente → Vehículo → Orden · el _Customer Snapshot_ con visitas por año y última visita · _Change Customer_ · _Set Flag_                      |
| **Garage Hive — [Previewing and Publishing Online Documents](https://docs.garagehive.com/p/gFfa6lg5AJdkz7/Previewing-and-Publishing-Online-documents)**                               | **Archived Versions** con el Intro Text · cuándo se abrió el documento · revocación al republicar · la foto se congela al enviar                       |
| **Garage Hive — [Working With Group Items Actions](https://docs.garagehive.com/p/gxoOzrGJdo-BE4/Working-With-Group-Items-Actions)**                                                   | **Create Alternative** · la autorización se rompe si cambia la descripción o el precio publicados · Match Approved Line Groups                         |
| **Garage Hive — [How to Group Document Lines](https://docs.garagehive.com/p/ON2BmTskQ8JbTm/How-to-Group-Document-Lines)** (leída 2026-08-17)                                          | Los _Group Items_ agrupan líneas _"under the same job or category"_; se crean solos desde lo marcado _requires attention_                              |

### Precios (primaria, verificados 2026-08-29)

- Tekmetric — https://www.tekmetric.com/pricing
- Shopmonkey — https://www.shopmonkey.io/pricing
- AutoLeap — https://autoleap.com/pricing/

### Normativa (primaria)

- **Costa Rica — Ley 8454, _Ley de Certificados, Firmas Digitales y Documentos Electrónicos_**, artículos 3, 4, 8, 9 y 10 — https://sinalevi.go.cr/ResultadosNormativa/Informacion?param1=55666&param2=143022&param3=1

### Documentos propios que este documento continúa y no repite

- [`que-hace-indispensable.md`](./que-hace-indispensable.md) (#15) — el bucle de venta, los cuatro números, el empaquetado, el trabajo declinado, las entidades canónicas, el taller mixto, Latinoamérica
- [`organizacion-multiespecialidad.md`](./organizacion-multiespecialidad.md) (#16) — dónde vive la Especialidad, la tabla de seis productos, el _Folder_ de Nexsyis, la segmentación vertical del mercado
- [`placa-vs-vin-costa-rica.md`](./placa-vs-vin-costa-rica.md) (#35) — la Placa como identificador operativo, el VIN como atributo, y la verificación de que no hay fuente pública tica consultable
- [`acabado-visual-listas-densas.md`](./acabado-visual-listas-densas.md) (#72) — las capturas de primera mano de los cinco tableros del rubro, de donde sale que nadie ordena por Tiempo parado

### Fuentes de Bitácora (primaria, leídas para este documento)

`apps/bitacora/CONTEXT.md` · `apps/bitacora/src/app/data-access/db/esquema.ts` · `apps/bitacora/src/app/data-access/db/recepcion.ts` · `apps/bitacora/src/app/data-access/ordenes.store.ts` · `apps/bitacora/src/app/pantallas/recepcion/recepcion.ts` · ADR [0001](../../../apps/bitacora/docs/adr/0001-visita-igual-orden.md), [0003](../../../apps/bitacora/docs/adr/0003-tablero-unico-y-un-responsable-por-orden.md), [0006](../../../apps/bitacora/docs/adr/0006-fotos-en-la-orden.md), [0007](../../../apps/bitacora/docs/adr/0007-autorizacion-por-whatsapp.md), [0009](../../../apps/bitacora/docs/adr/0009-aviso-de-listo-con-constancia.md), [0010](../../../apps/bitacora/docs/adr/0010-folio-con-prefijo-de-puesto.md), [0011](../../../apps/bitacora/docs/adr/0011-proxima-visita-la-pone-el-asesor.md), [0014](../../../apps/bitacora/docs/adr/0014-capa-de-datos-sobre-indexeddb.md), [0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md), [0020](../../../apps/bitacora/docs/adr/0020-la-orden-se-lee-en-su-ventana-y-se-imprime-en-tres-papeles.md), [0021](../../../apps/bitacora/docs/adr/0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md), [0022](../../../apps/bitacora/docs/adr/0022-las-fotos-se-comprimen-y-el-almacenamiento-se-pide.md), [0023](../../../apps/bitacora/docs/adr/0023-lo-que-se-configura-tiene-que-verse.md), [0024](../../../apps/bitacora/docs/adr/0024-el-ciclo-no-es-una-linea-recta-y-entregar-es-su-propio-verbo.md), [0025](../../../apps/bitacora/docs/adr/0025-el-personal-existe-y-decir-quien-sos-es-opcional.md)

### Lo que NO se pudo verificar

Repetido acá para que quede en las fuentes y no solo en §3.2: **Protractor, Identifix Shop Manager, R.O. Writer, CCC ONE, Mitchell Cloud Estimating, Web-Est, Audatex/Qapter, MAM Autowork Online, TechMan, Workshop Software**, y **todo el mercado hispanohablante**. Tampoco los precios de **Mitchell 1, Shop-Ware y Garage Hive**. No se afirma nada sobre ellos en este documento que no venga de #15 o #16 con su propia cita.
