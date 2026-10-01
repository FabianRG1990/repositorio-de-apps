# Competencia hispanohablante: quién compite por el mismo taller tico (Bitácora)

> Investigación de producto del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14), ticket [#126](https://github.com/FabianRG1990/repositorio-de-apps/issues/126). Alimenta en particular [#131](https://github.com/FabianRG1990/repositorio-de-apps/issues/131) (firma del Cliente en tableta).
> Fecha de lectura: **2026-09-30**. Precios y funciones cambian sin aviso; cada afirmación lleva su URL.
>
> **Este documento cierra el hueco que dejó [`competencia-recepcion-y-orden.md`](./competencia-recepcion-y-orden.md)** (2026-08-29), que leyó seis productos anglosajones y declaró el mercado hispanohablante **[NO VERIFICADO] entero** (§3.2, §11.8, pregunta abierta 7 de §12). El relevamiento de mercado de [`que-hace-indispensable.md`](./que-hace-indispensable.md) §8 (#15) nombró productos; acá se abre su documentación. El marco legal de la firma (Ley 8454, artículos 3, 4, 8, 9 y 10) ya está leído en el documento de origen, §4.4, y **no se repite**: se cita.

---

## Convención de confianza de las fuentes

La misma del documento de origen, con una etiqueta más.

| Etiqueta             | Significado                                                                                                                        | Cómo leerlo                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **[PRODUCTO]**       | Página de función, precios, centro de ayuda, términos o ficha de tienda de aplicaciones del propio fabricante, leída para este doc | Fuente primaria sobre lo que el fabricante **dice** que hace su producto                     |
| **[MARKETING]**      | Afirmación promocional del fabricante sin detalle verificable                                                                      | Solo posicionamiento. No se usa como evidencia de que la función exista tal como se describe |
| **[DESCUBRIMIENTO]** | Buscador, directorio o comparativa de un tercero (o de un competidor)                                                              | **Solo sirvió para encontrar el nombre.** Nunca se cita como evidencia de una función        |
| **[NO VERIFICADO]**  | No se pudo abrir la fuente primaria, o la fuente no lo dice                                                                        | **Se declara y no se rellena**                                                               |

Una advertencia que pesa más acá que en el documento de origen: **ninguno de estos productos tiene un centro de ayuda escrito comparable al de Tekmetric o Shopmonkey.** Taller Alpha documenta en video; los demás tienen una página de producto. Casi todo lo que sigue es, por lo tanto, **[PRODUCTO] de página de venta**: dice qué hay, rara vez dice cómo funciona. Donde el _cómo_ importa (cómo sale el WhatsApp, qué queda guardado de la firma) se marca como hueco.

---

## 1. Pregunta

¿Qué sistemas de gestión de taller se venden **de verdad** en Costa Rica y en el resto de Latinoamérica y España, y qué hacen en:

1. **la recepción del vehículo** (campos obligatorios, Estado de entrada),
2. **la autorización del Cliente** (¿WhatsApp?, ¿firma en tableta?, y cómo presentan legalmente esa firma),
3. **la factura electrónica de Hacienda** (¿integrada?),
4. **el trabajo sin conexión**,
5. **el precio**?

Con prioridad para lo que se vende en Costa Rica, porque ese es el taller por el que compite Bitácora.

---

## 2. Resumen ejecutivo

1. **Autorox no compite en Costa Rica.** Es un producto de Hyderabad, India, y su sitio tiene páginas de mercado para India, Arabia Saudita, Emiratos y EE. UU. — **ninguna en español ni para Latinoamérica** en las 175 URL de su mapa ([autorox.ai](https://www.autorox.ai/), mapa leído 2026-09-30). Su WhatsApp es real (_"WhatsApp integration connects WhatsApp Business with your garage management software… approvals recorded within the system"_, [autorox.ai — WhatsApp integration](https://www.autorox.ai/post/whatsapp-integration-garage-management-software)), pero su aparición en la búsqueda del documento de origen fue una pista falsa sobre el mercado tico.

2. **El competidor real en Costa Rica es Taller Alpha, de Design Soft S.A. (Costa Rica), y ya tiene todo lo que el documento de origen suponía que tendría el competidor hispanohablante — y bastante más.** Recepción con combustible, kilometraje, daños sobre diagrama 360°, inspección de partes, fotos y **firma en pantalla**; envío por **WhatsApp** del comprobante de recepción y de la orden; **factura electrónica de Hacienda v4.4** incluida desde el plan de entrada; **facturación sin conexión** en la app móvil desde el plan PRO; enderezado y pintura en Premium. Precio publicado: **US$50 / 70 / 99 al mes**, impuestos incluidos ([talleralpha.com/precios](https://talleralpha.com/precios), [recepción vehicular](https://talleralpha.com/software-para-recepcion-vehicular)). Es la ficha de Bitácora casi casilla por casilla, a un quinto del precio de Tekmetric.

3. **Hay al menos cinco productos más con presencia tica verificable, y forman tres grupos distintos:**
   - **Taller completo con Hacienda:** Taller Alpha (US$50+), _Sistema Taller_ de pistoncr.com (**₡7 000 / 14 900 / 24 900 al mes**, factura de Hacienda en todos los planes).
   - **Taller con WhatsApp, Hacienda solo en el plan alto:** _Para Talleres Mecánicos_ (paratalleresmecanicos.com, **US$25 / 45 / 65 / 89**, factura electrónica solo en Business).
   - **Nicho o facturador con taller encima:** Henko Solutions (pintura y aseguradoras), Puntia (facturador con módulo de taller, **₡64 000 al año**), TallerOne, egobytes (a medida).

4. **El WhatsApp de Bitácora no es un diferenciador en Costa Rica: es piso.** Los seis productos ticos leídos usan WhatsApp para vender (cinco con un enlace `wa.me/506…` en la página; _Sistema Taller_ ofrece la demo _"por WhatsApp o llamada"_), y los dos que documentan su flujo de taller —Taller Alpha y _Para Talleres Mecánicos_— lo traen como función del producto. Y el más cercano a nuestro diseño lo hace **exactamente como nosotros**: _"Generamos mensajes y enlaces listos para abrir en WhatsApp Web o la app del teléfono"_ ([paratalleresmecanicos.com](https://paratalleresmecanicos.com/), FAQ). Taller Alpha va más lejos: muestra una bandeja donde el taller **recibe y responde** los mensajes del Cliente dentro del sistema, lo que apunta a la API de WhatsApp Business — el mecanismo es **[NO VERIFICADO]**.

5. **La firma en tableta también es piso en Costa Rica, y nadie la presenta con base legal.** Taller Alpha la llama _"Firma digital"_ y la vende para que _"el cliente apruebe la orden y los términos de ingreso firmando directamente desde la pantalla"_. Henko la ofrece como _"PDF imprimible. Respaldo legal del estado al ingreso. Firmado por cliente."_ egobytes, _"Orden de trabajo con estados, fotos y firma del cliente"_. **Ninguno cita la Ley 8454, ni un certificado, ni dice qué se guarda junto al trazo**; los términos y condiciones de Taller Alpha, leídos íntegros, **no mencionan la firma**. Y Taller Alpha usa el nombre _"firma digital"_, que en la Ley 8454 (art. 8) es un término definido que un trazo en pantalla no cumple (análisis en §4.4 del documento de origen).

6. **Lo que la firma de Taller Alpha firma es un texto de "Términos y Condiciones" que configura el taller.** La ficha de Google Play lo dice: _"Modulo de firma de Términos y condiciones, La aplicación le permite al Taller, poder configurar los Términos y Condiciones, para proteger tanto al cliente como al Taller."_ Y la orden de muestra que publican termina en un bloque _"Términos y Condiciones"_ seguido de _"Firma del Cliente"_ ([orden-1028.pdf](https://talleralpha.com/documents/orden-1028.pdf)). **Esa es la forma del mercado tico: trazo + texto de condiciones + PDF.** No es una constancia de autorización por línea; es una conformidad de ingreso.

7. **La factura electrónica de Hacienda es requisito de entrada, y ya tiene precio de mercado: cero.** _Sistema Taller_: _"La regla de oro del sistema es que ningún plan desactiva la factura electrónica"_; Taller Alpha la trae en el plan Básico; Puntia factura desde **₡12 500 al año**. Esto confirma #15 §12.7 con fuente primaria y lo agrava: no basta con tenerla, **hay que tenerla en el plan más barato**.

8. **"Funciona sin conexión" ya no es un hueco del rubro en Costa Rica, pero sí lo sigue siendo para la orden.** Taller Alpha vende _"Facturación OFFLINE (En aplicación móvil)"_ en PRO, y egobytes un facturador _"CR v4.4 con app offline"_. Lo que existe sin conexión es **facturar**, no recibir el carro ni trabajar la orden — de eso no hay una sola mención. _Para Talleres Mecánicos_ lo dice al revés y sin vueltas: _"Solo necesitas internet."_ La ventaja de Bitácora (§8.2 del documento de origen) se sostiene, pero más angosta: **es la Recepción y la Orden sin conexión, no "el sistema" sin conexión**.

9. **El hallazgo lateral más valioso no es de recepción: es de pintura.** Henko Solutions, hecho en Costa Rica, existe para un problema que #15 §12.1 dejó abierto: _"Avalúo, inspección, tracker de tiempos y análisis financiero — en una sola herramienta calibrada para INS, MAPFRE, Quálitas y ASSA."_ Compara el avalúo **borrador contra el aprobado** de la aseguradora, extrae **UT** (unidades de tiempo) por ítem y arma la Orden con porcentajes por estación. Es evidencia primaria de que **en Costa Rica la aseguradora sí impone un estimado con tiempos**, aunque por PDF y no por un sistema obligatorio como CCC en EE. UU. Ver §7.3.

10. **Fuera de Costa Rica, el patrón se repite y se aclara.** TallerON (Argentina) y Appli-Car (Chile/Colombia) mandan el presupuesto por WhatsApp para que el Cliente lo **firme desde su propio celular**; GDTaller (España) firma _"presupuestos, ORs, albaranes, facturas, resguardos de depósito"_ desde tableta y **acepta subir una imagen de la firma** en lugar de trazarla; Autodialog (España/Alemania) es el único que hace una afirmación legal: _"E-firmas legalmente vinculantes"_. Ninguno de estos vende en Costa Rica según sus propias páginas.

11. **El rango de precio del mercado hispanohablante es de US$16 a US$99 al mes, contra US$180–500 del anglosajón.** El techo verificado de Costa Rica es el Premium de Taller Alpha (**US$99**); el piso con Hacienda incluida es _Sistema Taller_ Básico (**₡7 000/mes**, unos US$15). La conclusión de #15 §8 se sostiene con números nuevos: la franja **no está vacía**, está **ocupada barato**.

---

## 3. Qué se verificó de primera mano y qué no

### 3.1 Cómo se encontraron los productos

Los nombres salieron de búsquedas web con país Costa Rica (**[DESCUBRIMIENTO]**), del relevamiento de #15 §8, y de una comparativa que publica el propio Taller Alpha ([talleralpha.com/blog/taller-alpha-vs-alternativas](https://talleralpha.com/blog/taller-alpha-vs-alternativas)) — **usada solo para nombres**: es un competidor hablando de competidores. Se priorizó lo que tiene alguna marca local verificable en la fuente primaria: número `+506`, precio en colones, mención de Hacienda, CABYS, RTV o aseguradoras ticas.

### 3.2 Verificado leyendo la fuente primaria el 2026-09-30

| Producto                            | Origen                                    | Qué se leyó                                                                                                                                                                            | Cobertura                                                                       |
| ----------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Taller Alpha** (Design Soft S.A.) | Costa Rica (`+506`, `designsoftcr`)       | Inicio, _Precios_, _Recepción vehicular_, _Facturación electrónica_, _Sistema de facturación_, _Enderezado y pintura_, _Ayuda_, _Términos_, orden PDF de muestra, ficha de Google Play | **Alta.** Las cinco preguntas tienen respuesta, salvo el mecanismo del WhatsApp |
| **Sistema Taller** (pistoncr.com)   | Costa Rica (colones, SINPE)               | Página única con precios y FAQ                                                                                                                                                         | **Media.** Hacienda, precio y recepción; nada de firma ni offline               |
| **Para Talleres Mecánicos**         | Costa Rica (`+506`, colones, RTV)         | Página única con módulos, precios y FAQ                                                                                                                                                | **Media-alta.** Responde cómo funciona el WhatsApp y el offline                 |
| **Henko Solutions**                 | Costa Rica (_"Hecho en Costa Rica"_)      | Página única                                                                                                                                                                           | **Media.** Recepción y firma; nada de Hacienda ni precio                        |
| **Puntia** (Dev Labs CR)            | Costa Rica (Cartago, colones)             | Página de talleres                                                                                                                                                                     | **Baja en taller**, alta en factura y precio                                    |
| **TallerOne** (mercedsoftware.com)  | Costa Rica (`+506`, clientes ticos)       | Página única                                                                                                                                                                           | **Baja.** Seguimiento del Cliente; casi nada de lo demás                        |
| **egobytes**                        | Costa Rica y Chile                        | Página de talleres                                                                                                                                                                     | **Baja.** Es desarrollo a medida, no un producto empaquetado                    |
| **MX Suite** (mxonesolution.com)    | Perú, con página regional para Costa Rica | Página de Costa Rica y página general                                                                                                                                                  | **Baja.** Afirma Hacienda; nada verificable de recepción                        |
| **Autorox**                         | India                                     | Inicio, _Packages_, artículo de WhatsApp, mapa del sitio                                                                                                                               | **Media.** Suficiente para descartarlo como competidor tico                     |
| **Appli-Car**                       | Chile (AppliCar SpA)                      | Inicio, _Precios_, _WhatsApp para talleres_                                                                                                                                            | **Media**                                                                       |
| **TallerON**                        | Argentina (`+54`)                         | Página de taller mecánico, inicio                                                                                                                                                      | **Media**, sin precio                                                           |
| **AutoSoft Taller**                 | México                                    | Inicio                                                                                                                                                                                 | **Baja**                                                                        |
| **GDTaller**                        | España                                    | Inicio                                                                                                                                                                                 | **Media.** La descripción de firma más detallada del documento                  |
| **GestFuturo / FuturoOR**           | España                                    | Inicio                                                                                                                                                                                 | **Baja**                                                                        |
| **Autodialog mobo**                 | Alemania, página en español               | _Recepción y check-in_                                                                                                                                                                 | **Baja**, pero con la única afirmación legal sobre firma                        |
| **Tekmetric en español**            | EE. UU.                                   | [tekmetric.com/espanol](https://www.tekmetric.com/espanol)                                                                                                                             | **Suficiente** para ubicarlo (ver §4.12)                                        |

### 3.3 Declarado NO VERIFICADO

- **Cómo sale el WhatsApp de Taller Alpha** (¿API de WhatsApp Business o enlace `wa.me`?) — **[NO VERIFICADO]**. La página muestra recibir y responder mensajes dentro del sistema, lo que apunta a la API, pero no lo dice.
- **Qué se guarda junto a la firma** en cualquiera de los productos (fecha, hora, aparato, ubicación, versión del texto firmado) — **[NO VERIFICADO] en todos**. Ninguna página lo describe.
- **Si la Recepción u Orden de Taller Alpha funcionan sin conexión** — **[NO VERIFICADO]**. Solo se verificó la facturación offline.
- **Campos obligatorios para abrir una recepción** en cualquiera de los productos ticos — **[NO VERIFICADO]**, salvo las _"fotos obligatorias"_ de _Para Talleres Mecánicos_.
- **Precio de Henko, TallerOne, egobytes, MX Suite, TallerON, Autorox** — **[NO VERIFICADO]**. No los publican en las páginas leídas.
- **Que la factura de TallerOne sea la electrónica de Hacienda** — **[NO VERIFICADO]**. Dice _"Facturación Automotriz"_, no Hacienda.
- **Cuántos talleres usan cada producto en Costa Rica** — **[NO VERIFICADO]**. Taller Alpha afirma _"Más de 5.000 talleres en 23 países"_ (**[MARKETING]**); su app Android tiene **10 k+ descargas** y **3,8 estrellas con 16 opiniones** según Google Play, que es la única cifra externa al fabricante.
- **Productos solo descubiertos, sin fuente abierta:** Garage App (garageauto.app), ServitechApp, TuulApp, Karbook, Orderry, GestionCar, RO App, Asystec (Costa Rica; la página leída no detalla recepción, firma, offline ni precio), KMSOFT (Costa Rica, desarrollo a medida), Mekavo (página `/cr` de un producto europeo; no se evaluó), Facture.CR, AppTaller, Mi Taller Mecánico Pro, ITCA — **[NO VERIFICADO]**.
- **El régimen legal de la firma en Argentina, Chile y España** — **[NO VERIFICADO]**. No se leyó la Ley 25.506 argentina, ni la 19.799 chilena, ni el reglamento eIDAS. Lo que se reporta de esos productos es lo que **ellos** dicen, no lo que vale.

### 3.4 Lo que ninguna búsqueda puede darnos

Ninguno de estos productos se usó. La demo pública de Taller Alpha (`demo.talleralpha.com`) existe pero no se abrió. Densidad de la pantalla, clics por recepción y qué pasa realmente cuando se cae la red **no salen de una página de venta**. Para el que importa —Taller Alpha— **una hora con su demo cerraría la mitad de los huecos de §3.3**.

---

## 4. Producto por producto

### 4.1 Taller Alpha — el competidor directo

**Quién es.** Design Soft S.A., Costa Rica. La app Android es `com.designsoftcr.talleralpha` y el sitio remite a `designsoftcr.com`; todos los contactos son `+506` ([Google Play](https://play.google.com/store/apps/details?id=com.designsoftcr.talleralpha&hl=es_419), actualizada el 14 ago 2026). Los términos se rigen _"de acuerdo a las leyes de la República de Costa Rica"_ y advierten que _"Taller Alpha no hace ninguna declaración de que los materiales contenidos en este sitio son apropiados para normativas fiscales fuera de Costa Rica"_ ([términos](https://talleralpha.com/terminos-condiciones)).

**Recepción [PRODUCTO].** Once pasos en la página de [recepción vehicular](https://talleralpha.com/software-para-recepcion-vehicular), en este orden: Cliente → tipo de vehículo → _"Registra la placa, marca, kilometraje exacto, niveles de combustible y temperatura"_ → servicios → enderezado y pintura → abonos → _"Marca el estado de luces, llantas, espejos y accesorios"_ → fotos _"antes y después"_ → _"Señala raspones, abolladuras o daños previos directamente sobre el modelo del vehículo"_ (diagrama 360°) → firma → WhatsApp. La orden de muestra confirma los campos con datos reales: `Placa`, `Año`, `Modelo`, `Tipo de vehículo`, `Color primario`, `Marca`, `% de la batería` y _"Nivel del combustible 1/2 (44%)"_ ([orden-1028.pdf](https://talleralpha.com/documents/orden-1028.pdf)). La ayuda tiene un video _"Configurar la recepción vehicular"_ ([ayuda](https://talleralpha.com/ayuda)), lo que sugiere que los pasos son configurables — **[NO VERIFICADO]** qué se configura.

**Autorización y firma [PRODUCTO].** Dos cosas distintas que la página mezcla:

- La firma en pantalla, al **recibir**: _"Firma digital. Permite que el cliente apruebe la orden y los términos de ingreso firmando directamente desde la pantalla para un cierre digital completo."_ En precios: _"Ingreso digital con fotos y firma electrónica para evitar reclamos."_ En Google Play: _"Modulo de firma de Términos y condiciones, La aplicación le permite al Taller, poder configurar los Términos y Condiciones, para proteger tanto al cliente como al Taller."_
- La proforma, al **cotizar**: _"Creación de Proforma, una vez que el cliente acepto la proforma la conviertes a una orden de forma rápida y sencilla"_ y _"Envió de Proformas, Ordenes, Diagnósticos, directamente por WhatsApp"_ (Google Play). **No se encontró autorización por línea**, ni un registro de quién aceptó y por qué medio. **[NO VERIFICADO]**, no _ausente_.

**WhatsApp [PRODUCTO].** El inicio dedica una sección de ocho pasos: _"Inicia la conversación"_, _"Recibe sus mensajes. El mensaje del cliente queda disponible en la aplicación"_, _"Responde desde Taller Alpha"_, _"Envía la orden"_, _"Comparte la marcación de daños"_, _"Respuestas rápidas"_, _"Taller Alpha te avisa cuando el cliente escribe"_ ([talleralpha.com](https://talleralpha.com/)). Está en el plan Básico como _"Seguimiento WhatsApp + Correo"_. Además, un **portal de seguimiento** donde _"El cliente ve el estado de su vehículo en tiempo real desde su celular"_.

**Factura electrónica [PRODUCTO].** En los cuatro planes. La ayuda tiene _"Factura Electrónica 4.4"_ (la versión vigente de Hacienda) y una sección de preguntas frecuentes que solo tiene sentido en Costa Rica: _"Solución al rechazo: el IVA del Cabys no coincide con el impuesto del producto"_. La página de factura suma recepción de facturas de proveedores, _"Prorrata de IVA"_ y reenvío por correo o WhatsApp ([facturación electrónica](https://talleralpha.com/facturacion-electronica-para-talleres)).

**Sin conexión [PRODUCTO].** Solo la factura: _"Facturación OFFLINE (En aplicación móvil)"_, desde el plan PRO ([precios](https://talleralpha.com/precios)); y en las novedades de la app, _"Nueva funcionalidad para facturar offline desde el POS online"_. La propia guía de compra de Taller Alpha, al describir el software en la nube, dice que _"Depende de la conexión y de la disponibilidad del servicio"_ ([blog](https://talleralpha.com/blog/mejor-software-taller-mecanico)) — **[MARKETING]** genérico, no una afirmación sobre su producto.

**Precio [PRODUCTO]** — _"Precios en dólares estadounidenses con impuestos incluidos"_, anual _"AHORRA 2 MESES"_:

| Plan           | Mensual   | Usuarios   | Lo que agrega                                                                                          |
| -------------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| **Básico**     | US$50     | 1          | Punto de venta, **factura electrónica**, cotizaciones, gestión de taller, citas, **WhatsApp + correo** |
| **PRO**        | US$70     | 5          | **Facturación offline en la app**, recordatorios de mantenimiento, pago de mano de obra, fidelidad     |
| **Premium**    | US$99     | Ilimitados | Diagnóstico con listas sugeridas, **enderezado y pintura**, Kanban personalizable, carga de XML        |
| **Enterprise** | a cotizar | Ilimitados | Marcas de asistencia, RR. HH., contabilidad, tienda en línea                                           |

El pago se confirma _"envíanos el comprobante directo por WhatsApp y nuestro equipo activará tu sistema en minutos"_.

### 4.2 Sistema Taller (pistoncr.com) — Hacienda primero, en colones

**[PRODUCTO]** [pistoncr.com](https://www.pistoncr.com/). _"Ordená el trabajo de tu taller y facturá ante Hacienda desde un solo lugar… pensado para talleres de Costa Rica."_

- **Recepción:** _"Del ingreso del vehículo a la entrega: falla reportada, líneas de mano de obra y repuestos, cotización, aprobación y estados claros"_ y _"Fotos de ingreso y adjuntos"_ en todos los planes. Cliente _"con identificación validada para Hacienda"_. Nada de combustible, daños ni objetos.
- **Autorización:** _"Enviá la cotización al cliente por correo con un clic; queda registrada en la orden con su fecha de vigencia."_ **Por correo, no por WhatsApp.** Sin firma mencionada.
- **Hacienda:** _"Factura electrónica ante Hacienda en todos los planes, sin costo aparte. La clave viaja al taller cuando Hacienda acepta el documento."_
- **Sin conexión:** no. Lo que sí dice es que _"la facturación corre de forma asíncrona para que la caída de un servicio externo nunca frene tu operación"_ — resiliencia frente a Hacienda, no frente a la red del taller.
- **Precio:** Básico **₡7 000/mes** (2 usuarios, 15 órdenes abiertas, 30 facturas), Profesional **₡14 900** (6 usuarios, 60 órdenes, 150 facturas, inventario, reportes), Premium **₡24 900** (ilimitado). Pago _"con SINPE Móvil o transferencia"_, 14 días gratis sin tarjeta.

### 4.3 Para Talleres Mecánicos — el que hace WhatsApp como Bitácora

**[PRODUCTO]** [paratalleresmecanicos.com](https://paratalleresmecanicos.com/). Contacto `+506 7236 0363`, precios convertidos _"1 USD ~ ₡468, BCCR ventanilla"_, módulo de **RTV** (_"Ideal para Dekra / RTV"_). Se presenta para Latinoamérica pero es tico en todo lo verificable.

- **Recepción:** _"Captura placa, cliente nuevo o existente, **fotos obligatorias del vehículo** y escaneo OBDII opcional para guardar códigos de falla"_, más _"Notas de voz"_. Es el único producto del documento que **declara un campo obligatorio** en el ingreso, y es la foto.
- **WhatsApp:** _"¿Cómo funciona WhatsApp? Generamos mensajes y enlaces listos para abrir en WhatsApp Web o la app del teléfono. Puedes enviar estado de orden, cotización, PDF o recordatorio RTV al cliente o proveedor."_ **Es el modelo del [ADR 0007](../../../apps/bitacora/docs/adr/0007-autorizacion-por-whatsapp.md)**: el sistema arma el mensaje y el teléfono del taller lo manda.
- **Firma:** no se menciona.
- **Hacienda:** _"Facturación electrónica"_ solo en el plan **Business**. No dice "Hacienda" explícitamente — **[NO VERIFICADO]** que sea la de Hacienda, aunque es lo esperable para un producto tico.
- **Sin conexión:** _"¿Necesito instalar algo en el taller? No… Solo necesitas internet."_
- **Precio:** Start **US$25** (40 órdenes/mes), Pro **US$45** (60), Business **US$65** (200, con factura electrónica e IA), Enterprise **US$89** (400 por sede). _"Si superas tu límite mensual, no bloqueamos tu taller: cobramos $0.50 USD por orden extra."_ Es el único que **cobra por Orden**.

### 4.4 Henko Solutions — pintura con aseguradoras

**[PRODUCTO]** [hkosolution.com](https://hkosolution.com/). _"Software para talleres · Hecho en Costa Rica"_, _"calibrada para INS, MAPFRE, Quálitas y ASSA"_. _"Hecho para talleres que trabajan con aseguradoras y particulares. Carrocería, pintura y mecánica."_

- **Recepción:** _"Boleta visual interactiva por tipo de vehículo. Tocá la pieza y registrá golpes, rayones o abolladuras — grave en rojo, leve en ámbar"_, _"Severidad por pieza"_ y _"Observaciones generales. Accesorios, combustible, kilometraje — todo en una pantalla."_
- **Firma:** _"PDF imprimible. Respaldo legal del estado al ingreso. Firmado por cliente."_ **Es la única presentación con la palabra "legal" de los productos ticos**, y no dice en qué se apoya.
- **Avalúo:** _"Subí el borrador y el aprobado de la aseguradora. El parser extrae los ítems, los compara lado a lado y genera la Orden de Trabajo con los porcentajes reales de tu taller"_; _"Registro inmutable. El aprobado queda congelado. Cualquier cambio queda en historial."_ Y en el taller, _"Nadie inicia tarea sin desbloqueo con PIN de 4 dígitos"_, con cronómetro contra la UT asignada.
- **WhatsApp, Hacienda, offline, precio:** ninguno aparece. **[NO VERIFICADO]**.

### 4.5 Puntia — un facturador con módulo de taller

**[PRODUCTO]** [puntia.app/talleres](https://www.puntia.app/talleres). Dev Labs CR, Cartago. _"Comprobantes con IVA desglosado y códigos CABYS correctos, firmados y enviados a Hacienda"_; _"certificada con la versión 4.4"_. Cotizaciones, historial por vehículo e inventario. **Precio:** _"₡64 000 /año · IVA incluido"_ (Pyme 900); _"La facturación electrónica desde ₡12 500 al año"_; el resto _"se cotizan según tu taller"_. Nada de recepción, firma, WhatsApp de producto ni offline.

### 4.6 TallerOne (mercedsoftware.com)

**[PRODUCTO]** [mercedsoftware.com](https://mercedsoftware.com/). _"Software para Talleres Mecánicos en Costa Rica"_, con dos talleres ticos con nombre en la página. Lo distintivo es el **portal de seguimiento por placa**: _"Tus clientes podrán revisar el estado del vehículo sin necesidad de llamar constantemente al taller."_ _"Facturación Automotriz"_ sin mencionar Hacienda. WhatsApp solo como contacto de ventas. Sin precio publicado; _"Prueba Gratis por 15 Días"_.

### 4.7 egobytes y MX Suite

- **egobytes** ([egobytes.com/software-para-talleres](https://egobytes.com/software-para-talleres)) — _"Ya funcionando en talleres de Costa Rica y Chile"_; _"Orden de trabajo con estados, fotos y firma del cliente"_; nombra el problema exacto que la firma pretende cerrar: _"La autorización que nadie puede probar. El cliente dice que no aprobó ese trabajo y no hay registro."_ Su facturador FacBox es _"Facturación electrónica CR v4.4 con app offline"_. **Es una casa de desarrollo a medida** (su caso tico es _"Sistema a medida para el taller ARB Costa Rica"_), no un producto con precio.
- **MX Suite** ([página de Costa Rica](https://mxonesolution.com/software-para-taller-mecanico-costa-rica.html)) — _"La facturación electrónica para Costa Rica está disponible dentro de MX Premium"_; la página general precisa _"Está disponible en Perú con SUNAT ilimitada y en Costa Rica"_. La recepción es _"Cliente, vehículo, condiciones y evidencia desde la recepción"_ — sin detalle. Es una página regional de un producto peruano; **[NO VERIFICADO]** que tenga un solo cliente tico.

### 4.8 Autorox — descartado como competidor tico

**[PRODUCTO]** [autorox.ai](https://www.autorox.ai/). Hyderabad, India. Páginas de mercado: India, Arabia Saudita, Emiratos, EE. UU.; ninguna en español. _"Build loyalty with digital approvals, real-time updates and photo-proof work via WhatsApp and SMS"_; el artículo de WhatsApp describe aprobaciones _"recorded against the job card"_ y _"Uses official business communication"_ — es decir, WhatsApp Business del lado del sistema. La página _Packages_ lista Starter, Professional y Enterprise **sin precio**: todos terminan en _"Schedule Demo"_. Firma, factura de Hacienda y offline: no aparecen.

### 4.9 Appli-Car (Chile) y TallerON (Argentina) — la firma por WhatsApp

- **Appli-Car** ([appli-car.com/es](https://www.appli-car.com/es/)) — _"Envía presupuestos interactivos directo al WhatsApp del cliente para una firma y validación al instante."_ El FAQ de WhatsApp aclara el mecanismo: _"Desde la OT envías el presupuesto al cliente por WhatsApp Business; el cliente aprueba con un clic y la aprobación queda registrada en Appli-Car"_; _"¿Necesito WhatsApp Business? Se recomienda, pero puede funcionar con WhatsApp normal"_; _"Disponible en Chile y Colombia"_ ([WhatsApp para talleres](https://www.appli-car.com/es/whatsapp-talleres/)). **Precio:** Básico **US$25/mes** (US$21 anual), Avanzado **US$32** (US$27); la factura electrónica chilena es _"servicio adicional de $24.000 CLP"_ ([precios](https://www.appli-car.com/es/precios/)).
- **TallerON** ([talleron.com.ar](https://talleron.com.ar/software-taller-mecanico)) — la descripción de recepción más parecida a la de Bitácora: _"Es una ficha digital interactiva donde registras las condiciones en las que ingresa el auto (rayones, nivel de combustible, luces, accesorios, etc.). Puedes tomar fotos… y hacer que el cliente firme digitalmente la conformidad de recepción."_ Y la autorización: _"Tus clientes reciben el presupuesto por WhatsApp y pueden autorizar los trabajos mediante firma digital desde su propio celular, sin necesidad de acercarse."_ Tres firmas distintas: **recepción, presupuesto y _"conformidad de entrega"_**. Sin precio publicado.

### 4.10 GDTaller, GestFuturo y Autodialog (España) — la firma madura

- **GDTaller** ([gdtaller.com](https://gdtaller.com/)) — _"Hemos completado el programa con la opción de firmar desde un móvil, tablet o dispositivo táctil los documentos que se generan con el programa (presupuestos, ORs, albaranes, facturas, resguardos de depósito, hojas de diagnóstico, etc). El cliente recibe el documento y lo firma, existiendo además la opción de **subir una imagen con la firma**, si así lo desea, en lugar de firmar sobre la pantalla."_ El resguardo de depósito tiene _"condiciones a firmar configurables por el taller"_. **Precio:** **€19,90 / 39,90 / 59,90 + IVA al mes**.
- **GestFuturo** ([futuroinformatica.com](https://www.futuroinformatica.com/)) — _"Tablet y recepción activa"_ con su app FuturoOR; Verifactu y TicketBAI. La firma **no se menciona** en la página leída.
- **Autodialog mobo** ([autodialog.com/es/recepcion-y-check-in](https://autodialog.com/es/recepcion-y-check-in)) — _"E-firmas legalmente vinculantes para órdenes de trabajo, presupuestos y consentimiento RGPD — almacenadas de forma segura"_, y una firma **antes de llegar**: _"A través de su página de diálogo personal en el smartphone puede firmar la orden de reparación de antemano."_ **Es la única afirmación legal explícita sobre firma de todo el documento**, y tampoco cita norma.

### 4.11 AutoSoft Taller (México)

**[PRODUCTO]** [autosofttaller.com](https://autosofttaller.com/). Factura **CFDI 4.0 de México**; dice _"Puede adaptarse a cualquier país"_ y lista Costa Rica entre los países donde vende. **Precio:** desde **US$16.99/mes** (US$15.99 anual). Sin factura de Hacienda, sin WhatsApp ni firma en la página leída. La comparativa de Taller Alpha afirma que tiene representantes en San José y Alajuela — **[DESCUBRIMIENTO]**, no verificado.

### 4.12 Tekmetric en español — no apunta a Costa Rica

**[PRODUCTO]** [tekmetric.com/espanol](https://www.tekmetric.com/espanol). La señal que #15 §8 leyó como _"un jugador estadounidense tanteando el mercado"_ resulta ser otra cosa: _"Tekmetric ofrece un equipo de servicio al cliente ubicado en Estados Unidos"_, integraciones con QuickBooks y _"Desde $199 al mes"_. **Es para el taller hispanohablante dentro de EE. UU.**, no para Latinoamérica. Sigue valiendo lo de §5.5 del documento de origen: su mensajería es 10DLC estadounidense.

---

## 5. Tabla comparativa: producto × capacidad

Leyenda: **Sí** = verificado en fuente primaria · **No** = la fuente lo niega · **?** = no verificado, no se afirma nada · **Parcial** = lo hace de otra forma, explicada en §4.

### 5.1 Lo que se vende en Costa Rica

| Capacidad                           | Taller Alpha                   | Sistema Taller           | Para Talleres Mec.                   | Henko                             | Puntia          | TallerOne  | **Bitácora**                              |
| ----------------------------------- | ------------------------------ | ------------------------ | ------------------------------------ | --------------------------------- | --------------- | ---------- | ----------------------------------------- |
| Campos obligatorios para abrir      | ?                              | ?                        | **Fotos** (declaradas)               | ?                                 | ?               | ?          | **4** (placa, marca, cliente, ≥1 Reporte) |
| Odómetro de entrada                 | **Sí**                         | ?                        | ?                                    | **Sí**                            | ?               | ?          | **Sí**                                    |
| Combustible al recibir              | **Sí**                         | ?                        | ?                                    | **Sí**                            | ?               | ?          | **Sí**                                    |
| Daños previos marcados              | **Sí** (diagrama 360°)         | ?                        | ?                                    | **Sí** (con severidad)            | ?               | ?          | **Sí** (texto)                            |
| Objetos / accesorios dentro         | **Sí** (accesorios)            | ?                        | ?                                    | **Sí** (accesorios)               | ?               | ?          | **Sí**                                    |
| Fotos al recibir                    | **Sí**                         | **Sí**                   | **Sí, obligatorias**                 | ?                                 | ?               | ?          | **Sí**                                    |
| Dictado por voz en la recepción     | Parcial (_Alpha IA: voz_)      | ?                        | **Sí** (notas de voz)                | ?                                 | ?               | ?          | **Sí**                                    |
| **Firma del Cliente al recibir**    | **Sí** (en pantalla + T&C)     | ?                        | ?                                    | **Sí** (PDF firmado)              | ?               | ?          | **No**                                    |
| Firma al **autorizar** trabajo      | ?                              | ?                        | ?                                    | ?                                 | ?               | ?          | **No**                                    |
| Presentación legal de la firma      | Ninguna (la llama _"digital"_) | n/a                      | n/a                                  | _"Respaldo legal"_, sin base      | n/a             | n/a        | n/a                                       |
| Autorización por línea              | ?                              | ?                        | ?                                    | Parcial (aprobado de aseguradora) | ?               | ?          | **Sí**                                    |
| **WhatsApp**                        | **Sí**, bidireccional          | **No** (correo)          | **Sí**, enlace                       | ?                                 | ?               | ?          | **Sí**, enlace `wa.me`                    |
| Mecanismo del WhatsApp              | ? (parece API)                 | n/a                      | **Enlace al teléfono**               | ?                                 | ?               | ?          | **Enlace al teléfono**                    |
| Portal de seguimiento del Cliente   | **Sí**                         | ?                        | ?                                    | ?                                 | ?               | **Sí**     | **No**                                    |
| Enderezado y pintura                | **Sí** (Premium)               | ?                        | ?                                    | **Sí**, con aseguradoras          | ?               | ?          | Parcial (Especialidad)                    |
| **Factura electrónica de Hacienda** | **Sí**, v4.4, todos los planes | **Sí**, todos los planes | Parcial (solo Business)              | ?                                 | **Sí**, v4.4    | ?          | **No**                                    |
| **Sin conexión**                    | Parcial (solo facturar, PRO+)  | **No** documentado       | **No** (_"Solo necesitas internet"_) | ?                                 | ?               | ?          | **Sí**, Recepción y Orden                 |
| App móvil nativa                    | **Sí** (iOS y Android)         | ?                        | No (web adaptable)                   | ?                                 | ?               | ?          | No (web)                                  |
| Precio de entrada publicado         | **US$50/mes**                  | **₡7 000/mes**           | **US$25/mes**                        | No publica                        | **₡64 000/año** | No publica | n/a                                       |
| Precio más alto publicado           | **US$99/mes**                  | **₡24 900/mes**          | **US$89/mes**                        | —                                 | —               | —          | n/a                                       |

### 5.2 Referencias fuera de Costa Rica

| Capacidad                             | Appli-Car (CL/CO)         | TallerON (AR)            | GDTaller (ES)                  | Autodialog (ES/DE)              | AutoSoft (MX)    | Autorox (IN)         |
| ------------------------------------- | ------------------------- | ------------------------ | ------------------------------ | ------------------------------- | ---------------- | -------------------- |
| Combustible / condiciones al recibir  | ?                         | **Sí**                   | Parcial (hoja de diagnóstico)  | **Sí** (kilometraje, daños)     | ?                | ?                    |
| Firma al recibir                      | ?                         | **Sí**                   | **Sí** (resguardo de depósito) | **Sí**, también antes de llegar | ?                | ?                    |
| Firma al autorizar                    | **Sí**, desde el celular  | **Sí**, desde el celular | **Sí** (presupuesto)           | **Sí**                          | ?                | Parcial (aprobación) |
| Firma al entregar                     | ?                         | **Sí**                   | ?                              | ?                               | ?                | ?                    |
| Firma con imagen subida               | ?                         | ?                        | **Sí**                         | ?                               | ?                | ?                    |
| Afirmación legal sobre la firma       | Ninguna                   | Ninguna                  | Ninguna                        | _"legalmente vinculantes"_      | n/a              | n/a                  |
| WhatsApp                              | **Sí**, Business o normal | **Sí**                   | **Sí** (envío de documentos)   | ?                               | ?                | **Sí**, Business     |
| Factura fiscal                        | SII Chile (extra)         | ARCA Argentina           | Verifactu / TicketBAI          | ?                               | CFDI 4.0         | ?                    |
| Factura de Hacienda CR                | No                        | No                       | No                             | No                              | No               | No                   |
| Vende en Costa Rica (según su página) | No (_"Chile y Colombia"_) | ?                        | No                             | No                              | Lo lista         | No                   |
| Precio de entrada                     | **US$25/mes**             | No publica               | **€19,90/mes + IVA**           | ?                               | **US$16.99/mes** | No publica           |

---

## 6. La firma, en particular — evidencia para #131

Esta sección junta lo que #131 necesita, sin decidirlo.

### 6.1 Quién ofrece firma y en qué momento

| Momento de la firma             | Quién la ofrece (verificado)                                                    |
| ------------------------------- | ------------------------------------------------------------------------------- |
| **Al recibir el carro**         | Taller Alpha, Henko, egobytes (Costa Rica); TallerON, GDTaller, Autodialog      |
| **Al autorizar el presupuesto** | Appli-Car, TallerON, GDTaller, Autodialog — **ningún producto tico verificado** |
| **Al entregar**                 | TallerON (_"Firma digital de conformidad de entrega"_)                          |
| **Antes de llegar al taller**   | Autodialog (_"firmar la orden de reparación de antemano"_)                      |

**En Costa Rica, la firma verificada es de recepción, no de autorización.** Esto es lo contrario de lo que encontró el documento de origen en el mercado anglosajón (§4.4: _"Lo que ofrecen es firma electrónica para autorizar trabajo, no para recibir el carro"_). El taller tico, según lo que le venden, usa la firma para protegerse de _"reclamos"_ por el estado de entrada, no para probar la autorización.

### 6.2 Qué se firma

- **Taller Alpha:** un texto de _"Términos y Condiciones"_ que **configura el taller**, impreso al pie de la orden junto con _"Firma del Cliente"_. El texto de la orden de muestra es de relleno, así que **[NO VERIFICADO]** qué escriben los talleres reales.
- **GDTaller:** el resguardo de depósito con _"condiciones a firmar configurables por el taller"_, y cualquier otro documento.
- **Henko:** el PDF del estado al ingreso, con la boleta de daños.
- **TallerON:** _"la conformidad de recepción"_.

**Ninguno documenta qué metadatos guarda con el trazo** (hora, aparato, ubicación, huella del documento). Es **[NO VERIFICADO]** en todos, y es exactamente lo que, según la lectura de la Ley 8454 en §4.4 del documento de origen, le daría o le quitaría valor probatorio.

### 6.3 Cómo la presentan legalmente

- **Taller Alpha** la llama **"firma digital"** en la página de recepción y **"firma electrónica"** en la de precios, sin distinguir. En Costa Rica _"firma digital"_ es un término legal (Ley 8454, art. 8) que un trazo en pantalla no satisface; **no hay en sus términos y condiciones ninguna cláusula sobre la firma** (leídos íntegros el 2026-09-30). Promete función, no validez: _"para evitar reclamos"_, _"para proteger tanto al cliente como al Taller"_.
- **Henko** es el único producto tico que usa la palabra **"legal"**: _"Respaldo legal del estado al ingreso"_. Sin norma, certificado ni explicación.
- **egobytes** no la califica.
- **Afuera:** Autodialog dice _"legalmente vinculantes"_ sin citar norma; GDTaller acepta una **imagen subida** de la firma, lo que deja claro que su valor no está en la autenticidad del trazo; TallerON y Appli-Car la llaman _"firma digital"_ igual que Taller Alpha.

**Nadie en el mercado hispanohablante leído ofrece firma digital certificada** (la del artículo 10, con certificado del BCCR) **ni dice que la suya lo sea.** Es **[NO VERIFICADO]** si alguno la ofrece fuera de las páginas leídas.

### 6.4 Lo que esto dice del valor comercial

Cuatro de los seis productos ticos que se leyeron venden firma o fotos de ingreso (Taller Alpha, Henko, _Sistema Taller_, _Para Talleres Mecánicos_), y los dos que explican para qué lo hacen lo presentan como **protección del taller**: _"para evitar reclamos"_ (Taller Alpha), _"Respaldo legal del estado al ingreso"_ (Henko). Que el argumento de venta sea defensivo, y no de conversión, coincide con lo que Bitácora ya captura sin firma (Estado de entrada con nombre propio, §8.5 del documento de origen). **La pregunta para #131 no es si la firma existe en el mercado —existe y es piso en el competidor directo—, sino si su ausencia se nota en la comparación con Taller Alpha.** Esa pregunta no la responde una página de venta.

---

## 7. Implicaciones para Bitácora

No son decisiones; son lo que la evidencia cambia respecto del documento de origen.

### 7.1 Brechas contra el mercado tico

1. **Factura electrónica de Hacienda.** Cuatro de los seis productos ticos la tienen, tres en el plan más barato, uno a ₡12 500 al año. #15 §12.7 la llamó _"probablemente un requisito de entrada"_; acá queda verificado, y el precio de esa entrada es **incluida**. Sigue fuera del alcance de Bitácora y sigue siendo la brecha más grande en una comparación de venta.
2. **Firma al recibir.** Taller Alpha y Henko la tienen. Es la brecha de §7.4 del documento de origen, pero ahora con el competidor directo enfrente y en el **momento** contrario al anglosajón: recepción, no autorización.
3. **Portal de seguimiento del Cliente.** Taller Alpha y TallerOne lo venden como función principal (_"sin necesidad de llamar constantemente al taller"_). Bitácora no lo tiene y, sin backend, no puede tenerlo.
4. **Diagrama de daños.** Taller Alpha (360°) y Henko (por pieza, con severidad) marcan los daños sobre un dibujo del carro. Bitácora los captura como texto.
5. **App nativa.** Taller Alpha está en las dos tiendas. Bitácora es web.

### 7.2 Ventajas que sobreviven

1. **La Recepción y la Orden sin conexión.** Lo único offline del mercado tico verificado es **facturar** (Taller Alpha PRO, FacBox de egobytes); _Para Talleres Mecánicos_ dice _"Solo necesitas internet"_. Ningún producto tico documenta recibir el carro o trabajar la orden sin red. Sigue siendo ventaja, con la misma advertencia de §8.2 del documento de origen (sin backend no hay respaldo ni un carro visible desde dos aparatos) y con la precisión nueva de que **"funciona offline" ya no se puede decir en general**: Taller Alpha lo dice de su facturación.
2. **La Autorización por línea con medio y persona.** No se encontró en ningún producto tico. Taller Alpha convierte la proforma aceptada en orden; Sistema Taller registra la cotización enviada por correo. **[NO VERIFICADO]** que no exista, pero ninguno lo muestra.
3. **El Reporte del Cliente como entidad con Especialidad**, y **el Folio por Puesto**: no aparecen en nada de lo leído. Sin cambios respecto de §8.1 y §8.6 del documento de origen.
4. **El WhatsApp por enlace no es ventaja, pero tampoco desventaja.** El producto tico más parecido lo hace igual y lo explica igual. Taller Alpha tiene la versión rica (bandeja bidireccional), con el costo que eso supone y que no se pudo ver.

### 7.3 Lo que cambia para el taller mixto (#15 §12.1)

Henko es evidencia primaria de que **en Costa Rica las aseguradoras (INS, MAPFRE, Quálitas, ASSA) entregan un avalúo con UT por ítem, en borrador y aprobado, en PDF**, y de que hay un producto local construido solo para conciliarlos. Eso **contradice en parte** la hipótesis de #15 §7.4 y §11.7 de que _"si en el mercado objetivo esa imposición no existe, la razón estructural por la que nadie unifica mecánica y pintura desaparece"_: la imposición existe, aunque por documento y no por un sistema de estimación obligatorio. Y Taller Alpha Premium sí junta mecánica y _"enderezado y pintura"_ con cobro _"para cliente o aseguradora"_ ([enderezado y pintura](https://talleralpha.com/software-enderezado-pintura)). **El hueco del taller mixto, en Costa Rica, no está vacío.** Qué tan bien lo llenan es **[NO VERIFICADO]**.

### 7.4 Precio

El techo verificado del mercado tico es **US$99/mes** (Taller Alpha Premium) y el piso con Hacienda **₡7 000/mes**. Cualquier conversación de precio de Bitácora en Costa Rica se compara con eso, no con los US$199–499 de §10 del documento de origen.

---

## 8. Contradicciones e incertidumbres

1. **Todo el documento descansa en páginas de venta.** El documento de origen tuvo centros de ayuda escritos; acá casi no hay. Lo que dice _"Sí"_ en la tabla de §5 es _"el fabricante dice que lo tiene"_, con menos detalle del _cómo_ que en el documento de origen. Las celdas `?` son **huecos de investigación, no ausencias**.
2. **Taller Alpha es más grande en la página que en la tienda.** _"Más de 5.000 talleres en 23 países"_ (**[MARKETING]**) contra **10 k+ descargas y 16 opiniones** en Google Play. Ninguna de las dos cifras mide clientes ticos. Su peso real en Costa Rica es **[NO VERIFICADO]**.
3. **"Firma digital" significa tres cosas distintas en el mismo mercado:** el trazo en pantalla (Taller Alpha, TallerON, Appli-Car), la firma certificada de la Ley 8454, y el genérico de marketing. Leer _"tiene firma digital"_ en una ficha comparativa sin aclarar cuál sería el error más fácil con este documento.
4. **La conclusión de §6.1 —en Costa Rica la firma es de recepción, no de autorización— se apoya en tres productos**, uno de ellos a medida. Es un patrón de lo que se **vende**, no de lo que el taller **usa**.
5. **El WhatsApp bidireccional de Taller Alpha puede no ser lo que parece.** Si es la API de WhatsApp Business, implica plantillas aprobadas por Meta y costo por conversación que la página no menciona; si es otra cosa, la bandeja puede ser menos de lo que muestran las capturas. **[NO VERIFICADO]**.
6. **El offline de Taller Alpha está en la app y en el POS**, según dos frases distintas (_"Facturación OFFLINE (En aplicación móvil)"_ y _"facturar offline desde el POS online"_). No es claro si son la misma función. Y facturar ante Hacienda sin conexión implica emitir y enviar después; cómo manejan el plazo de envío es **[NO VERIFICADO]**.
7. **El hallazgo de Henko sobre aseguradoras viene del fabricante**, que tiene interés en que el problema parezca grande. Que INS, MAPFRE, Quálitas y ASSA trabajen con UT en PDF es plausible y coherente con el producto, pero **no se verificó en ninguna fuente de las aseguradoras**.
8. **La búsqueda pudo no encontrar productos ticos que no hacen SEO.** Todo lo descubierto lo fue por buscador. Un producto que se vende por recomendación entre talleres, o por un distribuidor de repuestos, no aparece. La lista de §4 es **lo encontrable**, no el mercado.

---

## 9. Preguntas abiertas para el mapa

1. **¿Se prueba la demo de Taller Alpha antes de decidir #131?** Es el competidor directo, tiene demo pública (`demo.talleralpha.com`), y una hora con ella respondería qué guarda la firma, qué es obligatorio en la recepción, cómo sale el WhatsApp y si la orden funciona sin red.
2. **¿La firma de #131 va en la Recepción o en la Autorización?** El mercado tico la pone en la recepción; el anglosajón, en la autorización. Bitácora tiene constancia de Autorización pero no de conformidad de ingreso. Es una pregunta de producto, no de evidencia.
3. **Si se construye, ¿se llama "firma digital"?** El competidor directo usa un término que la Ley 8454 define y que su función no cumple. Llamarla de otra forma es más correcto y menos vendible; llamarla igual es lo contrario.
4. **¿Qué hace Bitácora con la factura de Hacienda?** Cuatro de seis la tienen y la incluyen. Integrarla, delegarla en un facturador tico (Puntia factura desde ₡12 500 al año) o declararla fuera de alcance son tres posiciones de venta distintas.
5. **¿El taller mixto tico se modela con avalúo de aseguradora?** Henko dice que el avalúo con UT existe y es el centro del negocio de pintura. Retoma #15 §12.1 con un dato nuevo y pide verificarlo con un taller o con una aseguradora.
6. **¿El portal de seguimiento del Cliente es piso?** Taller Alpha y TallerOne lo venden como función principal. Sin backend no se puede; con backend, cambia lo que hoy hace el Aviso de listo.

---

## Fuentes

Todas leídas el **2026-09-30**.

### Costa Rica (primaria)

| Fuente                                                                                                                                                                                                         | Qué aporta                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Taller Alpha — [Inicio](https://talleralpha.com/)**                                                                                                                                                          | Los ocho pasos del WhatsApp dentro del sistema · el portal de seguimiento · bandera y contactos de Costa Rica                     |
| **Taller Alpha — [Precios](https://talleralpha.com/precios)**                                                                                                                                                  | US$50/70/99 con impuestos · _"Facturación OFFLINE (En aplicación móvil)"_ en PRO · WhatsApp en Básico                             |
| **Taller Alpha — [Recepción vehicular](https://talleralpha.com/software-para-recepcion-vehicular)**                                                                                                            | Los once pasos de la recepción · combustible, kilometraje, temperatura · diagrama 360° · _"Firma digital"_                        |
| **Taller Alpha — [Orden de muestra (PDF)](https://talleralpha.com/documents/orden-1028.pdf)**                                                                                                                  | Los campos reales del vehículo · _"Nivel del combustible 1/2 (44%)"_ · _"Términos y Condiciones"_ + _"Firma del Cliente"_         |
| **Taller Alpha — [Facturación electrónica](https://talleralpha.com/facturacion-electronica-para-talleres)** y [Sistema de facturación](https://talleralpha.com/sistema-de-facturacion-para-talleres-mecanicos) | Recepción de facturas de proveedores · prorrata de IVA · reenvío por WhatsApp                                                     |
| **Taller Alpha — [Ayuda](https://talleralpha.com/ayuda)**                                                                                                                                                      | _"Factura Electrónica 4.4"_ · rechazos por CABYS · _"Configurar la recepción vehicular"_                                          |
| **Taller Alpha — [Términos y condiciones](https://talleralpha.com/terminos-condiciones)**                                                                                                                      | Leyes de Costa Rica · integración con Hacienda · **ninguna cláusula sobre la firma**                                              |
| **Taller Alpha — [Enderezado y pintura](https://talleralpha.com/software-enderezado-pintura)**                                                                                                                 | Cobro _"para cliente o aseguradora"_                                                                                              |
| **Taller Alpha — [Google Play](https://play.google.com/store/apps/details?id=com.designsoftcr.talleralpha&hl=es_419)**                                                                                         | Design Soft S.A. · módulo de firma de Términos y condiciones · facturar offline desde el POS · 10 k+ descargas, 3,8 ★ (16)        |
| **Sistema Taller — [pistoncr.com](https://www.pistoncr.com/)**                                                                                                                                                 | ₡7 000/14 900/24 900 · Hacienda en todos los planes · cotización por correo · facturación asíncrona                               |
| **Para Talleres Mecánicos — [paratalleresmecanicos.com](https://paratalleresmecanicos.com/)**                                                                                                                  | _"fotos obligatorias"_ · WhatsApp por enlace al teléfono · _"Solo necesitas internet"_ · US$25/45/65/89 · RTV                     |
| **Henko Solutions — [hkosolution.com](https://hkosolution.com/)**                                                                                                                                              | Avalúo borrador vs aprobado con UT · INS, MAPFRE, Quálitas, ASSA · _"Respaldo legal del estado al ingreso. Firmado por cliente."_ |
| **Puntia — [puntia.app/talleres](https://www.puntia.app/talleres)**                                                                                                                                            | Hacienda v4.4 con CABYS · ₡64 000/año · factura desde ₡12 500/año                                                                 |
| **TallerOne — [mercedsoftware.com](https://mercedsoftware.com/)**                                                                                                                                              | Portal de seguimiento por placa · talleres ticos con nombre                                                                       |
| **egobytes — [Software para talleres](https://egobytes.com/software-para-talleres)**                                                                                                                           | _"firma del cliente"_ · _"La autorización que nadie puede probar"_ · FacBox CR v4.4 _"con app offline"_                           |
| **MX Suite — [Costa Rica](https://mxonesolution.com/software-para-taller-mecanico-costa-rica.html)** y [general](https://mxonesolution.com/software.html)                                                      | Factura de Costa Rica en MX Premium · producto peruano                                                                            |

### Fuera de Costa Rica (primaria)

| Fuente                                                                                                                                                                                            | Qué aporta                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Autorox — [Inicio](https://www.autorox.ai/)**, [Packages](https://www.autorox.ai/packages), [WhatsApp integration](https://www.autorox.ai/post/whatsapp-integration-garage-management-software) | India, sin páginas en español · WhatsApp Business con aprobación registrada · precios no publicados |
| **Appli-Car — [Inicio](https://www.appli-car.com/es/)**, [Precios](https://www.appli-car.com/es/precios/), [WhatsApp](https://www.appli-car.com/es/whatsapp-talleres/)                            | Firma del presupuesto por WhatsApp · _"Disponible en Chile y Colombia"_ · US$25/32                  |
| **TallerON — [Software taller mecánico](https://talleron.com.ar/software-taller-mecanico)**, [inicio](https://talleron.com.ar/)                                                                   | Firma en recepción, presupuesto y entrega · combustible al recibir · ARCA                           |
| **AutoSoft Taller — [Inicio](https://autosofttaller.com/)**                                                                                                                                       | CFDI 4.0 · lista Costa Rica · US$16.99                                                              |
| **GDTaller — [Inicio](https://gdtaller.com/)**                                                                                                                                                    | Firma desde tableta de cualquier documento · firma por imagen subida · €19,90/39,90/59,90           |
| **GestFuturo — [Inicio](https://www.futuroinformatica.com/)**                                                                                                                                     | Recepción activa en tableta · Verifactu/TicketBAI                                                   |
| **Autodialog — [Recepción y check-in](https://autodialog.com/es/recepcion-y-check-in)**                                                                                                           | _"E-firmas legalmente vinculantes"_ · firma antes de la cita                                        |
| **Tekmetric — [Español](https://www.tekmetric.com/espanol)**                                                                                                                                      | Soporte desde EE. UU. · _"Desde $199 al mes"_                                                       |

### Solo para descubrir nombres (no son evidencia)

- Búsquedas web con país Costa Rica, 2026-09-30.
- Taller Alpha — [Taller Alpha vs alternativas](https://talleralpha.com/blog/taller-alpha-vs-alternativas) (comparativa de un competidor).

### Documentos propios que este continúa

- [`competencia-recepcion-y-orden.md`](./competencia-recepcion-y-orden.md) — los seis anglosajones, la tabla de §6, la lectura de la Ley 8454 en §4.4.
- [`que-hace-indispensable.md`](./que-hace-indispensable.md) (#15) — el relevamiento de mercado de §8, la pregunta de la factura (§12.7) y la de seguros (§12.1).

### Lo que NO se pudo verificar

Listado completo en §3.3.
