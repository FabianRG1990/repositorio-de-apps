# El Dueño configura el Taller y mira cuatro números

El Perfil Dueño existía desde el [ADR 0005](./0005-perfil-sin-permisos.md) con dos atribuciones sin contenido: configurar y ver cómo va el negocio. **Decidimos qué son exactamente.**

**Configura** las Especialidades que ofrece el Taller, las Tarifas de cada una, los datos del Taller que van impresos en la factura y en la Orden, y el personal — la lista de Técnicos y Asesores.

**Ve** cuatro números: trabajo declinado sin recuperar, carros parados, facturado del mes, y horas facturadas contra reales.

## Considered Options

### Qué mira

- **Panel con cuatro métricas** (elegida).
- **Solo el trabajo declinado sin recuperar**: es el foso del producto según [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) y lo único que los competidores pequeños no enseñan bien. Habría sido la opción de máxima señal por mínimo trabajo.
- **Declinado más carros parados**: dos números de un vistazo, sin construir un módulo de reportes.
- **Sin reportes**: dejaba al Dueño configurando y nada más.

### Qué configura

- **Especialidades, Tarifas, datos y personal** (elegida).
- **Solo Especialidades y Tarifas**: cubre lo que cambia el comportamiento del producto, pero deja la factura con membrete genérico.
- **Sin personal**: no había de dónde salieran el selector de Perfil ni el Responsable de la Orden.

## Consequences

- **El personal deja de ser un supuesto.** Hasta ahora el selector de Perfil ([ADR 0005](./0005-perfil-sin-permisos.md)) y el Responsable de la Orden ([ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md)) daban por sentada una lista de gente que nadie creaba. Configurarla en el Taller cierra ese cabo.
- **Horas facturadas contra reales dice menos de lo que promete.** El [ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md) dejó las horas a nivel de Orden, sin ejecutor por Línea de servicio, así que la métrica compara la Orden completa y no permite ver qué oficio o qué persona se desvía. Es el número más débil de los cuatro y conviene saberlo antes de presentarlo en una demo.
- **"Facturado del mes" no es "cobrado del mes".** El mapa dejó los estados de factura — pagada, pendiente — fuera de alcance, así que el número suma lo que se facturó, sin saber si entró la plata. La distinción hay que sostenerla en la interfaz: llamarlo "ingresos" a secas sería mentir.
- Configurar las Especialidades del Taller es la única configuración que **cambia lo que se ve**: con una sola, el filtro del tablero desaparece. Las demás son datos.
