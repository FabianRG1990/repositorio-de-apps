# Una Línea no puede estar autorizada y declinada a la vez

La Orden se leía y se imprimía ([ADR 0020](./0020-la-orden-se-lee-en-su-ventana-y-se-imprime-en-tres-papeles.md)) pero no se editaba: el taller no podía anotar lo que iba a hacer, ni registrar que el Cliente dijo que sí, ni que dijo que no. Y la tabla `autorizaciones` existía desde [#74](https://github.com/FabianRG1990/repositorio-de-apps/issues/74) sin que nadie la hubiera llenado nunca.

**Decidimos tres verbos —anotar, autorizar y declinar— y una invariante: una Línea de servicio nunca está autorizada y declinada a la vez.** Sale del ticket [#110](https://github.com/FabianRG1990/repositorio-de-apps/issues/110).

## La invariante, y por qué es una y no un estado más

Sería más barato dejar que los dos hechos convivan: la Línea tiene `declinadaEn` y las Autorizaciones son filas aparte, así que nada en el esquema lo impide.

Pero la Autorización no es un estado de la Línea: es una **constancia**, y existe para que alguien pueda apoyarse en ella meses después. Una Línea que dice a la vez _"Marielos lo autorizó por WhatsApp"_ y _"declinado: se arrepintió"_ no es un registro más rico, es un registro que se contradice — y el único momento en que alguien lo va a leer es justo cuando eso importe.

De ahí las tres reglas:

- **Declinar una autorizada le retira la autorización.**
- **Autorizar una declinada le quita la declinación.**
- **Autorizar dos veces no apila constancias.** La pregunta que la Orden tiene que contestar es _"quién autorizó esto"_, en singular. La anterior se retira en lógico, como todo acá, así que el historial no se pierde.

Y una que va en el otro sentido: **deshacer la declinación NO devuelve la autorización que hubiera antes.** Quién dijo que sí y cuándo es un hecho, no un estado que se restaura.

## El monto se escribe, no se calcula

Las Tarifas existen en el esquema desde #74 y **no hay ninguna**: son de Ajustes › Taller, que sigue pendiente. Pero aunque las hubiera, `horas × tarifa` da la **mano de obra**, no el trabajo: [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) encontró que el margen sobre repuestos es donde la mecánica hace su dinero, y ese margen no sale de ninguna tarifa por hora.

Si algún día la tarifa entra, entra como **sugerencia** sobre un campo que se sigue pudiendo escribir, no como cálculo.

## Considered Options

- **Tres verbos y la invariante** (elegida).
- **Un solo campo `estado` en la Línea** (`propuesta | autorizada | declinada`): más simple de leer y pierde lo único que hace útil a la Autorización — quién y por qué medio. #15 lo llama _"lo único que protege al taller en una disputa"_.
- **Permitir los dos hechos y resolverlo al mostrar**: mueve la contradicción de la base a cada pantalla que la lea, y garantiza que la próxima pantalla la resuelva distinto.

## Consequences

- **Declinar se puede deshacer.** Es un clic sin vuelta atrás sobre una tableta que se usa de pie, y un dedo torpe no puede costar una venta. Es la única de las tres acciones con deshacer, porque es la única que quita algo.
- **El estado de la Orden no se mueve.** Anotar o autorizar trabajos no la lleva de `recibido` a `en proceso`: eso es una máquina de estados con sus propias reglas y es otro ticket. Hoy queda incoherente a propósito — una Orden en diagnóstico con trabajos autorizados — y es visible.
- **No se puede editar ni borrar un trabajo ya escrito.** Se anota, se autoriza y se declina. Corregir una descripción mal escrita es otra conversación, y hacerlo mal —dejando que un monto cambie después de que el Cliente lo aprobó— rompería justo la constancia que este ADR protege.
- **Las horas reales siguen en cero.** El campo existe desde #74 y lo llena el técnico al trabajar, no el Asesor al cotizar; se guardan separadas desde el día uno porque #15 encontró que la eficiencia del técnico es irrecuperable si se mezclan.
- El mensaje de WhatsApp lleva **solo lo que no tiene respuesta**. Mandarle al Cliente una lista donde ya aprobó la mitad lo obliga a leerla entera otra vez para encontrar lo que falta.
