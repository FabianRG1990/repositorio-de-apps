# Las Fotos van en la Orden, no en la Línea de servicio

Al recibir el Vehículo se le sacan Fotos, y había que decidir a qué se pegan. **Decidimos que pertenezcan a la Orden**: muestran cómo entró el carro, sin amarrarse al trabajo concreto que las justifica.

## Considered Options

- **Fotos en la Orden** (elegida): un conjunto de imágenes de la Visita. Simple de construir y de explicar.
- **Fotos en la Línea de servicio**: cada imagen pegada al trabajo que la motiva — la pastilla gastada junto al cobro por cambiarla. Es lo que convierte una recomendación en algo que el Cliente ve, pero exige decidir en el momento de la foto a qué trabajo pertenece, y muchas veces el trabajo todavía no existe cuando se está recibiendo el carro.
- **Sin Fotos**: se descartó. [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) encontró que la inspección digital ya es piso de mercado, no diferenciador: no tenerla resta, aunque tenerla no sume.

## Consequences

- **El Cliente ve un álbum, no una prueba por cobro.** [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) identificó el bucle _inspección con fotos → trabajos cotizados → aprobación_ como la razón de compra del rubro, y la fuerza de ese bucle está en que cada trabajo propuesto venga con su imagen. Con las Fotos en la Orden, el bucle existe pero pierde ese filo: la conversación sigue siendo "confíe en mí" apoyada en un álbum general.
- Si más adelante se quiere la foto por trabajo, la migración no es dolorosa — sería agregar una referencia opcional de Foto a Línea de servicio, dejando las existentes colgando de la Orden como están.
- Las Fotos se guardan en el dispositivo junto al resto de los datos ([#24](https://github.com/FabianRG1990/repositorio-de-apps/issues/24) fijó Dexie sobre IndexedDB), así que funcionan sin conexión. A cambio, ocupan espacio real en el navegador y no se respaldan en ningún lado mientras no exista backend — una Orden con Fotos vive solo en el equipo donde se creó.
