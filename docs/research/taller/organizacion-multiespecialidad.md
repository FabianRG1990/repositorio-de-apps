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
   - colisión → `Labor Category` / `LaborType` (CCC, Mitchell, CIECA)
   - mecánica general → `skillRequired` en la línea de labor (Shopmonkey)
   - ERP → *skill code* + *resource group* asociados al recurso y al ítem (Business Central)
   - DMS de concesionario → *labor level* por línea + tipo de RO en la cabecera (Autosoft)

3. **La excepción real y documentada es el concesionario:** ahí sí existe una orden por departamento. Autosoft marca en la cabecera del RO el campo `Service/Body/Contract/QuickLube [S/B/C/Q]`, es decir, una orden de carrocería es un *tipo de documento distinto* de una orden de servicio mecánico. Fuera del concesionario no encontré evidencia primaria de ese patrón.

4. **El tablero es uno solo, con columnas por *etapa de proceso* y filtros por persona/grupo — no un kanban por especialidad.** Shopmonkey tiene un único Workflow con columnas configurables; Business Central tiene un único *Dispatch Board* filtrable por `Resource Filter` y `Resource Group Filter`; el taller de carrocería real organiza el tablero por etapas físicas (desarme, carrocería, preparación, pintura, pulido, armado), no por oficio.

5. **La facturación es una sola factura consolidada por orden, con los totales desglosados por categoría de trabajo.** Los propios esquemas lo demuestran: Tekmetric expone `laborSales / partsSales / subletSales / feeTotal`; Shopmonkey expone `laborCents / partsCents / tiresCents / subcontractsCents / feesCents`; CIECA agrega los totales por `LaborType`. El desglose por especialidad es un *rollup* del atributo de línea, no un documento separado.

6. **El mejor patrón encontrado para "estado por línea vs. estado global" es el de Business Central:** cada tarea tiene su propio `Repair Status Code` configurable, cada estado declara a qué estado de cabecera mapea y con qué prioridad, y **el estado de la orden se deriva tomando el de mayor prioridad entre sus líneas**. Esto resuelve limpiamente el caso "el carro ya salió de mecánica pero sigue en pintura".

7. **La misma jerarquía sirve a mono-especialidad y multi-especialidad sin ramificar el modelo.** Tekmetric y Shopmonkey son productos de mecánica general pura; CCC y Mitchell son de colisión pura; Fullbay es de diésel pesado puro; todos usan la misma forma `orden → unidad de trabajo autorizable → líneas económicas`. Lo único que cambia es qué valores tiene el catálogo de categorías. **Un taller mono-especialidad es simplemente el caso en que ese catálogo tiene un elemento.**

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

### 3.3 ERP genérico: el modelo más completo (Business Central / Garage Hive)

Garage Hive, el sistema de talleres más extendido en Reino Unido, está construido sobre el módulo Service de Dynamics 365 Business Central, cuya referencia de tablas es pública. La jerarquía es de tres niveles más una entidad de asignación en paralelo:

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

**Conclusión sobre el kanban:** no encontré un solo producto con un tablero *por especialidad*. Lo que existe es un tablero por *etapa del proceso* (que en colisión coincide parcialmente con la especialidad, porque "pintura" es a la vez oficio y etapa) más filtros por técnico o grupo.

### 3.6 Facturación y reporte cuando el vehículo pasa por varias especialidades

**Una sola factura por orden, con desglose por categoría.** Los esquemas lo evidencian sin ambigüedad:

- Tekmetric: `laborSales`, `partsSales`, **`subletSales`**, `discountTotal`, `feeTotal`, `taxes`, `totalSales` (todo en centavos enteros).
- Shopmonkey: `laborCents`, `partsCents`, `tiresCents`, **`subcontractsCents`**, `feesCents`, `shopSuppliesCents`, `taxCents`, `totalCostCents`.
- CIECA BMS: `RepairTotalsInfo` con subtotales agregados por `LaborType` (`LAB`, `LAR`, `LAM`, `LAF`…) y por tipo de material (`MAPA` paint materials, `MASH` shop materials) más `OTSL` para sublet.
- CCC: descuentos e impuestos configurables **por *charge category***, lo que implica que el documento ya está segmentado por categoría.

**El desglose por especialidad es un rollup del atributo de línea.** No hay evidencia de ningún producto que emita una factura por especialidad; hay evidencia abundante de reporte por categoría de mano de obra dentro de un documento único.

**Facturación parcial sí existe, pero por cantidad, no por especialidad.** Business Central lo hace con `"Qty. to Invoice"` / `"Qty. to Ship"` / `"Quantity Invoiced"` por `Service Line` (tabla 5902).

**Requisito regulatorio (referencia útil para un mercado con protección al consumidor).** El Bureau of Automotive Repair de California exige:

> "An estimate must contain a description of the specific job and the estimated price for all parts and labor." … "The automotive repair dealer must include with the estimate a statement of any **sublet repair** to be performed on the vehicle." … la factura debe llevar "an itemized list of all services and repairs performed and the prices for each" y "an itemized list of each part supplied".
> — <https://www.bar.ca.gov/wir> (*Write It Right*, confianza: alta)

Traducción al modelo: **la orden debe poder imprimir un desglose línea por línea de mano de obra y repuestos, y el trabajo externalizado debe ser identificable como tal en el documento.** Esto empuja hacia una orden única con líneas tipadas, no hacia órdenes separadas.

