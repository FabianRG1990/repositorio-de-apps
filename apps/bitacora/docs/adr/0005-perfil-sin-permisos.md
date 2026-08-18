# Tres Perfiles que cambian la pantalla, no un sistema de permisos

La demo no tiene backend ni login real: se entra eligiendo un Perfil de una lista. Había que decidir qué separa a un Perfil de otro. **Decidimos que el Perfil determine qué pantalla se abre y qué se ofrece hacer, no qué está permitido hacer.** Todos ven todas las Órdenes; la Especialidad es un filtro que uno se pone, no un muro.

Los Perfiles son tres: **Asesor**, **Técnico** y **Dueño**.

## Considered Options

### Visibilidad

- **Todos ven todo** (elegida): cualquiera abre cualquier Orden. Es como funciona un taller donde la información circula de viva voz, y es lo más barato de construir.
- **Cada quien ve lo suyo**: el eléctrico solo vería Órdenes con al menos una línea de electricidad. Rompe el caso central del producto — una Orden mixta que dos oficios necesitan mirar.
- **Ven todo, editan lo suyo**: más fiel a cómo se trabaja, pero son reglas que hay que construir, y sobre todo explicar en vivo durante una demo.

### Perfiles

- **Asesor, Técnico y Dueño** (elegida): el Asesor recibe, cotiza y trata con el Cliente; el Técnico ejecuta y registra horas; el Dueño ve reportes y configura el taller.
- **Solo Asesor y Técnico**: cubre el trabajo diario, pero deja la configuración del taller sin dueño visible.
- **Un solo perfil sin selector**: lo más barato, pero la demo pierde la ocasión de mostrar que el sistema entiende quién hace qué.

## Consequences

- **No hay nada que auditar.** Como el Perfil no restringe, tampoco hay registro de "quién no debía hacer esto y lo hizo". Si algún día el taller quiere responsabilidad real por acción, eso es autenticación de verdad, y no se construye sobre un selector.
- El Perfil **Dueño** introduce la configuración del taller — qué Especialidades tiene, qué tarifas cobra — que hasta ahora no tenía lugar en el modelo. Es lo que hace que la promesa de "un taller puede tener una, dos o las tres" sea visible en pantalla y no solo un supuesto: con una sola Especialidad configurada, el filtro del tablero no aparece ([ADR 0003](./0003-tablero-unico-y-un-responsable-por-orden.md)).
- Cambiar de Perfil en vivo durante la demo es gratis y no pierde estado, porque no hay sesión que cerrar. Eso lo vuelve una herramienta de venta y no un trámite.
- El Perfil elegido **no** es lo mismo que el Responsable de una Orden. El Responsable es un dato del trabajo y sobrevive a quién esté mirando la pantalla.
