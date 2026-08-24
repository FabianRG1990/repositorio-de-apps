# La estructura la pone la pantalla, no la voz

El [ADR 0004](./0004-dictado-solo-en-campos-de-prosa.md) decidió que el Dictado sea **un botón de micrófono sobre campos de prosa y nada más**, y descartó explícitamente dos cosas: comandos de voz para navegar o accionar, y **dictar una Orden entera para que la máquina la reparta en campos**.

Al construir la Recepción guiada apareció la pregunta obvia: se pidió un ayudante que guíe y obtenga la información necesaria, y eso suena a lo segundo. **Decidimos que la estructura la ponga la pantalla y no la voz.** Sale del ticket [#106](https://github.com/FabianRG1990/repositorio-de-apps/issues/106).

## Qué significa en concreto

La pantalla pregunta —_¿cuándo pasa?_, _¿desde cuándo?_, _¿qué hace?_— y cada respuesta es un botón o un campo de prosa con su micrófono. El resultado es un ayudante que guía, sin que nada tenga que **interpretar** lenguaje natural para repartir una parrafada en campos.

Es la salida que cumple las dos cosas a la vez, y no un punto medio: el ADR 0004 sigue entero, y el micrófono sigue siendo un acelerador sobre campos que ya funcionan escribiendo. Quitando el botón, la Recepción se completa igual — y hay una prueba de punta a punta que lo hace, precisamente para que eso no se pueda perder sin que nadie se entere.

## Lo que el sistema propone, y por qué siempre dice por qué

De lo dictado sale una sugerencia: un título corto, las señales reconocidas y una Especialidad probable. Tres reglas la gobiernan.

**Siempre dice por qué**, citando las palabras del Cliente: «porque dijo _"no prende"_». Una etiqueta que aparece sola obliga a quien recibe a decidir entre creerle a ciegas o ignorarla siempre, y las dos salidas son malas. Con el motivo al lado, la sugerencia se juzga en un segundo.

**Ante un empate no propone nada.** _"Le dieron un golpe y desde entonces suena el motor"_ puede ser pintura o mecánica. Una moneda al aire con cara de certeza es peor que un espacio en blanco que quien recibe llena en dos segundos.

**Deja de escribir en cualquier grupo que se toque a mano.** Desmarcar algo y verlo volver solo dos segundos después —porque se siguió dictando— es la clase de detalle que hace que se deje de confiar en toda la pantalla.

## Considered Options

- **Reconocer vocabulario, con función pura y determinista** (elegida): corre sin red, que es la mitad del tiempo en un taller, y se puede probar entrada por entrada. A cambio no "entiende" nada — de ahí que todo salga como sugerencia editable.
- **Mandar el texto a un modelo de lenguaje**: entendería de verdad, y rompe lo que [ADR 0014](./0014-capa-de-datos-sobre-indexeddb.md) sostiene — la app funciona sin conexión. Además pone la queja del Cliente en un servicio de terceros, que es una decisión de otro tamaño.
- **No proponer nada y que se marque todo a mano**: honesto y lento. La Especialidad sugerida es lo que hace que el paso 2 se llene en segundos en vez de en un minuto.

## Consequences

- **El léxico es tico y es un punto de partida, no una lista cerrada** — "candela" por bujía, "burro" por motor de arranque, "faja" por correa. Habrá que corregirlo con el taller de verdad, y por eso se guarda si la sugerencia se cambió a mano: es lo que va a permitir saber si el intérprete acierta, en vez de suponerlo.
- **La Especialidad se propone por el léxico de PIEZAS, no por la señal.** Un ruido lo hacen las tres; lo que decide el oficio es de qué parte del carro se habla.
- **El título de la queja no se guarda, se deriva en cada lectura.** Un título guardado envejece cuando el intérprete mejora, y ninguna decisión depende de él.
- El Dictado sigue sin tocar el modelo de datos, salvo un campo que dice si la queja se dictó o se tecleó. Es el único número que va a decir si el micrófono se usa de verdad o si es un botón que nadie toca.
- Sigue siendo cierto lo que [#17](https://github.com/FabianRG1990/repositorio-de-apps/issues/17) encontró: el dictado solo funciona en Chrome y Edge de escritorio, con internet y HTTPS, en `es-MX`. En un celular Android no hay dictado continuo, y es una limitación de la plataforma que no se arregla desde acá.
