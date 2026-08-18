# Qué hace indispensable un sistema de órdenes de trabajo para talleres (mecánico / eléctrico / pintura)

> Investigación de producto para el proyecto nuevo de app de órdenes de trabajo para talleres automotrices de rango medio-alto (Costa Rica y mercados similares). **No propone una lista de features** — busca el *porqué* detrás de las funciones que sí importan, para informar más adelante el modelo de historial de cliente/vehículo y el modelo de organización multi-especialidad.
>
> Ticket: [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) · Mapa: [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14)
> Fecha de la investigación: **2026-08-17**. Precios, tiers y estadísticas cambian sin aviso; cada afirmación lleva su URL para reverificación.

## Convención de confianza de fuentes

Todo el documento etiqueta explícitamente de dónde viene cada afirmación, porque la diferencia entre "lo que dice el marketing" y "lo que dicen los usuarios" es el punto central de esta investigación.

| Etiqueta | Significado | Cómo se debe leer |
|---|---|---|
| **[USUARIO]** | Reseña en G2/Capterra, hilo de foro de dueños de taller (Reddit, AutoShopOwner, Automotive Management Network, diag.net), podcast de la industria. | Evidencia de uso real. Sesgo: quien escribe reseñas suele estar muy contento o muy enojado; muchas reseñas de Capterra están marcadas "Incentivized review". |
| **[PRODUCTO]** | Documentación, help center, esquema de API pública o página de precios del propio fabricante. | Fiable sobre *cómo funciona su producto* — es fuente primaria del modelo de dominio. No es evidencia de que eso importe. |
| **[MARKETING]** | Afirmación promocional del fabricante. | Solo señal de posicionamiento. **Nunca** se usa como evidencia de valor. |
| **[BENCHMARK-VENDOR]** | Datos agregados publicados por un fabricante desde su base instalada. | Cuantitativo y útil, pero con sesgo de muestra (solo sus clientes) y de incentivo. |
| **[PRENSA]** | Prensa sectorial o análisis de tercero (Ratchet+Wrench, FenderBender, Body Shop Business, Repairer Driven News). | Independiente del fabricante, pero vive de publicidad del sector. |

---

## Pregunta

¿Qué funciones y prácticas hacen que un sistema de órdenes de trabajo para talleres (mecánico, eléctrico, pintura) de rango medio-alto sea genuinamente indispensable para el dueño/operador del taller — no solo "otro software", sino un colaborador real?

---

## Resumen ejecutivo

