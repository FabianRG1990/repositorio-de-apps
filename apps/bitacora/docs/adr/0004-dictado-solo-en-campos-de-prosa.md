# El Dictado es un acelerador sobre campos de prosa, nunca un camino propio

El dictado por voz era uno de los requisitos de entrada del proyecto, y había que decidir hasta dónde llega. **Decidimos que sea un botón de micrófono sobre los campos de texto libre que ya existen** — diagnóstico, descripción del trabajo, observaciones al recibir — y nada más. Lo dictado entra como texto y se corrige a mano igual que lo escrito.

No hay comandos de voz para navegar ni para accionar, no se dictan montos ni placas, y **los campos dictables no cambian según la Especialidad**: un pintor escribe el código de color dentro de la descripción, como texto.

## Considered Options

- **Dictado en campos de prosa** (elegida): el campo funciona igual sin micrófono. La voz solo ahorra tecleo.
- **Dictado más comandos de navegación** ("nueva orden", "aprobar trabajo"): obliga a diseñar gramática de comandos, confirmaciones, y qué ocurre cuando el sistema entiende mal una acción destructiva. Es otro producto.
- **Dictar una Orden entera y repartirla en campos**: requiere interpretar lenguaje natural, no solo transcribir. [#17](https://github.com/FabianRG1990/repositorio-de-apps/issues/17) además encontró que la API corta a los 15 s de silencio y a los 8 s sin habla, así que las sesiones largas no son confiables ni siquiera para transcribir.
- **Campos propios por Especialidad** (código de color, código de falla): haría que la Línea de servicio tuviera forma distinta según su Especialidad, con más modelo y más pantallas, para un dato que cabe en la descripción.

## Consequences

- **El dictado no toca el modelo de datos.** Ninguna entidad ni campo existe por causa de la voz; si el micrófono desapareciera, el producto sigue completo. Esa es la propiedad que se quiso preservar.
- Sin conexión el micrófono se apaga con un aviso claro y el campo de texto sigue funcionando. No se empaca modelo de voz en cliente: [#17](https://github.com/FabianRG1990/repositorio-de-apps/issues/17) verificó que no existe dictado offline en español latino en ningún navegador, y que la alternativa (Vosk, 34,5 MB) no se justifica para un acelerador opcional.
- El dictado solo va a funcionar en Chrome y Edge de escritorio, con internet y HTTPS, en `es-MX` — `es-CR` revienta en Safari. La demo corre exactamente en ese escenario, pero **un taller que abra Bitácora en un celular Android no va a tener dictado continuo** (crbug 41297427, abierto desde 2017). Es una limitación de la plataforma, no del producto, y por eso el campo de texto nunca deja de ser el camino principal.
- Si algún día el código de color o el código de falla necesitan ser dato consultable y no prosa, eso es una decisión sobre la Línea de servicio, no sobre el dictado.
