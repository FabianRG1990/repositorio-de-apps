# El Perfil se elige al entrar y se cambia desde el pie del menú

El [ADR 0005](./0005-perfil-sin-permisos.md) decidió que a Bitácora se entra **eligiendo un Perfil** y que el Perfil determina **qué pantalla se abre y qué se ofrece hacer**, no qué está permitido. Faltaba decidir dónde vive esa elección y qué pasa al cambiarla.

**Decidimos que el Perfil se elija en una pantalla de entrada la primera vez y se cambie después desde el pie del menú, y que cambiarlo NO navegue.** Sale del ticket [#90](https://github.com/FabianRG1990/repositorio-de-apps/issues/90).

## Dos sitios, porque el ADR promete dos cosas distintas

- _"Se entra eligiendo un Perfil de una lista"_ → una **pantalla de entrada**, que aparece mientras nadie haya elegido en ese aparato.
- _"Cambiar de Perfil en vivo es gratis y no pierde estado"_ → un **conmutador siempre a mano**, al pie del menú lateral. Si hubiera que ir a buscarlo a Ajustes dejaría de ser una herramienta de venta y pasaría a ser un trámite, que es exactamente lo que el ADR 0005 quería evitar.

Con un solo sitio, una de las dos frases se queda sin cumplir.

## Cambiar de Perfil no navega

Es la consecuencia directa de _"no pierde estado"_: llevarse al usuario a otra pantalla **es** perder el estado. El destino de entrada se usa al **entrar**, que es lo que dice la otra mitad de la frase — "determina qué pantalla se abre".

Comprobado de punta a punta: al cambiar de Perfil no solo se conserva la URL, se conserva hasta la pestaña abierta dentro de la pantalla.

## No hay guarda de ruta, y es a propósito

La comprobación de "¿ya eligió?" vive en el constructor del `Shell`, que se construye **una sola vez**, cuando el router ya resolvió la primera ruta. Corre exactamente al entrar y nunca más.

Una guarda intercepta **cada** navegación, y eso es lo que el ADR 0005 descarta: acá nada está prohibido. `/entrar` se abre siempre, y el resto también.

## Ofrecer no es permitir, y tiene que ser comprobable

Cada Perfil ve en el menú lo que usa, en su orden. Nada desaparece del sistema: **`/ajustes` se abre entera escribiendo la URL** aunque el Técnico no la tenga en su menú, sin redirección y sin pantalla de "no tenés permiso" — que sería la frase del muro sin el muro, el mismo criterio que fijó el [ADR 0013](./0013-la-apariencia-es-del-taller-y-la-fija-el-dueno.md).

Hay una prueba dedicada a eso. Si algún día alguien mete una guarda, se pone roja.

| Perfil  | Entra por | Se le ofrece en el menú                       |
| ------- | --------- | --------------------------------------------- |
| Asesor  | Tablero   | Tablero, Recepción, Órdenes, Próximas visitas |
| Técnico | Órdenes   | Órdenes, Tablero                              |
| Dueño   | Ajustes   | Tablero, Órdenes, Ajustes                     |

Los tres destinos de entrada tienen contenido hoy. Recepción y Próximas visitas siguen siendo un párrafo, y mandar ahí al Asesor sería abrir la demo en una pantalla vacía; cuando existan, `OFRECIDO` es el único sitio que hay que tocar.

## La pantalla abierta nunca desaparece del menú

Si la pantalla en la que estás no está en la lista de tu Perfil, **se añade al final** en vez de esconderse. Cambiar a Técnico estando en Ajustes no puede dejar al usuario en una pantalla que el menú ya no reconoce, sin rastro de dónde está ni cómo volver. Es la misma regla de fondo: ofrecer, no prohibir.

## Que no parezca lo que no es

El ADR 0005 dice que esto **no** es autenticación, así que el vocabulario lo sostiene: no dice "iniciar sesión" ni "entrar como", no pide nada que haya que saberse, y no hay un solo campo donde escribir. Lo que pregunta es quién tiene el aparato en la mano, y lo dice en la propia pantalla: cambia lo que la app te pone delante, no lo que podés hacer.

Hay una prueba que falla si aparecen las palabras "sesión", "contraseña", "usuario", "ingresar" o "login", o si aparece un campo de texto.

## Consequences

- **El Perfil arranca en `null`, no en Dueño.** Con un valor por defecto no hay forma de distinguir "todavía no eligió" de "eligió Dueño", y la pantalla de entrada no sabría si le toca aparecer. `configuraElTaller` es falso mientras nadie haya elegido.
- **Es del APARATO, no del Taller**, así que se guarda en el almacenamiento local. Es el corte contrario al de la apariencia (ADR 0013): esa es del Taller e igual para todos; el Perfil dice quién tiene la tableta en la mano ahora mismo.
- **El catálogo de destinos y el reparto viven separados**: el catálogo —icono y nombre de cada pantalla— en el menú lateral, y qué subconjunto ve cada Perfil en el store, que es donde está la decisión del ADR 0005.
- **El menú del Perfil se estila desde la hoja global.** Un `mat-menu` se renderiza en un overlay al final del `<body>`, fuera del árbol del componente, así que el CSS encapsulado no lo alcanza; `panelClass` más hoja global es el mecanismo que Material documenta. Es la primera excepción al corte del [ADR 0012](./0012-dos-pieles-por-tokens-de-color-y-de-efecto.md), y es de sitio, no de contenido: esas reglas siguen sin nombrar un solo color.
- **Las pruebas de punta a punta arrancan con el Perfil sembrado.** Entrar dejó de caer directo en el Tablero, así que las que no ejercen esta pantalla declaran el Perfil de partida.
- Medido sobre el render: contraste 5 de 5 puntos de texto en cada piel (≥ 5,75:1 en oficina, ≥ 8,16:1 en taller), tarjetas de 177 × 288 px, pie de menú de 80 px, item del desplegable de 48 px, y anillo de foco de 2 px con 2 px de hueco por teclado.