**1. Lo que hace indispensable al software no es registrar el trabajo, es *vender* el trabajo.** El patrón que se repite en absolutamente todas las fuentes de usuario es un solo bucle: **inspección con fotos → hallazgos convertidos en trabajos cotizados → enviados al celular del cliente → el cliente autoriza desde el teléfono → el técnico sigue trabajando sin esperar la llamada**. Un dueño lo describe operativamente mejor que cualquier página de marketing: compartir la inspección *"nos da 15 minutos para armar nuestro plan… la mayoría de las veces ya aprobaron las reparaciones antes de que siquiera les hagamos la llamada"* ([Capterra / Shop-Ware](https://www.capterra.com/p/153469/Shop-Ware/reviews/)). Ese bucle es el producto. Todo lo demás es infraestructura de apoyo.

**2. La segunda razón de permanencia no es una función, es *velocidad y ausencia de fricción*.** En G2, la razón #1 mencionada para Tekmetric es "ease of use" con **135 menciones** y para AutoLeap **136** — muy por encima de cualquier función concreta ([G2 Tekmetric](https://www.g2.com/products/tekmetric/reviews?qs=pros-and-cons), [G2 AutoLeap](https://www.g2.com/products/autoleap/reviews?qs=pros-and-cons)). Del lado inverso, la queja que aparece primero cuando se le pregunta directamente a dueños qué quieren es: *"la velocidad es mi mayor dolor, la mitad del tiempo el mayor atraso para hacer un estimado o una inspección son los tiempos de carga"* y *"la mayoría de los sistemas tienen muchísimas funciones, pero las tareas básicas requieren demasiados clics y a los empleados les cuesta usarlos"* ([r/mechanics](https://www.reddit.com/r/mechanics/comments/1syv8np/what_do_auto_shop_owners_want_in_an_auto_shop/)). **Un sistema con menos funciones y menos clics le gana a uno completo y lento.**

**3. El historial del vehículo es a la vez la razón de compra y la baja más común en migración.** Los usuarios lo nombran explícitamente como motivo de cambio (*"muestra el trabajo declinado en la factura final y lleva registro del trabajo declinado"*, [Capterra / Tekmetric](https://www.capterra.com/p/190952/Tekmetric/reviews/)), como superpoder del asesor (*"si me encuentro a un cliente en el supermercado, ahora puedo hablar con criterio del historial de su carro"*, misma fuente) y como lo que se pierde al migrar (*"la conversión no trajo los servicios declinados"*, [Capterra / Protractor](https://www.capterra.com/p/18043/Protractor-NET/reviews/)). En los productos líderes el **trabajo diferido/declinado no es un borrado suave: es un estado de primera clase con motivo, fecha y mecanismo de resurrección** — Shopmonkey modela `Service.deferredReason: Archived | Declined | InvoicedNotAuthorized` más `revived` y `revivedFromId`, y cuenta `deferredServiceCount` **en el vehículo** ([schema público](https://shopmonkey.dev/schema/Service)).

**4. El empaquetado comercial de los tres líderes coincide en qué es piso y qué es palanca.** Verificado en las páginas de precios de los tres el 2026-08-17: la inspección digital, las órdenes ilimitadas, los trabajos precargados (canned jobs), la firma electrónica y el pedido de repuestos están en el **tier más barato** (~US$199–239/mes). Los relojes de tiempo del técnico, las guías de labor y los reportes de desempeño están en el **tier medio** (~US$349–399). Y el seguimiento automático de estimados, el trabajo inactivo y el tablero en tiempo real están en el **tier alto** (~US$439–499). La inspección digital es **piso**, no diferenciador. La analítica de gente y el follow-up automatizado son **la palanca de precio**.

**5. Lo que el mercado no ha resuelto — y por lo tanto está abierto.** Cuatro quejas estructurales se repiten en todos los productos, incluidos los líderes: **repuestos/inventario** (es el con #2 de Tekmetric en G2, 22 menciones: *"sistema de gestión de repuestos engorroso, que afecta el acceso al historial del trabajo"*), **reportes no segmentables**, **permisos por rol demasiado gruesos** (17 menciones), y **apps móviles nativas** que los usuarios abandonan a favor del navegador (*"terminamos haciendo que los técnicos entraran al sitio web desde el celular y a los empleados mayores les dimos tabletas grandes"*, [Capterra / Shopmonkey](https://www.capterra.com/p/169022/Shopmonkey/reviews/)).

**6. Multi-especialidad no es un problema de features, es un choque de dos modelos de negocio.** Mecánica es una venta al mostrador con margen sobre repuestos; colisión/pintura es un ciclo de negociación con una aseguradora, con suplementos, tarifas dictadas por la carrier y reglas de tiempo de mezcla (blend). En Estados Unidos **el 30.3% de los talleres de colisión corren más de un sistema de estimación** porque la aseguradora se lo impone ([Repairer Driven News](https://www.repairerdrivennews.com/2021/05/21/ccc-less-and-less-overlap-in-repairer-estimating-system-usage-but-shops-still-have-multiple/)), y re-digitar un estimado entre sistemas cuesta *"hora y media por estimado"* según un consultor del sector ([RDN](https://www.repairerdrivennews.com/2020/10/20/repair-u-rekeying-a-drain-on-shops-time-expenses/)). **No se encontró ningún hilo de practicantes describiendo un solo sistema que maneje bien ambos mundos.** Y en los sistemas mecánicos líderes **el "departamento" ni siquiera existe como concepto de datos** — solo hay categorías y etiquetas.

---

## 1. El bucle que hace indispensable al sistema: inspección → cotización → aprobación desde el celular

Esta es la respuesta central a la pregunta del ticket, y es la más consistente entre fuentes independientes.

### Lo que dicen los usuarios

- **[USUARIO]** *"Las inspecciones digitales, estimados y autorizaciones digitales profundamente integradas son lo destacado del software. Poder enviarle al cliente por texto la inspección y cualquier trabajo que necesite, y que lo aprueben desde su teléfono, no tiene igual en la industria."* — [Capterra / Tekmetric](https://www.capterra.com/p/190952/Tekmetric/reviews/)
- **[USUARIO]** Motivo declarado de cambio de proveedor: *"Me gusta la integración de la inspección digital y los estimados que podemos enviar al cliente e incluir opciones de financiamiento. La DVI está dentro de Tekmetric, lo cual fue un factor motivador para nuestro cambio desde NAPA Tracs."* — [G2 / Tekmetric](https://www.g2.com/products/tekmetric/reviews?qs=pros-and-cons)
- **[USUARIO]** El mismo motivo, invertido: *"Tuvimos un sistema de gestión distinto por 14 años; yo quería agregar la DVI pero no quería comprar un programa separado, así que nos cambiamos a Shop-Ware."* — [Capterra / Shop-Ware](https://www.capterra.com/p/153469/Shop-Ware/reviews/)
- **[USUARIO]** La versión simple, de un mecánico: *"Vender trabajos al cliente es muchísimo más fácil cuando pueden ver una foto de la pieza rota."* — [r/mechanics](https://www.reddit.com/r/mechanics/comments/1emtcxf/shop_management_software/)

**El valor no es "digitalizar la hoja de inspección".** Es cambiar quién tiene que convencer a quién: la foto de la pastilla gastada convence sola, el asesor deja de ser vendedor y pasa a ser mensajero, y el tiempo muerto entre "el técnico encontró algo" y "el cliente dijo que sí" se colapsa.

### El dato de practicante más fuerte que se encontró sobre DVI

**[USUARIO]** Chris Cloutier (Golden Rule Auto Care, Dallas), en el podcast *Remarkable Results*: *"vimos un aumento de casi 300 a 400 dólares de orden de reparación promedio al pasar de una inspección de cuatro fotos a una de 8 a 12 fotos, y luego había probablemente otra brecha de 300 dólares si pasabas de esas 12 fotos a digamos 14, 15, 16 fotos."* — [Remarkable Results THA 418](https://www.youtube.com/watch?v=fdNvlmkxsxA)

Pero **el mismo dueño admite el problema real**: su tasa de envío de inspecciones estaba en **30%**, y *"me tomó varios años llevar mis envíos de más de 30% a consistentemente más de 80 o 90%."* Y otro dueño lo dice sin rodeos: *"hemos estado tan ocupados los últimos meses que no hemos estado usando la función de inspección tanto como deberíamos."* ([AutoShopOwner](https://www.autoshopowner.com/forums/topic/16875-do-i-need-a-shop-management-program/)).

> **Implicación de producto:** la función existe en todos los productos; **la adopción diaria es el problema real, no la función**. Un sistema que hace la inspección obligatoria/inevitable dentro del flujo (no un botón aparte que el técnico puede saltarse cuando hay presión) es cualitativamente distinto de uno que "tiene DVI".

### Contra-evidencia importante: más inspección no es mejor

**[USUARIO/PRENSA]** Lucas Underwood documentó que su lista de inspección inflada producía ~US$1,700 de orden promedio, pero los clientes *"pasaban hasta cuatro horas en el taller por lo que debía ser una inspección de 90 minutos, lo que a su vez redujo las tasas de aprobación."* Al pasar a inspecciones escalonadas (tiered), *"la orden promedio bajó unos US$300 en vehículos nuevos, pero la frecuencia de visitas de retorno se duplicó."* — [Ratchet+Wrench](https://www.ratchetandwrench.com/running-a-shop/technology/article/55392836/how-tiered-dvis-create-value-for-technicians-customers-and-the-shop)

Esto es evidencia directa de que **optimizar el ticket de hoy destruye la relación**, y que la métrica correcta no es orden promedio sino orden promedio × frecuencia de retorno — lo cual es, literalmente, un argumento a favor de que el modelo de **historial** sea el corazón del producto y no un accesorio.

### Cómo lo modelan los productos (fuente primaria)

**[PRODUCTO]** Shopmonkey expone su esquema públicamente. El hallazgo clave: los hallazgos de la inspección **no son texto libre, apuntan a trabajos precargados**.

- `Inspection` (pertenece a `orderId`, `templateId`) → `InspectionItem` → `InspectionItemStatusDetail`
- `InspectionItem.status` y `InspectionItemStatusDetail.status`: **`Green | Yellow | Red | NotApplicable`**
- **`InspectionItem.recommendedCannedServiceIds: string[]`** ← el enlace hallazgo→trabajo es un campo de primera clase
- `InspectionItem.reviewStatus`: **`DeferredByCustomer | EstimateRequested`** ← la respuesta del cliente se guarda *en el ítem de inspección*
- A nivel de orden: `inspectionStatus: None | Completed | NotCompleted`, `inspectionReviewStatus: None | Reviewed | NotReviewed`, `requireESignatureOnInspection`, `allowCustomerViewInspections`, y un registro `OrderSignedInspection`
— https://shopmonkey.dev/schema/Inspection · https://shopmonkey.dev/schema/InspectionItem

**[PRODUCTO]** Tekmetric implementa la misma idea con una regla explícita: *"Las tareas marcadas en rojo o amarillo **y que tengan el ícono de llave** poblarán automáticamente el canned job en la pestaña de Estimado una vez que la inspección se marque como completa."* — [support.tekmetric.com](https://support.tekmetric.com/hc/en-us/articles/1500011364982-Link-Canned-Jobs-to-Inspections)

**[PRODUCTO]** La autorización es **por trabajo, no por orden, y auditada**: Shopmonkey tiene entidades `Authorization` + `AuthorizationService` con `method: InPerson | Phone | Text | Email | InApp`, `authorizedCostCents`, `serviceWriterId` y `serviceAuthorizationReset`. — https://shopmonkey.dev/schema/Authorization

> **Patrón repetido, para el modelo:** la convención verde/amarillo/rojo es universal; el ítem de inspección conoce el trabajo que lo resuelve; la autorización es granular por trabajo, registra **por qué medio** se autorizó y **quién** la tomó; y una re-cotización *resetea* la autorización.

---

## 2. Los cuatro números por los que se mide un taller

Si el sistema quiere ser "un colaborador real" y no un archivador, tiene que mover números que el dueño ya usa para juzgarse. La evidencia más limpia de cuáles son esos números viene del propio índice público de Tekmetric, construido sobre su base instalada.

**[BENCHMARK-VENDOR]** Tekmetric Shop Index, *"datos actualizados trimestralmente de más de 10,000 talleres de reparación en Norteamérica"*, reporte vigente con datos hasta junio 2026 — https://www.tekmetric.com/shop-index

| Métrica | Promedio nacional | Mediana | Top 25% |
|---|---|---|---|
| Autos por mes (car count) | 118 | 97 | 180 |
| **Orden de reparación promedio (ARO)** | **US$704.25** | US$649.88 | US$879.38 |
| Margen sobre repuestos | 58% | 56% | 65% |
| Tarifa de labor efectiva (ELR) | US$134.92 | US$134.31 | US$154.06 |

Que el líder del mercado construya su herramienta pública de benchmarking sobre **exactamente estas cuatro** es la señal más fuerte disponible de cuáles son las métricas de gobierno del negocio. Nótese además la dispersión: el top 25% mueve casi **el doble de autos** que la mediana con un ARO solo ~35% mayor — el volumen y la retención pesan tanto como el ticket.

### Las métricas de labor están vivas, y ni siquiera están estandarizadas

**[USUARIO]** En diag.net, un dueño declara su criterio *principal* de selección de software: *"lo más importante es rastrear los tiempos de labor para tener una idea del tiempo de pago del empleado."* — [diag.net](https://diag.net/msg/m3qtz3fa6x08orl5p2bkryx7cd)

**[USUARIO]** Benchmarks que los dueños se dicen entre ellos: *"90% es un buen promedio de productividad de taller, comparado con la mayoría de talleres independientes que están por debajo de 70%… Muchos talleres están más cerca de 55%."* Meta citada: 110% (9 horas facturadas en un día de 8). — [AutoShopOwner](https://www.autoshopowner.com/forums/topic/9540-effective-labor-rate/)

**[USUARIO]** Y sin embargo: *"Una búsqueda rápida en Google de 'fórmula de tarifa de labor efectiva' y ahora tengo unos 3 o 4 métodos distintos de calcularla, ninguno de los cuales es realmente parecido."* — misma fuente.

**[PRENSA]** FenderBender argumenta que medir solo horas facturadas es engañoso: *"Medir horas facturadas por sí solo para monitorear el desempeño de los técnicos es susceptible a dos métricas de negocio enormes: tu razón repuestos/labor y tu tarifa de labor efectiva"* — y propone ventas totales por técnico. — [FenderBender](https://www.fenderbender.com/running-a-shop/operations/article/33025058/youre-measuring-tech-productivity-wrong)

> **Implicación:** hay una oportunidad real en **definir la métrica bien y de forma transparente** (mostrar la fórmula), porque el mercado no la tiene resuelta. Pero también un riesgo: imponer una definición que el dueño no reconoce como la suya destruye la confianza en todo el panel.

### El margen sobre repuestos como bucle de retroalimentación en vivo

**[USUARIO]** La explicación más clara encontrada de por qué un dueño paga ~US$400/mes: *"te dará márgenes calculados por computadora sobre los repuestos y te dejará ver tus márgenes de ganancia mientras construyes el ticket. Si está muy bajo, tienes que ajustarlo. **Este bucle de retroalimentación en tiempo real es cómo se paga solo.**"* — [AutoShopOwner](https://www.autoshopowner.com/forums/topic/19272-shop-management-tools/)

Esto es un principio de diseño, no una función: **el número que importa se muestra en el momento en que todavía se puede cambiar**, no en un reporte a fin de mes.

---

## 3. El empaquetado comercial revela qué es piso y qué es palanca

Las páginas de precios son fuente primaria del fabricante sobre qué considera básico y qué considera premium. Los tres líderes cloud fueron verificados el mismo día.

**[PRODUCTO]** Tekmetric — https://www.tekmetric.com/pricing (verificado 2026-08-17)

| Tier | Precio mensual | Qué agrega |
|---|---|---|
| **Start** | US$199/mes/taller | Inventario y proveedores · **Inspecciones digitales** · Smart Jobs · **Autorizaciones digitales y facturación** |
| **Grow** | US$349 | Guía de labor · Programas de mantenimiento · **Relojes de tiempo y de trabajo** · Reportes de repuestos/inventario/marketing |
| **Scale** | US$439 | **Texto bidireccional** · Tablero de taller en tiempo real · **Tablero de técnicos** · Analítica de desempeño de empleados |
| **Enterprise** | a cotizar | Pagos integrados · gerente de cuenta · revisiones trimestrales de negocio |

Complementos: multi-taller **+US$70/mes/taller**, suite de llantas +US$39, marketing **+US$345/mes/taller**.

**[PRODUCTO]** Shopmonkey — https://www.shopmonkey.io/pricing (verificado 2026-08-17)

| Tier | Precio mensual | Qué agrega |
|---|---|---|
| **Basic** | US$239 | Texto y correo bidireccional · Estimados y facturas ilimitados · Calendario y recordatorios automáticos · **DVI** · **Firma electrónica** · Pagos integrados · Búsqueda y pedido de repuestos · App móvil |
| **Clever** | US$399 | **Flujo de trabajo personalizable** · Guías de labor · Gestión de inventario · QuickBooks Online · **Reloj de tiempo** · ALLDATA · Checklist de pedidos |
| **Genius** | US$499 | Gestor de reseñas de Google · Diagramas y procedimientos · **Seguimiento automático de estimados** · **Órdenes de trabajo inactivas** · Cupones · **Bitácora de auditoría** |
| **Multi-Shop** | a cotizar | Estandarización y desempeño entre locales |

**[PRODUCTO]** AutoLeap — https://autoleap.com/pricing/ (verificado 2026-08-17)

| Tier | Precio mensual | Qué agrega |
|---|---|---|
| **Essentials** | US$199 | Tablero de trabajo personalizable · ROs ilimitadas · **Integración CARFAX** · **Canned jobs** · Firma electrónica verificada · Pedido de repuestos integrado · **DVI estándar** |
| **Pro** | US$349 | Búsqueda de repuestos · Texto bidireccional · Inventario y proveedores · **App de técnico** · **Relojes de tiempo y trabajo** · **Reportes de desempeño de empleados** · QBO · guías de labor · programas de mantenimiento |
| **Elite** | US$449 | **DVI de nueva generación** (checklists certificados, descripciones de un clic, notas de técnico autogeneradas) · Reseñas de Google · Tablero en tiempo real |
| **Enterprise** | a cotizar | Reportes entre locales · reportes a medida · integraciones ERP · controles centrales y permisos |

### Lo que la convergencia de los tres nos dice

1. **La inspección digital y la autorización electrónica son el piso, no el diferenciador.** Los tres las ponen en el tier más barato. Un producto nuevo que las presente como su propuesta de valor llega tarde.
2. **La analítica de personas es la palanca de precio.** Relojes de trabajo, app de técnico y reportes de desempeño están consistentemente en el tier medio-alto en los tres. Eso es lo que el dueño paga por *encima* del piso.
3. **La reactivación de clientes es el techo.** "Seguimiento automático de estimados" y "órdenes de trabajo inactivas" (Shopmonkey Genius), tablero en tiempo real, reseñas, y el complemento de marketing de Tekmetric a **+US$345/mes/taller** — más caro que el plan Start completo. **El fabricante cobra más por traer al cliente de vuelta que por gestionar el trabajo de hoy.**
4. **La banda de precio confirma el posicionamiento.** US$199–499/mes/taller es el rango real de un producto "medio-alto" en este sector. Nada aquí es software de US$20/mes.
5. **Nadie ofrece prueba gratuita autoservicio.** AutoLeap lo dice explícitamente: *"AutoLeap no ofrece prueba gratuita debido a que construimos el sistema a la medida con la información necesaria de su taller."* — https://autoleap.com/pricing/. El costo de configuración inicial es parte del modelo de negocio.

---

## 4. Lo que el marketing vende y los usuarios no usan

Esta sección es el contrapeso directo al ticket: distinguir marketing de uso real.

### Las apps móviles nativas son la función más abandonada

- **[USUARIO]** Un dueño con formación de CIO, sobre Shopmonkey: *"las apps no son tan buenas, con errores y limitantes. Al final simplemente hicimos que los técnicos entraran al sitio web desde el celular y a los empleados mayores les dimos tabletas grandes."* — [Capterra / Shopmonkey](https://www.capterra.com/p/169022/Shopmonkey/reviews/)
- **[USUARIO]** Sobre Tekmetric: *"La app deja bastante que desear en su estado actual, pero poder usar Tekmetric como sitio web móvil la hace prácticamente irrelevante."* — [Capterra / Tekmetric](https://www.capterra.com/p/190952/Tekmetric/reviews/)
- **[USUARIO]** El costo de la divergencia entre app y escritorio: *"estoy saltando de la app móvil al escritorio constantemente, es una pérdida de tiempo tremenda."* — [r/mechanics](https://www.reddit.com/r/mechanics/comments/1syv8np/what_do_auto_shop_owners_want_in_an_auto_shop/)

> **Implicación directa para un proyecto Angular:** una web responsive de calidad es una decisión *validada por usuarios*, no un compromiso. La app nativa es la que se abandona; el navegador móvil es lo que sobrevive. Lo que no se perdona es que la versión móvil sea un subconjunto distinto de la de escritorio.

### Las guías de labor incorporadas se desconfían y se rodean

- **[USUARIO]** Tekmetric: *"la guía de labor que usa Tekmetric. Hay muchos comentarios de que el tiempo de labor es muy bajo en muchos trabajos. No te gusta tener que andar saltando a verificar tiempos de labor."* — [Capterra / Tekmetric](https://www.capterra.com/p/190952/Tekmetric/reviews/)
- **[USUARIO]** Shop-Ware: *"La guía de labor casi siempre está mal."* — [Capterra / Shop-Ware](https://www.capterra.com/p/153469/Shop-Ware/reviews/)
- **[USUARIO]** Manager SE: *"Las guías de labor eran de fácil acceso aunque muchas veces estaban mal."* — [Capterra / Manager SE](https://www.capterra.com/p/145351/Manager-SE/reviews/)
- **[USUARIO]** Tekmetric otra vez: *"cuando los escritores usan lo que sea que tiene Tekmetric para comparar repuestos y encontrar tiempos de labor, muchas veces está mal."* — [r/mechanics](https://www.reddit.com/r/mechanics/comments/1emtcxf/shop_management_software/)

**Pero** el otro lado del mismo hilo dice: *"Lo que ha sido un lastre enorme para mi tiempo es la guía de labor. No tengo tiempo de buscar todo esto y andar llamando por repuestos… necesito estar en una bahía."* ([AutoShopOwner](https://www.autoshopowner.com/forums/topic/19272-shop-management-tools/)) y *"La guía de labor y la matriz de repuestos ayudan a ser consistentes en el precio… se paga sola cada mes en tiempo ahorrado, aumentos automáticos de labor y la matriz de repuestos."* ([r/mechanics](https://www.reddit.com/r/mechanics/comments/1p4us06/helping_a_buddy_with_a_3bay_shop_is/)).

> **Lectura:** el valor no está en el *dato* de la guía de labor (que es de un tercero y falla), sino en **la consistencia de precios** que la matriz impone. El taller quiere dejar de improvisar el precio, no quiere que un catálogo le diga cuánto vale su hora.

### Se compra amplitud de funciones que no se consume

- **[USUARIO]** *"El software de Protractor ya viene cargado con más funciones y beneficios de los que voy a utilizar en un año."* y *"No lo usamos a su máximo potencial, ¡este programa hace TODA la contabilidad del negocio también!"* — [Capterra / Protractor](https://www.capterra.com/p/18043/Protractor-NET/reviews/)
- **[USUARIO]** Módulo de marketing/CRM de R.O. Writer: *"el módulo de marketing y seguimiento es difícil de navegar, me gustaría verlo actualizado."* — [Capterra / R.O. Writer](https://www.capterra.com/p/173266/R-O-Writer/reviews/)
- **[USUARIO]** Y hay resistencia explícita al todo-en-uno: *"Ojalá las empresas de software de gestión de taller se enfocaran en mejorar las funciones de gestión de taller… Parece haber una tendencia a convertirse en una gigantesca navaja suiza que incluye DVIs."* — [AutoShopOwner](https://www.autoshopowner.com/forums/topic/19571-are-you-happy-with-your-shop-management-software/)

---

## 5. Por qué se abandona un sistema (y por qué no se abandona)

Los motivos de churn no son funciones faltantes. Son **latencia de soporte, caídas, y ausencia de nube**.

- **[USUARIO]** *"¡El servicio que da R.O.Writer es terrible! Se cayó y a tier 2 le tomó una semana responder… habría estado 'taller caído, no puedo trabajar, crítico' por una semana."* — [Capterra / Protractor](https://www.capterra.com/p/18043/Protractor-NET/reviews/)
- **[USUARIO]** *"Caídas constantes, respuesta extremadamente lenta del software. Pasaba la mitad del día viendo la pantalla esperando a que R.O. Writer me alcanzara."* — [Capterra / R.O. Writer](https://www.capterra.com/p/173266/R-O-Writer/reviews/)
- **[USUARIO]** *"Estoy usando la última versión de RO Writer y es absolutamente horrible. Imagínate que alguien diseñara un carro con todas las funciones que puedas imaginar, pero solo fuera a 20 mph y se dañara cada semana… siguen usando una base de datos de Microsoft Access de los 90."* — [AutoShopOwner](https://www.autoshopowner.com/forums/topic/16461-are-you-really-happy-with-your-management-system/)
- **[USUARIO]** El límite de escala del software heredado: *"6.5SE también parece ser muy 'glitchy'… al menos una vez al día tenemos que cerrar todos los usuarios y reiniciar Mitchell… El reporteo es terrible."* Y luego, la parte reveladora: un representante de Mitchell le dijo que *"somos lo que ellos consideran 'power users'… el programa no fue diseñado para manejar un taller de nuestro tamaño."* — [Automotive Management Network](https://www.automotivemanagementnetwork.com/forums/topic/looking-to-make-the-switch-from-mitchell/)
- **[USUARIO]** Y la base de datos como cuello de botella: *"Nuestra base de datos era masiva, unos 10,000 clientes o más. Los retrasos en RO Writer eran debilitantes a veces."* — [r/serviceadvisors](https://www.reddit.com/r/serviceadvisors/comments/1lig24b/new_shop_management_system_feedback_repair_shop/)

### La migración es una barrera brutal — en ambas direcciones

- **[USUARIO]** El caso de fracaso: *"Usamos Mitchell por más de 20 años… Nos fuimos a AutoLeap y fue un desastre absoluto. Tuvimos que volver a Mitchell. Una vez que nos recuperamos de eso decidimos probar Tekmetric."* — [r/mechanics](https://www.reddit.com/r/mechanics/comments/1emtcxf/shop_management_software/)
- **[USUARIO]** El costo real de probar: un dueño perdió ~US$1,600 entre tres sistemas fallidos, y concluye en mayúsculas: *"ENCONTRAR EL SOFTWARE CORRECTO ES COMO CASARSE… TÓMATE AL MENOS DE 6 MESES A UN AÑO PARA PROBAR DISTINTOS PROGRAMAS."* — [Automotive Management Network](https://www.automotivemanagementnetwork.com/forums/topic/looking-to-make-the-switch-from-mitchell/)
- **[USUARIO]** *"Una vez que empiezas a usar un SMS, cambiar a un sistema nuevo puede ser un esfuerzo disruptivo para el taller. A menos que sea obligatorio, no seas indeciso. Escoge un ganador de largo plazo."* — [AutoShopOwner](https://www.autoshopowner.com/forums/topic/19272-shop-management-tools/)

> **Implicación estratégica:** el foso competitivo de estos productos **no es la funcionalidad, es el historial acumulado y el costo de migrarlo**. Esto define la propuesta de valor de un entrante: la única forma de entrar es que el costo de cambio sea bajo (importación de historial que sí funcione) y el costo de quedarse sea alto (historial que crece y se vuelve más útil con el tiempo).

### Criterios nuevos post-hackeo de CDK

**[USUARIO]** *"Seguridad, uptime, y acceso a los datos retroactivamente para cumplimiento son, discutiblemente, lo más importante. El SLA debería ser 99.99%. La seguridad no puede ser un CDK boogaloo ronda 2."* — [r/serviceadvisors](https://www.reddit.com/r/serviceadvisors/comments/1lig24b/new_shop_management_system_feedback_repair_shop/)

**[USUARIO]** Y el recordatorio de que la nube no es universal: un taller de enderezado rural rechaza la nube de plano — *"estoy limitado a una conexión satelital bastante lenta, así que la nube es tan lenta para mí que simplemente no es opción."* — [r/Autobody](https://www.reddit.com/r/Autobody/comments/15a56jg/give_me_a_reason_to_not_switch_to_ccc_or_stick/)

---

## 6. Los patrones estructurales que se repiten entre los líderes

Esta sección es fuente primaria de producto (esquemas de API, help centers). Es el material más directamente aplicable al diseño del modelo.

### 6.1 El documento cambia de tipo; el tablero es ortogonal

**El patrón dominante no es una máquina de estados plana.** Es un documento que cambia de *tipo*, más un estado de tablero configurable por el taller, más un estado de autorización por trabajo.

**[PRODUCTO]** Shopmonkey: `Order.status` tiene solo **tres** valores — **`Estimate | RepairOrder | Invoice`** (https://shopmonkey.dev/schema/Order). Todo lo demás son campos separados en la misma orden: `authorized`, `authorizedDate`, `invoiced`, `invoicedDate`, `completedDate`, `archived`, `paid`, `invoiceLockState: Unlocked | Locked | PreviouslyLocked`, `readOnly`/`readOnlyReason`. La posición en el tablero es `workflowStatusId` + `workflowStatusPosition` + `workflowStatusDate` + **`workflowStatusDuration`**. Y `WorkflowStatus` es una fila **definida por el usuario, por local** (`name`, `position`, `locationId`) con banderas `repairOrderWorkflow` e `invoiceWorkflow` — es decir, **dos tableros separados** — más reglas de archivado automático `archiveWhenPaid`, `archiveWhenInactive`, `daysToArchive`, `inactiveOrderWarningThreshold` (https://shopmonkey.dev/schema/WorkflowStatus).

**[MARKETING/PRODUCTO]** Tekmetric expone columnas fijas — "Estimates", "Work-in-Progress", "Completed" — con filtros de vista "Active", "Saved for Later", "Accounts Receivable", "Paid", "Deleted"; estados dentro de Estimados: "Not Started", "Requires Authorization", "Pending Authorization", "Declined All"; y estados manuales dentro de WIP: **"In Progress", "Waiting on Parts", "Waiting on Sublet"**. — https://www.tekmetric.com/post/repairs-management-software-job-board

**[MARKETING]** Mitchell 1 Manager SE describe la misma progresión de tres documentos: "Estimate, then Repair Order, then Invoice, Pay & Post to History" (https://mitchell1.com). Fullbay usa checkpoints firmados en orden: **Assign → Diagnose → Quote → Authorize → Order → Receive → Repair → Invoice** (https://www.fullbay.com/blog/the-fullbay-workflow/).

> **Patrón para robar:** separar **(a)** el tipo de documento (estimado/orden/factura, que tiene consecuencias contables y de bloqueo), de **(b)** el estado operativo del tablero (configurable, medido en duración), de **(c)** el estado de autorización por trabajo. Y `workflowStatusDuration` es la pieza silenciosa: **el tablero mide cuánto tiempo lleva el carro atascado en cada columna** — ahí está el reporte de cycle time gratis.

### 6.2 Las entidades canónicas

**[PRODUCTO]** La forma se repite casi idéntica en todos; el esquema de Shopmonkey es el más explícito:

- `Company → Location → Order`; **cada fila lleva `companyId` y `locationId`**.
- `Order → Service (trabajo) → { Labor, Part, Tire, Fee, Subcontract }`. El enum `Service.lineItemOrder` es literalmente **`Labor | Part | Tire | Fee | Subcontract`** — **cinco** tipos de línea, no dos. Y `Service.pricing: FixedPrice | LineItem` más `lumpSum` controlan **si el cliente ve el desglose o no**.
- **Cliente ↔ Vehículo es muchos-a-muchos**, vía una tabla puente (`VehicleOwner`, `HQVehicleOwner`); el vehículo tiene `ownerCount`. **El vehículo NO está llaveado por VIN**: la PK es `id`, y `vin`, `hin`, `coalescedVINorHIN`, `licensePlate` + `licensePlateState` + `licensePlateCountry` son índices de búsqueda; además `vcdbVehicleId`/`makeId`/`modelId`/`engineId` para el catálogo y `configurationStatus: Custom | Incomplete | Invalid | NotSupported | Valid`.
- **El técnico no es una tabla aparte** — es `User`, referenciado como `Labor.technicianId`, `Order.assignedTechnicianIds: string[]`, `Order.serviceWriterId`.
- **La cita es de primera clase y solo opcionalmente ligada a una orden** (`orderId` nulable), con `confirmationStatus: Confirmed | Declined | NoResponse` y `origin: Shop | HQ | AppointmentScheduler | Concierge`.
- Trabajo precargado = `CannedService` con hijos `CannedServiceLabor/Part/Tire/Fee/Subcontract`, más `CannedServiceTemplate` (plantilla de cadena empujada a los locales) y banderas `bookable`, `recommended`.

Fuente: https://shopmonkey.dev/schema/Order · https://shopmonkey.dev/schema/Service · https://shopmonkey.dev/schema/Vehicle · https://shopmonkey.dev/schema/Appointment

**[PRODUCTO]** Tekmetric expone las mismas entidades: Shops, Customers, Vehicles, Repair Orders, **Jobs** ("servicios individuales, labor, repuestos y asignaciones de técnico"), Appointments, Employees, Inventory. Su API REST expone `GET /repair-orders` con campos `id, shopId, repairOrderNumber, customerId, vehicleId, repairOrderStatusId, totalSales, createdDate, updatedDate, deletedDate`; **los valores del enum `repairOrderStatusId` no son públicos**.

**[MARKETING]** Fullbay (pesado) cambia Vehículo por **"unit"** (camión/remolque/equipo) y estructura el cuerpo del trabajo con las **Tres C: Complaint, Cause, Correction** (queja, causa, corrección) en una pestaña de "Action Items" — https://www.fullbay.com/blog/how-to-create-accurate-repair-estimates-in-fullbay/. Shopmonkey tiene la versión ligera: `Order.complaint` y `Order.recommendation`.

> **Las Tres C importan para el caso eléctrico**: un diagnóstico eléctrico no es "cambiar la pieza X", es "el cliente reportó A, encontré B, hice C". Un modelo que solo tiene "servicio + labor + repuesto" no puede representar un diagnóstico honesto.

### 6.3 El historial del vehículo lleva contadores desnormalizados

**[PRODUCTO]** El `Vehicle` de Shopmonkey no es un registro pasivo: lleva `orderCount`, `appointmentCount`, `messageCount`, `mileageLogCount`, `lastServicedDate` y — crítico — **`deferredServiceCount`**. Además `locationIds: string[]` y `hqVehicleId` hacen que un vehículo sea visible entre talleres de la misma cadena. — https://shopmonkey.dev/schema/Vehicle

> El historial no es "una consulta sobre las órdenes pasadas". Es **estado materializado en el vehículo**, porque se consulta en el mostrador, en segundos, mientras el cliente espera.

### 6.4 Dos relojes distintos para el tiempo del técnico

**[PRODUCTO]** El patrón universal es **reloj de turno + reloj de trabajo**. Shopmonkey `Timesheet` tiene `activity: General | Order | Service | Labor` — se puede marcar entrada al taller, a una orden, a un trabajo, **o a una sola línea de labor**; más `type: Timeclock | Manual`, `flatRate` (bool), `duration`, `inProgress`, `rateCents`, y geocerca (`clockInAtLocation`, lat/long, `clockInPlatform: Web | Mobile`). — https://shopmonkey.dev/schema/Timesheet

Tarifa fija vs real: `Labor.hours` (facturadas) contra la duración del timesheet; `Labor.costHours`/`costRateCents` separan costo de precio; `Labor.multiplierType: Hours | Rate`; `Labor.skillRequired: General | Maintenance | Precision`. La orden acumula `totalLaborHours`, `completedLaborHours`, `totalAuthorizedLaborHours`, `completedAuthorizedLaborHours`.

**Varios técnicos en una línea** es una tabla puente aparte: `PUT /v3/line_item_assignment/bulk` con `{laborId|partId|tireId, userId}` (https://shopmonkey.dev/resources/line_item_assignment). AutoLeap habla de "técnico primario y ayudantes". **[PRODUCTO]** Mitchell 1 *Technician Time Manager*: los técnicos *"marcan entrada y salida de operaciones de labor"*, al completar *"se llena automáticamente el campo de Horas Reales"*, y compara *"horas marcadas contra horas pagadas por trabajo"* — https://mitchell1.com/press/. Fullbay: *"Cada vez que un técnico entra a una orden de servicio, queda automáticamente marcado en ella."*

> **El par que importa:** `Labor.hours` (lo que se facturó) vs duración real del reloj (lo que costó). Esa diferencia **es** la eficiencia del técnico y el margen de labor. Si el modelo no guarda ambas por separado desde el día uno, esa métrica no se puede reconstruir después.

### 6.5 El trabajo declinado es un estado de primera clase con motivo y resurrección

Este es el hallazgo más directamente aplicable al modelo de historial.

**[PRODUCTO]** Shopmonkey, en `Service` (https://shopmonkey.dev/schema/Service):
- `authorizationStatus: NotAuthorized | Authorized | Declined`
- `deferredDate`
- **`deferredReason: Archived | Declined | InvoicedNotAuthorized`** ← distingue *"el cliente dijo que no"* de *"se facturó sin autorizarlo"* de *"se archivó el estimado"*
- `excludedFromDeferred`, `recommended`
- **`revived` (bool) + `revivedFromId`** ← el trabajo nuevo **apunta al trabajo diferido original**

**[PRODUCTO]** Y el flujo de recuperación está documentado: el diferimiento se dispara al facturar o al archivar un estimado; en un estimado nuevo se abre **Suggestions → sección Service → ícono +** para traerlos; por cliente/vehículo hay un menú **Deferred** con **+ Add New Estimate**; y existe un *Deferred Services by Customer Report*. — https://support.shopmonkey.io/hc/en-us/articles/38743421091988-Deferred-Services

**[PRODUCTO]** Tekmetric distingue **declined jobs** (casilla marcada, el cliente lo rechazó) de **draft jobs** (casilla sin marcar, nunca se le mostró al cliente): *"Una vez que se postea la RO que contiene trabajos declinados, esos trabajos declinados son visibles en la **sección de historial de trabajos** en cualquier RO futura creada para **este vehículo**."* Alimentan la razón de cierre y un *Declined Jobs report*, y se suprimen si la casilla **"Market to customer"** del cliente está desmarcada. — https://support.tekmetric.com/hc/en-us/articles/360039270153

**[PRODUCTO]** El cierre del bucle campaña→orden: Shopmonkey tiene `ScheduledMessage.type: Standard | EstimateFollowUp` y `Order.attributionSource: WorkRequestForm | AppointmentScheduler | Manual | FuzzyCampaignSMSDelivered | FuzzyCampaignEmailRead` — **la orden sabe qué campaña la generó**.

**Nomenclatura entre productos:** Protractor = "Deferred Service items"; R.O. Writer = "Checklist, Declined Services, Follow up"; Shop Controller = "Service Recommendations".

### 6.6 El número duro sobre el valor del trabajo declinado

**[PRENSA]** El mejor dato encontrado. Kathy Kelley, gerente de BDC en Hiley Automotive Group, sobre el estado previo: *"Estábamos prácticamente en manos de los asesores, esperando que pusieran todos los comentarios ahí… Lo único que teníamos para guiarnos eran nuestros reportes de RO, algunos de los cuales no eran realmente reportes."* Después de extraer los servicios declinados del DMS como una campaña propia: **~385 citas por servicios declinados al mes × ~US$250 por RO ≈ US$96,000 en un período de 30 días.** — [Ratchet+Wrench](https://www.ratchetandwrench.com/running-a-shop/finance/article/11471887/an-answer-to-declined-services-2018-11-29-fixed)

Advertencia: es un grupo de concesionarios (volumen mucho mayor que un taller independiente) y el dato es de 2018. **Lo transferible no es la cifra, es el mecanismo**: el trabajo declinado deja de ser un comentario suelto del asesor y pasa a ser una lista accionable.

---

## 7. Multi-especialidad: mecánica, eléctrico y pintura no son el mismo negocio

### 7.1 Colisión/pintura corre sobre otro riel

**[USUARIO]** Los talleres de colisión no eligen su software; lo elige la aseguradora: *"Ambos son propiedad de la compañía de seguros y ninguno quiere ayudar a los talleres a ganar dinero."* — [r/Autobody](https://www.reddit.com/r/Autobody/comments/15a56jg/give_me_a_reason_to_not_switch_to_ccc_or_stick/)

**[PRENSA]** El dato estructural: **30.3% de los talleres de colisión corren más de un sistema de estimación** (83.7% CCC, 27.9% Mitchell, 23.7% Audatex), y el mandato de la aseguradora es la razón principal de compra para el 51.2% de los usuarios de Audatex y el 35% de los de Mitchell. State Farm exigió CCC a sus talleres Select Service desde abril de 2021. — [Repairer Driven News](https://www.repairerdrivennews.com/2021/05/21/ccc-less-and-less-overlap-in-repairer-estimating-system-usage-but-shops-still-have-multiple/)

**[PRENSA]** El costo medido de re-digitar entre sistemas: *"Algunas redigitaciones se pueden hacer en 20 a 30 minutos… **pero hora y media por estimado es más probable**"* — en una tarea que *"realmente no deberías estar haciendo"* (Mark Olson, VECO). Y re-digitar hace que los talleres *"pierdan operaciones sin darse cuenta"*. — [RDN](https://www.repairerdrivennews.com/2020/10/20/repair-u-rekeying-a-drain-on-shops-time-expenses/)

**[PRENSA]** Contexto de por qué el suplemento domina el flujo: **el 82% de las reparaciones tuvo al menos un suplemento, promediando 14.5% del costo total de la reparación.** — [RDN](https://www.repairerdrivennews.com/2020/10/20/repair-u-rekeying-insurer-estimates-insane-hurts-the-body-shop/)

### 7.2 La labor de pintura se calcula con reglas, no con una guía plana

**[PRODUCTO]** CCC documenta que su cálculo fijo daba *"a cada panel adyacente mezclado el 50% del tiempo de repintado publicado del panel para procesos de dos capas, y 70% para tres capas"*; desde la revisión de MOTOR de octubre 2023 esos porcentajes son **reglas configurables por el taller** (*Estimating Blend Rules*), con **reglas por aseguradora** (*Insurance Blend Rules*) y **reglas copiables para grupos multi-taller**, y los tiempos de mezcla van subrayados en el estimado. — https://cccis.zendesk.com/hc/en-us/articles/20080680958356

> Esto no tiene análogo en mecánica. En mecánica el tiempo de labor viene de un catálogo por operación; en pintura el tiempo **se deriva de otro tiempo** mediante un porcentaje que depende del proceso y de quién paga.

### 7.3 En colisión el "departamento" sí existe; en mecánica no

**[PRODUCTO]** Los sistemas mecánicos **no modelan departamentos**. Lo más cercano son categorías y etiquetas: `Service.categoryId`, `Labor.categoryId`, `Part.categoryId`, `CannedService.categoryId` → `InventoryCategory`, más `Label`/`SavedLabel` sobre Order/Labor/Part/Vehicle, y filas `WorkflowStatus` por local (se puede construir un segundo tablero, pero no un segundo departamento).

**[USUARIO]** La consecuencia se siente: *"su modelo de datos no tiene un concepto lógico de Departamento… Solo hay 1 reporte que divide los datos por Departamento."* — [Capterra / Shopmonkey](https://www.capterra.com/p/169022/Shopmonkey/reviews/)

**[MARKETING]** En cambio, los sistemas de colisión sí lo tienen de primera clase. Mitchell RepairCenter: *"Rastrea el progreso de reparación por vehículo **en cada departamento**"* y *"cambio de departamento del vehículo durante la reparación"* (https://mitchell.com). Rome Technologies: *"sistema de nivelación de carga… evita sobrecargar cualquier **departamento**"* (https://rometech.com).

### 7.4 Nadie ha resuelto el taller mixto

**No se encontró ningún hilo de practicantes describiendo un solo sistema que maneje bien mecánica y colisión.** Lo más cercano fue un dueño usando **CCC ONE en el taller de enderezado y Shop-Ware en el de servicio, como dos herramientas separadas** ([AutoShopOwner](https://www.autoshopowner.com/forums/topic/16461-are-you-really-happy-with-your-management-system/)).

Un competidor de nicho lo resume con precisión inusual (fuente **[MARKETING]** pero estructuralmente honesta): *"Mismo VIN, mismo cliente, flujo de trabajo distinto. Un vehículo que fue golpeado por atrás y también necesita cambio de aceite es el mismo carro. Pero el flujo operativo de los dos trabajos no se parece en nada. Uno pasa por una aseguradora. El otro es una venta al mostrador."* — https://claimory.io/compare/claimory-vs-tekmetric

La misma fuente enumera la asimetría: unidad de trabajo (reclamo de seguro vs orden de reparación), suplementos, comunicación con el ajustador, DVI (mecánica inspecciona; colisión **desarma** — teardown), margen sobre repuestos (mecánica gana margen; colisión recibe precios negociados por la aseguradora), historial de servicio (mecánica es recurrente cada 5,000 km; colisión es un evento único por accidente), y matriz de labor (mecánica corre de matrices y canned jobs; colisión saca la labor del estimado).

> **La pregunta clave para el proyecto:** la razón por la que en EE.UU. nadie unifica mecánica y pintura es **el dominio de la aseguradora sobre el estimado de colisión**, no una imposibilidad técnica. En Costa Rica la dinámica de seguros es distinta (mercado con INS y aseguradoras privadas, con menos programas DRP con sistema de estimación mandatorio). **Si esa restricción no se transfiere al mercado objetivo, el taller mixto deja de ser un problema irresoluble y pasa a ser una oportunidad real** — pero eso hay que verificarlo con evidencia local antes de asumirlo.

---

## 8. Contradicciones e incertidumbres

Registro explícito de lo que **no** quedó resuelto, para no construir sobre arena.

1. **DVI: ¿cuánto sube realmente el ticket?** Las cifras más citadas (+27%, +US$128 por RO, 45% más ARO con 40+ fotos) son **[BENCHMARK-VENDOR]** de AutoVitals, y un análisis las califica como *"un techo para programas bien ejecutados, más que un promedio"* ([WickedFile](https://www.wickedfile.com/blogs/digital-vehicle-inspection)). El dato de practicante (Cloutier, +US$300–400) es de un solo taller y autoreportado en un podcast. **No se encontró ningún estudio independiente con muestra y metodología publicadas.** Tratar todo número de ARO por DVI como orden de magnitud, nunca como pronóstico.

2. **Más inspección vs mejor relación.** El caso de Underwood contradice directamente la narrativa "más fotos = más plata": inspecciones más largas bajaron la tasa de aprobación y alargaron la espera; el retorno vino de **duplicar la frecuencia de visita**, no de subir el ticket. Los dos efectos son reales y opuestos.

3. **La adopción es el cuello de botella, no la función.** Cloutier (30% → 80-90% de tasa de envío tras años) y el dueño que deja de inspeccionar "porque estamos muy ocupados" muestran que **la función instalada ≠ la función usada**. Ninguna fuente cuantifica bien la tasa de uso real de DVI en la base instalada.

4. **Reddit no es scrapeable directamente.** Los hilos de Reddit citados se obtuvieron vía un espejo (redlib) y se citan con su URL canónica. Firecrawl y el fetch directo devuelven 403. Las citas son verificables abriendo el enlace en un navegador, pero **no se pudieron verificar dos veces por medios automáticos**.

5. **Reseñas incentivadas.** Muchas reseñas de Capterra están marcadas *"Incentivized review"* o *"Vendor Referred — Incentive Offered"*. Se privilegiaron reseñas no incentivadas para lo negativo, pero **el sesgo positivo del corpus es estructural**. Además G2 trunca las citas largas a ~150 caracteres, por lo que varias citas terminan a media frase — eso es la fuente, no una paráfrasis.

6. **Enum de estados de Tekmetric no es público.** Su API expone `repairOrderStatusId` como entero pero no publica los valores. Los nombres de columna citados vienen de su blog **[MARKETING]**, no de la API. Lo mismo para AutoLeap, Shop-Ware, Protractor y R.O. Writer: **no se encontraron enums de estado públicos**. **El único modelo de dominio verificable campo por campo es el de Shopmonkey** — lo cual sesga el "patrón repetido" hacia su diseño. Conviene tratar a Shopmonkey como *la muestra legible* y a los demás como corroboración parcial.

7. **El caso de US$96,000/mes en servicios declinados es de un grupo de concesionarios (2018)**, no de un taller independiente. El mecanismo es transferible; la magnitud no.

8. **Costa Rica / Latinoamérica no fue validado en profundidad en esta investigación.** La premisa del ticket (que este software casi no existe localmente) se toma como dada. La afirmación de la sección 7.4 sobre la dinámica de seguros en Costa Rica **es una hipótesis, no un hallazgo**, y necesita verificación local (ver "Preguntas abiertas").

---

## 9. Implicaciones para el modelo de historial de cliente/vehículo

No son decisiones tomadas — son las restricciones que la evidencia impone sobre el modelo que se diseñe después.

1. **El historial es el producto, no un reporte.** Es lo que hace que el sistema se vuelva más valioso con el tiempo y lo que hace doloroso irse. Es también lo que los usuarios reportan perder en cada migración. Debe ser un ciudadano de primera clase desde el día uno, no algo derivable de las órdenes.

2. **Cliente ↔ Vehículo debe ser muchos-a-muchos.** Es el patrón de todos los líderes (`VehicleOwner` con `ownerCount`). Un carro cambia de dueño y el historial de reparación pertenece al **carro**, no a la persona. En un taller mixto esto es aún más cierto: el mismo VIN puede volver por mecánica con un dueño y por pintura con otro.

3. **El VIN es un índice, no la llave primaria.** El vehículo tiene `id` propio, con VIN, placa (+ provincia/país) y catálogo como formas de búsqueda. En Costa Rica la **placa** es el identificador natural de mostrador y el VIN a menudo no está a mano; el modelo tiene que tolerar un vehículo sin VIN sin degradarse.

4. **El trabajo declinado necesita motivo y resurrección, no un borrado suave.** Como mínimo, replicar la distinción de Shopmonkey (`Declined` vs `InvoicedNotAuthorized` vs `Archived`) y de Tekmetric (**declinado por el cliente** vs **borrador que nunca se le mostró**) — mezclarlos envenena cualquier reporte de tasa de cierre. Y el trabajo que se revive debe **apuntar al original** (`revivedFromId`), o se pierde la trazabilidad de "esto se recomendó hace 8 meses".

5. **El historial se consulta de pie, en segundos.** Los contadores desnormalizados en el vehículo (`orderCount`, `lastServicedDate`, `deferredServiceCount`) existen porque la consulta ocurre en el mostrador con el cliente enfrente. La cita *"si me encuentro a un cliente en el supermercado, puedo hablar con criterio del historial de su carro"* describe el caso de uso real: **contexto instantáneo, no un informe**.

6. **La autorización es parte del historial, con medio y persona.** `Authorization.method: InPerson | Phone | Text | Email | InApp` + quién la tomó. En una disputa ("yo nunca autoricé eso") esto es lo único que protege al taller. Y una re-cotización debe **resetear** la autorización, no heredarla.

7. **Guardar horas facturadas y horas reales por separado, siempre.** `Labor.hours` vs duración del reloj. Si se colapsan, la eficiencia del técnico y el margen de labor son irrecuperables retroactivamente.

8. **La orden debe saber de dónde vino.** El equivalente de `Order.attributionSource` cierra el bucle recordatorio→visita. Sin eso, la reactivación de clientes no se puede medir y por lo tanto no se puede vender como valor.

9. **El historial debe poder importarse y exportarse.** La barrera de entrada del producto es el historial que el taller ya tiene en otro lado (o en papel); la barrera de salida no debe construirse a costa del cliente — pero sí debe existir por acumulación de valor. Y el reclamo post-CDK de *"acceso a los datos retroactivamente para cumplimiento"* dice que la exportabilidad ya es criterio de compra.

---

## 10. Implicaciones para el modelo de organización multi-especialidad

1. **El "departamento" debe existir como concepto de datos desde el inicio.** Es exactamente lo que los sistemas mecánicos no tienen y lo que sus usuarios reclaman (*"su modelo de datos no tiene un concepto lógico de Departamento"*), y es lo que los sistemas de colisión sí tienen. Si el diferenciador del proyecto es el taller multi-especialidad, ese es el hueco identificado en el mercado.

2. **Departamento ≠ etiqueta ni categoría.** Debe atravesar: el trabajo (a qué especialidad pertenece), el técnico (qué puede tomar), el tablero (cada especialidad ve su cola), el reporte (margen y eficiencia por especialidad) y el tiempo (una unidad puede estar en pintura mientras espera un repuesto de mecánica).

3. **Una orden, varios departamentos.** El patrón `Order → Service` ya lo permite naturalmente si el **departamento vive en el trabajo (`Service`), no en la orden**. El cliente recibe una sola cuenta; el taller ve tres colas. Este es probablemente el hallazgo estructural más importante para el proyecto.

4. **El vehículo se mueve entre departamentos y ese movimiento hay que medirlo.** Mitchell RepairCenter modela el "cambio de departamento durante la reparación"; Shopmonkey mide `workflowStatusDuration`. En un taller mixto, **el tiempo perdido en los traspasos entre especialidades es el desperdicio principal** — y nadie lo está midiendo hoy en mecánica.

5. **Cada especialidad tiene una unidad económica distinta y el modelo tiene que tolerarlo:**
   - **Mecánica**: operación de catálogo, margen sobre repuestos, canned jobs, matriz de labor.
   - **Eléctrico/diagnóstico**: tiempo de diagnóstico que no encaja en tarifa fija; necesita la estructura **queja → causa → corrección** (las Tres C de Fullbay) para justificar el cobro; y el hilo de foro sobre labor de diagnóstico regalada (*"¿el técnico recibe el tiempo de labor, o el técnico lo sufre?"*) muestra que **el diagnóstico se cobra mal precisamente porque los sistemas no lo modelan**.
   - **Pintura**: la labor se **deriva** de otra labor por un porcentaje según proceso (dos vs tres capas) y según quién paga; hay etapas físicas (desarme, enderezado, preparación, cabina, pulido) con capacidad limitada (la cabina es un recurso, no una bahía más); y existe la figura del **suplemento** (trabajo adicional descubierto al desarmar, que requiere reautorización).

6. **El suplemento es el análogo de la re-cotización, y ya existe evidencia de cómo modelarlo.** `serviceAuthorizationReset` + autorización por trabajo cubre conceptualmente el caso: se descubre daño oculto, se agregan trabajos, se reautoriza solo lo nuevo. Un modelo de autorización a nivel de orden **no puede** representar pintura.

7. **No copiar la dependencia de la aseguradora sin verificarla localmente.** El modelo estadounidense de colisión está dictado por CCC/Mitchell/Audatex y los programas DRP. Si en el mercado objetivo esa imposición no existe, **la razón estructural por la que nadie unifica mecánica y pintura desaparece** — y ahí está la ventaja del producto. Pero es una hipótesis pendiente de verificación.

8. **Multi-local es un problema aparte de multi-especialidad, y el patrón ya está establecido:** `Company → Location`, cada fila estampada con `locationId`, entidades `HQ*` para identidad compartida, plantillas de cadena (`*Template`) empujadas hacia abajo, y un ajuste explícito de **compartir datos** de clientes/vehículos. La queja en mayúsculas *"EL HISTORIAL DEL CLIENTE NO SE PUEDE COMPARTIR ENTRE MÚLTIPLES LOCALES"* indica que aquí también hay dolor sin resolver. **No mezclar los dos ejes** (especialidad y local) en la misma dimensión.

---

## 11. Preguntas abiertas para el mapa

Cosas que esta investigación identificó pero no puede responder, y que probablemente merecen su propio ticket:

1. **¿Cuál es la dinámica real de seguros para pintura/colisión en Costa Rica?** ¿Existen programas tipo DRP con sistema de estimación impuesto? De la respuesta depende si el taller mixto es viable como un solo producto (ver 7.4 y 10.7).
2. **¿Cómo se cobra el diagnóstico eléctrico en el mercado objetivo?** El modelo de dominio del diagnóstico depende de si se cobra por hora, por evento, o si se regala contra la reparación.
3. **¿Qué identificador usa realmente el mostrador en Costa Rica: placa, VIN, o nombre del cliente?** Determina el índice primario de búsqueda del historial.
4. **¿Cuál es la tasa de adopción realista de una inspección con fotos en un taller local?** El hallazgo más incómodo de esta investigación es que la función existe en todas partes y se usa a medias.
5. **Benchmarks locales.** Los cuatro números (autos/mes, ARO, margen de repuestos, tarifa efectiva) son de Norteamérica. Sin equivalentes locales, el panel de KPIs no tiene contra qué comparar.

---

## Fuentes

### Esquemas y documentación de producto (primaria)
- Shopmonkey — esquema público de API: https://shopmonkey.dev/schema/Order · https://shopmonkey.dev/schema/Service · https://shopmonkey.dev/schema/Vehicle · https://shopmonkey.dev/schema/Inspection · https://shopmonkey.dev/schema/InspectionItem · https://shopmonkey.dev/schema/Timesheet · https://shopmonkey.dev/schema/WorkflowStatus · https://shopmonkey.dev/schema/Authorization · https://shopmonkey.dev/schema/Appointment · https://shopmonkey.dev/resources/line_item_assignment
- Shopmonkey — Deferred Services (help center): https://support.shopmonkey.io/hc/en-us/articles/38743421091988-Deferred-Services
- Shopmonkey — Shopmonkey HQ Settings: https://support.shopmonkey.io/hc/en-us/articles/38743905954452-Shopmonkey-HQ-Settings
- Tekmetric — Declined Jobs: https://support.tekmetric.com/hc/en-us/articles/360039270153
- Tekmetric — Link Canned Jobs to Inspections: https://support.tekmetric.com/hc/en-us/articles/1500011364982-Link-Canned-Jobs-to-Inspections
- CCC — Blend Rules: https://cccis.zendesk.com/hc/en-us/articles/20080680958356
- Mitchell 1 — Technician Time Manager (nota de prensa): https://mitchell1.com/press/

### Precios (primaria, verificadas 2026-08-17)
- Tekmetric: https://www.tekmetric.com/pricing
- Shopmonkey: https://www.shopmonkey.io/pricing
- AutoLeap: https://autoleap.com/pricing/

### Benchmarks publicados por fabricante
- Tekmetric Shop Index (>10,000 talleres, datos a junio 2026): https://www.tekmetric.com/shop-index

### Reseñas de usuarios
- G2 — Tekmetric: https://www.g2.com/products/tekmetric/reviews?qs=pros-and-cons
- G2 — AutoLeap: https://www.g2.com/products/autoleap/reviews?qs=pros-and-cons
- G2 — Shopmonkey: https://www.g2.com/products/shopmonkey/reviews?qs=pros-and-cons
- Capterra — Tekmetric: https://www.capterra.com/p/190952/Tekmetric/reviews/
- Capterra — Shopmonkey: https://www.capterra.com/p/169022/Shopmonkey/reviews/
- Capterra — Shop-Ware: https://www.capterra.com/p/153469/Shop-Ware/reviews/
- Capterra — Protractor: https://www.capterra.com/p/18043/Protractor-NET/reviews/
- Capterra — Manager SE: https://www.capterra.com/p/145351/Manager-SE/reviews/
- Capterra — R.O. Writer: https://www.capterra.com/p/173266/R-O-Writer/reviews/
- Capterra — NAPA TRACS: https://www.capterra.com/p/61551/NAPA-TRACS/reviews/

### Foros y comunidades de dueños/técnicos
- r/mechanics — "What do auto shop owners want in an auto shop [software]": https://www.reddit.com/r/mechanics/comments/1syv8np/what_do_auto_shop_owners_want_in_an_auto_shop/
- r/mechanics — "Shop management software": https://www.reddit.com/r/mechanics/comments/1emtcxf/shop_management_software/
- r/mechanics — "Helping a buddy with a 3-bay shop": https://www.reddit.com/r/mechanics/comments/1p4us06/helping_a_buddy_with_a_3bay_shop_is/
- r/serviceadvisors — "New shop management system feedback": https://www.reddit.com/r/serviceadvisors/comments/1lig24b/new_shop_management_system_feedback_repair_shop/
- r/Autobody — "Give me a reason to not switch to CCC": https://www.reddit.com/r/Autobody/comments/15a56jg/give_me_a_reason_to_not_switch_to_ccc_or_stick/
- AutoShopOwner — "Are you really happy with your management system?": https://www.autoshopowner.com/forums/topic/16461-are-you-really-happy-with-your-management-system/
- AutoShopOwner — "Shop management tools": https://www.autoshopowner.com/forums/topic/19272-shop-management-tools/
- AutoShopOwner — "Do I need a shop management program?": https://www.autoshopowner.com/forums/topic/16875-do-i-need-a-shop-management-program/
- AutoShopOwner — "Effective labor rate": https://www.autoshopowner.com/forums/topic/9540-effective-labor-rate/
- AutoShopOwner — "Technician pay plans": https://www.autoshopowner.com/forums/topic/19597-technician-pay-plans-is-there-a-right-choice/
- AutoShopOwner — "AutoVitals vs AutoTextMe": https://www.autoshopowner.com/forums/topic/15681-autovitals-vs-autotextme/
- AutoShopOwner — "Are you happy with your shop management software?": https://www.autoshopowner.com/forums/topic/19571-are-you-happy-with-your-shop-management-software/
- Automotive Management Network — "Looking to make the switch from Mitchell": https://www.automotivemanagementnetwork.com/forums/topic/looking-to-make-the-switch-from-mitchell/
- Diagnostic Network: https://diag.net/msg/m3qtz3fa6x08orl5p2bkryx7cd
- Remarkable Results Radio, THA 418 (Chris Cloutier sobre DVI): https://www.youtube.com/watch?v=fdNvlmkxsxA

### Prensa sectorial y análisis independiente
- Ratchet+Wrench — "How Tiered DVIs Create Value": https://www.ratchetandwrench.com/running-a-shop/technology/article/55392836/how-tiered-dvis-create-value-for-technicians-customers-and-the-shop
- Ratchet+Wrench — "An Answer to Declined Services": https://www.ratchetandwrench.com/running-a-shop/finance/article/11471887/an-answer-to-declined-services-2018-11-29-fixed
- FenderBender — "You're Measuring Tech Productivity Wrong": https://www.fenderbender.com/running-a-shop/operations/article/33025058/youre-measuring-tech-productivity-wrong
- Repairer Driven News — sistemas de estimación múltiples en colisión: https://www.repairerdrivennews.com/2021/05/21/ccc-less-and-less-overlap-in-repairer-estimating-system-usage-but-shops-still-have-multiple/
- Repairer Driven News — costo de re-digitar estimados: https://www.repairerdrivennews.com/2020/10/20/repair-u-rekeying-a-drain-on-shops-time-expenses/
- Repairer Driven News — re-digitación y suplementos: https://www.repairerdrivennews.com/2020/10/20/repair-u-rekeying-insurer-estimates-insane-hurts-the-body-shop/
- Body Shop Business — portabilidad de datos (EMS): https://www.bodyshopbusiness.com/ignorance-is-expensive/
- WickedFile — análisis crítico de las cifras de DVI: https://www.wickedfile.com/blogs/digital-vehicle-inspection

### Marketing (citado solo como posicionamiento)
- Tekmetric — Job Board: https://www.tekmetric.com/post/repairs-management-software-job-board
- Fullbay — The Fullbay Workflow: https://www.fullbay.com/blog/the-fullbay-workflow/
- Fullbay — estimados y las Tres C: https://www.fullbay.com/blog/how-to-create-accurate-repair-estimates-in-fullbay/
- Mitchell RepairCenter: https://www.mitchell.com/
- Rome Technologies: https://rometech.com/
- Claimory vs Tekmetric (competidor de nicho, comparación estructural mecánica vs colisión): https://claimory.io/compare/claimory-vs-tekmetric
