# Un solo tablero ordenado por tiempo parado, y un Responsable por Orden

Un taller puede tener una, dos o las tres Especialidades, y había que decidir cómo se organiza el trabajo en pantalla y a quién se le atribuye. **Decidimos que haya un solo tablero — la lista de Órdenes abiertas ordenada por tiempo parado — y que cada Orden tenga un único Responsable**, no un ejecutor por Línea de servicio.

La Especialidad no genera columnas ni carriles: es un filtro sobre esa única lista. En un taller de una sola Especialidad el filtro no aparece, y la pantalla es exactamente la misma.

## Considered Options

### El tablero

- **Una sola lista ordenada por tiempo parado** (elegida): lo que más duele sube. Es la estructura que ganó en el prototipo de tokens ([#25](https://github.com/FabianRG1990/repositorio-de-apps/issues/25)), donde el tiempo es el dato de vistazo.
- **Lista más un kanban por estado**: dos vistas del mismo dato, ambas por construir y por mantener, sin que la demo ejercite la segunda.
- **Kanban con columnas por estado y carriles por Especialidad**: es lo que hacen los sistemas de colisión. [#16](https://github.com/FabianRG1990/repositorio-de-apps/issues/16) encontró que sus causas — integraciones de aseguradora, DMS de concesionario — no aplican acá, y que ningún sistema mecánico líder modela departamento.

### Quién responde por el trabajo

- **Un Responsable por Orden** (elegida): la Orden queda a nombre de una persona del taller.
- **Un Técnico por Línea de servicio**: más fiel a un taller mixto, donde mecánica y pintura las hacen personas distintas, y permitiría comparar horas facturadas contra reales por persona. Se descartó por peso frente a lo que la demo ejercita.

## Consequences

- **Las Horas reales no se pueden atribuir a persona por Especialidad.** La Orden sabe quién responde por ella, no quién ejecutó cada trabajo, así que la comparación de horas facturadas contra reales queda a nivel de Orden. [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) señaló esa comparación como dato clave del rubro: acá se conserva el dato, se pierde el desglose por técnico.
- En un taller mixto el Responsable de una Orden con mecánica y pintura será quien la coordina, no quien hace ambos oficios. Es una simplificación consciente, no un descuido del modelo.
- Si más adelante hace falta el desglose, la Línea de servicio es donde va — ya carga Especialidad y Pagador, y sumarle ejecutor no rompe nada de lo decidido. Lo que sí habría que migrar son las Órdenes ya creadas.
- La relación Técnico↔Especialidad sigue siendo N:N conceptualmente ([#16](https://github.com/FabianRG1990/repositorio-de-apps/issues/16) documenta que el IMI certifica MET como oficio multi-skilled), pero el MVP no la ejercita: sin asignación por línea, no hay nada que validar contra la especialidad de quien ejecuta.