### 3.7 Mono-especialidad vs. multi-especialidad: la forma del modelo no cambia

| Producto | Especialidad(es) que atiende | Jerarquía |
|---|---|---|
| Tekmetric | mecánica general (mono) | `RepairOrder → Job → Labor / Part / Fee`; sublet a nivel RO |
| Shopmonkey | mecánica general (mono) | `Order → Service → Labor / Part / Subcontract / Fee` |
| Fullbay | diésel pesado (mono) | Service Order con reparaciones asignadas a técnicos; "Review up-to-the-minute technician stats to help speed up decisions like **who to assign to what jobs**" (<https://www.fullbay.com/products/service-orders/>) |
| CCC ONE / Mitchell | colisión (mono, pero con líneas mecánicas dentro) | `Workfile/Estimate → líneas con Labor Category` |
| Business Central / Garage Hive | genérico multi-industria | `Service Header → Service Item Line → Service Line` + `Allocation` |
| Orderry | genérico multi-industria | `Work Order → líneas de servicio/material con ejecutor` |
| Autosoft (DMS) | concesionario multi-departamento | RO tipado `S/B/C/Q` → hasta 12 *repairs* con técnico y tarifa propios |

**La observación clave:** los productos mono-especialidad y los multi-especialidad usan **exactamente la misma forma**. Ninguno tiene un modelo "simple" para el taller de una sola especialidad y otro "complejo" para el multi. Lo que cambia es cuántos valores tiene el catálogo de categorías y si la UI muestra o no ese campo.

---

## 4. Tabla comparativa: dónde vive cada decisión

| Pregunta | CCC ONE / Mitchell / CIECA | Tekmetric | Shopmonkey | Business Central | Orderry | Autosoft (DMS) |
|---|---|---|---|---|---|---|
| ¿Una orden o una por especialidad? | **Una** (workfile único) | **Una** | **Una** | **Una** | Una, pero con *tipos* de orden | **Una por departamento** (`S/B/C/Q`) |
| ¿Dónde vive la especialidad? | `Labor Category` / `LaborType` en la línea | (no tipada; implícita en el *job*) | `skillRequired` en `Labor` | *Skill code* en recurso + ítem; `Resource Group` | Tipo de orden + ejecutor por línea | `Labor Level` por línea + tipo de RO |
| ¿Técnico por orden o por línea? | (n/a en el estimate) | **Por línea de labor** (con atajo a nivel job) | **Por línea de labor** | Entidad `Allocation` por tarea, N por tarea | **Por línea** (con reparto fraccionado) | **Por línea** (*repair*) |
| ¿Estado por línea? | No (estado de documento) | `complete` por labor, `completed` por job | `completed` por `Labor`; `authorizationStatus` por `Service` | **Sí — `Repair Status Code` por tarea, y la cabecera se deriva por prioridad** | No (estado de orden) | No documentado |
| ¿Tablero? | Production boards por etapa | Job Board / Tech Board | **Un Workflow, columnas configurables** | **Un Dispatch Board, filtros por recurso/grupo** | Workflow con vistas tabla/tablero/agenda; pipeline por tipo de orden | n/a |
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

6. **Tekmetric no tipa la especialidad.** Su `Job` no tiene categoría ni skill. Esto es un dato en contra de que el campo sea imprescindible — o evidencia de que un producto de mecánica pura no lo necesita, que es justo la asimetría que nos interesa resolver.

7. **`skillRequired` de Shopmonkey es nivel de destreza (`General/Maintenance/Precision`), no oficio.** No es un contraejemplo perfecto; lo que prueba es la *ubicación* del campo (la línea), no su taxonomía.

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

4. **Asignación en la línea, permitiendo asignar a una especialidad/grupo antes que a una persona.** Precedente: Business Central permite asignar a `Resource Group` y no solo a `Resource No.`. Esto habilita "esto va para pintura" en recepción y "lo hace Juan" después, sin cambiar de entidad.

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
- Tekmetric — API (texto oficial espejado): <https://raw.githubusercontent.com/shermanhuman/oh/master/skills/tekmetric-api/Tekmetric-API.txt>
- Shopmonkey — esquema público de entidades: <https://shopmonkey.dev/schema/Order>, `/schema/Service`, `/schema/Labor`, `/schema/Subcontract`, `/schema/Fee`, `/schema/Authorization`
- Shopmonkey — *Assign Technicians to Labor Items*: <https://support.shopmonkey.io/hc/en-us/articles/38743885537172-Assign-Technicians-to-Labor-Items>
- Shopmonkey — *Workflow Views*: <https://support.shopmonkey.io/hc/en-us/articles/38743858598676-Workflow-Views>
- Fullbay — *Service Work Order Software*: <https://www.fullbay.com/products/service-orders/>
- Orderry — *How to assign multiple specialists in one work order*: <https://help.orderry.com/en/articles/9133947-how-to-assign-multiple-specialists-in-one-work-order>
- Orderry — *Work Orders. General information*: <https://help.orderry.com/en/articles/9133862-work-orders-general-information>
- Orderry — *How to use work order statuses*: <https://help.orderry.com/en/articles/9148669-how-to-use-work-order-statuses-in-orderry>

**ERP / plataformas genéricas (base de Garage Hive)**
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
