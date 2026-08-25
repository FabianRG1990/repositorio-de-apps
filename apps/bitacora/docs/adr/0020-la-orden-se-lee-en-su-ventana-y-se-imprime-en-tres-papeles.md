# La Orden se lee en su ventana, y se imprime en tres papeles

El panel derecho del armazón enseñaba la Orden completa. Mide **310 px**, y ahí las Líneas de servicio con sus montos, las quejas del Cliente y el estado de entrada se convertían en una columna larguísima de texto envuelto: había que leer en vertical algo que existe para verse de un vistazo.

**Decidimos que el panel se quede con el resumen, que la Orden se abra en un `<dialog>` nativo, y que se imprima en tres documentos distintos.** Sale del ticket [#108](https://github.com/FabianRG1990/repositorio-de-apps/issues/108).

## El panel resume; la ventana desarrolla

En el panel queda lo que se responde **sin leer**: cuánto lleva parado, qué carro, quién, en qué estado, a qué Especialidades toca, cuánto suma lo aprobado, cuánto quedó declinado y por qué entró el carro. Nada de eso necesita más de una línea.

Lo que se **lee** —las palabras del Cliente, la tabla de trabajos, el estado de entrada— pide ancho, y el ancho no está en un cajón lateral.

`DetalleStore` no cambió: la fila sigue **pidiendo** la Orden por un contador y es el armazón quien decide cómo enseñarla. Lo que cambió es la respuesta. Esa indirección, que se escribió en el [ADR 0015](./0015-la-fila-de-ordenes-es-propia-y-el-boton-es-de-material.md) para que la fila no tuviera que conocer el `MatSidenav`, es la que hizo que este cambio no tocara la lista.

## `<dialog>` nativo y no `MatDialog`

`showModal()` trae la trampa de foco, el `Esc`, el fondo inerte, el `::backdrop` y la devolución del foco al botón que abrió — todo del navegador, sin librería.

`MatDialog` hace lo mismo, con dos diferencias que pesan acá: trae su propia carcasa, que es exactamente lo que hubo que pelear en las pestañas, en la fila y en el desplegable del Perfil; y arrastra un fallo abierto por el que el foco se le escapa con Shift+Tab ([angular/components#18799](https://github.com/angular/components/issues/18799)).

Lo único que el nativo **no** hace es bloquear el desplazamiento de la página detrás: con la rueda sobre el velo, el tablero se movía debajo. Se apaga a mano mientras está abierta.

## Tres papeles, no tres estilos del mismo

Es la decisión de fondo de la impresión, y la que se puede equivocar barato: **cambia el contenido, porque cambia quién lo lee**.

- **Taller** — **sin montos**. El mecánico no cotiza, ejecuta, y una hoja con precios pegada al parabrisas es una hoja con precios circulando por el patio. Placa a 34 pt porque se lee a un brazo de distancia, la queja del Cliente **en sus palabras** —que es lo que hay que reproducir para diagnosticar—, casillas para marcar y renglones para escribir, porque el papel del taller vuelve con anotaciones.
- **Cliente** — qué se hizo y cuánto, y lo declinado **en recuadro**. Ese bloque no es relleno: [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) identificó la reactivación como lo que más se cobra del rubro, y este papel se relee en la casa cuando ya no hay nadie vendiéndolo.
- **Archivo** — todo, con el estado de entrada y qué se aprobó y qué se declinó. Es el papel que contesta una disputa.

## Considered Options

- **Hoja de estilo y `window.print()`** (elegida): sin librería, sin servidor, y funciona sin conexión — que es la mitad del tiempo en un taller y lo que [ADR 0014](./0014-capa-de-datos-sobre-indexeddb.md) sostiene.
- **Generar el PDF en el cliente** (pdfmake, jsPDF): pesa cientos de kilobytes en un paquete que ya excede su presupuesto, y obliga a reimplementar la maquetación en la API de la librería en vez de en CSS.
- **Generarlo en un servidor**: no hay servidor, y el día que lo haya, imprimir no puede ser lo que deje de funcionar cuando se cae la conexión.

## Consequences

- **El tamaño del papel no se fija.** `size: auto` deja mandar a la impresora, que es lo que no falla con la que el taller tenga; fijar Carta hace que una A4 salga con la última línea cortada, y al revés. Margen de una pulgada, que ningún cabezal de oficina recorta.
- **La app se tapa con `visibility` y no con `display`.** La ventana se pinta en la **capa superior** del navegador, fuera del flujo del documento, y ocultar a sus ancestros con `display` no la alcanza.
- **Hay que esperar dos cuadros antes de imprimir**: el papel no existe cuando se pulsa el botón, porque la hoja se pinta solo para el documento elegido. Llamando a `print()` en el mismo cuadro sale una hoja en blanco.
- **La Especialidad va en texto y no en color** en el papel. La mitad de los talleres imprime en blanco y negro, y ahí un cuadrito de color es un cuadrito gris — el mismo razonamiento de #18 §6.2 que ya obligó a poner figura además de color en las insignias.
- **Recibir un vehículo ya no abre nada.** Antes pedía el detalle y eso abría el panel; con la ventana, aparecer con un modal encima justo después de recibir un carro tapa lo que se quería comprobar. Ahora solo se selecciona.
- **La app declara `es-CR`.** Salió del primer papel impreso, que decía "24 de August 2026": Angular arranca en `en-US` mientras nadie diga lo contrario.
- Falta lo que este ADR **no** resuelve: la Orden se lee y se imprime, pero todavía no se edita. Añadir Líneas, autorizarlas y declinarlas es otro ticket.
