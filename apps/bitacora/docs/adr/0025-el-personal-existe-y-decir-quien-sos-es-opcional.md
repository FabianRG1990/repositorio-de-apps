# El personal existe, y decir quién sos es opcional

`personas` era la última tabla del esquema sin un solo uso fuera de su definición. Existía desde [#74](https://github.com/FabianRG1990/repositorio-de-apps/issues/74) y quedó fuera dos veces a propósito —[#114](https://github.com/FabianRG1990/repositorio-de-apps/issues/114) no la puso en Ajustes, [#116](https://github.com/FabianRG1990/repositorio-de-apps/issues/116) no puso el Responsable en la Orden— las dos por la misma razón: el personal no existía. El costo era que el [ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md) prometía **un Responsable por Orden** y `responsableId` valía `null` en los tres sitios que crean Órdenes. Sale de [#118](https://github.com/FabianRG1990/repositorio-de-apps/issues/118).

**Decidimos que el Taller tenga gente con nombre, que el aparato pueda saber quién lo tiene en la mano sin que eso sea un login, y que la Orden quede a nombre de alguien sin obligar a que siempre lo esté.**

## El nombre es la identidad, y por eso no se repite

Una Persona no tiene cédula, ni carné, ni foto: el nombre es lo único que la distingue en pantalla. Dos "Luis Vargas" en la lista de Responsables dejan a quien elige adivinando cuál es cuál, y la Orden queda a nombre de una moneda al aire. Por eso el nombre se exige y se comprueba repetido **sin distinguir mayúsculas ni acentos** — quien teclea deprisa no los cuida.

El precio: un taller con dos personas que de verdad se llaman igual tiene que desempatarlas a mano ("Luis Vargas hijo"). Es un precio barato comparado con no poder distinguirlas nunca.

## La baja es lógica, y no toca las Órdenes

Dar de baja a alguien lo saca de la lista y **no le quita el Responsable a ninguna Orden**, ni siquiera a las abiertas. Quién respondió por un trabajo no deja de ser cierto porque la persona se haya ido del taller, y reasignar es una decisión del Taller, no una consecuencia automática de una baja.

De ahí que la Orden compuesta lea **todas** las Personas y no solo las vivas: filtrar por vivas dejaría al historial diciendo que esas Órdenes no fueron de nadie, que es justo lo que el borrado lógico se puso para evitar.

Y el nombre vuelve a quedar libre en cuanto alguien se da de baja: quien se fue no se lo reserva para siempre.

## Decir quién sos es un segundo paso, y es opcional

Se entra eligiendo un Papel, como decidió el [ADR 0005](./0005-perfil-sin-permisos.md). Ahora, elegido el Papel, se ofrece decir **cuál** de las Personas de ese Papel es.

**Sigue sin ser un inicio de sesión.** No se pide nada que haya que saberse, nadie demuestra ser quien dice, y no aparece ninguna guarda de ruta. Que las personas ahora tengan nombre no convierte esto en autenticación: el Perfil sigue diciendo qué se OFRECE, _"no qué está permitido"_.

Es opcional por dos motivos. El primero es el huevo y la gallina del primer arranque: sin nadie configurado, exigirlo dejaría al Dueño sin forma de entrar a crear la primera Persona. El segundo es que un paso obligatorio en una app sin contraseñas se contesta con el primero de la lista, y entonces el dato deja de significar nada.

**Quién tiene el aparato es del aparato**, no del Taller: se guarda el id en el almacenamiento local del navegador, igual que el Perfil, y es el corte contrario al de la apariencia ([ADR 0013](./0013-la-apariencia-es-del-taller-y-la-fija-el-dueno.md)). Se guarda el **id** y no el nombre, porque el nombre se edita en Ajustes y una copia local se quedaría con el viejo.

Cambiar de Perfil **suelta a la Persona**: el Papel es de ella, así que un Técnico que sigue elegido mientras la app dice "Asesor" es una contradicción.

## Cuándo se sabe que no hay a quién preguntar

El personal llega por `liveQuery`, y en el primer arranque tarda un instante. Leerlo al pulsar el Papel devuelve una lista vacía que significa **"todavía no ha llegado"**, no "no hay nadie": quien pulsara rápido se saltaba el segundo paso sin pedirlo, y de forma distinta cada vez.

La decisión espera a `cargado`, el mismo centinela que el [ADR 0023](./0023-lo-que-se-configura-tiene-que-verse.md) ya había necesitado para no confundir esas dos cosas en el filtro del tablero. Es la segunda vez que aparece el mismo problema; vale la pena reconocerlo a la primera.

## El Responsable se sugiere, no se impone

Al recibir, la Orden queda a nombre de quien tiene el aparato **si es Técnico**. Al Asesor no se le sugiere nadie: es quien recibe el carro, no quien responde por el trabajo, y ponerle su propio nombre sería llenar el campo con el dato equivocado por tener uno a mano.

Se puede dejar en nadie y se puede cambiar cuantas veces haga falta: en un taller el trabajo cambia de manos, y un campo que solo se escribe una vez acabaría mintiendo a la semana. Una Orden sin Responsable es un estado real —nadie la ha tomado todavía—, no un dato que falte por descuido, y por eso el tablero la señala en vez de disimularla.

## Lo que NO se comprueba

**La Especialidad del Responsable contra la de la Orden.** El [ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md) dice que quien responde _"responde por el trabajo, no necesariamente lo ejecuta todo"_: en un taller mixto, el Responsable de una Orden de mecánica y pintura es quien la coordina. Comprobarlo convertiría a ese coordinador en un error.

Las Especialidades se capturan igual —solo para el Técnico, que es quien ejecuta— porque el esquema ya las tiene y porque son lo que hará falta el día que exista ejecutor por Línea. Hoy no bloquean nada.

## Consequences

- **El Perfil y el Papel son dos cosas con los mismos tres valores.** El tipo `Papel` vive en el esquema y `Perfil` en el store del aparato, sin importarse uno al otro: unirlos ataría el esquema al almacenamiento local del navegador. Las etiquetas en español sí se comparten, porque dos tablas acabarían diciendo "Dueño" en un sitio y "Propietario" en el otro.
- **El Responsable vive en la Orden compuesta**, como la marca de sin recoger ([ADR 0024](./0024-el-ciclo-no-es-una-linea-recta-y-entregar-es-su-propio-verbo.md)): la fila del tablero, el resumen, la ficha de recepción y el selector de la Orden lo dicen los cuatro sin ponerse de acuerdo.
- **El Aviso de listo sigue sin registrar quién avisó.** El [ADR 0009](./0009-aviso-de-listo-con-constancia.md) pidió _"fecha, a quién y por qué medio"_ y eso ya está. Que ahora exista el personal no lo completa: añadir el emisor sería cambiar ese ADR, y nadie lo ha pedido.
- **El tablero no se filtra por Responsable.** El [ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md) dice que la Especialidad es el filtro de esa lista. Un segundo filtro es una decisión de producto que nadie ha tomado.
