# Anexo: la recepción de Tekmetric y Garage Hive, y el precio de Shop-Ware y Garage Hive (Bitácora)

> Investigación de producto del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14), ticket [#125](https://github.com/FabianRG1990/repositorio-de-apps/issues/125).
> Fecha de verificación: **2026-09-30**. Precios y funciones cambian sin aviso; cada afirmación lleva su URL.
>
> **Este documento continúa [`competencia-recepcion-y-orden.md`](./competencia-recepcion-y-orden.md)** (2026-08-29) y no lo repite. Cierra lo que su pregunta abierta 6 (§12) pidió cerrar antes de decidir: las celdas `?` de su tabla §6 para **Tekmetric** y **Garage Hive** en la recepción, y el precio de **Shop-Ware** y **Garage Hive**. Sirve de evidencia para [#128](https://github.com/FabianRG1990/repositorio-de-apps/issues/128) —la obligatoriedad de la Recepción— **sin tomar esa decisión**.
>
> **Cuatro cosas de este anexo contradicen al documento original**, y se dicen en §7 con la cita que las sostiene: Shop-Ware y Garage Hive **sí publican precio**; Tekmetric **no exige cero campos** para abrir una orden; Tekmetric **sí modela la queja del Cliente como varias filas**; y Garage Hive **no es el único** que guarda copia de lo que el Cliente aprobó.

---

## Convención de confianza de las fuentes

Las mismas cinco etiquetas del documento original (**[PRODUCTO]**, **[MARKETING]**, **[LEY]**, **[BITÁCORA]**, **[NO VERIFICADO]**), más una que este anexo necesitó:

| Etiqueta      | Significado                                                                                                                   | Cómo leerlo                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ARCHIVO]** | Texto del **propio fabricante**, leído en una copia del Internet Archive porque el original ya no es público. Va con su fecha | Fuente primaria **fechada**: dice qué decía la documentación ese día, no que hoy siga igual. Se usa solo cuando el original no se puede abrir (§3.2) |

---

## 1. Pregunta

La misma sub-pregunta 1 y 2 del original, para los dos productos que quedaron a medias:

1. **¿Qué exigen Tekmetric y Garage Hive antes de dejar abrir una orden**, y qué exigen antes de cerrarla?
2. **¿Qué capturan del estado de entrada**: odómetro, combustible, daños, objetos, fotos, firma, llave?
3. **¿Tienen consulta por placa** (pregunta 7 de §11 del original)?
4. **¿Cuánto cuestan Shop-Ware y Garage Hive?**

---

## 2. Resumen ejecutivo

1. **Ninguno de los dos documenta una orden que nazca vacía: los dos la empiezan sabiendo de quién es y qué carro es.** Tekmetric crea la orden desde un formulario _Create RO_ donde se eligen Cliente y Vehículo — _"After deciding which customer and vehicle you want to add to the RO … your selected customer and vehicle will be automatically populated onto the Create RO form"_ ([Tekmetric Multi-Shop: Shared Customer History](https://support.tekmetric.com/hc/en-us/articles/15925142685463-Tekmetric-Multi-Shop-Shared-Customer-History)) — y su API pública exige `year`, `make` y `model` para crear un vehículo, con la placa opcional ([api.tekmetric.com — Create Vehicle](https://api.tekmetric.com/)). Garage Hive abre el _Jobsheet_ con _Service Type_ y _Vehicle Registration No._, y después el Cliente ([ARCHIVO] _Using the Jobsheet_, captura del 2026-06-11). **El "cero campos al crear" que el original le atribuyó a Tekmetric no se sostiene** (§7.2).

2. **Lo que sí se confirma es la otra mitad del hallazgo original: lo que bloquea es el cierre, no la creación.** Garage Hive no deja _postear_ el Jobsheet si falta el técnico en una línea de labor, si quedan repuestos genéricos sin número real o si no se recibieron en stock: _"If you post the Jobsheet without adding the resources, the following error message will be displayed"_ ([ARCHIVO] _Taking a Payment and Posting a Jobsheet_, 2026-05-17). Y tiene un semáforo de dos niveles: la bandera roja _"Prevents document from posting"_; el triángulo _"Doesn't prevent the document from posting"_ ([ARCHIVO] _Understanding the Jobsheet Line Checker Notifications_, 2026-06-11).

3. **Ningún bloqueo documentado, en ninguno de los dos, es sobre el estado de entrada.** Lo que bloquea el cierre es lo que hace falta para **cobrar y contabilizar** (técnico, repuestos, pago) más el odómetro (Tekmetric, si el Dueño lo enciende) y la llave (Garage Hive, §5.3). Combustible, daños y objetos no bloquean nada en ningún momento — porque no tienen campo propio documentado.

4. **Los dos mezclan bloqueos fijos con interruptores del Dueño.** Garage Hive bloquea siempre por falta de técnico o de repuesto real, y deja como interruptor _"Prevent Posting if Unit Price is Less or Equal Than Cost"_ y _"Ask for Reason on Jobsheet Delete"_. Tekmetric añadió desde la lectura del 2026-08-29 una sección nueva, **qué se exige para borrar o guardar para después** una orden ([Repair Order Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings), leído hoy). El patrón es: **lo que necesita el sistema, fijo; lo que decide la política del taller, interruptor.**

5. **El número de la llave es un dato de recepción en los dos, y en Garage Hive bloquea el cierre.** Tekmetric tiene `keytag` en la orden ([API](https://api.tekmetric.com/)). Garage Hive tiene un catálogo de llaveros: al marcar _Vehicle on Site_ pide asignar uno, un llavero no puede estar en dos Jobsheets, y _"a Jobsheet cannot be posted with an assigned key number"_ ([ARCHIVO] _Managing Key Numbers_, 2025-05-17). Con Mitchell 1 (_Hat #_), son **tres de seis** los que tienen el gancho de la llave como campo. Bitácora no lo tiene.

6. **Garage Hive le pasa parte de la recepción al Cliente, antes de llegar.** _Customer Self Check-in_: un enlace de un solo uso por SMS o correo donde el Cliente _"confirm[s] their contact information, parking spot, and add[s] any relevant notes or photos"_ ([ARCHIVO], 2026-02-14). La orden ya existe —nació de la reserva— cuando el Cliente aporta esos datos. **En su modelo, los datos de recepción llegan después de crear la orden por construcción.**

7. **Consulta por placa: los dos la tienen, y ninguno sirve en Costa Rica.** Garage Hive busca por **VRM** (la matrícula británica) y llena el vehículo; su ToS cobra esas consultas por unidad (_"Variable Costs – transaction-based costs per unit (Postcode Lookup, MOT Lookup, SMS etc.)"_). Tekmetric decodifica por placa —_"We recommend using the VIN or license plate to decode the vehicle"_ ([Smart Jobs 101](https://support.tekmetric.com/hc/en-us/articles/27373807531287-Smart-Jobs-101))— salvo placas personalizadas. Lo que #35 cerró sigue en pie: no hay fuente tica equivalente.

8. **Tekmetric guarda copia de lo que el Cliente aprobó y registra el medio.** _"there will be point-in-time records of all authorizations on your Summary tab. You can download carbon copies of what was approved at that point in time"_, con seis medios: firma digital, firma en papel, verbal en persona, llamada, texto y correo ([Digital Signature & Authorization Process](https://support.tekmetric.com/hc/en-us/articles/4421125978391-Digital-Signature-Authorization-Process)). La brecha §7.1 del original —no guardamos copia de lo que se mandó— **la cierran dos competidores, no uno**.

9. **Precios, ahora sí verificados.** **Shop-Ware publica cuatro tiers**: US$279 / 389 / 499 / 999 al mes, o US$251 / 350 / 449 / 899 con pago anual ([shop-ware.com/packages](https://shop-ware.com/packages/)). **Garage Hive publica un piso**: _"Starting from £145 per month with a one-month rolling contract"_ ([garagehive.co.uk/pricing](https://garagehive.co.uk/pricing/)), con planes Core, Pro y Enterprise cuyos precios individuales no están en la página pública.

10. **La documentación de Garage Hive se cerró al público entre el 2026-08-29 y hoy.** Todas sus páginas `docs.garagehive.com/p/…` —incluidas las cuatro que cita el original— redirigen hoy a `access-expired` y piden entrar desde la cuenta del producto. Lo de Garage Hive en este anexo sale de copias del Internet Archive con fecha, y **las citas del original ya no se pueden reabrir en su URL** (§3.2).

---

## 3. Qué se verificó de primera mano y qué no

### 3.1 Verificado el 2026-09-30

| Producto        | Qué se leyó                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Cobertura                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Tekmetric**   | _Repair Order Advanced Settings_ (releído), _The Customer Concern_, _Global Search Engine_, _Digital Signature & Authorization Process_, _How to Transfer Repair Orders_, _Multi-Shop: Shared Customer History_, _Tekmetric FAQs_, _Smart Jobs 101_, _CARFAX Integration_, _Release Date & Feature Notes_, _Counter Sales_, _Repair Order Workflow Overview_, la referencia pública de su API                                                                                                                                     | **Alta en recepción.** Creación, identificación, queja, autorización y API   |
| **Garage Hive** | Página de precios y Términos de Servicio (públicos, leídos hoy); y en **[ARCHIVO]**: _Using the Jobsheet_, _Creating a Jobsheet from Various Places_, _Creating a Booking from the Schedule_, _Processing a Vehicle Arriving in Your Trial_, _Customer Self Check-in_, _Managing Key Numbers_, _Vehicle Card Details_, _Create a Customer Card_, _Taking a Payment and Posting a Jobsheet_, _Understanding the Jobsheet Line Checker Notifications_, _Technician Vehicle Inspections/Checklists_, _Customer Online Authorisation_ | **Media-alta en recepción**, con la salvedad de que es documentación fechada |
| **Shop-Ware**   | Página de precios                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Alta en precio.** Nada nuevo sobre recepción                               |

### 3.2 Por qué Garage Hive se leyó en archivo

El 2026-09-30, `https://docs.garagehive.com/p/gFfa6lg5AJdkz7/Previewing-and-Publishing-Online-documents` —la fuente principal de §5.2 del original— responde `302` a `https://docs.garagehive.com/access-expired`, y la portada dice: _"Return to Garage Hive home screen and click on Visit Docs tile to start a new session."_ Lo mismo pasa con todas las páginas `/p/…` que se probaron. **La documentación ya no es pública; hay que ser cliente.**

Se buscaron entonces las copias del Internet Archive (`web.archive.org`) de cada página. Cada cita de Garage Hive lleva la **fecha de la captura**, no la de hoy. Dos consecuencias honestas:

- Lo que el original citó de Garage Hive el 2026-08-29 **sigue siendo lo que decía su documentación ese día**, pero hoy ya no se puede reabrir en su URL. Existe captura de _Previewing and Publishing Online documents_ del 2026-03-06.
- Dos páginas que importaban **no tienen captura**: _Customer Digital Signature Capture_ (`/p/lh7KoJt8VOXyfD/…`) y _Vehicle Mileage Settings_ (`/p/Rfoml9HepPv7Fd/…`). Se sabe que existen —aparecen con ese título en un buscador— pero **su contenido es [NO VERIFICADO]**.

### 3.3 Declarado NO VERIFICADO

- **El formulario exacto de _Create RO_ de Tekmetric**: qué campos marca obligatorios la pantalla. No hay artículo que lo describa; lo que hay es el formulario nombrado en dos artículos y el contrato de la API para crear Cliente y Vehículo. Su API pública **no tiene endpoint para crear órdenes** (solo leerlas y modificar algunos campos), así que el contrato de la orden en sí tampoco se pudo leer.
- **La _Mobile App Check In Experience_ de Tekmetric**: aparece en sus notas de versión del 5 de mayo de 2025, pero enlaza a un video de Loom y no a un artículo. Qué captura —y si eso cambia lo de combustible, daños u objetos— **no se sabe**.
- **La firma del Cliente en Garage Hive**, al autorizar o al recibir: existe un artículo titulado _Customer Digital Signature Capture_ cuya ruta original es `Customer-Signature-Capture-on-Job-Card-and-Schedule-of-Work`; no se pudo leer.
- **Qué incluye cada plan de Garage Hive y cuánto cuesta cada uno.** La página pública da solo el piso de £145; si es con o sin IVA, no lo dice.
- **El _Pre-Check-in_ de Garage Hive**: la captura de _Using the Pre-Check-in Feature_ (2025-10-31) está vacía.

---

## 4. Tekmetric: la recepción, mecánica fina

### 4.1 Qué hace falta para abrir la orden

**[PRODUCTO]** La orden se crea desde el botón _Repair Order_ del tablero, en un formulario llamado **Create RO**. Ese formulario lleva Cliente y Vehículo: _"your selected customer and vehicle will be automatically populated onto the Create RO form"_ ([Multi-Shop: Shared Customer History](https://support.tekmetric.com/hc/en-us/articles/15925142685463-Tekmetric-Multi-Shop-Shared-Customer-History)). Y si alguno no existe se crea en el momento: _"If the customer does not already exist in your customer list, you can use the **Add New Customer** button … If the vehicle does not already exist on the customer's profile, you can use the **Add New Vehicle** button"_ ([How to Transfer Repair Orders](https://support.tekmetric.com/hc/en-us/articles/6378779404183-How-to-Transfer-Repair-Orders)).

**[PRODUCTO] El contrato de la API** dice qué es lo mínimo de cada uno ([api.tekmetric.com](https://api.tekmetric.com/), leída 2026-09-30):

| Recurso         | Obligatorio (`required`)                          | Opcional                                                                             |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Customer**    | `shopId`, `firstName`                             | apellido, correo, teléfonos, dirección, crédito, consentimiento de marketing         |
| **Vehicle**     | `customerId`, `year`, `make`, `model`             | **`licensePlate`**, `state`, **`vin`**, submodelo, motor, color, unidad              |
| **RepairOrder** | **No hay endpoint de creación en la API pública** | Se pueden modificar `keyTag`, `milesIn`, `milesOut`, técnico, asesor, hora prometida |

Que la orden tenga `customerId` y `vehicleId` en su respuesta, y que el vehículo no exista sin Cliente, es el contrato del servidor. Si la pantalla deja crear una orden sin vehículo **no está documentado** (§3.3).

Existe una sola vía sin Cliente: la **Counter Sale**, para vender repuestos de mostrador sin que el carro entre — _"You can add customer information to the counter sale, however it is optional"_ ([Counter Sales](https://support.tekmetric.com/hc/en-us/articles/22405880885527-Counter-Sales)). La documentación la presenta justamente como lo contrario de una orden: _"instead of creating an RO, gathering customer/vehicle information, and going through the approval process"_.

> **Lectura:** el mínimo de Tekmetric para abrir una orden es **nombre del Cliente + año, marca y modelo**, con placa y VIN opcionales. Es casi el mismo mínimo que el de Mitchell 1 (licencia + año/marca/modelo), y **cubre lo mismo que el paso _El carro_ de Bitácora** (Placa, marca, Cliente), con la diferencia de qué identifica al carro: ellos el modelo, nosotros la Placa.

### 4.2 Qué se exige al cerrar y en qué otro momento

**[PRODUCTO]** Los nueve interruptores de _Advanced Settings_ que documentó el original siguen ahí, con el mismo texto. Lo nuevo desde el 2026-08-29 es una segunda sección: _"[NEW] Control which data is required to delete and save a repair order for later"_, con un único interruptor hoy — no se puede borrar ni guardar para después una orden _"if there are ordered or received parts on those repair orders"_ ([Repair Order Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings), releído 2026-09-30).

Es decir, Tekmetric ya distingue **tres momentos** con exigencias propias: completar el trabajo, postear, y borrar o archivar. **Ninguno es la creación.**

Y el odómetro tiene una recomendación del propio fabricante, con razones: _"We recommend requiring employees to enter the vehicle odometer information on the repair order. … Odometer measurements are also required to track warranty parts and their failures. Similarly, it'll be needed tracking certain services based on mileage recommendations or promoting reminders."_ ([Repair Order Workflow Overview for Service Writers](https://support.tekmetric.com/hc/en-us/articles/360043239813-Repair-Order-Workflow-Overview-for-Service-Writers)). Es la misma puerta que el original (§11.10) vio abierta entre el ADR 0011 y el 0017.

### 4.3 La queja del Cliente

**[PRODUCTO]** _The Customer Concern_ es una tabla, no una caja de texto: _"Enter what the customer is visiting for. **It is recommended to enter each concern as its own item/row.**"_ Cada fila tiene tres partes: lo que dice el Cliente (_Customer States_), el hallazgo (_Finding_) y medios (_"images, videos, or files … provided by the customer"_). Se agrega desde las pestañas de Inspección y Estimado, a mano o por automatización desde la reserva en línea ([The Customer Concern](https://support.tekmetric.com/hc/en-us/articles/36897066105111-The-Customer-Concern)). La API lo confirma: `customerConcerns` es un arreglo de objetos `{ id, concern, techComment }`.

**No es obligatoria en ningún momento documentado**: no aparece entre los nueve interruptores de cierre, y se carga después de crear la orden, en otra pestaña.

> **Esto corrige al original** (§7.3): Tekmetric sí modela la queja como varias instancias. Lo que sigue siendo solo de Bitácora es que **cada Reporte del Cliente lleva su Especialidad sugerida** ([ADR 0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md)). Y hay algo que Tekmetric tiene y nosotros no: **la foto que trae el Cliente cuelga de su queja**, no de la Orden en general.

### 4.4 Identificar el vehículo y consultar por placa

**[PRODUCTO]**

- **Búsqueda por placa, propia:** el buscador global busca vehículos por _"Year, Make, Model, Submodel · License Plate · VIN · Unit Number"_ ([Global Search Engine](https://support.tekmetric.com/hc/en-us/articles/360055559034-Global-Search-Engine)), y desde 2021 se puede _"find customers based on vehicle details search (license or VIN) when creating a RO"_ ([Release Date & Feature Notes](https://support.tekmetric.com/hc/en-us/articles/360041785434-Release-Date-Feature-Notes)).
- **Decodificar por placa:** _"We recommend using the VIN or license plate to decode the vehicle"_ ([Smart Jobs 101](https://support.tekmetric.com/hc/en-us/articles/27373807531287-Smart-Jobs-101)), con un límite declarado: _"As of now custom license plates cannot be decoded, however, you can use the VINs."_ ([Tekmetric FAQs](https://support.tekmetric.com/hc/en-us/articles/34977202334615-Tekmetric-FAQs)). **[NO VERIFICADO]** contra qué proveedor se decodifica la placa.
- **Decodificar por VIN:** _"Tekmetric works with PartsTech to help decode the VINs"_ (mismas FAQs).
- **La placa no es la llave**: en la API es un campo opcional del vehículo, igual que el VIN. Su única obligación de facto es con CARFAX: _"It will only send data to Carfax if the repair orders have a license plate associated with the vehicle"_ ([CARFAX Integration](https://support.tekmetric.com/hc/en-us/articles/360036301793-CARFAX-Integration-FAQS-Configuration)).

### 4.5 El estado de entrada y la firma

- **Odómetro:** `milesIn` / `milesOut` en la orden, exigible al postear (ya en el original).
- **Llave:** `keytag` en la orden; la etiqueta de la llave se puede mostrar en estimado y factura (_"Keytag Setting to Estimate & Invoice Settings"_, notas de la versión 2.27).
- **Fotos al recibir:** las del Cliente cuelgan de la queja (§4.3); las del Técnico, de la inspección.
- **Combustible, daños previos, objetos dentro:** **no encontrados** en lo leído hoy, tampoco en la API. Siguen "No encontrado", con la salvedad de la _Mobile App Check In Experience_ sin leer (§3.3).
- **Firma al recibir:** no encontrada. La única firma documentada sigue siendo la de autorizar (§4.6).

### 4.6 La constancia de la autorización

**[PRODUCTO]** Al autorizar se elige el medio entre seis: _"Digital Signature · Paper Signature · Verbal In-Person · Phone Call · Text Message · Email"_; la firma digital se puede volver obligatoria, y es **la única parte configurable**: _"individual authorization types (such as Phone Call or Text Message) cannot be disabled"_. Lo que queda escrito: _"point-in-time records of all authorizations on your Summary tab. You can download carbon copies of what was approved at that point in time"_ ([Digital Signature & Authorization Process](https://support.tekmetric.com/hc/en-us/articles/4421125978391-Digital-Signature-Authorization-Process)). Y desde la versión 3.21 (oct. 2021) el estimado digital coincide con el PDF, con _"Vehicle YMME, Odometer, VIN, License Plate · Customer Concerns"_ ([Release Notes](https://support.tekmetric.com/hc/en-us/articles/360041785434-Release-Date-Feature-Notes)).

**[NO VERIFICADO]** si la constancia guarda **quién** autorizó como persona distinta del Cliente titular, como lo hace `Autorizacion.autorizadaPor` en Bitácora.

---

## 5. Garage Hive: la recepción, mecánica fina

Todas las citas de esta sección son **[ARCHIVO]** salvo que se indique otra cosa (§3.2).

### 5.1 Qué hace falta para abrir el Jobsheet

El Jobsheet nace por cuatro caminos —desde un estimado de inspección, un estimado, la agenda o la reserva en línea ([_Creating a Jobsheet from Various Places_](https://web.archive.org/web/20260611195537/https://docs.garagehive.com/p/Q7dwf7PXJVV1-N/Creating-a-Jobsheet-from-Various-Places), 2026-06-11)— y en el camino directo el orden es este ([_Using the Jobsheet_](https://web.archive.org/web/20260611192105/https://docs.garagehive.com/p/4-w1NrytzbzDpJ/Using-the-Jobsheet), 2026-06-11):

1. _"Select the **Service Type** - This is the type of job to do."_
2. _"Fill in the **Vehicle Registration No.**: If the vehicle is in the system, the vehicle information will be auto-filled. If the vehicle is not in the system, the system will look it up using **VRM**."_
3. _"Confirm with the customer that the **Vehicle Description** matches the actual vehicle."_
4. _"Enter the vehicle's current mileage in the **Mileage** field."_
5. El Cliente: si ya existe por otro vehículo se enlaza; si es nuevo, _"the system will prompt you to Create a new customer card."_

Y la ficha del vehículo, de hecho, solo nace así: _"The vehicle card is typically only created within the context of a Jobsheet or booking"_ ([_Vehicle Card Details_](https://web.archive.org/web/20251016152727/https://docs.garagehive.com/p/bgysB-6paTo4IV/Vehicle-Card-Details), 2025-10-16).

**[NO VERIFICADO]** cuáles de los cinco pasos son **obligatorios** en la pantalla: el artículo describe una secuencia, no marca campos. Lo que sí se puede decir es que **la matrícula es la primera cosa que se escribe sobre el carro**, y que de ella sale todo lo demás.

Después vienen datos opcionales de recepción: _Arrival Date/Time_, _Requested Delivery Date/Time_, **_Vehicle on Site_**, _Vehicle Staying Overnight_, _Collection and Delivery_, **_Key Tag Text_ / _Key Tag No._**, _Marketing Channel_ y _Work Description_. La queja del Cliente va en una subpágina de comentarios: _"In the **Comments** subpage, you can enter any information the customer has provided about the job to be done."_ **Es texto libre y es opcional.**

### 5.2 Qué se exige al cerrar

Dos artículos lo dicen con precisión:

- **Fijo, sin interruptor** ([_Taking a Payment and Posting a Jobsheet_](https://web.archive.org/web/20260517080323/https://docs.garagehive.com/p/_TYxXo5rJ55YZo/Taking-a-Payment-and-Posting-a-Jobsheet), 2026-05-17): _"Before posting the Jobsheet, all labour lines must-have resource information added to them"_; _"All item numbers must be updated from the **Placeholder Item**, such as **MISC**, to their actual item numbers"_; _"All parts need to be bought into stock."_ Cada uno da un error al postear.
- **Semáforo de líneas** ([_Understanding the Jobsheet Line Checker Notifications_](https://web.archive.org/web/20260611200505/https://docs.garagehive.com/p/I9MVRY1LE-XSlm/Understanding-the-Jobsheet-Line-Checker-Notifications), 2026-06-11): la bandera roja (stock insuficiente, falta el recurso de labor) _"Prevents document from posting"_; el triángulo (monto cero, precio bajo costo, ítem repetido) _"Doesn't prevent the document from posting"_. Un interruptor del Dueño convierte el triángulo de precio bajo costo en bandera: _"Prevent Posting if Unit Price is Less or Equal Than Cost"_.

Y un interruptor para borrar, como el nuevo de Tekmetric: _"Ask for Reason on Jobsheet Delete"_ (_Using the Jobsheet_).

**No se encontró ningún interruptor que exija el kilometraje al cerrar.** Existe un artículo _Vehicle Mileage Settings_ que podría tenerlo y no se pudo leer (§3.2).

### 5.3 La llave

[_Managing Key Numbers_](https://web.archive.org/web/20250517125010/https://docs.garagehive.com/p/lRDDg8yNtorsJd/Managing-Key-Numbers) (2025-05-17) es la versión más completa del dato de patio que el original encontró en Mitchell 1:

- Con el interruptor _Use Key Tag Catalogue_, el Jobsheet gana un **Key Tag No.** elegido de un catálogo de llaveros físicos del taller.
- _"If you enable the **Vehicle on Site** slider, the system will prompt you to allocate a key number to the Jobsheet."_ — **la llegada del carro dispara la pregunta de la llave**.
- _"A key number cannot be assigned to more than one Jobsheet."_
- _"Upon posting, the system will prompt you to deallocate the key number, as **a Jobsheet cannot be posted with an assigned key number**."_
- El mismo número puede rotular el estante de repuestos del trabajo.

### 5.4 El estado de entrada, las fotos y la firma

- **Kilometraje:** campo _Mileage_ del Jobsheet, _"the mileage of the vehicle at the time of booking"_.
- **Fotos al recibir:** dos vías. El Técnico, en la inspección: _"Take Picture or Take Line Picture"_ ([_Technician Vehicle Inspections/Checklists_](https://web.archive.org/web/20250517120106/https://docs.garagehive.com/p/IhLeSlHs3GEtjh/Technician-Vehicle-Inspections-Checklists), 2025-05-17). Y **el Cliente, antes de llegar**, en el _Customer Self Check-in_ (§5.5).
- **Daños previos:** dentro de la inspección con semáforo verde/ámbar/rojo y texto. Sigue siendo _Parcial (checklist)_ como dijo el original.
- **Combustible y objetos dentro:** **no encontrados** en lo leído.
- **Firma:** hay un artículo titulado _Customer Digital Signature Capture_, cuya ruta original habla de _"Job Card and Schedule of Work"_. **Su contenido es [NO VERIFICADO]**: el título sugiere una firma sobre el Jobsheet, pero no se puede afirmar si es al recibir, al autorizar o al entregar.
- **Consentimiento:** la ficha del Cliente tiene _"GDPR consent form signed"_, que se muestra en el Jobsheet ([_Create a Customer Card_](https://web.archive.org/web/20260418125756/https://docs.garagehive.com/p/bevgqpK7bLBscc/Create-a-Customer-Card), 2026-04-18). Es una firma de privacidad, no de recepción.

### 5.5 La recepción que hace el Cliente

[_Customer Self Check-in_](https://web.archive.org/web/20260214174445/https://docs.garagehive.com/p/q7_ILRU8gSo5jq/Customer-Self-Check-in) (2026-02-14): _"A one-time link is sent to the customers via SMS or email. … The customer opens the link to confirm their contact information, parking spot, and add any relevant notes or photos. … Customers submit their details and receive a confirmation on their screens, and the system updates automatically."_ La página de precios lo lista como _"Customer Self-Check-In"_ entre las funciones incluidas.

Es el único caso encontrado, en los seis productos, en que **el Cliente escribe parte de la recepción**. Y lo hace sobre un Jobsheet que ya existe.

### 5.6 Identificación del vehículo

- **Matrícula como llave del mostrador:** la secuencia del Jobsheet y la de la agenda empiezan por _Vehicle Registration No._ ([_Creating a Booking from the Schedule_](https://web.archive.org/web/20250517114938/https://docs.garagehive.com/p/wRnc6XrfqKq6-x/Creating-a-Booking-from-the-Schedule), 2025-05-17). **[NO VERIFICADO]** si exige que sea única.
- **Consulta por matrícula, propia y cobrada:** la VRM llena la sección _General_, motor, transmisión y componentes de vehículo eléctrico (_Vehicle Card Details_). Los Términos de Servicio la cuentan entre los costos variables por consulta, con _"free monthly units included in your subscription plan"_ ([garagehive.co.uk/tos](https://garagehive.co.uk/tos/), leído 2026-09-30). **[NO VERIFICADO]** el proveedor de datos; el producto está hecho para el Reino Unido, Irlanda, Isla de Man y Sudáfrica según el pie de su documentación.
- **VIN:** la acción _"Update Vehicle Data by VIN — This is useful if a vehicle has a plate change"_. **Garage Hive previó el cambio de placa**, que es lo que el historial de vigencia de la Placa resuelve en Bitácora.
- **Quien paga ≠ Quien es dueño:** _"Bill-to Customer … If you have a customer who had a lease car, you want their name to remain attached to the car. But you want the invoice to be charged to the lease company"_ (_Create a Customer Card_). Es facturación, no **Quien entrega**: sigue sin aparecer en ninguno el "hoy lo trajo Marvin".

---

## 6. Precio, verificado hoy

**[PRODUCTO] Shop-Ware** — https://shop-ware.com/packages/ (2026-09-30)

| Tier          | Mensual | Anual (cobro anual) | Qué agrega                                                                                                                             |
| ------------- | ------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Startup**   | US$279  | US$251              | Usuarios ilimitados · AI Parts Matrix · DVX (inspección digital) · Maintenance Builder · **texto bidireccional limitado** · pagos      |
| **Pro**       | US$389  | US$350              | Texto bidireccional ilimitado · guía de labor MOTOR · catálogo de repuestos · OE Specs · conexiones API · AutoWrite (redacción con IA) |
| **Master**    | US$499  | US$449              | Analítica de negocio · valor de inventario y margen mensual · tableros para grupos de coaching                                         |
| **Ultimate+** | US$999  | US$899              | Sitio web · SEO · Google Ads · seguimiento de llamadas · CRM · agenda en línea                                                         |

Complemento aparte: **CRM + Online Service Scheduler, US$249/mes**. Cargos fuera de la tabla, declarados por ellos mismos: _"Data Migration fees may apply. Accounting Link integration fee applies."_ y comisiones por transacción de pagos. Sin contrato anual: _"Shop-Ware offers flexible month-to-month subscription plans that do not require an annual contract"_. El precio es por local: _"Shop-Ware pricing is structured on a per-location basis"_.

> **Cómo se leyó la tabla.** La página muestra un conmutador _Monthly / Annual_ y, por tier, dos cifras seguidas de la leyenda _"Billed Annually"_ bajo la segunda. Se asignó la mayor al pago mensual y la menor al anual porque la misma página dice que el pago anual da _"a discounted rate"_. El descuento resulta de ~10 %, el mismo de Tekmetric, Shopmonkey y AutoLeap (original §10).

**[PRODUCTO] Garage Hive** — https://garagehive.co.uk/pricing/ (2026-09-30)

- **Piso publicado:** _"Starting from £145 per month with a one-month rolling contract"_.
- **Planes:** _"There are three subscription plans we offer Core, Pro and Enterprise"_ ([Terms of Service](https://garagehive.co.uk/tos/)). Core _"is suitable for smaller garages"_; Pro _"best suits small to medium-sized garages"_; Enterprise es para varios locales. **[NO VERIFICADO]** a cuál corresponde el piso de £145, cuánto cuestan los otros dos y si es con IVA: la ToS remite a una _"pricelist"_ que no es pública.
- **Cómo se cobra:** _"Monthly Costs – these are set monthly costs … according to the chosen Subscription Plan plus any changes … (adding users and additional software services)"_ y _"Variable Costs – transaction-based costs per unit (Postcode Lookup, MOT Lookup, SMS etc.)"_. Es decir: **por usuario, más consultas y SMS por unidad**. Excepciones al mes a mes: _"Autodata (quarterly) and Microsoft 365 (annual)"_.

Un resultado de buscador atribuye a Garage Hive un piso de **£109/mes**; **no aparece en la página leída hoy** y no se usa.

**Lo que cambia para la comparación del original:** con Shop-Ware, **cuatro de los seis publican precio**, y el piso del rubro para un local sube un poco: el tier de entrada va de US$199 (Tekmetric, AutoLeap) a US$279 (Shop-Ware). La conclusión del original —~US$180–280/mes por local— se sostiene con el techo corrido. Garage Hive, en libras y por usuario, no se puede comparar fila por fila sin su lista de precios.

---

## 7. Contradicciones con el documento original

Se dicen explícitamente para que la tabla §6 del original no se lea sin esta corrección.

1. **"Mitchell 1, Shop-Ware y Garage Hive no publican precio"** (original §2.12, §3.2, §6, §10). **Falso hoy para Shop-Ware y para Garage Hive.** Shop-Ware publica cuatro tiers con cifra; Garage Hive publica un piso. No se puede saber si las páginas cambiaron entre el 2026-08-29 y hoy o si no se encontraron entonces. Mitchell 1 no se revisó en este anexo.

2. **"Tekmetric — cero al crear"** (original §4.1, §6 y resumen 2: _"Nadie bloquea la creación; todos bloquean el cierre"_). **La segunda mitad se sostiene; la primera no.** El original infirió el cero de que _Advanced Settings_ no tiene interruptores de creación, pero la orden de Tekmetric se crea con Cliente y Vehículo, y el vehículo exige año, marca y modelo (§4.1). La frase correcta es: **nadie bloquea la creación por datos de recepción; todos exigen saber de quién es y qué carro es.**

3. **"Las tres C están en el producto, pero como dos cajas de texto, no como entidad"** y **"Somos el único de los seis que modela la queja como entidad múltiple"** (original §2.10, §4.6, §8.6). **Falso para Tekmetric**: _"enter each concern as its own item/row"_, con hallazgo y medios por fila, y `customerConcerns[]` en la API (§4.3). Lo único que sigue siendo nuestro es la **Especialidad por queja**.

4. **"Garage Hive es el único que archiva lo publicado"** (original §9.1) y la celda **"Copia de lo que se le mandó al Cliente: ?"** para Tekmetric. **Tekmetric también guarda copia**: registros puntuales de cada autorización y _"carbon copies of what was approved at that point in time"_ (§4.6). Matiz: Tekmetric guarda **lo aprobado**; Garage Hive dice guardar **lo publicado con su texto de presentación**. No son lo mismo, pero la brecha §7.1 del original queda **más cara**, no más barata: la cierran dos competidores.

5. **Las fuentes de Garage Hive del original ya no se pueden reabrir** (§3.2). No es una contradicción de contenido, pero cambia cómo se puede auditar lo que el original afirmó.

6. **El "Hat #" de Mitchell 1 como "el dato más de patio de toda la investigación"** (original §4.3). Sigue siendo el más antiguo, pero **no es único**: Tekmetric tiene `keytag` y Garage Hive un catálogo de llaveros que bloquea el cierre (§5.3).

---

## 8. Tabla: las celdas `?` de §6, cerradas

Solo las filas que este anexo pudo tocar. Las que no aparecen siguen como estaban en el original. Leyenda igual que la del original, más **[ARCHIVO]** (§ Convención).

### 8.1 Tekmetric

| Capacidad (fila de §6 del original)      | Antes                | Ahora                                                                                            | Fuente                                        |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Campos obligatorios para **crear**       | 0                    | **Cliente + Vehículo** (nombre; año, marca, modelo). Placa y VIN opcionales — **corrige** (§7.2) | Multi-Shop, Transfer RO, API _Create Vehicle_ |
| Se bloquea al **cerrar**, no al crear    | Sí                   | **Sí**, y además al borrar o archivar (nuevo)                                                    | Advanced Settings (releído)                   |
| Placa como llave del mostrador           | ?                    | **No**: criterio de búsqueda, campo opcional                                                     | Global Search Engine, API                     |
| Decodificador de VIN                     | ?                    | **Sí** (con PartsTech)                                                                           | Tekmetric FAQs                                |
| Consulta por placa                       | ?                    | **Sí**, decodifica por placa salvo personalizadas; proveedor **[NO VERIFICADO]**                 | Smart Jobs 101, FAQs                          |
| Fotos al recibir                         | Parcial              | **Parcial**: medios del Cliente en cada queja; del Técnico en la inspección                      | The Customer Concern                          |
| Queja del Cliente como entidad múltiple  | Parcial (dos listas) | **Sí, sin Especialidad** — **corrige** (§7.3)                                                    | The Customer Concern, API                     |
| Número de llave                          | (no había fila)      | **Sí** (`keytag`, imprimible)                                                                    | API, Release Notes v2.27                      |
| Combustible / objetos / firma al recibir | No encontrado        | **No encontrado**; _Mobile App Check In Experience_ **[NO VERIFICADO]**                          | Release Notes (solo el título)                |
| Constancia con **medio** y persona       | ?                    | **Sí el medio** (seis); persona **[NO VERIFICADO]**                                              | Digital Signature & Authorization Process     |
| Copia de lo que se le mandó al Cliente   | ?                    | **Sí, de lo aprobado** (copias descargables por autorización) — **corrige** (§7.4)               | Digital Signature & Authorization Process     |
| Historial de autorizaciones imprimible   | ?                    | **Descargable**; si se imprime en la factura **[NO VERIFICADO]**                                 | ídem                                          |

### 8.2 Garage Hive

| Capacidad (fila de §6 del original)      | Antes                    | Ahora                                                                                                          | Fuente                                                  |
| ---------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Campos obligatorios para **crear**       | ?                        | **Secuencia:** tipo de servicio → matrícula → kilometraje → Cliente. Obligatoriedad formal **[NO VERIFICADO]** | [ARCHIVO] Using the Jobsheet                            |
| Obligatoriedad **configurable**          | ?                        | **Parcial**: interruptores de precio bajo costo, motivo al borrar y catálogo de llaveros; lo demás fijo        | [ARCHIVO] Line Checker, Using the Jobsheet, Key Numbers |
| Se bloquea al **cerrar**, no al crear    | ?                        | **Sí**: técnico en la labor, repuesto real, stock recibido, llavero liberado                                   | [ARCHIVO] Posting, Line Checker, Key Numbers            |
| Placa como llave del mostrador           | ?                        | **Sí, en la práctica**: la matrícula abre el Jobsheet y la reserva; unicidad **[NO VERIFICADO]**               | [ARCHIVO] Using the Jobsheet, Booking from the Schedule |
| Decodificador de VIN                     | ?                        | **Parcial**: _Update Vehicle Data by VIN_, pensado para el cambio de placa                                     | [ARCHIVO] Vehicle Card Details                          |
| Consulta por placa                       | ?                        | **Sí, VRM británica, cobrada por consulta**                                                                    | [ARCHIVO] Vehicle Card Details; ToS (hoy)               |
| Odómetro de entrada                      | ?                        | **Sí** (_Mileage_ del Jobsheet)                                                                                | [ARCHIVO] Using the Jobsheet                            |
| Combustible al recibir                   | ?                        | **No encontrado**                                                                                              | —                                                       |
| Objetos dentro del carro                 | ?                        | **No encontrado**                                                                                              | —                                                       |
| Fotos al recibir                         | Sí (imagen del vehículo) | **Sí**, y además **las manda el Cliente** en el _Self Check-in_                                                | [ARCHIVO] Customer Self Check-in                        |
| Número de llave                          | (no había fila)          | **Sí, con catálogo, unicidad y bloqueo al postear**                                                            | [ARCHIVO] Managing Key Numbers                          |
| Recepción hecha por el Cliente           | (no había fila)          | **Sí** (enlace de un solo uso: contacto, estacionamiento, notas, fotos)                                        | [ARCHIVO] Customer Self Check-in                        |
| Firma del Cliente al recibir             | ?                        | **[NO VERIFICADO]**: existe _Customer Digital Signature Capture_, ilegible                                     | Título en buscador                                      |
| Firma electrónica al autorizar           | ?                        | **[NO VERIFICADO]** (mismo artículo)                                                                           | —                                                       |
| Dueño ≠ **Quien entrega** en esta Visita | ?                        | **No** (_Bill-to Customer_ es facturación)                                                                     | [ARCHIVO] Create a Customer Card                        |
| Queja del Cliente como entidad múltiple  | No (grupos)              | **No**: comentarios de texto libre, opcionales                                                                 | [ARCHIVO] Using the Jobsheet, Vehicle Arriving          |

### 8.3 Precio de lista publicado

| Producto        | Antes         | Ahora                                                                                |
| --------------- | ------------- | ------------------------------------------------------------------------------------ |
| **Shop-Ware**   | No publica    | **US$279 / 389 / 499 / 999** mensual · **251 / 350 / 449 / 899** anual — **corrige** |
| **Garage Hive** | No verificado | **Desde £145/mes**, mes a mes; precio por plan **[NO VERIFICADO]** — **corrige**     |

---

## 9. Qué implica para #128 (obligatoriedad de la Recepción)

Evidencia ordenada por la pregunta del ticket —¿bloquear al crear o al cerrar, configurable por el Dueño?—. **No es una recomendación.**

1. **Exigir identidad al crear es lo normal del rubro, no una rareza nuestra.** Los cuatro productos con creación documentada piden saber de quién es y qué carro es antes de que la orden exista: Tekmetric (Cliente + año/marca/modelo), Mitchell 1 (licencia + año/marca/modelo), Garage Hive (matrícula + Cliente, como secuencia; la obligatoriedad formal no está escrita), Shop-Ware (marca). **El paso _El carro_ de Bitácora (Placa, marca, Cliente) cae dentro de ese rango.** Lo que nadie más hace es lo segundo: **exigir la queja para seguir**. En Tekmetric la queja va en otra pestaña después de crear; en Garage Hive es un comentario opcional.

2. **Lo que el rubro exige al cerrar es lo que hace falta para cobrar, más dos datos de patio.** Técnico por línea, repuestos con número y en stock, tipo de tarjeta —todo para la contabilidad—, más **el odómetro** (Tekmetric, interruptor) y **la llave liberada** (Garage Hive, fijo). **Ningún producto documenta un bloqueo, en ningún momento, por combustible, daños u objetos.** Si Bitácora decidiera exigir el Estado de entrada en algún momento, no tendría precedente que copiar: sería decisión propia.

3. **La configurabilidad es mixta en los dos.** Garage Hive tiene bloqueos fijos (técnico, repuesto real, stock, llave) y unos pocos interruptores del Dueño; Tekmetric tiene casi todo en interruptores, pero no deja apagar los medios de autorización. **Evidencia para un diseño en dos capas**: lo que sostiene la integridad del sistema, fijo; lo que expresa la política del taller, en Ajustes. Cuál dato cae en cada capa es la decisión de #128.

4. **Los dos avisan lo que falta antes del momento de bloquear, y con dos niveles.** Tekmetric pinta _"warning icons throughout the estimate"_; Garage Hive distingue bandera (_"Prevents document from posting"_) de triángulo (_"Doesn't prevent"_). Encaja con el [ADR 0023](../../../apps/bitacora/docs/adr/0023-lo-que-se-configura-tiene-que-verse.md) —lo que se configura tiene que verse— y con el estilo de `faltaParaSeguir` (_"Falta la placa."_) de `recepcion.ts`: decir el motivo en una frase en lugar de apagar el botón sin explicación.

5. **En los dos, la orden puede nacer antes de que llegue el carro.** Tekmetric desde una cita, Garage Hive desde la reserva en línea o la agenda, y el _Self Check-in_ de Garage Hive llena datos de recepción **después**. Bitácora hoy no tiene reservas, así que esto no obliga a nada; pero **si Bitácora llega a tener agenda, cualquier exigencia de recepción al crear tendría que moverse**, porque la orden existiría sin carro.

6. **La llave aparece como el dato de recepción más exigido después del odómetro.** Tres de seis tienen campo; Garage Hive lo pide al marcar _Vehicle on Site_ y lo exige liberado al cerrar. Si #128 abre la lista de qué se exige, la llave es un candidato con precedente que hoy **Bitácora no tiene ni como campo opcional**.

7. **El odómetro tiene argumento del fabricante para volverse exigible al cerrar**: garantías de repuestos y servicios por kilometraje (§4.2). Es evidencia para la pregunta abierta entre el ADR 0011 y el ADR 0017 que el original anotó en §11.10, no para esta decisión.

---

## 10. Contradicciones e incertidumbres

1. **Garage Hive se leyó en copias fechadas, no hoy.** Las capturas van de mayo de 2025 a junio de 2026. Una función que se agregó o quitó después de la captura no se ve. Todo lo de §5 vale **para la fecha de cada captura**.

2. **"Obligatorio" en Garage Hive es una lectura de la secuencia, no un `required`.** El artículo dice _"Select … Fill in … Enter"_, no qué pasa si no se llena. Para Tekmetric la obligatoriedad del vehículo sale del contrato de la API, que es más fuerte, pero **la API no tiene endpoint para crear órdenes**: que la orden necesite vehículo es inferencia de la forma de su respuesta y del formulario.

3. **La lectura de la tabla de Shop-Ware depende de un conmutador.** El texto plano de la página da dos cifras por tier; asignarlas a mensual y anual se apoya en el FAQ del propio fabricante (§6). Si la página mostrara al revés —el anual más caro—, contradiría su propio FAQ.

4. **La evidencia negativa sigue siendo débil** (original §11.3–11.4). "No encontrado" para combustible y objetos significa que no aparece en lo leído hoy, que es bastante más que en agosto pero no todo. En Tekmetric hay una función de _check in_ móvil sin leer; en Garage Hive, dos artículos sin captura.

5. **La corrección de §7.3 achica una ventaja que el original presentaba como limpia.** La queja como entidad múltiple ya no es exclusiva; la Especialidad por queja, sí. Conviene no usar la versión vieja en ninguna conversación de venta.

---

## Fuentes

Leídas el **2026-09-30** salvo indicación distinta.

### Documentación de producto (primaria)

| Fuente                                                                                                                                                                                | Qué aporta a este anexo                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Tekmetric — [Repair Order Advanced Settings](https://support.tekmetric.com/hc/en-us/articles/360041549714-Repair-Order-Advanced-Settings)**                                         | Los nueve interruptores siguen; nueva sección de exigencias para borrar o guardar para después                            |
| **Tekmetric — [The Customer Concern](https://support.tekmetric.com/hc/en-us/articles/36897066105111-The-Customer-Concern)**                                                           | _"enter each concern as its own item/row"_ · hallazgo y medios por fila · desde Inspección y Estimado                     |
| **Tekmetric — [Global Search Engine](https://support.tekmetric.com/hc/en-us/articles/360055559034-Global-Search-Engine)**                                                             | Búsqueda de vehículos por placa, VIN, YMM y unidad                                                                        |
| **Tekmetric — [Digital Signature & Authorization Process](https://support.tekmetric.com/hc/en-us/articles/4421125978391-Digital-Signature-Authorization-Process)**                    | Los seis medios de autorización · _"carbon copies of what was approved"_ · solo la firma es configurable                  |
| **Tekmetric — [How to Transfer Repair Orders](https://support.tekmetric.com/hc/en-us/articles/6378779404183-How-to-Transfer-Repair-Orders)**                                          | Campos _Customer_ y _Vehicle_ con _Add New Customer_ y _Add New Vehicle_                                                  |
| **Tekmetric — [Multi-Shop: Shared Customer History](https://support.tekmetric.com/hc/en-us/articles/15925142685463-Tekmetric-Multi-Shop-Shared-Customer-History)**                    | El formulario _Create RO_ con Cliente y Vehículo                                                                          |
| **Tekmetric — [Tekmetric FAQs](https://support.tekmetric.com/hc/en-us/articles/34977202334615-Tekmetric-FAQs)**                                                                       | No decodifica placas personalizadas · decodificación de VIN con PartsTech                                                 |
| **Tekmetric — [Smart Jobs 101](https://support.tekmetric.com/hc/en-us/articles/27373807531287-Smart-Jobs-101)**                                                                       | _"using the VIN or license plate to decode the vehicle"_                                                                  |
| **Tekmetric — [CARFAX Integration FAQS & Configuration](https://support.tekmetric.com/hc/en-us/articles/360036301793-CARFAX-Integration-FAQS-Configuration)**                         | CARFAX solo recibe órdenes con placa                                                                                      |
| **Tekmetric — [Release Date & Feature Notes](https://support.tekmetric.com/hc/en-us/articles/360041785434-Release-Date-Feature-Notes)**                                               | Búsqueda por placa al crear la orden · `keytag` imprimible · auditoría de autorizaciones · _Mobile App Check In_          |
| **Tekmetric — [Counter Sales](https://support.tekmetric.com/hc/en-us/articles/22405880885527-Counter-Sales)**                                                                         | La única venta con Cliente opcional, y no es una orden                                                                    |
| **Tekmetric — [Repair Order Workflow Overview for Service Writers](https://support.tekmetric.com/hc/en-us/articles/360043239813-Repair-Order-Workflow-Overview-for-Service-Writers)** | La recomendación de exigir el odómetro, con sus razones                                                                   |
| **Tekmetric — [API](https://api.tekmetric.com/)**                                                                                                                                     | `required` de _Create Customer_ y _Create Vehicle_ · sin endpoint de creación de órdenes · `keytag`, `customerConcerns[]` |

### Documentación de producto en archivo (primaria fechada)

Garage Hive, copias del Internet Archive; la fecha es la de la captura.

| Fuente                                                                                                                                                                                                 | Captura    | Qué aporta                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| [Using the Jobsheet](https://web.archive.org/web/20260611192105/https://docs.garagehive.com/p/4-w1NrytzbzDpJ/Using-the-Jobsheet)                                                                       | 2026-06-11 | Secuencia de creación · campos de recepción · comentarios del Cliente    |
| [Creating a Jobsheet from Various Places](https://web.archive.org/web/20260611195537/https://docs.garagehive.com/p/Q7dwf7PXJVV1-N/Creating-a-Jobsheet-from-Various-Places)                             | 2026-06-11 | Los cuatro orígenes del Jobsheet                                         |
| [Creating a Booking from the Schedule](https://web.archive.org/web/20250517114938/https://docs.garagehive.com/p/wRnc6XrfqKq6-x/Creating-a-Booking-from-the-Schedule)                                   | 2025-05-17 | La reserva también empieza por la matrícula                              |
| [Processing a Vehicle Arriving in Your Trial](https://web.archive.org/web/20251110225336/https://docs.garagehive.com/p/v__bvoWFFkg24B/Processing-a-Vehicle-Arriving-in-Your-Trial)                     | 2025-11-10 | Qué se hace cuando el carro llega · la llave                             |
| [Customer Self Check-in](https://web.archive.org/web/20260214174445/https://docs.garagehive.com/p/q7_ILRU8gSo5jq/Customer-Self-Check-in)                                                               | 2026-02-14 | La recepción hecha por el Cliente                                        |
| [Managing Key Numbers](https://web.archive.org/web/20250517125010/https://docs.garagehive.com/p/lRDDg8yNtorsJd/Managing-Key-Numbers)                                                                   | 2025-05-17 | Catálogo de llaveros · unicidad · no se postea con llavero asignado      |
| [Vehicle Card Details](https://web.archive.org/web/20251016152727/https://docs.garagehive.com/p/bgysB-6paTo4IV/Vehicle-Card-Details)                                                                   | 2025-10-16 | VRM · actualizar por VIN ante cambio de placa                            |
| [Create a Customer Card](https://web.archive.org/web/20260418125756/https://docs.garagehive.com/p/bevgqpK7bLBscc/Create-a-Customer-Card)                                                               | 2026-04-18 | _Bill-to Customer_ · consentimiento GDPR                                 |
| [Taking a Payment and Posting a Jobsheet](https://web.archive.org/web/20260517080323/https://docs.garagehive.com/p/_TYxXo5rJ55YZo/Taking-a-Payment-and-Posting-a-Jobsheet)                             | 2026-05-17 | Lo que bloquea el posteo                                                 |
| [Understanding the Jobsheet Line Checker Notifications](https://web.archive.org/web/20260611200505/https://docs.garagehive.com/p/I9MVRY1LE-XSlm/Understanding-the-Jobsheet-Line-Checker-Notifications) | 2026-06-11 | Bandera que bloquea, triángulo que no · interruptor de precio bajo costo |
| [Technician Vehicle Inspections/Checklists](https://web.archive.org/web/20250517120106/https://docs.garagehive.com/p/IhLeSlHs3GEtjh/Technician-Vehicle-Inspections-Checklists)                         | 2025-05-17 | Semáforo de inspección · fotos del Técnico                               |
| [Customer Online Authorisation](https://web.archive.org/web/20251018172659/https://docs.garagehive.com/p/SSAePIHtVgTdpq/Customer-Online-Authorisation)                                                 | 2025-10-18 | Índice de la autorización en línea (sin contenido nuevo)                 |

### Precios y términos (primaria)

- Shop-Ware — https://shop-ware.com/packages/
- Garage Hive — https://garagehive.co.uk/pricing/ y https://garagehive.co.uk/tos/

### Fuentes de Bitácora

`apps/bitacora/src/app/pantallas/recepcion/recepcion.ts` (`faltaParaSeguir`, releído: sigue exigiendo Placa, marca, Cliente y al menos un Reporte) · ADR [0011](../../../apps/bitacora/docs/adr/0011-proxima-visita-la-pone-el-asesor.md), [0017](../../../apps/bitacora/docs/adr/0017-la-queja-del-cliente-es-una-entidad-y-la-recepcion-guia.md), [0023](../../../apps/bitacora/docs/adr/0023-lo-que-se-configura-tiene-que-verse.md).

### Lo que NO se pudo verificar

El formulario exacto de _Create RO_ de Tekmetric y su _Mobile App Check In Experience_; quién queda registrado como persona en su constancia de autorización; los artículos _Customer Digital Signature Capture_, _Vehicle Mileage Settings_ y _Using the Pre-Check-in Feature_ de Garage Hive; qué campos del Jobsheet son formalmente obligatorios; si la matrícula debe ser única; el proveedor de las consultas por placa de los dos; el precio de cada plan de Garage Hive y si incluye IVA. Todo lo demás de la tabla §6 del original que no aparece en §8 sigue como estaba.
