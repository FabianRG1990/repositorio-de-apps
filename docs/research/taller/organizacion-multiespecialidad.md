# Organización del trabajo en talleres multi-especialidad (mecánico / eléctrico / pintura)

> Investigación para el ticket [#16](https://github.com/FabianRG1990/repositorio-de-apps/issues/16) del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14).
> Fecha: 2026-08-17. Alimenta la decisión de [#20 — Modelo de organización multi-especialidad](https://github.com/FabianRG1990/repositorio-de-apps/issues/20).

---

## 1. Pregunta

> ¿Cómo organizan el flujo de trabajo, a nivel internacional, los talleres automotrices que ofrecen más de una especialidad (mecánico + eléctrico + pintura, en cualquier combinación)?
>
> - Si una orden de trabajo se divide en líneas/tareas por especialidad dentro de la misma orden, o si cada especialidad maneja su propia orden.
> - Si hay un pipeline/kanban por especialidad o uno unificado.
> - Cómo se factura/reporta cuando un mismo vehículo pasa por varias especialidades.
> - Cómo lo modelan los sistemas de gestión de taller que sí soportan esto.
>
> El sistema debe funcionar igual de bien para un taller de una sola especialidad que para uno con las tres.

**Alcance de la evidencia buscada:** modelo de datos observable (entidades, campos, enums) en documentación de primera mano, esquemas públicos y manuales de producto; no reseñas ni comparativas de terceros.

---

## 2. Resumen ejecutivo

1. **El patrón dominante es UNA orden por visita del vehículo, subdividida en líneas/tareas, con la especialidad como *atributo de la línea*, no como eje que parte la orden.** Esto se cumple tanto en el mundo de colisión (CCC ONE, Mitchell, el estándar CIECA BMS) como en el de mecánica general (Tekmetric, Shopmonkey), como en ERP genérico (Dynamics 365 Business Central) y en DMS de concesionario (Autosoft).

2. **Ningún producto líder modela "especialidad" como entidad de primera clase con ese nombre.** Cada industria la codifica con un nombre distinto sobre el mismo lugar del modelo (la línea o su recurso asignado):
   - colisión → `Labor Category` / `LaborType` en la línea (CCC, Mitchell, CIECA)
   - mecánica general → **`Job Categories` por job, opcionalmente obligatorias** (Tekmetric); `Service.categoryId` + `Labor.categoryId` + `Labor.skillRequired` (Shopmonkey)
   - Reino Unido → *Group Items* con *Service Action Categories* (Garage Hive)
   - ERP → *skill code* + *resource group* asociados al recurso y al ítem (Business Central)
   - DMS de concesionario → *labor level* por línea + tipo de RO en la cabecera (Autosoft)

   Revisados nueve productos, **todos** tienen algún mecanismo de categorización en la unidad de trabajo. Ninguno lo llama "especialidad".

3. **La excepción real y documentada es el concesionario:** ahí sí existe una orden por departamento. Autosoft marca en la cabecera del RO el campo `Service/Body/Contract/QuickLube [S/B/C/Q]`, es decir, una orden de carrocería es un *tipo de documento distinto* de una orden de servicio mecánico. Fuera del concesionario no encontré evidencia primaria de ese patrón.

4. **Ningún producto revisado tiene un kanban por especialidad.** Los dos ejes que sí existen son **etapa del proceso** y **técnico**: Shopmonkey tiene un único Workflow con columnas configurables; Tekmetric tiene *Job Board* (etapas) más *Tech Board* (una columna por técnico, con carril de "Unassigned Jobs"); Garage Hive tiene TCards con un carril por técnico; Business Central tiene un único *Dispatch Board* filtrable por `Resource Filter` y `Resource Group Filter`; el taller de carrocería real organiza el tablero por etapas físicas (desarme, carrocería, preparación, pintura, pulido, armado), no por oficio.

5. **La unidad de negociación con el cliente ya es la línea/tarea, no la orden.** Tekmetric aprueba o declina **cada job por separado** ("Each job on an RO … can be approved or declined separately from other jobs on the RO"); Shopmonkey tiene `authorizationStatus` por `Service`; Garage Hive autoriza grupo por grupo. Nadie factura parcialmente por especialidad: el mecanismo para "el cliente solo aprueba la mitad" es **declinar o diferir tareas dentro de la misma orden**. Este es el argumento más fuerte contra partir la orden por especialidad.

6. **La facturación es una sola factura consolidada por orden, con los totales desglosados por categoría de trabajo.** Los propios esquemas lo demuestran: Tekmetric expone `laborSales / partsSales / subletSales / feeTotal`; Shopmonkey expone `laborCents / partsCents / tiresCents / subcontractsCents / feesCents`; CIECA agrega los totales por `LaborType`. El desglose por especialidad es un *rollup* del atributo de línea, no un documento separado.

7. **El mejor patrón encontrado para "estado por línea vs. estado global" es el de Business Central:** cada tarea tiene su propio `Repair Status Code` configurable, cada estado declara a qué estado de cabecera mapea y con qué prioridad, y **el estado de la orden se deriva tomando el de mayor prioridad entre sus líneas**. Esto resuelve limpiamente el caso "el carro ya salió de mecánica pero sigue en pintura".

8. **La misma jerarquía sirve a mono-especialidad y multi-especialidad sin ramificar el modelo.** Tekmetric y Shopmonkey son productos de mecánica general pura; CCC y Mitchell son de colisión pura; Fullbay es de diésel pesado puro; todos usan la misma forma `orden → unidad de trabajo autorizable → líneas económicas`. Lo único que cambia es qué valores tiene el catálogo de categorías. **Un taller mono-especialidad es simplemente el caso en que ese catálogo tiene un elemento.** Mitchell 1 Manager SE lo confirma por evolución: empezó siendo una rejilla plana de líneas y **añadió después** los contenedores de trabajo (*Job View*).

---

## 3. Hallazgos con evidencia

### 3.1 Colisión / carrocería y pintura: la especialidad es una columna de la línea

**CCC ONE** (líder de mercado en EE. UU. para colisión) mantiene una sola *workfile* por vehículo y clasifica cada línea del presupuesto con una categoría de mano de obra. La instrucción oficial para agregar mano de obra mecánica dentro de un presupuesto de colisión es explícita:

> "Locate the **Labor Charge Category** column to the right of the **Labor** column. Note that by default the column is blank. Insert a capital 'M' next to the Labor time that should reflect Mechanical Labor, or Right-Click on the line and select **Line Properties** → Select **Mechanical** from the **Labor Category** droplist."
> — <https://cccis.zendesk.com/hc/en-us/articles/360042332432-Mechanical-Labor-Hours-Not-Showing-on-Estimate> (confianza: alta)

Es decir: el trabajo mecánico **no abre otra orden**; ocupa líneas de la misma orden marcadas con otra categoría.

Esa categoría es además la unidad económica: las tarifas se configuran por categoría, no por orden.

> "The profile Labor feature allows you to enter labor rates for each labor and material charge category. This feature also allows you to apply tax for each charge category."
> — <https://cccis.zendesk.com/hc/en-us/articles/360042736191-Working-with-Rates-and-Rules-in-the-Repair-Facility-Profile> (confianza: alta)

**Mitchell** documenta lo mismo en sus P-Pages oficiales (las páginas de procedimiento del baremo), y aclara que la clasificación la decide el taller, no la base de datos:

> "LABOR CATEGORIES: The labor times shown in the Guide fall into various categories (for example: body, frame, mechanical) as determined by the repair facility's operating procedures. As a guide, components for which R&I or R&R is commonly considered to be a mechanical operation when performed in a collision repair environment are designated with the letter 'm' in the text. These designations are only a guide."
> — <http://static.mymitchell.com/static/webhelp/ppages/rvg/1033/Content/rvg010400.htm> (confianza: alta)

Dos consecuencias de diseño que vale la pena robar: (a) la categoría es **configurable por taller**, no una taxonomía impuesta; (b) el sistema puede **sugerir** la categoría pero el taller la sobreescribe.

**CIECA BMS** — el estándar de intercambio de la industria de colisión — lo formaliza. El elemento de línea se llama `DamageLineInfo` (no `EstimateLineItem`), y lleva dentro un bloque `LaborInfo` con el tipo:

```xml
<DamageLineInfo>
  <LineNum/> <LineDesc/> <LineType/>
  <PartInfo>...</PartInfo>
  <LaborInfo>
    <LaborType/>          <!-- LAB, LAR, LAM, LAF, LAG, LAS, LAA... -->
    <LaborOperation/>     <!-- OP5, OP6, OP9, OP11... -->
    <LaborHours/>
    <DatabaseLaborHours/>
    <LaborTypeJudgmentInd/>
  </LaborInfo>
  <SubletInfo>
    <PartSubletInd/> <LaborSubletInd/>
  </SubletInfo>
</DamageLineInfo>
```

Códigos de `LaborType` observados en ficheros BMS de producción generados por Mitchell (`BMSVer 5.2.22`):

| Código | Significado | Código | Significado |
|---|---|---|---|
| `LAB` | Body Labor | `LAS` | Structural Labor |
| `LAR` | Refinish Labor (pintura) | `LAA` | Aluminum Labor |
| `LAM` | **Mechanical Labor** | `LA4` | Carbon Fiber Labor |
| `LAF` | Frame Labor | `LA1` / `LA2` | UserDefined1 / UserDefined2 Labor |
| `LAG` | Glass Labor | `LABS` | Body Labor **Sublet** |

— Ficheros de ejemplo: <https://github.com/Farhaan96/CollisionOS/tree/main/Example%20BMS>; página del estándar: <https://www.cieca.com/standardsoverview> (confianza: alta para los códigos observados; media para exhaustividad — las *code lists* completas están tras login de miembro).

Tres detalles del estándar que son directamente aplicables:

- Existen **`LA1` / `LA2` (UserDefined)**: el estándar internacional ya asume que cada taller necesita categorías propias. Ahí es donde encajaría "eléctrico" en un taller costarricense.
- El **sublet es un par de flags booleanos sobre la línea** (`PartSubletInd`, `LaborSubletInd`), no una entidad separada. Trabajo externalizado = línea normal marcada.
- `LaborHours` convive con `DatabaseLaborHours` más un `LaborTypeJudgmentInd` / `LaborHoursJudgmentInd`: el estándar distingue **lo que dice el baremo** de **lo que el perito decidió a mano**.

### 3.2 Mecánica general: técnico y estado viven en la línea, no en la orden

**Tekmetric** es la evidencia más nítida. El artículo de soporte dice literalmente:

> "**Tech assignment is at the labor line**; however, to avoid the extra clicks, you can assign a technician to the job. This will assign the technician to **ALL** the labor lines on the job, not only unassigned labor lines."
>
> "In Tekmetric, you can assign multiple technicians to a job by assigning different technicians per labor line."
> — <https://support.tekmetric.com/hc/en-us/articles/24617998260247-Multiple-Techs-on-a-Job> (confianza: alta)

Y en su API, la jerarquía y los campos son explícitos:

- `RepairOrder`: `id`, `repairOrderStatus{id,code,name}`, `technicianId`, `serviceWriterId`, `jobs[]`, `sublets[]`, `fees[]`, `customerConcerns[]`, `laborSales`, `partsSales`, `subletSales`, `totalSales`.
- `Job`: `id`, `repairOrderId`, `name`, **`authorized`**, `authorizedDate`, **`selected`**, `technicianId`, `labor[]`, `parts[]`, `fees[]`, `laborHours`, `loggedHours`.
- `labor[]` (LaborItem): `{id, name, rate, hours, complete}` + `technicianId`.
- `repairOrderStatusId`: `1 Estimate, 2 Work-in-Progress, 3 Complete, 4 Saved for Later, 5 Posted, 6 Accounts Receivable, 7 Deleted`.

Documentación oficial tras solicitud de acceso; base URL real `https://shop.tekmetric.com/api/v1`. Texto verbatim espejado en <https://raw.githubusercontent.com/shermanhuman/oh/master/skills/tekmetric-api/Tekmetric-API.txt> (confianza: alta para los nombres de campo; media para que el espejo esté al día).

Nótese: **el técnico existe en tres niveles** (RO, Job, línea de labor) y **las horas vendidas (`laborHours`) están separadas de las fichadas (`loggedHours`)**.

Tres hechos más de Tekmetric, todos con fuente propia, que resultan decisivos:

- **La autorización del cliente es por *job*, no por orden:** "Each job on an RO in Tekmetric has the ability to be approved or declined separately from other jobs on the RO." Además existe el concepto de *draft job*: "Draft jobs are not presented to the customer."
  — <https://support.tekmetric.com/hc/en-us/articles/360039270153-What-is-the-difference-between-declined-jobs-draft-jobs> (confianza: alta)
- **Sí existe categorización por job, y puede ser obligatoria.** Tekmetric tiene *Job Categories*: una lista configurable por taller que se asigna a cada job, con la opción de "require job categories on every job before closing out a repair order".
  — <https://support.tekmetric.com/hc/en-us/articles/360035750394-Job-Categories-Setup> (confianza: alta)
- **Los estados del tablero NO son configurables; las etiquetas sí:** "labels are configurable and can be fully customized by column … while statuses cannot be changed." Las columnas son fijas (Estimates / Work-In-Progress / Completed).
  — <https://support.tekmetric.com/hc/en-us/articles/360039292193-RO-Labels-and-Workflow-Statuses> (confianza: alta)

El segundo punto es importante porque **contradice mi lectura inicial** de que Tekmetric no tipa el trabajo: sí lo hace, con un catálogo configurable por taller a nivel de *job*, exactamente el lugar donde la Opción A pone la especialidad.

**Fullbay** (diésel pesado) usa el mismo patrón con otro nombre: la unidad de trabajo es el **Service Order Action Item (SOAI)**, que lleva las "Three C's" (Complaint, Cause, Correction) y **su propio técnico responsable**: "They can manage inventory and be assigned as lead tech to service order action items (SOAI)"; hay tipos de usuario que "cannot be assigned to an SOAI".
— <https://www.fullbay.com/blog/who-needs-access-to-fullbay-in-your-shop/> y <https://www.fullbay.com/products/integrations/ai-powered-service-order/> (confianza: alta)

**Protractor** descompone la orden en "concerns, inspections and services" (<https://help.protractor.com/shopmanager/Setup/Work_Order_Setup/Work_Order_Templates.htm>) y exige resolver todas las líneas antes de cerrar: "All line items on the work order should be fully resolved before a work order is saved as completed work" (<https://help.protractor.com/shopmanager/Work_Orders/Work_In_Progress.htm>) (confianza: alta).

**Workshop Software** (Australia) asigna el mecánico a la reserva, pero captura las horas **por línea de mano de obra** y admite varios mecánicos en la misma línea: "If the same mechanic returns … or a second mechanic also worked on the vehicle, click the **+** icon"
— <https://workshopsoftware.com/knowledge-base/job-centre-invoicing/add-mechanic-hours-to-an-invoice/> (confianza: alta)

**Mitchell 1 Manager SE es el contraejemplo instructivo.** Históricamente su pantalla de orden es una **rejilla plana de líneas**, sin contenedor de trabajo: "The Order screen is where the parts and labor repair lines, the heart of the Manager order, are created and maintained" (<https://buymitchell1.net/managerhelp/Orderscreen.htm>). La agrupación llegó después, como función nueva llamada **Job View**: "Group labor tasks and related parts into job containers" (<https://mitchell1.com/manager-se/service-writer/>). Es decir: el producto legado empezó plano y **evolucionó hacia el contenedor de trabajo**, lo que refuerza que esa es la dirección correcta y no una complicación gratuita. (confianza: alta)

**Shopmonkey** publica su esquema sin login en `https://shopmonkey.dev/schema/<Entidad>` (confianza: alta). La jerarquía es `Order → Service → Labor`:

- `Order`: `status` enum **`Estimate | RepairOrder | Invoice`** (tipo de documento), `workflowStatusId` (estado de taller, configurable), `assignedTechnicianIds[]`, `serviceWriterId`, `authorized`, y totales `laborCents / partsCents / tiresCents / subcontractsCents / feesCents`, más cuatro contadores de horas: `totalLaborHours`, `completedLaborHours`, `totalAuthorizedLaborHours`, `completedAuthorizedLaborHours`.
- `Service` (la unidad de trabajo autorizable): `authorizationStatus` enum **`NotAuthorized | Authorized | Declined`**, `pricing` enum `FixedPrice | LineItem`, `categoryId`, `recommended`, `deferredDate`.
- `Labor` (hija de `Service`): `hours`, `rateCents`, **`technicianId`**, **`completed` + `completedDate`**, y — clave para nosotros — **`skillRequired` enum `General | Maintenance | Precision`** con `skillRequiredDescription`.
- `Subcontract` (sublet) cuelga del `Service` (en Tekmetric cuelga del RO).
- `Authorization` es entidad propia con `method` enum `InPerson | Phone | Text | Email | InApp`.

La documentación de asignación confirma la lectura:

> "Assign a Service Writer to the order, as well as Technicians for each labor item on the order. Choose different technicians for each service item or assign the entire order to the same technician."
> — <https://support.shopmonkey.io/hc/en-us/articles/38743885537172-Assign-Technicians-to-Labor-Items> (confianza: alta)

`skillRequired` es la evidencia más directa de que **la habilidad requerida se modela en la línea**, no partiendo la orden. Sus valores (`General/Maintenance/Precision`) son de nivel de destreza, no de oficio — pero el *lugar* del modelo es el que nos interesa.

**Orderry** (multi-industria, con localización al español) asigna el ejecutor por línea, y hasta permite repartir una misma línea entre dos personas:

> "First, we select the specialist, and then the service/material that they performed/installed." … cuando dos empleados hacen el mismo servicio hay que "add it separately for each specialist. Then, in each line, indicate which part of the service is performed by a particular specialist" (ejemplo: `David - 0.5, Amelie - 0.5`).
> — <https://help.orderry.com/en/articles/9133947-how-to-assign-multiple-specialists-in-one-work-order> (confianza: alta)

### 3.3 ERP genérico: el modelo más completo (Business Central)

Dynamics 365 Business Central publica la referencia completa de tablas de su módulo Service, y es el modelo más explícito y mejor documentado que encontré. La jerarquía es de tres niveles más una entidad de asignación en paralelo:

| Tabla | Rol | Campos relevantes |
|---|---|---|
| `Service Header` (5900) | Orden | `"Document Type"`, `Status` (Pending/In Process/Finished/On Hold), `"Service Order Type"`, `Priority`, `"Allocated Hours"`, `"Response Date"` |
| `Service Item Line` (5901) | **Tarea / unidad de trabajo** | **`"Repair Status Code"`**, `Priority`, `"Starting/Finishing Date"`, `"Symptom Code"`, `"Fault Area Code"`, `"Fault Code"`, `"Fault Reason Code"`, `"Resolution Code"`, `"No. of Allocations"`, `"No. of Active/Finished Allocs"` |
| `Service Line` (5902) | Línea económica | **`Type` enum `Item / Resource / Cost / G-L Account`**, `"Service Item Line No."` (enlace al padre), `Quantity`, `"Unit Price"`, `"Qty. to Invoice"` |
| `Service Order Allocation` (5950) | Asignación de técnico | `Status` (`Active / Nonactive / Reallocation Needed / Finished / Canceled`), **`"Resource No."`**, **`"Resource Group No."`**, `"Service Item Line No."`, `"Allocated Hours"`, `"Reason Code"` |

Referencias: <https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.service.document.service-header>, `...service-item-line`, `...service-line`, `...service-order-allocation` (confianza: alta).

Cuatro cosas que este modelo hace bien y que ningún SaaS de taller hace igual de explícito:

**(a) La mano de obra no es un tipo especial de línea: es `Type = Resource`.** Repuesto = `Type = Item`. Sublet/coste externo = `Type = Cost`. Un solo tipo de línea polimórfico en lugar de tres tablas.

**(b) El estado de la orden se DERIVA del estado de sus líneas, por prioridad.** Esto está documentado con la regla explícita:

> "Each time the repair status of a service item is changed in a service order, the status of the order is updated. To display the status that reflects the overall repair status of the individual service items, you must specify the following: The service order status that each repair status is linked to. The level of priority of each service order status option."
>
> "If the service items are linked to two or more service order status options, the service order status option with the highest priority is selected."
>
> Ejemplo textual: "if one service item has the repair status **Initial**, linked to **Pending**, another has **In Process**, linked to **In Process**, and a third has **Spare Part Ordered**, linked to **On Hold**, the resulting service order status will be **In Process** because this has the highest priority."
> — <https://learn.microsoft.com/en-us/dynamics365/business-central/service-service-order-status-and-repair-status> (confianza: alta)

Los estados de línea (`Repair Status`, tabla 5927) son **de configuración, no un enum fijo**: cada estado creado por el taller declara con flags qué semántica tiene (`Initial`, `In Process`, `Partly Serviced`, `Waiting for Customer`, `Spare Part Ordered`, `Finished`…) y qué transiciones de cabecera habilita (`"Pending Status Allowed"`, `"Finished Status Allowed"`, `"Posting Allowed"`…).

**(c) La asignación se puede hacer a un recurso individual O a un grupo de recursos** — y un grupo de recursos es exactamente lo que en nuestro dominio sería "el área de pintura":

> "You can allocate the same resource, for example, a technician, **or resource group** to all the service items in a service order."
>
> "For a service item in a service order, there can only be active allocation entries with one resource or resource group at a time."
> — <https://learn.microsoft.com/en-us/dynamics365/business-central/service-how-to-allocate-resources> (confianza: alta)

**(d) Existe un sistema de *skills* que impide (o advierte) asignar a alguien no calificado:**

> "You can allocate resources based on their **skill**, availability, or whether they are in the same service zone as the customer. To use resource allocation, you must set up: The **skills** required to repair and maintain service items. **You assign these to service items and resources.**"
>
> Opción `Resource Skills Option`: `Code Shown` | **`Warning Displayed`** — "Shows the information and displays a warning if you choose a resource that isn't qualified" | `Not Used`.
> — <https://learn.microsoft.com/en-us/dynamics365/business-central/service-how-setup-resource-allocation> (confianza: alta)

Esto es literalmente "esta línea requiere especialidad *pintura*; este técnico no la tiene; avisá".

> ⚠️ **Corrección sobre Garage Hive.** Es habitual leer que Garage Hive "es Business Central", y así lo asumí al empezar. La documentación propia de Garage Hive apunta a que sus jobsheets se construyen sobre **documentos de venta**, no sobre las tablas nativas del módulo Service: las instrucciones de agrupación remiten a *Sales & Receivables Setup* y a *Custom Grouping* en la pestaña *Invoice Print Options* (<https://docs.garagehive.com/p/ON2BmTskQ8JbTm/How-to-Group-Document-Lines>). **Business Central sirve aquí como arquitectura de referencia, no como descripción de la implementación de Garage Hive.**

### 3.3b Garage Hive: agrupación de líneas y autorización por grupo

Garage Hive (Reino Unido) llega al mismo sitio por otro camino: no tiene una entidad "tarea", sino **Group Items**, que agrupan líneas del documento.

> "this feature enables you to group the document lines under the same **job or category**" — disponible en presupuestos, inspecciones de vehículo y jobsheets.
> — <https://docs.garagehive.com/p/ON2BmTskQ8JbTm/How-to-Group-Document-Lines> (confianza: alta)

Lo relevante para nosotros:

- **El cliente autoriza grupo por grupo**, no la orden entera: "If you change a group description or price after it has been published and the customer approves it, it is not automatically marked as authorised" (<https://docs.garagehive.com/p/gxoOzrGJdo-BE4/Working-With-Group-Items-Actions>).
- Los grupos se crean **automáticamente** a partir de paquetes de servicio y de las líneas marcadas como "requires attention" en un checklist o en defectos de ITV: "This action will take the lines marked as 'requires attention' and automatically create groups".
- **Service Action Categories** clasifican los grupos por urgencia (los tipos de defecto `DANGEROUS` / `MAJOR` / `FAIL` mapean a categorías tipo `REQUIRED`). Es un eje de *prioridad*, no de oficio — pero demuestra que la categorización vive en el grupo de líneas.
- **Service Types** clasifican la cita/reserva, con `Group Code` y paquete de servicio asociado (<https://docs.garagehive.com/p/zrt1uG4WCC25Gb/How-to-Create-Service-Types>).
- El tablero es un **Schedule** con asignaciones por técnico, más **TCards con un carril por técnico** y un carril de pendientes: "when a technician starts a job the job will move from the pending jobs TCard to the relevant technician's TCard" (<https://garagehive.co.uk/features/workshop-management-with-garage-hive/>).
- Existen **pool jobs**: reservar a una bahía sin asignar técnico individual, y que el grupo tome de la piscina (confianza: media — texto de índice de búsqueda, página no recuperable).

### 3.4 La excepción documentada: el concesionario sí separa la orden por departamento

El manual público del DMS **Autosoft** muestra que en la cabecera del repair order hay un campo que tipifica la orden por departamento:

> `Service/Body/Contract/QuickLube [S/B/C/Q]: S`
> — <https://download.autosoft-asi.com/instructions/S/RepairOrders.pdf>, cap. 5, pantalla *Start Repair Order* (confianza: alta)

Es decir, en el mundo del concesionario **una orden de carrocería es un documento de otro tipo que una orden de servicio mecánico**, aunque el vehículo y el cliente sean los mismos. La razón es contable: cada departamento es un centro de costo con su propia cuenta de resultados.

Dentro de una misma orden, en cambio, el mismo manual describe el patrón de líneas ya visto:

> "The purpose of this screen is to enter a list of complaints or repairs needed. **You can enter up to 12 repairs per repair order.** … Number each repair (condition) separately."

Y cada "repair" lleva sus propios: `Complaint`, **`Technician`**, `Writer`, `C/W/I/Q` (tipo de pago: customer / warranty / internal / quick lube), **`Labor Level` (A–J, que determina la tarifa)**, `Estimated Labor Time`, `Labor Sale`, `LOP` (labor operation code del fabricante), `Complaint Code`, `Trouble/Fail Code`.

Nótese que **`Labor Level` es una tarifa por línea**: el mismo mecanismo que en CCC (tarifa por *charge category*) permite cobrar la hora de pintura distinto de la de mecánica dentro de una sola orden.

La consultoría de la industria confirma que un taller que combina colisión y mecánica los opera como dos áreas, y que el problema práctico es la coordinación, no el documento:

> "We have two separate buildings so getting this to be as non-verbal as possible is key." / "Individually on the mechanical side communication from service writer to tech can be an issue." / "having both businesses is definitely an advantage for the collision shop as we aren't having to sublet much out these days."
> — Jimmy Holman, Earhart's Collision & Automotive Service, en <https://driveshops.com/combine-forces-collision-and-general-repair/> (confianza: media — testimonio, no documentación de sistema)

### 3.5 Tablero: uno solo por etapas, con filtros — no uno por especialidad

**Shopmonkey** tiene un único Workflow, con tres modos de vista y columnas totalmente configurables:

> "View the workflow in three different ways: **Columns**, **List**, or **Parts & Tires**." … "Edit, add, delete, and rearrange columns to work for your shop." … "**Hiding columns will only change your view. It will not hide columns for anyone else in your shop.**"
> — <https://support.shopmonkey.io/hc/en-us/articles/38743858598676-Workflow-Views> (confianza: alta)

Y la segmentación por persona se hace con permisos sobre el tablero único, no creando tableros:

> "Depending on how user roles and permissions are set up in your shop, some users in your shop may only be able to see orders in the workflow they are assigned to."
> — <https://support.shopmonkey.io/hc/en-us/articles/38743885537172-Assign-Technicians-to-Labor-Items> (confianza: alta)

**Business Central** hace lo mismo con un único *Dispatch Board*, cuya segmentación por especialidad es un filtro:

> "To get a list of documents that contain service tasks a certain resource or resource group is allocated to, fill in the **Resource Filter** and **Resource Group Filter** fields."
> — <https://learn.microsoft.com/en-us/dynamics365/business-central/service-how-to-allocate-resources> (confianza: alta)

**Orderry** es el único que ofrece pipelines separados, pero el eje no es la especialidad sino el **tipo de orden**:

> "Make sure to configure relevant initial work order statuses to set up different processes for each of your work order types." … "create several work order types with different forms and initial statuses" … "Orderry enables you to switch the work order type anytime."
> — <https://help.orderry.com/en/articles/9148669-how-to-use-work-order-statuses-in-orderry> y <https://help.orderry.com/en/articles/9133862-work-orders-general-information> (confianza: alta)

**En colisión el tablero es por etapa física del proceso, no por oficio.** La descripción operativa de un taller real:

> Cada tablero contiene un "Work Flow Quality Control Diagram" que "lists every stage in the repair process so the employee knows where the vehicle should travel next: **office, parts, disassembly, repair, prep, paint, polish, reassembly**, etc."
> — <https://fenderbender.com/running-a-shop/article/11517295/100-percent-workflow> (confianza: media-alta — reportaje con cita directa de un taller nombrado)

**CCC** describe su producto en los mismos términos:

> "Track Vehicle Flow — Know where vehicles are at every stage with **digital production boards, production schedules, checklists, and reports**."
> — <https://www.cccis.com/collision-repairers/shop-management/vehicle-workflow> (confianza: media — material de producto de primera mano, sin detalle de modelo)

**Existe un segundo eje de tablero, y es el TÉCNICO — nunca la especialidad.** Varios productos ofrecen dos tableros sobre los mismos datos:

- **Tekmetric**: *Job Board* (columnas = etapa del flujo) y ***Tech Board* (una columna por técnico)**, con despacho de jobs individuales. "Any unassigned jobs will appear in the Unassigned Jobs Column." / "If you hover over each individual job you will then have the ability to assign a technician." / "The wrench on each RO identifies how many jobs are on that particular RO."
  — <https://support.tekmetric.com/hc/en-us/articles/1500008658441-Tech-Board-Navigation> (confianza: alta)
- **Garage Hive**: Schedule + TCards con un carril por técnico y un carril de pendientes.
- **Protractor**: árbol de carpetas de WIP con una carpeta *Unassigned Work* — "contains a listing of work orders for vehicles that are on-site but have not been assigned to a technician" (<https://help.protractor.com/shopmanager/Work_Orders/Work_In_Progress.htm>).
- **AutoLeap**: un solo Work Board con "Filter repair orders by technician to see workloads at a glance" (<https://autoleap.com/features/work-board/>, confianza: media — material de marketing; su base de conocimiento exige login).
- **Mitchell 1 Manager SE**: ni siquiera es un tablero, es una rejilla ordenable (WIP).

**Conclusión sobre el kanban:** revisados nueve productos, **cero** tienen un tablero por especialidad. El patrón universal es: **un tablero por etapa del proceso + (opcionalmente) un tablero con un carril por técnico + filtros**. En colisión la etapa coincide parcialmente con la especialidad, porque "pintura" es a la vez oficio y etapa del proceso — pero eso es una coincidencia del dominio de carrocería, no un principio de diseño.

### 3.6 Facturación y reporte cuando el vehículo pasa por varias especialidades

**Una sola factura por orden, con desglose por categoría.** Los esquemas lo evidencian sin ambigüedad:

- Tekmetric: `laborSales`, `partsSales`, **`subletSales`**, `discountTotal`, `feeTotal`, `taxes`, `totalSales` (todo en centavos enteros).
- Shopmonkey: `laborCents`, `partsCents`, `tiresCents`, **`subcontractsCents`**, `feesCents`, `shopSuppliesCents`, `taxCents`, `totalCostCents`.
- CIECA BMS: `RepairTotalsInfo` con subtotales agregados por `LaborType` (`LAB`, `LAR`, `LAM`, `LAF`…) y por tipo de material (`MAPA` paint materials, `MASH` shop materials) más `OTSL` para sublet.
- CCC: descuentos e impuestos configurables **por *charge category***, lo que implica que el documento ya está segmentado por categoría.

**El desglose por especialidad es un rollup del atributo de línea.** No hay evidencia de ningún producto que emita una factura por especialidad; hay evidencia abundante de reporte por categoría de mano de obra dentro de un documento único.

**No existe facturación parcial por especialidad en ningún producto de taller revisado.** La orden es un único documento que cambia de tipo:

- Shopmonkey: "an order can only have one status at a time: estimate, repair order, or invoice" (<https://support.shopmonkey.io/hc/en-us/articles/38743969407124-Repair-Order-Status>).
- Mitchell 1: agregar una línea a una factura revierte el documento entero a Repair Order — "If parts or labor items are added to an Invoice it is converted back to a Repair Order" (<https://buymitchell1.net/managerhelp/Estimtesordinv.htm>).
- Tekmetric admite **pago** parcial ("Partially paid"), que no es lo mismo que factura parcial.
- Fullbay dispara la facturación solo cuando el técnico marca **todos** los ítems como completos.
- Business Central sí permite posteo parcial por cantidad (`"Qty. to Invoice"` / `"Qty. to Ship"` / `"Quantity Invoiced"` en `Service Line`, tabla 5902), pero eso es el sustrato ERP, no el flujo del taller.

**La respuesta de la industria a "el cliente solo aprueba la mitad del trabajo" no es partir la factura: es declinar o diferir los jobs no aprobados dentro de la misma orden.** Tekmetric aprueba/declina por job; Shopmonkey tiene `authorizationStatus` por `Service` y `deferredDate`; Garage Hive autoriza por grupo. **Esto es un argumento fuerte a favor de la Opción A y en contra de la Opción B**: la unidad de negociación con el cliente ya es la línea/tarea, no la orden.

**Requisito regulatorio (referencia útil para un mercado con protección al consumidor).** El Bureau of Automotive Repair de California exige:

> "An estimate must contain a description of the specific job and the estimated price for all parts and labor." … "The automotive repair dealer must include with the estimate a statement of any **sublet repair** to be performed on the vehicle." … la factura debe llevar "an itemized list of all services and repairs performed and the prices for each" y "an itemized list of each part supplied".
> — <https://www.bar.ca.gov/wir> (*Write It Right*, confianza: alta)

Traducción al modelo: **la orden debe poder imprimir un desglose línea por línea de mano de obra y repuestos, y el trabajo externalizado debe ser identificable como tal en el documento.** Esto empuja hacia una orden única con líneas tipadas, no hacia órdenes separadas.

### 3.7 Mono-especialidad vs. multi-especialidad: la forma del modelo no cambia

| Producto | Especialidad(es) que atiende | Jerarquía |
|---|---|---|
| Tekmetric | mecánica general (mono) | `RepairOrder → Job → Labor / Part / Fee`; sublet a nivel RO |
| Shopmonkey | mecánica general (mono) | `Order → Service → Labor / Part / Subcontract / Fee` |
| Fullbay | diésel pesado (mono) | `Service Order → Service Order Action Item` (Complaint/Cause/Correction) con *lead tech* propio |
| Protractor | mecánica general (mono) | `Work Order → concerns / inspections / services → line items` |
| Workshop Software (AU) | mecánica general (mono) | Job card con líneas de mano de obra; varios mecánicos por línea |
| Mitchell 1 Manager SE | mecánica general (mono) | Rejilla plana de líneas → ***Job View*** (contenedores de trabajo) añadido después |
| CCC ONE / Mitchell (colisión) | colisión (mono, pero con líneas mecánicas dentro) | `Workfile/Estimate → líneas con Labor Category` |
| Garage Hive (UK) | genérico / taller UK | Jobsheet (documento de venta) → líneas + **Group Items** autorizables por separado |
| Business Central | genérico multi-industria | `Service Header → Service Item Line → Service Line` + `Allocation` |
| Orderry | genérico multi-industria | `Work Order → líneas de servicio/material con ejecutor` |
| Autosoft (DMS) | concesionario multi-departamento | RO tipado `S/B/C/Q` → hasta 12 *repairs* con técnico y tarifa propios |

**La observación clave:** los productos mono-especialidad y los multi-especialidad usan **exactamente la misma forma**. Ninguno tiene un modelo "simple" para el taller de una sola especialidad y otro "complejo" para el multi. Lo que cambia es cuántos valores tiene el catálogo de categorías y si la UI muestra o no ese campo.

---

## 4. Tabla comparativa: dónde vive cada decisión

| Pregunta | CCC ONE / Mitchell / CIECA | Tekmetric | Shopmonkey | Business Central | Orderry | Autosoft (DMS) |
|---|---|---|---|---|---|---|
| ¿Una orden o una por especialidad? | **Una** (workfile único) | **Una** | **Una** | **Una** | Una, pero con *tipos* de orden | **Una por departamento** (`S/B/C/Q`) |
| ¿Dónde vive la especialidad? | `Labor Category` / `LaborType` en la línea | **`Job Categories`** por job (pueden ser obligatorias) | `Service.categoryId` **+** `Labor.categoryId` **+** `Labor.skillRequired` | *Skill code* en recurso + ítem; `Resource Group` | Tipo de orden + ejecutor por línea | `Labor Level` por línea + tipo de RO |
| ¿Técnico por orden o por línea? | (n/a en el estimate) | **Por línea de labor** (con atajo a nivel job) | **Por línea de labor** | Entidad `Allocation` por tarea, N por tarea | **Por línea** (con reparto fraccionado) | **Por línea** (*repair*) |
| ¿Autorización del cliente? | Por documento (aseguradora) | **Por job** (approve/decline independiente; + *draft jobs*) | **Por `Service`** (`NotAuthorized/Authorized/Declined`) | Por documento | Por orden | Por orden |
| ¿Estado por línea? | No (estado de documento) | `complete` por labor, `completed` por job, readiness de repuestos | `completed` por `Labor`; `authorizationStatus` por `Service` | **Sí — `Repair Status Code` por tarea, y la cabecera se deriva por prioridad** | No (estado de orden) | No documentado |
| ¿Tablero? | Production boards por etapa | **Job Board (etapas) + Tech Board (1 columna por técnico)** | **Un Workflow, columnas configurables** | **Un Dispatch Board, filtros por recurso/grupo** | Workflow con vistas tabla/tablero/agenda; pipeline por tipo de orden | n/a |
| ¿Tarifa distinta por especialidad? | **Sí** — rate por *charge category* | Rate por línea de labor | `rateCents` + `rateId` + `laborMatrixId` por línea | Precio por `Resource` | Precio por servicio | **Sí** — `Labor Level` A–J |
| ¿Sublet? | Flags `PartSubletInd`/`LaborSubletInd` en la línea | `sublets[]` a nivel **RO** | `Subcontract` colgando del **`Service`** | `Service Line` con `Type = Cost` | — | Pantalla *Close Lubricants-Sublet* |
| Factura | Una, totales por `LaborType` | Una, `laborSales/partsSales/subletSales` | Una, `laborCents/partsCents/subcontractsCents` | Una, con facturación parcial por cantidad | Una | Una por RO (y por tanto por departamento) |

---

## 5. Contradicciones e incertidumbres

1. **Contradicción real: concesionario vs. taller independiente.** El DMS de concesionario (Autosoft, y por extensión CDK/Reynolds, que no pude verificar con fuente primaria pública) sí separa la orden por departamento. El taller independiente y el software SaaS moderno no. La razón es contable (centro de costo por departamento), no operativa. **Para un taller independiente de rango medio-alto en Costa Rica, el driver contable del concesionario no aplica**, salvo que el cliente quiera P&L por área — lo cual se resuelve con reporte, no con documentos separados.

2. **"Eléctrico" no existe como categoría de primera clase en ningún producto anglosajón revisado.** CCC/CIECA tienen `LAB/LAR/LAM/LAF/LAG/LAS/LAA` — carrocería, pintura, mecánica, chasis, vidrio, estructural, aluminio — pero **no eléctrico**; en EE. UU. se subsume en *mechanical* o en *diagnostic*. En cambio, "auto eléctrico" es una especialidad claramente diferenciada en el mercado hispanohablante. **Incertidumbre a resolver con el cliente, no con más investigación web.** Mitigación de diseño: el propio estándar CIECA reserva `LA1`/`LA2` como *UserDefined*, y Mitchell dice explícitamente que las categorías las determina "the repair facility's operating procedures" — la lección es que **el catálogo de especialidades debe ser dato configurable, no un enum en el código**.

3. **No encontré ningún producto con kanban por especialidad.** Todo apunta a tablero único (por etapa) + filtro. Esto contradice la intuición de "un pipeline por área". Antes de implementar tableros separados habría que validarlo con un taller real; la evidencia internacional no lo respalda.

4. **Falta evidencia primaria sobre CCC ONE Repair Workflow a nivel de modelo de datos.** La página de producto es marketing; la Knowledge Base de CCC exige login para los artículos de producción. Sé que existen *production boards* y *repair plan phases*, pero no pude verificar si una fase se asigna a un departamento o si una línea tiene estado propio. **Confianza baja en esa parte; declarada como hueco.**

5. **CIECA BMS: las *code lists* completas (185 pestañas de enums) están tras login de miembro.** Los códigos de la tabla vienen de ficheros de producción reales, no del diccionario oficial. Confianza alta en los observados, media en la exhaustividad.

6. ~~**Tekmetric no tipa la especialidad.**~~ **Retractado.** Una primera pasada me hizo concluir que el `Job` de Tekmetric no tenía categoría. Es falso: Tekmetric tiene **Job Categories**, un catálogo configurable por taller que se asigna a cada job y que el taller puede volver **obligatorio antes de cerrar la orden** (<https://support.tekmetric.com/hc/en-us/articles/360035750394-Job-Categories-Setup>). Con esto **la evidencia a favor de tipar la unidad de trabajo pasa a ser unánime** entre los productos revisados.

7. **`skillRequired` de Shopmonkey es nivel de destreza (`General/Maintenance/Precision`), no oficio.** No es un contraejemplo perfecto; lo que prueba es la *ubicación* del campo (la línea), no su taxonomía. La taxonomía de oficio en Shopmonkey vive en `categoryId`, que existe **en dos niveles** (por `Service` y por línea).

8. **Varias bases de conocimiento están tras login y su evidencia es más débil.** AutoLeap (`help.autoleap.com` no resuelve; la KB vive dentro del User Center), Shop-Ware (`help.shop-ware.com` redirige a login) y Fullbay (la KB real está en "Fullbay Learn", dentro de la app) solo aportan páginas de producto/blog. Sus afirmaciones en este documento están marcadas con confianza media. La documentación de Garage Hive es una SPA renderizada por JavaScript y solo pude recuperar tres páginas.

---

## 6. Opciones de modelado para nuestro caso

Restricciones a respetar: Fase 1 es demo de venta sin backend; debe funcionar igual para un taller de una sola especialidad que para uno con tres; mercado Costa Rica y similares.

### Opción A — Especialidad como atributo de la línea de trabajo, dentro de una única orden ✅ recomendada

```
OrdenDeTrabajo
  ├─ vehículo, cliente, asesor, estado (derivado), fechas
  └─ LineaDeTrabajo[]          ← unidad autorizable y agendable
       ├─ especialidadId       ← FK a catálogo configurable
       ├─ técnicoAsignadoId    ← nullable
       ├─ estado               ← propio de la línea
       ├─ horasEstimadas / horasReales
       ├─ tarifaId             ← puede depender de la especialidad
       └─ Item[]  (manoDeObra | repuesto | subcontratado | cargo)
```

**A favor**
- Es el patrón que usan CCC/Mitchell/CIECA, Tekmetric, Shopmonkey, Business Central y Autosoft *dentro* de la orden. Es lo que un dueño de taller reconoce.
- El taller mono-especialidad no ve diferencia: el catálogo tiene un elemento, la UI oculta el campo. **Cero ramas en el modelo.**
- La factura consolidada sale gratis; el desglose por especialidad es un `groupBy` de líneas.
- Permite tarifa por hora distinta por especialidad (CCC `charge category`, Autosoft `Labor Level`).
- El sublet es una línea marcada (CIECA `LaborSubletInd`), no una entidad nueva.
- Un vehículo que pasa por tres áreas sigue siendo un solo documento para el cliente — que es lo que el cliente quiere y lo que exigen normativas tipo BAR.

**En contra**
- Si el cliente realmente quiere P&L separado por área, hay que construirlo como reporte (no es gratis, pero tampoco caro).
- Requiere decidir la regla de derivación del estado global (ver más abajo) — que es trabajo real de diseño, no configuración.

### Opción B — Una orden por especialidad, agrupadas por "visita del vehículo"

```
Visita ──< OrdenDeTrabajo (una por especialidad) ──< Linea
```

**A favor**: es lo que hace el concesionario (`S/B/C/Q`); P&L por área es trivial; cada área tiene su pipeline sin ambigüedad.
**En contra**: obliga a inventar la entidad `Visita` que ningún producto SaaS tiene; el cliente recibe N documentos o hay que consolidar al facturar (trabajo extra); duplica cliente/vehículo/asesor; **penaliza al taller mono-especialidad con una capa que no necesita**; y contradice el patrón dominante fuera del concesionario.

### Opción C — Orden padre con sub-órdenes por especialidad

**A favor**: intuitivo para un taller con áreas físicamente separadas.
**En contra**: **no encontré un solo producto que lo implemente así.** Tres niveles jerárquicos (orden → sub-orden → línea) contra los tres que ya son estándar (orden → línea de trabajo → ítem económico) — se paga complejidad sin precedente que la respalde. Descartable salvo evidencia nueva.

### Opción D — Especialidad solo como atributo del técnico (la línea no se tipa)

**A favor**: mínimo esfuerzo; es lo que hace Tekmetric.
**En contra**: no se puede planificar ni reportar por especialidad antes de asignar técnico; se pierde la tarifa por especialidad; no permite decir "esta línea la tiene que hacer pintura" cuando aún nadie está asignado. Business Central resuelve esto asignando skills **al ítem *y* al recurso**, no solo al recurso.

### Recomendación

**Opción A**, con estas cuatro decisiones tomadas del material investigado:

1. **Catálogo de especialidades configurable, no enum.** Precedente: Mitchell ("as determined by the repair facility's operating procedures"), CIECA (`LA1`/`LA2` UserDefined), Orderry (tipos de orden definidos por el usuario). Esto es lo que hace que "eléctrico" sea representable sin tocar código, y lo que hace que el taller mono-especialidad sea un caso natural del mismo modelo.

2. **Estado propio por línea + estado de orden derivado por prioridad** (patrón `Repair Status` → `Service Order Status` de Business Central). Es la única solución encontrada que responde bien a "ya salió de mecánica pero sigue en pintura", y evita que el estado global sea un campo que alguien tiene que acordarse de mover a mano.

3. **Un solo tablero por etapa de proceso, con filtro por especialidad y por técnico** — no tableros separados. Precedente: Shopmonkey (un Workflow, columnas configurables, ocultar columna es preferencia personal), Business Central (`Resource Filter` / `Resource Group Filter` sobre un Dispatch Board). Si más adelante el cliente pide vistas separadas, se resuelven como filtros guardados, no como pipelines paralelos.

4. **Asignación en la línea, permitiendo asignar a una especialidad/grupo antes que a una persona.** Precedente: Business Central permite asignar a `Resource Group` y no solo a `Resource No.`; Garage Hive tiene *pool jobs* reservados a una bahía sin técnico individual. Esto habilita "esto va para pintura" en recepción y "lo hace Juan" después, sin cambiar de entidad.

5. **Autorización del cliente por línea/tarea, no por orden.** Precedente unánime: Tekmetric (approve/decline por job, más *draft jobs* que el cliente no ve), Shopmonkey (`authorizationStatus` por `Service` + `deferredDate`), Garage Hive (autorización por grupo). Es además el mecanismo con el que la industria resuelve la aprobación parcial **sin** partir el documento — lo que elimina la razón principal que uno podría tener para elegir la Opción B.

Dos cosas más que salieron de la evidencia y que conviene no perder aunque no sean el objeto de este ticket: **separar horas vendidas de horas fichadas** (Tekmetric `laborHours` vs `loggedHours`; CIECA `LaborHours` vs `DatabaseLaborHours`) y **separar el tipo de documento del estado de taller** (Shopmonkey `status: Estimate|RepairOrder|Invoice` vs `workflowStatusId`; Business Central `Status` vs `Repair Status Code`). Ambas son ortogonales al multi-especialidad pero aparecen en todos los modelos serios.

---

## 7. Fuentes

**Colisión / carrocería y pintura**
- CCC — *Mechanical Labor Hours Not Showing on Estimate*: <https://cccis.zendesk.com/hc/en-us/articles/360042332432-Mechanical-Labor-Hours-Not-Showing-on-Estimate>
- CCC — *Working with Rates and Rules in the Repair Facility Profile*: <https://cccis.zendesk.com/hc/en-us/articles/360042736191-Working-with-Rates-and-Rules-in-the-Repair-Facility-Profile>
- CCC — *Vehicle Workflow / CCC Repair Workflow*: <https://www.cccis.com/collision-repairers/shop-management/vehicle-workflow>
- Mitchell — P-Pages, *Labor General Information*: <http://static.mymitchell.com/static/webhelp/ppages/rvg/1033/Content/rvg010400.htm>
- CIECA — *Standards Overview* (BMS): <https://www.cieca.com/standardsoverview>
- Ficheros BMS de producción (generados por Mitchell, `BMSVer 5.2.22`): <https://github.com/Farhaan96/CollisionOS/tree/main/Example%20BMS>
- SCRS — *Guide to Complete Repair Planning* (PDF, no extraíble por herramienta; referenciado): <https://scrs.com/wp-content/uploads/2018/01/2016-scrs-guide-to-complete-repair-planning-revised-11-16.pdf>
- FenderBender — *100 Percent Workflow*: <https://fenderbender.com/running-a-shop/article/11517295/100-percent-workflow>

**Mecánica general**
- Tekmetric — *Multiple Techs on a Job*: <https://support.tekmetric.com/hc/en-us/articles/24617998260247-Multiple-Techs-on-a-Job>
- Tekmetric — *Types of Jobs Used to Build an Estimate*: <https://support.tekmetric.com/hc/en-us/articles/27046099150743-Types-of-Jobs-Used-to-Build-an-Estimate>
- Tekmetric — *Declined jobs vs. draft jobs* (autorización por job): <https://support.tekmetric.com/hc/en-us/articles/360039270153-What-is-the-difference-between-declined-jobs-draft-jobs>
- Tekmetric — *Job Categories Setup*: <https://support.tekmetric.com/hc/en-us/articles/360035750394-Job-Categories-Setup>
- Tekmetric — *RO Labels and Workflow Statuses*: <https://support.tekmetric.com/hc/en-us/articles/360039292193-RO-Labels-and-Workflow-Statuses>
- Tekmetric — *Tech Board Navigation*: <https://support.tekmetric.com/hc/en-us/articles/1500008658441-Tech-Board-Navigation>
- Tekmetric — *Sublet Workflow*: <https://support.tekmetric.com/hc/en-us/articles/1500000008022-Sublet-Workflow>
- Tekmetric — API (texto oficial espejado): <https://raw.githubusercontent.com/shermanhuman/oh/master/skills/tekmetric-api/Tekmetric-API.txt>
- Shopmonkey — esquema público de entidades: <https://shopmonkey.dev/schema/Order>, `/schema/Service`, `/schema/Labor`, `/schema/Subcontract`, `/schema/Fee`, `/schema/Authorization`, `/schema/WorkflowStatus`
- Shopmonkey — *Assign Technicians to Labor Items*: <https://support.shopmonkey.io/hc/en-us/articles/38743885537172-Assign-Technicians-to-Labor-Items>
- Shopmonkey — *Workflow Views*: <https://support.shopmonkey.io/hc/en-us/articles/38743858598676-Workflow-Views>
- Shopmonkey — *Repair Order Status*: <https://support.shopmonkey.io/hc/en-us/articles/38743969407124-Repair-Order-Status>
- Shopmonkey — *Request Customer Authorization*: <https://support.shopmonkey.io/hc/en-us/articles/38743372579988-Request-Customer-Authorization>
- Shopmonkey — *Service Level Categories*: <https://support.shopmonkey.io/hc/en-us/articles/43444408898964-Service-Level-Categories>
- Fullbay — *Service Work Order Software*: <https://www.fullbay.com/products/service-orders/>
- Fullbay — *Who needs access to Fullbay* (lead tech por SOAI): <https://www.fullbay.com/blog/who-needs-access-to-fullbay-in-your-shop/>
- Fullbay — *AI-Powered Service Order* (Three C's por SOAI): <https://www.fullbay.com/products/integrations/ai-powered-service-order/>
- Protractor — *Work In Progress*: <https://help.protractor.com/shopmanager/Work_Orders/Work_In_Progress.htm>
- Protractor — *Work Order Templates*: <https://help.protractor.com/shopmanager/Setup/Work_Order_Setup/Work_Order_Templates.htm>
- Mitchell 1 Manager SE — *Order screen*: <https://buymitchell1.net/managerhelp/Orderscreen.htm>
- Mitchell 1 Manager SE — *Estimates, Orders, Invoices*: <https://buymitchell1.net/managerhelp/Estimtesordinv.htm>
- Mitchell 1 Manager SE — *Job View*: <https://mitchell1.com/manager-se/service-writer/>
- Workshop Software (AU) — *Add mechanic hours to an invoice*: <https://workshopsoftware.com/knowledge-base/job-centre-invoicing/add-mechanic-hours-to-an-invoice/>
- AutoLeap — *Work Board* (marketing; KB tras login): <https://autoleap.com/features/work-board/>
- Orderry — *How to assign multiple specialists in one work order*: <https://help.orderry.com/en/articles/9133947-how-to-assign-multiple-specialists-in-one-work-order>
- Orderry — *Work Orders. General information*: <https://help.orderry.com/en/articles/9133862-work-orders-general-information>
- Orderry — *How to use work order statuses*: <https://help.orderry.com/en/articles/9148669-how-to-use-work-order-statuses-in-orderry>

**Garage Hive (Reino Unido)**
- *How to Group Document Lines* (Group Items, Service Action Categories): <https://docs.garagehive.com/p/ON2BmTskQ8JbTm/How-to-Group-Document-Lines>
- *Working With Group Items Actions* (autorización por grupo): <https://docs.garagehive.com/p/gxoOzrGJdo-BE4/Working-With-Group-Items-Actions>
- *How to Create Service Types*: <https://docs.garagehive.com/p/zrt1uG4WCC25Gb/How-to-Create-Service-Types>
- *Workshop Management* (Schedule, TCards por técnico): <https://garagehive.co.uk/features/workshop-management-with-garage-hive/>

**ERP / plataformas genéricas (arquitectura de referencia)**
- Business Central — *Service order status and repair status*: <https://learn.microsoft.com/en-us/dynamics365/business-central/service-service-order-status-and-repair-status>
- Business Central — *How to allocate resources*: <https://learn.microsoft.com/en-us/dynamics365/business-central/service-how-to-allocate-resources>
- Business Central — *Set up resource allocation* (skills): <https://learn.microsoft.com/en-us/dynamics365/business-central/service-how-setup-resource-allocation>
- Business Central — *How to create service orders*: <https://learn.microsoft.com/en-us/dynamics365/business-central/service-how-to-create-service-orders>
- Business Central — referencia de tablas `Service Header` (5900), `Service Item Line` (5901), `Service Line` (5902), `Service Order Allocation` (5950), `Repair Status` (5927): <https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.service.document.service-header>

**Concesionario / DMS**
- Autosoft DMS — *Repair Orders* (manual, cap. 5): <https://download.autosoft-asi.com/instructions/S/RepairOrders.pdf>
- DRIVE — *Combine Forces: Collision and General Repair*: <https://driveshops.com/combine-forces-collision-and-general-repair/>

**Regulatorio**
- California Bureau of Automotive Repair — *Write It Right*: <https://www.bar.ca.gov/wir>

**Estándares de codificación de reparaciones (contexto)**
- TMC/ATA VMRS — *Implementation Handbook v2.0*, extracto público: <https://tmc.trucking.org/sites/default/files/VMRS_INTRO.pdf>
