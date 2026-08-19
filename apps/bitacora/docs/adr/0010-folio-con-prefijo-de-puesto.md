# El Folio lleva la letra del Puesto que lo acuñó

Bitácora es offline-first ([ADR de datos, #24](https://github.com/FabianRG1990/repositorio-de-apps/issues/24)): cada Puesto escribe en su propia base local y no hay servidor que reparta números. **Decidimos que el Folio lleve la letra del Puesto y un consecutivo propio de ese Puesto** — `A-241`, `B-118` — y que se acuñe al crear la Orden.

Dos Puestos incomunicados no pueden producir el mismo Folio, porque el prefijo los separa antes de que el consecutivo tenga oportunidad de chocar.

## Considered Options

- **Prefijo por Puesto** (elegida): la unicidad no depende de coordinación. Sigue siendo corto de dictar por teléfono, que es como se usa un Folio en la práctica.
- **Consecutivo único asumiendo un solo Puesto**: es lo más natural de leer, y es exactamente lo que hace Bahía hoy — [#46](https://github.com/FabianRG1990/repositorio-de-apps/issues/46) documenta que acuña desde el `max()` local. Funciona hasta que el taller pone una segunda tablet, y para entonces ya hay facturas impresas con números repetidos.
- **Acuñar al facturar**: limpio en el papel, pero el Taller necesita nombrar el trabajo desde que el carro entra. Una Orden sin Folio no se puede mencionar por teléfono ni buscar en el tablero.

## Consequences

- **Los Folios de un Taller no forman una serie corrida.** Ver `A-241` junto a `B-118` invita a pensar que faltan órdenes. Es el costo directo de la decisión y hay que sostenerlo en la interfaz: el Folio se muestra siempre completo, con su letra, nunca solo el número.
- **No sirve para contar.** "Vamos por la orden 300" deja de ser cierto — el consecutivo de un Puesto no dice cuánto trabajó el Taller. Los conteos salen de consultar las Órdenes, no de leer el último Folio.
- **Cada Puesto necesita su letra antes de crear la primera Orden.** Es configuración del Taller ([ADR 0008](./0008-alcance-del-dueno.md)) y no puede quedar en blanco ni repetirse entre Puestos: dos Puestos con la misma letra reproducen el problema que esto viene a evitar.
- **Fase 1 tiene un solo Puesto**, así que la demo enseña una sola letra y el mecanismo no se ejercita de verdad. Se construye igual porque el Folio va impreso en la factura y cambiarlo después no es una migración de datos sino un problema con documentos ya entregados.
- Esto **no arregla [#46](https://github.com/FabianRG1990/repositorio-de-apps/issues/46)**, que es el mismo defecto ya presente en `apps/bahia`. Bitácora simplemente no lo hereda.
