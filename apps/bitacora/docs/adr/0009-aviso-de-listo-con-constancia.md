# El Aviso de listo deja constancia y el tablero señala lo que nadie recoge

Cuando el trabajo termina hay que avisarle a Quien entrega. **Decidimos que Bitácora arme el mensaje, registre que se avisó — con fecha y a quién — y marque en el tablero los Vehículos sin recoger.**

El mensaje sale por WhatsApp desde el teléfono del Asesor, con el mismo mecanismo de enlace prellenado que el [ADR 0007](./0007-autorizacion-por-whatsapp.md) fijó para la Autorización.

## Considered Options

- **Constancia y recordatorio** (elegida).
- **Constancia sin recordatorio**: la Orden sabe que se avisó, pero el tablero no distingue el carro que espera trabajo del que espera dueño.
- **Solo abrir el mensaje**: Bitácora arma el texto y se desentiende. Es lo más barato, pero deja sin respuesta el reclamo más común del rubro — "nadie me llamó" — y vuelve invisible el Vehículo sin recoger.

## Consequences

- **El Tiempo parado deja de ser un solo número.** El tablero ordena por Tiempo parado ([ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md)), pero un carro que lleva cuatro días esperando un repuesto y otro que lleva cuatro días listo sin que lo recojan son problemas distintos: el primero es del Taller, el segundo es del Cliente. Marcarlos distinto es lo que vuelve accionable la pantalla.
- **Hay un umbral que calibrar y no hay dato para hacerlo.** ¿Desde cuándo un Vehículo listo "lleva días sin recoger"? Sin talleres reales observados, cualquier número es una suposición. Se deja como valor visible y ajustable en vez de enterrarlo en el código, y se revisa cuando haya uso real.
- **La constancia dice que se mandó el mensaje, no que lo leyeron.** Bitácora registra que el Asesor avisó; WhatsApp está fuera del sistema y no devuelve confirmación de lectura. Para el reclamo "nadie me llamó" alcanza; como prueba, no.
- Registrar el Aviso funciona sin conexión, igual que la Autorización. Lo que necesita internet es WhatsApp, que es una app aparte.
- El Aviso de listo y la Autorización comparten forma — un hecho con fecha, persona y medio. Si aparece un tercer caso conviene mirarlos juntos antes de repetir la estructura una vez más.
