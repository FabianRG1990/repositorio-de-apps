# La apariencia es del Taller, la fija el Dueño y no hay muro

Los tres ajustes de apariencia —piel, tamaño y color de marca— salieron de la barra de pruebas del prototipo y viven en Ajustes › Apariencia. **Decidimos que los tres son configuración del Taller, una sola para todos los aparatos**, que los cambia el Dueño, y que quien no es Dueño **ve exactamente lo mismo sin controles**, sin aviso de permiso y sin nada que bloquee.

Decidido con el usuario el 2026-08-21, sobre el ticket [#80](https://github.com/FabianRG1990/repositorio-de-apps/issues/80).

## Del Taller, no del aparato

La alternativa era que cada dispositivo recordara lo suyo: la tableta que sale al patio en modo taller y con filas grandes, el monitor de recepción en oficina y compacto. Se descartó a favor de **una sola configuración**: el Taller se ve igual en todas partes y hay un único sitio donde cambiarlo.

**El costo, dicho claro:** un Taller con la tableta al sol y la recepción bajo techo tiene que elegir. Si esa tensión aparece en uso real, la salida no es partir el ajuste en dos sino permitir que un aparato se aparte de la configuración del Taller — y eso es un ticket nuevo, no un parche.

## El permiso: gana el ADR 0005

El ticket proponía copiar el patrón de la referencia, que deshabilita la sección para quien no es administrador y avisa que solo él puede cambiarla. **No se copió.** El [ADR 0005](./0005-perfil-sin-permisos.md) decidió que el Perfil determina **qué se ofrece hacer**, no qué está permitido, y que no hay login: un muro sobre un selector de Perfil no es seguridad, es teatro.

Así que el Asesor y el Técnico ven la piel, el tamaño y el color que tiene su Taller —dato útil— y no ven controles. **Tampoco ven un aviso de "no tenés permiso"**, que sería la misma frase del muro sin el muro. Al pie dice quién lo configura, que es información y no negativa.

Como el selector de Perfil todavía no existe ([#90](https://github.com/FabianRG1990/repositorio-de-apps/issues/90)), la regla vive en un `PerfilStore` mínimo que arranca en Dueño, y está cubierta por prueba en los dos estados.

## Una sola perilla de tamaño, con tres pasos medidos

#18 pedía un escalar de "modo taller" (100 %/125 %) y la referencia tiene tamaño de fuente en tres pasos. **Son la misma perilla con dos nombres**, y quedó una sola: **Compacta · Normal · Guantes**, con el destinatario escrito al lado en vez de un porcentaje.

Mueve el `font-size` de la raíz y el relleno de la fila a la vez, porque el alto no es proporcional al texto: 96 px con letra de 18 px es una fila cómoda; con letra de 24 px sería una fila vacía. Todo lo demás está en `rem`, que es lo que permite que el zoom al 200 % de SC 1.4.4 siga funcionando **encima** de este ajuste.

Los tres pasos son la escalera 56 / 72 / 96 px de #18 §6.5. **Medidos en el navegador: 55,6 · 72,0 · 95,6 px** — el relleno se calibró contra la medición, no se estimó.

## "Sistema" no es una opción, pero el sistema sí se escucha una vez

La referencia ofrece Claro / Oscuro / **Sistema**, y `Sistema` significa `prefers-color-scheme`. **Acá no se ofrece**, por dos razones:

1. **Escucharía la señal equivocada.** `prefers-color-scheme` expresa gusto de tema claro u oscuro. El modo taller no es un gusto: es alto contraste para el sol. La preferencia que significa lo mismo que este ajuste es **`prefers-contrast: more`** — _"the user has notified the system that they prefer an interface that has a higher level of contrast"_ ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)), disponible en todos los navegadores desde mayo de 2022.
2. **Ni una ni otra saben dónde está el aparato.** Ningún sistema operativo sabe que el Asesor acaba de salir al patio. Una opción "Sistema" prometería un automatismo que no puede cumplir.

Lo que sí se hace: **la primera vez, cuando no hay nada elegido, se mira `prefers-contrast: more`**. Si el dispositivo pide más contraste, se arranca en modo taller. En cuanto alguien elige, manda lo elegido y no se vuelve a preguntar. Es un valor inicial informado, no una tercera opción.

## El color de marca no puede romper el contraste

Del color que elige el Taller se toman **el matiz y, acotado, el croma**; **la luminancia la pone la piel**. Es el mecanismo que el prototipo de #70 dejó probado, y no es una promesa sino una consecuencia de trabajar en OKLCH, que es perceptualmente uniforme en L: el contraste depende de la luminancia, y esa no se negocia.

Cuando el matiz pedido no existe en sRGB con esa luminancia —los azules saturados son el caso típico— **se baja el croma hasta que entra**. Desaturar mantiene la luminancia; dejar que el navegador recorte los canales la **mueve**, y con ella el contraste.

De esos dos acentos se deriva todo lo demás con `color-mix`: la selección de fila, el activo del menú, la pestaña abierta, el anillo de foco. Cambiar la marca mueve la app entera y no solo un borde.

**Verificado con siete colores de marca —incluidos amarillo puro, blanco y negro— en las dos pieles: 14 de 14 cumplen el mínimo de su piel** (4,5:1 en oficina, 7:1 en taller). El rango medido es estrecho —11,45 a 11,82:1 en oficina— y esa estrechez _es_ la prueba: cambia el matiz, no la claridad.

## Consequences

- **Los tres ajustes se guardan hoy en el dispositivo**, porque el esquema de [#74](https://github.com/FabianRG1990/repositorio-de-apps/issues/74) no existe todavía. La forma de la API del store es la que ese ticket tiene que conservar al mover el respaldo, igual que se hizo con `OrdenesStore`. Mientras no haya backend, "del Taller" y "del dispositivo" coinciden de hecho; cuando lo haya, la diferencia se vuelve real y el respaldo tiene que mudarse.
- **El conmutador de pieles del prototipo se borró**, que era su plan desde el primer día: esto lo reemplaza.
- **Un componente nuevo que use acento hereda la garantía gratis** si lo deriva de `--app-accent` o `--app-accent-strong`. Si escribe un color de acento propio, se queda fuera del mecanismo y el color de marca dejará de moverlo — es el mismo criterio de revisión del [ADR 0012](./0012-dos-pieles-por-tokens-de-color-y-de-efecto.md).
- **La densidad no usa la escala de Angular Material.** La de Material se calcula en SCSS y solo va hacia lo compacto (`clamp-density` topa en 0), así que no puede dar el paso "Guantes". La perilla vive en tokens propios; si algún componente de Material se ve fuera de escala, se le apunta su token, como con el color.
