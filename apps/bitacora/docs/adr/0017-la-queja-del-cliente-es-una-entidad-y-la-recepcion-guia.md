# La queja del Cliente es una entidad, y la Recepción guía por pasos

La Recepción de [#102](https://github.com/FabianRG1990/repositorio-de-apps/issues/102) capturaba ocho campos planos y metía todo lo que dijera el Cliente en un `textarea` que iba a `Orden.notas`. Eso alcanza para abrir una Orden y no para lo que [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) identificó como la razón de compra del rubro: **lo indispensable no es registrar el trabajo, es venderlo**.

**Decidimos que lo que el Cliente dice sea una entidad propia —el Reporte del Cliente— y que la Recepción sea un flujo guiado de cuatro pasos.** Sale del ticket [#106](https://github.com/FabianRG1990/repositorio-de-apps/issues/106).

## Por qué una entidad y no un párrafo

Lo que el Cliente dice es la **Queja** de las tres C del oficio —queja, causa, corrección—, y el estándar es registrarla **en las palabras del Cliente**. Una queja reescrita por quien recibe ya trae un diagnóstico adentro, y cuando el diagnóstico sale mal nadie puede volver a lo que de verdad se dijo. Por eso el texto se guarda literal y solo se le recortan los espacios.

Un párrafo no sabe representar el caso normal: _"suena al frenar y además no prende el aire"_ son **dos** problemas, de dos Especialidades distintas. Aplastados en un campo, después no se sabe a quién asignarlos, y la causa y la corrección no tienen de dónde colgar — que es justo lo que [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) encontró que la especialidad eléctrica necesita.

## Por qué no es una Línea de servicio

Se consideró y se descartó. **La queja es del Cliente y existe desde que el carro entra; la Línea es del Taller y nace al diagnosticar.** Una queja puede terminar en tres Líneas, en una o en ninguna. Meterlas en la misma tabla obligaría a inventar una Línea sin precio y sin Especialidad en el momento de recibir, y a distinguir después esas de las de verdad — que es exactamente el error que [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) documenta en Tekmetric al mezclar _declinado por el cliente_ con _borrador que nunca se mostró_.

La Orden sigue naciendo **sin Líneas** ([ADR 0001](./0001-visita-igual-orden.md) intacto).

## Considered Options

- **Reporte del Cliente como entidad, Recepción en cuatro pasos** (elegida).
- **Seguir con un campo de notas y añadirle etiquetas**: más barato, y deja sin representar la Visita con dos problemas de dos oficios, que es el caso normal.
- **Una sola pantalla larga con todos los campos**: es lo que había, escalado. La recomendación de forma para un formulario por pasos es de tres a cinco, y una pantalla con veinte campos de pie frente al Cliente no se llena — se salta.
- **Un paso por tabla del modelo** (Cliente / Vehículo / Orden / Reportes): agrupa por lo que le conviene a la base, no por lo que ocurre en el mostrador. Los cuatro pasos siguen la CONVERSACIÓN: se habla del carro, de qué le pasa, se camina alrededor mirándolo, y se confirma.

## El estado de entrada entra con esto

Odómetro, combustible, daños que ya traía y objetos dejados dentro. Es lo que todo check-in profesional registra y lo que sostiene al Taller cuando alguien dice _"usted me rayó el carro"_. Va en la **Orden y no en el Vehículo** porque describe esta Visita, no al carro.

El combustible se guarda en **cuartos de tanque** y no en litros ni en porcentaje: es lo que la aguja permite leer. Nadie mira el tablero y dice "31 %", y medir con más precisión de la que tiene el instrumento es inventar el dato.

## Consequences

- **`Orden.notas` deja de ser donde vive la queja** y queda como lo que su nombre dice. Las Órdenes viejas conservan lo que tengan ahí; no se migra, porque el texto libre de antes no se puede repartir en campos sin inventar.
- **El trabajo declinado aparece al reconocer la placa.** El glosario dice que "vuelve a proponerse cuando el Vehículo regresa", y este es el momento exacto en que regresa. Estaba escrito desde el principio y la pantalla se lo callaba.
- **La ficha que se confirma y la que se lee después son el mismo componente.** No es ahorro de código: es lo que garantiza que lo confirmado en el mostrador y lo leído tres días después sean literalmente la misma cosa.
- La tabla `reportes` obliga a una versión 2 del esquema de Dexie. Los cuatro campos nuevos de `Orden` no llevan índice, así que solo hacía falta rellenarlos en las bases que ya existían.
- Las Fotos ([ADR 0006](./0006-fotos-en-la-orden.md)) siguen sin construirse. Son su propio ticket: la cámara, los blobs y la cuota de IndexedDB no son un apéndice de este flujo.
