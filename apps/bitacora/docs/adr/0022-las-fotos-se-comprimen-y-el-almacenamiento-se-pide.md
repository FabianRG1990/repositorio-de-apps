# Las Fotos se comprimen antes de guardarse, y el almacenamiento se pide

El [ADR 0006](./0006-fotos-en-la-orden.md) decidió que las Fotos pertenezcan a la Orden y se guarden en el dispositivo, y dejó anotada su consecuencia incómoda: _"ocupan espacio real en el navegador y no se respaldan en ningún lado mientras no exista backend"_. Al construirlas hubo que mirar esa frase de cerca. **Decidimos comprimir antes de guardar y pedir almacenamiento persistente al arrancar.** Sale del ticket [#112](https://github.com/FabianRG1990/repositorio-de-apps/issues/112).

## Comprimir no es una optimización

Una foto de un teléfono actual pesa 3–5 MB. Veinte por Orden —que es el orden de magnitud de un check-in completo— son 100 MB por carro. Sin comprimir, la decisión del ADR 0006 no es sostenible: no es que la app vaya lenta, es que deja de poder guardar.

Se reduce a **1600 px de lado largo** y se recomprime a **WebP 0,72**. Medido sobre una foto de 4032×3024 y 5,34 MB: queda en **154 kB**, unas 35 veces menos.

1600 px es de sobra para lo que estas fotos tienen que probar —_"este rayón ya venía"_—: no son fotos de catálogo, son constancias. Y escalar antes de comprimir es la mayor de las dos reducciones: de 4032 a 1600 px se pierde el 84 % de los píxeles antes de que la compresión empiece a trabajar.

## Tres cosas que no son evidentes

**La orientación se maneja al decodificar.** El canvas se queda solo con los píxeles y descarta el EXIF. Eso es bueno para la privacidad —se va también el GPS, que en la foto de un carro ajeno no tiene por qué viajar— pero incluye la etiqueta de rotación, y sin tratarla las fotos de teléfono salen acostadas. `createImageBitmap` con `imageOrientation: 'from-image'` la aplica; se comprueba que el navegador lo soporte antes de confiar en ello.

**Si comprimir sale más grande, se guarda el original.** Pasa con capturas de pantalla y con fotos ya muy comprimidas. Guardar una versión peor _y_ más pesada no tiene defensa.

**Reducir no puede correr dentro de una transacción de Dexie**, que se cierra sola en cuanto el hilo cede el control. Por eso al recibir un Vehículo las Fotos llegan ya reducidas y solo se escriben adentro — en la misma transacción que la Orden, porque una Orden sin las fotos que se le sacaron al carro deja al Taller sin con qué contestar.

## Lo que el ADR 0006 no contemplaba

**WebKit borra los datos de un origen que no haya tenido interacción en siete días.** Para una app cuyos datos viven solo en el navegador eso no es una molestia: es pérdida de historial, y el historial es el producto — lo dice [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) y lo repite el [ADR 0014](./0014-capa-de-datos-sobre-indexeddb.md).

Se pide `navigator.storage.persist()` al arrancar, no al guardar la primera foto: lo que se borra a los siete días no son solo las fotos, son todas las Órdenes.

**El navegador puede decir que no**, y de hecho lo dice: Chromium lo niega sin señales de uso —en la prueba automatizada devuelve `false`— y lo concede con la app instalada o con historial de visitas. Lo único honesto es saberlo en vez de suponer que los datos están a salvo.

## Considered Options

- **Comprimir en el cliente con canvas** (elegida): sin dependencias, sin red, y el EXIF se va de paso.
- **Guardar el original**: fiel a lo que la cámara vio y acaba con la cuota en unas pocas Órdenes.
- **Una librería de compresión** (`browser-image-compression` y parecidas): hacen lo mismo que estas cuarenta líneas, con un `Worker` que acá no hace falta porque se comprime de una en una mientras la persona camina alrededor del carro.
- **Subirlas a un servidor**: no hay servidor, y el día que lo haya, sacar fotos no puede ser lo que deje de funcionar cuando se cae la conexión.

## Consequences

- **Las Fotos no salen en los papeles impresos.** En una impresora láser de taller una foto sale como una mancha gris y quema tóner. Son para la pantalla, y hay una prueba que lo fija.
- **El aviso de espacio existe** porque llenar el disco no puede ser una sorpresa: sin él, la primera señal sería que guardar deja de funcionar en mitad de una recepción.
- **Sigue sin haber respaldo.** Una Orden con Fotos vive solo en el equipo donde se creó. El ADR 0006 ya lo decía y este no lo resuelve: `persist()` evita el borrado automático, no el disco que se daña ni el aparato que se pierde.
- **Con 154 kB por foto y veinte por Orden**, un taller de cinco carros al día llena unos 3 GB al año. Cabe en la cuota de un equipo de escritorio y no cabe indefinidamente: el día que el historial importe de verdad, hará falta el servidor que #14 tiene fuera de la Fase 1.
- No se construye cámara propia. `<input capture="environment">` abre la del sistema, que ya trae visor, disparador, enfoque y rotación mejor hechos de lo que saldrían acá.
