# La Visita es la Orden, y la Especialidad vive en la Línea de servicio

Un taller multi-especialidad puede atender un mismo vehículo en mecánica, electricidad y pintura durante una sola entrada, y había que decidir con qué unidad se cuenta el historial. **Decidimos que una Visita equivale a una Orden**: el vehículo entró una vez, aunque lo hayan tocado tres oficios. La Especialidad se registra en cada **Línea de servicio**, de modo que "vino 2 veces por mecánica y 1 por pintura" se responde consultando las líneas, sin una entidad intermedia por especialidad.

## Considered Options

- **Visita = Orden** (elegida): el historial cuenta entradas al taller, que es como lo cuenta el taller mismo. Los contadores por especialidad son derivados.
- **Visita = atención por especialidad**: cada oficio genera su propia entrada en la cronología. Se descartó porque parte una sola entrada física del vehículo en varias filas y distorsiona el "¿cuántas veces ha venido?".
- **Dos niveles explícitos** (Visita contenedora + Atención por especialidad como entidad propia): más fiel si cada especialidad tuviera su propio ciclo de vida, pero agrega una entidad y su ciclo al MVP sin que la demo lo ejercite.

## Consequences

- El tiempo por especialidad dentro de una misma visita **no** queda registrado de forma directa. Si más adelante hace falta (por ejemplo para medir cuánto se tarda pintura frente a mecánica), habrá que promover la línea de servicio a una entidad con estados propios. Esa es la puerta que este ADR deja entreabierta a propósito.
- La investigación de organización multi-especialidad ([#16](https://github.com/FabianRG1990/repositorio-de-apps/issues/16)) encontró que ningún sistema mecánico líder modela "departamento" y que los de colisión sí; esta decisión se alinea con el lado mecánico, que es donde está el hueco de mercado detectado.
