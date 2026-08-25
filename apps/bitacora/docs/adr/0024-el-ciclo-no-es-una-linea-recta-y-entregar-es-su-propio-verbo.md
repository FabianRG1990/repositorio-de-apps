# El ciclo no es una línea recta y entregar es su propio verbo

La máquina de estados de la Orden quedó quieta tres tickets. Lo que la destrabó no fue que hiciera falta por sí misma, sino que **ya bloqueaba dos decisiones tomadas hace meses**: el Aviso de listo ([ADR 0009](./0009-aviso-de-listo-con-constancia.md)) y la Próxima visita ([ADR 0011](./0011-proxima-visita-la-pone-el-asesor.md)), que se escribe **al cerrar la Orden** — y cerrar una Orden no existía. Sale de [#116](https://github.com/FabianRG1990/repositorio-de-apps/issues/116).

**Decidimos que el estado se mueva en cualquier dirección, que entregar tenga su propio verbo, y que avisar y terminar sean dos hechos separados.**

## El estado no lleva orden forzado

Los cinco estados dentro del Taller se ofrecen en el orden en que suelen ocurrir, pero eso es **para presentarlos, no para imponerlos**. Un carro vuelve de "listo" a "en proceso" cuando algo sale mal en la prueba de ruta, y de "esperando repuesto" a "en proceso" cuando llega la pieza. Una máquina rígida pelearía con el taller en vez de describirlo, y el taller siempre gana esa pelea: lo que pasa es que la gente deja de tocar el estado.

## Entregar no es un estado más

`entregado` no se alcanza moviendo el estado. Saca el carro del Taller y fija la fecha de entrega, así que lleva su propio verbo. Llegar ahí por el camino de los demás fijaría el estado sin la fecha, y una Orden entregada sin fecha de entrega no significa nada.

Volver a meter al Taller un carro ya entregado **limpia la fecha**: si se quedara, la Orden diría a la vez que salió y que sigue adentro.

## Avisar no mueve el estado

Son dos hechos distintos —el trabajo terminó, y se le avisó al Cliente— y juntarlos haría imposible registrar el segundo cuando el primero ya se había marcado antes, que es el caso normal: primero se termina, después alguien llama.

Como con la Autorización, avisar de nuevo **retira el aviso anterior** en vez de apilarlo. La pregunta que la Orden contesta es "¿se avisó, y cuándo?", en singular. El borrado es lógico: el historial sigue ahí.

## Deshacer la entrega, y la pestaña que hizo falta

Entregar es un clic que cambia el mundo y un dedo torpe sobre una tableta no puede costar eso. Deshacer devuelve el carro a `listo` y **no borra la Próxima visita**: esa la escribió una persona pensando en el carro, no en el estado de la Orden.

Al construirlo apareció que la Orden entregada **desaparecía de todas las pantallas**, así que deshacer solo se podía mientras la ventana siguiera abierta — y el arrepentimiento casi nunca llega antes de cerrarla. De ahí la pestaña **Entregado** en Órdenes: no es una función nueva, es la puerta de vuelta que faltaba.

## El Vehículo sin recoger va aparte de lo que espera repuesto

El ADR 0009 pedía marcarlo y dio la razón: el tablero ordena por Tiempo parado, pero un carro que lleva días esperando un repuesto y otro que lleva días listo sin que lo recojan son problemas distintos — el primero es del Taller, el segundo es del Cliente — y son dos llamadas distintas.

La insignia **comparte el color con `riesgo` y no la forma**: rombo para el repuesto que no llega, cuadrado para el carro que nadie recoge. El color no puede ser lo único que los separe (ANSI/HFES 100-2007 §7.2.5.3), y bajo el sol del patio la figura aguanta más que el tono.

Se exige que la Orden esté `listo`, y no solo que exista Aviso: un carro avisado que volvió a proceso conserva su Aviso, y sin esa condición el tablero lo daría por abandonado mientras el Taller le está metiendo mano.

**El umbral se configura**, como el ADR 0009 dejó dicho: sin talleres reales observados cualquier número es una suposición, y una suposición enterrada en el código no se corrige con lo que enseñe el uso. Al lado del número va escrito lo que va a pasar con él; un "3" suelto en una casilla no dice qué hace.

## Próximas visitas se lee en tres montones

El ADR 0011 la pidió "ordenada por fecha". Ordenada por fecha y plana obliga a leerla entera para contestar lo primero que uno va a preguntarle: **a quién hay que llamar hoy**. Se parte en tres —ya pasó la fecha, en los próximos siete días, más adelante— y los montones vacíos no salen: un "Ya pasó la fecha" con nada debajo se lee como que algo falló, no como que el Taller va al día.

Cada visita trae a la vista **lo que quedó declinado**. Es lo que el mismo ADR llama los dos caminos hacia la misma conversación de venta; llamar sin eso a mano es llamar sin saber qué proponer.

## Considered Options

- **Ciclo libre con verbos propios para entregar y avisar** (elegida).
- **Máquina estricta con transiciones permitidas**: más fácil de razonar y más fácil de romper contra la realidad del taller. El coste no es un error visible: es que la gente deje de mover el estado y el tablero mienta.
- **Entregar como un estado más**: un radio menos y una fecha que se olvida de fijar.
- **Avisar mueve el estado a listo**: ahorra un clic el día que coinciden y hace imposible registrar el aviso cuando no.

## Consequences

- **La fecha se enseña con el mes en letras.** El `<input type="date">` guarda ISO pero se **presenta** en el formato del aparato: una tableta en inglés pone `mm/dd` donde en Costa Rica se lee `dd/mm`, y un 01/12 leído al revés es un carro que vuelve once meses tarde. Se repite debajo del campo y en todas las vistas.
- **Las pruebas corren en el huso de Costa Rica.** El error de zona horaria que `fechaLarga` evita solo se manifiesta al oeste de Greenwich: en un CI en UTC la prueba que lo vigila pasaría con el bug puesto.
- **La semilla lleva fechas relativas.** Se instala el día que alguien abre la app, así que una fecha escrita a mano queda vencida sola y la pantalla acabaría enseñando siempre lo mismo.
- **`reuseExistingServer` puede mentir.** Un `serve-static` vivo de una corrida anterior sirve el bundle viejo, y una prueba mutada pasa igual. Verificar que una prueba muerde exige matar el servidor primero.
- **Falta el enlace de la lista a la Orden.** Desde Próximas visitas se puede escribir, pero no abrir la Orden: para ver qué se hizo hay que ir a Órdenes. Es un ticket aparte.
- **El Aviso de listo, la Autorización y ahora la constancia de entrega comparten forma** — un hecho con fecha, persona y medio. El ADR 0009 avisó que si aparecía un tercer caso convenía mirarlos juntos antes de repetir la estructura. Ya son tres.
