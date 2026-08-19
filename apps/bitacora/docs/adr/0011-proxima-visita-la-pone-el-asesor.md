# La Próxima visita la escribe el Asesor y vive en una lista aparte

El seguimiento post-entrega está en alcance: el Taller quiere saber a quién llamar. **Decidimos que el Asesor escriba a mano, al cerrar la Orden, cuándo debería volver el Vehículo, y que esas fechas se junten en una lista aparte** que el Taller revisa cuando quiere.

No hay cálculo, ni intervalos, ni kilometraje.

## Considered Options

### Qué dispara el recordatorio

- **Lo escribe el Asesor** (elegida): el sistema recuerda una fecha que puso una persona.
- **Por kilometraje y fecha, lo que ocurra primero**: es como lo manda el manual del carro y es lo correcto en el mundo real. Exige anotar el kilometraje en cada entrada — un dato nuevo en la recepción — y estimar cuánto ha rodado el Vehículo desde entonces, que es una suposición disfrazada de cálculo.
- **Solo por fecha, con un intervalo fijo**: no pide datos nuevos, pero le manda el mismo aviso a un taxi y a un carro de fin de semana.

### Dónde aparece

- **Una lista aparte** (elegida): ordenada por fecha, se revisa cuando hay tiempo, y desde ahí se arma el mensaje.
- **En el tablero**: se vería sin buscarlo, pero el tablero es la pantalla del trabajo de hoy. Meterle carros que no están presentes le quita el sentido de "lo que está parado".
- **Solo al volver el Vehículo**: como el Trabajo declinado, que reaparece al recibir ([ADR 0001](./0001-visita-igual-orden.md)). Nunca habría generado una llamada saliente, que es justo lo que el Taller pidió.

## Consequences

- **El sistema no sabe nada que el Asesor no le haya dicho.** Si nadie escribe la fecha, el Vehículo no aparece nunca en la lista. Es un recordatorio, no un motor de mantenimiento — y conviene no venderlo como lo segundo.
- **No se registra kilometraje, y eso cierra una puerta.** Sin ese dato no se puede pasar después a intervalos reales sin volver a pedirlo en cada recepción, así que el historial acumulado no servirá para reconstruirlo hacia atrás.
- **Bitácora sigue sin mandar mensajes por su cuenta**, coherente con el [ADR 0009](./0009-aviso-de-listo-con-constancia.md): la lista le dice al Taller a quién llamar, y una persona decide y envía. No hay recordatorio automático al Cliente.
- La lista convive con el otro motivo por el que un Vehículo vuelve — el Trabajo declinado, que reaparece solo al recibirlo ([ADR 0001](./0001-visita-igual-orden.md)). Son dos caminos distintos hacia la misma conversación de venta: uno saliente y planificado, otro entrante y oportunista.
