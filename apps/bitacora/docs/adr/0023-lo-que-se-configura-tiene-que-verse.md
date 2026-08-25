# Lo que se configura tiene que verse

El [ADR 0008](./0008-alcance-del-dueno.md) le dio al Perfil Dueño cuatro atribuciones. Al ir a construirlas apareció que **una de ellas dependía de algo que no existía**: el ADR 0003 y el propio 0008 llaman a las Especialidades _"la única configuración que cambia lo que se ve"_ —con una sola, el filtro del tablero desaparece— y **ese filtro nunca se había construido**.

**Decidimos que ninguna pantalla de configuración entre sin que su efecto sea visible**, y por eso el filtro del tablero entra en el mismo ticket. Sale de [#114](https://github.com/FabianRG1990/repositorio-de-apps/issues/114).

## Por qué no se podía dejar para después

Una pantalla que guarda Especialidades sin que pase nada al guardarlas no es media función: es una función que enseña que la app no hace nada con lo que se le dice. Es exactamente el argumento que los dos ADR usan para justificar que esa configuración importa, y entregarla sin el filtro lo habría desmentido.

Lo mismo con las otras dos: los datos del Taller entran **con** el membrete de los tres papeles, y las Tarifas entran **con** la sugerencia de monto al anotar un trabajo — el uso que el [ADR 0021](./0021-una-linea-no-puede-estar-autorizada-y-declinada-a-la-vez.md) les había reservado. Ninguna de las tres se guarda en un sitio donde nadie la lea.

## Tres invariantes que no sostenía nadie

- **La letra del Puesto no puede quedar en blanco ni repetirse.** El [ADR 0010](./0010-folio-con-prefijo-de-puesto.md) hizo que encabece el Folio y que cada Puesto lleve su consecutivo para que dos sin conexión nunca acuñen el mismo; esa promesa se cae si dos comparten letra. La comprobación devuelve el **motivo** y no un booleano, porque quien la llama tiene que poder decir qué está mal — y el mensaje que se enseña es ese mismo, no un "no se pudo guardar".
- **Tiene que quedar al menos un Puesto.** Sin Puesto no se acuña Folio, y sin Folio no se recibe un carro.
- **El Taller no puede quedarse sin Especialidades.** Cada Línea lleva la suya ([ADR 0001](./0001-visita-igual-orden.md)), y sin ninguna no habría de dónde elegirla.

## El monto se sigue escribiendo

La Tarifa **sugiere** la mano de obra y no calcula el monto. Es lo que el ADR 0021 dejó dicho y sigue valiendo: el monto incluye repuestos, y ahí es donde [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) encontró que la mecánica hace su dinero. La sugerencia se pulsa para copiarla; el campo no cambia de naturaleza.

## Considered Options

- **Configuración con su efecto, todo en el mismo ticket** (elegida).
- **Solo las pantallas, y el filtro después**: más pequeño, y entrega una configuración que no se puede comprobar. La demo enseñaría un formulario que guarda en el vacío.
- **Solo el filtro, con las Especialidades fijas**: enseña el filtro y deja al Dueño sin lo único que el ADR 0008 le prometió.

## Consequences

- **El Taller no pasa por `Repositorio`**, porque no es un `Registro`: le faltan `tallerId` y `borradoEn` a propósito — es la fila que DEFINE el taller, no una que le pertenezca, y borrarla lógicamente no significaría nada. Sus marcas se sellan a mano.
- **Ajustes vuelve a abrir en Taller.** Se había movido a Apariencia porque las otras dos pestañas estaban en blanco; ya no lo están.
- **Hay que distinguir "vacío" de "todavía no llegó".** `liveQuery` tarda un instante en emitir, y en ese instante la configuración se ve vacía: un clic ahí AÑADE una Especialidad en vez de quitarla, y borra las otras. No es teórico — así fallaba en Firefox, que contesta un poco más lento. Como ninguna Especialidad es un estado que la capa de datos permita guardar, la lista vacía solo puede significar que no ha llegado, y eso es lo que se usa para bloquear.
- **El orden de tabulación del tablero cambió**: el filtro se mete entre la acción principal y la primera fila. Una prueba que tabulaba a ciegas para medir el anillo de foco de la fila pasó a medir el del chip.
- **El personal queda fuera.** El ADR 0008 lo lista, pero cablearlo arrastra dos cosas que no existen en la interfaz: el selector de Perfil sale de tres papeles fijos, y el Responsable de la Orden no se asigna en ninguna pantalla. Es su propio ticket, y meterlo acá lo dejaría a medias — que es justo lo que este ADR decide no hacer.
- **Los cuatro números del Dueño siguen sin existir.** El ADR 0008 se los promete y son un panel de métricas: otro ticket.
