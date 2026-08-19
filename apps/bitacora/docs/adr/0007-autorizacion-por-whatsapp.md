# La Autorización se pide por WhatsApp y la registra el Asesor

El Cliente tiene que aprobar cada trabajo antes de que se ejecute, y había que decidir por dónde ocurre esa conversación. **Decidimos que el Asesor mande la lista de trabajos con sus precios por WhatsApp, desde su propio teléfono, y que registre en Bitácora lo que el Cliente conteste.**

El mensaje se arma con un enlace `wa.me` prellenado: abre WhatsApp con el texto listo. No hay servidor de por medio.

## Considered Options

- **Enlace de WhatsApp, el Asesor registra** (elegida): usa el canal que el Cliente ya tiene abierto y no inventa infraestructura.
- **Solo registro manual**: el Asesor llama y marca el resultado. Es lo mismo sin la ayuda de armar el mensaje, y deja al taller escribiendo a mano la lista de precios en cada cotización.
- **El Cliente aprueba en pantalla**: una vista donde toca cada trabajo y firma. A distancia **no es implementable en Fase 1** — el backend está fuera de alcance, así que el dispositivo del Cliente no tiene cómo hablar con el del taller. Habría sido una promesa que la demo enseña y el producto no cumple.

## Consequences

- **La aprobación no es un dato que el Cliente produce, sino uno que el Asesor transcribe.** La constancia dice quién autorizó y por qué medio, pero la escribe el taller. No hay firma ni prueba del lado del Cliente; si más adelante hace falta valor probatorio, eso exige backend y es otra decisión.
- **Registrar funciona sin conexión; mandar el mensaje no.** Marcar un trabajo como aprobado o declinado es una escritura local y ocurre offline. El envío lo hace WhatsApp, no Bitácora, así que necesita internet — pero es una app aparte, y el Asesor puede haber recibido el "sí" por teléfono y registrarlo igual.
- El **Trabajo declinado** conserva su motivo y su monto y vuelve a proponerse en la siguiente Visita ([ADR 0001](./0001-visita-igual-orden.md)). Ese es el bucle de venta que [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) señaló como lo que hace indispensable al sistema, y funciona con la Autorización registrada a mano: no depende de que el Cliente toque nada.
- El mismo mecanismo — mensaje prellenado desde el teléfono del Asesor — es el candidato natural para avisar que el carro está listo ([#55](https://github.com/FabianRG1990/repositorio-de-apps/issues/55)), pero eso se decide en su propio ticket.
