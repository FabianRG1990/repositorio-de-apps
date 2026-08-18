# Placa vs VIN como identificador de vehículo en Costa Rica (Bitácora)

> Investigación del ticket [#35](https://github.com/FabianRG1990/repositorio-de-apps/issues/35) del mapa [#14](https://github.com/FabianRG1990/repositorio-de-apps/issues/14).
> Verifica o refuta la propuesta de la investigación [#15](https://github.com/FabianRG1990/repositorio-de-apps/issues/15) (_"placa como llave en CR y VIN como índice, no llave"_) antes de fijarla en el modelo de datos del ticket [#21](https://github.com/FabianRG1990/repositorio-de-apps/issues/21).
> Fecha: 2026-08-18. No hereda nada de `apps/bahia`.

---

## 1. Pregunta

¿Cuál es, en la práctica costarricense, el identificador con el que un taller reconoce un vehículo — la placa o el VIN — y qué implica eso para el modelo de datos?

Sub-preguntas: formato y estabilidad de la placa en Costa Rica; disponibilidad real del VIN para un taller tico; qué pasa cuando un vehículo cambia de dueño y el historial debería seguir al carro; cómo lo resuelven los sistemas internacionales que asumen VIN; y si existe alguna fuente pública consultable por placa que un sistema pudiera aprovechar.

---

## 2. Resumen ejecutivo

1. **La propuesta de #15 se confirma en la dirección, pero se refuta en la letra.** El instinto era correcto: en Costa Rica el identificador operativo es la **placa**, y el VIN no está a mano. Pero la formulación _"placa como llave"_ es insegura, y por una razón que no estaba sobre la mesa: **desde el 28 de octubre de 2024 el dueño de un vehículo particular puede cambiar su matrícula cuantas veces quiera** (Decreto 44649-MJP, art. 147). La placa es estable frente al **cambio de dueño** y mutable frente a la **voluntad del dueño**. Ninguna de las dos cosas se sabía al escribir #15.

2. **Buena noticia para el foso del producto: el traspaso NO cambia la placa.** La matrícula está atada al bien, no al titular (Decreto 44649-MJP, arts. 127 y 139: la elección de matrícula _"no procederá su traslado a otro vehículo automotor… por encontrarse asociada directamente a un bien en específico"_), y el Registro Nacional lleva **dos índices independientes**, uno por placa y otro por propietario (Ley 9078, art. 17). Vendés el carro y la placa se va con el carro. El historial acumulado sobrevive al cambio de dueño sin trabajo extra.

3. **Mala noticia: la placa no es inmutable.** El cambio de matrícula es un trámite voluntario, de pago y **repetible sin límite** en automóviles particulares, que además exige depositar la placa anterior. Una llave primaria construida sobre la placa se rompe el día que un cliente decide ponerle una matrícula personalizada a su carro — y ese día el historial se parte en dos vehículos.

4. **El VIN no está a mano en el mostrador tico, y lo confirma el único proceso oficial que se pudo leer entero: la RTV.** DEKRA agenda la inspección con _"Número de placa / DUA"_ y el único documento que se pide es la licencia de conducir. El VIN no aparece en el flujo operativo. Coherentemente, los dos productos de software de taller construidos **para Costa Rica** que se pudieron inspeccionar buscan por placa y ninguno menciona VIN ni chasis.

5. **El VIN, además, decodifica mal en Costa Rica.** La API pública de la NHTSA (vPIC) es gratis y sin API key, pero la propia NHTSA declara que solo tiene datos de fabricantes que se registraron _"with the intention of having them be sold, used and or registered within the United States"_. En pruebas en vivo: un Toyota Hilux fabricado en Tailandia devuelve **nada**; un chasis JDM corto devuelve **nada**; VW y Renault de mercado europeo devuelven **la marca sin el modelo**. Y el dígito verificador de la posición 9 solo es obligatorio bajo norma estadounidense, así que **no sirve como validación de VIN en CR**.

6. **Ningún sistema serio del sector usa VIN ni placa como llave primaria.** Shopmonkey (`id: string`) y Tekmetric (`id: int`) coinciden. En Shopmonkey **todos** los identificadores externos son nulables a la vez: `vin`, `hin`, `licensePlate`, `serial`. Un vehículo puede existir sin ningún identificador legal.

7. **Y hay un estándar del sector que dice algo más fuerte todavía:** ACES/VCdb, el estándar de la Auto Care Association, **no identifica ejemplares, identifica configuraciones**. El mapeo usa las **posiciones 1-10 del VIN** — precisamente las que codifican el modelo, no la unidad. El VIN es una **clave de decodificación hacia un catálogo**, no una identidad de registro. Eso es exactamente el rol que el "bastidor" cumple en el software español (TallerMatic: _"si introduces el número de bastidor el programa rellena automáticamente marca, modelo y tipo de motor"_).

8. **La solución al cambio de dueño ya está resuelta y documentada, por Mitchell 1:** el historial es **dual según el eje de consulta**. Buscá por cliente y ves solo sus facturas; buscá por vehículo (placa o VIN) y ves _"posted invoices for both prior and current owners… all seen together on the History screen"_, con las facturas conservando inmutable el nombre del cliente original. Historial técnico al carro, historial contable al cliente.

9. **No hay ninguna fuente pública consultable por placa que sirva para un backend.** Se verificaron seis: el Registro Nacional exige login y **hoy ni siquiera permite auto-registro**, además de bloquear IPs de datacenter; COSEVI está detrás de captcha comercial (PerfDrive/ShieldSquare) y su dominio real es `csv.go.cr`, no `cosevi.go.cr` (NXDOMAIN); Hacienda devuelve 400 anti-bot; `datosabiertos.go.cr` responde 522; y el marchamo del INS es una SPA sin API documentada. **El MVP no puede asumir enriquecimiento automático por placa.**

10. **Veredicto: ni placa ni VIN son la llave. La llave es un `id` sintético.** La placa es el **identificador operativo obligatorio** (lo que se teclea, lo que se busca, lo que el cliente dice por teléfono) y el VIN es un **atributo opcional de decodificación**. La corrección real a #15 no es cambiar de campo, es **añadir la dimensión temporal**: la placa necesita historial, porque cambia.

---

## 3. Convención de confianza de las fuentes

| Etiqueta          | Significado                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `[LEY]`           | Texto normativo leído íntegro desde el PDF oficial de _La Gaceta_ o desde GovInfo (CFR). |
| `[OFICIAL]`       | Sitio o comunicado de la institución que es autoridad sobre el hecho.                    |
| `[DOCS/API]`      | Documentación de esquema o API publicada por el fabricante del software.                 |
| `[SOPORTE]`       | Base de conocimiento oficial del producto.                                               |
| `[MARKETING]`     | Página comercial. Describe intención de producto, no necesariamente implementación.      |
| `[TERCEROS]`      | Fuente no oficial (cliente de API construido por la comunidad, blog).                    |
| `[NO CONFIRMADO]` | No se pudo verificar. **No usar como base de decisión.**                                 |

Toda la investigación se hizo el 2026-08-18 con el presupuesto de búsqueda web agotado a mitad de camino, lo que forzó ir a los PDF normativos directamente. El efecto colateral fue positivo para el rigor (§4 se apoya en la ley, no en resúmenes) y negativo para la cobertura de campo (§8.3 quedó flaca). Está marcado dónde.

---

## 4. La placa en Costa Rica

### 4.1 Es un documento público que emite el Registro Nacional, y solo él

Ley 9078 (Ley de Tránsito), art. 2, definición 77 — `[LEY]`:

> **"Placa de matrícula**: documento público expedido por el **Registro Nacional**, que identifica externamente un vehículo."

Art. 7 de la misma ley:

> "La propiedad de los vehículos se comprueba mediante su inscripción en el Registro Nacional. **El Registro otorgará al propietario el correspondiente título de propiedad, las placas de matrícula y el dispositivo de identificación**, en el momento de su inscripción o su reposición."

— <https://www.imprentanacional.go.cr/pub/2012/10/26/ALCA165_26_10_2012.pdf> (_La Gaceta_ N.º 207, Alcance Digital N.º 165, 26 de octubre de 2012)

**Los demás actores solo consumen el dato.** Es un punto importante porque se suele atribuir la placa a "RITEVE" o al MOPT:

| Actor                                  | Papel real sobre la placa                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Registro Nacional / Bienes Muebles** | **Asigna, emite y regula.** Crea los códigos de clase (Decreto 44649-MJP, art. 128) y puede _"diseñar y ordenar el cambio de todas las placas que circulen en el país"_ (Ley 9078, art. 20).            |
| **MOPT**                               | Solo fija _"la cantidad de placas que deberá llevar cada tipo de vehículo y el sitio visible en donde deberán ser colocadas"_ (Ley 9078, art. 4.d). **No asigna matrículas.**                           |
| **COSEVI**                             | **Retiene y devuelve** placas en inmovilizaciones (Ley 9078, arts. 151-152). No emite.                                                                                                                  |
| **RTV (hoy DEKRA)**                    | **Consume el dato.** Su transmisión electrónica es requisito para inscribir, cambiar características y reinscribir (Decreto 44649-MJP, arts. 114.c, 115.b, 117.d). **Cero competencia sobre la placa.** |
| **INS**                                | Consumidor **aguas abajo y manual**: tras un cambio de matrícula _"el usuario debe apersonarse al INS a informar sobre el cambio… y actualizar así los datos del bien"_.                                |

Sobre la RTV: el operador actual es **DEKRA**, confirmado desde su propio sitio con red nacional de 13 estaciones fijas y 3 móviles (<https://www.dekra.cr/es/inspeccion-vehicular/>). El dominio histórico `riteve.co.cr` devuelve 404 y `rtv.co.cr` **redirige hoy a un blog comercial de terceros**, lo cual es en sí un aviso: la gente que busca "la fuente oficial de RTV" aterriza en un intermediario. La **fecha exacta** del cambio de operador quedó `[NO CONFIRMADO]`.

Nota terminológica: la ley lo llama **IVE** (_"inspección técnica vehicular"_, Ley 9078 art. 2 def. 57), DEKRA lo rotula **ITV** y el público dice **RTV**. Son lo mismo.

### 4.2 Formato: la ley delega, y hoy conviven dos formatos

La ley **no fija** el patrón. Ley 9078, art. 20 — `[LEY]`:

> "Las placas tendrán una identificación diferente para cada vehículo y **podrán tener una combinación de números y letras**. El Registro Nacional regulará lo concerniente a las condiciones de mantenimiento y autenticidad que deberán tener las placas."

El Reglamento del Registro de Bienes Muebles (Decreto Ejecutivo 44649-MJP), art. 129, repite la delegación: _"queda autorizado el Registro de Bienes Muebles, para el uso combinado de números y letras"_. — <https://www.imprentanacional.go.cr/pub/2024/09/25/ALCA164_25_09_2024.pdf> (_La Gaceta_ N.º 178, Alcance N.º 164, 25 de setiembre de 2024)

**Consecuencia práctica para el modelo de datos: en Costa Rica coexisten placas puramente numéricas (el formato histórico de particulares) y placas alfanuméricas.** El propio Registro Nacional publica un trámite llamado literalmente _"Procedimiento de Cambio de Matrícula Numérica a Alfanumérica"_ — <https://www.rnpdigital.com/placas/Procedimiento%20de%20Cambio%20de%20Matricula%20Numerica%20a%20Alfanumerica.pdf>

Del comunicado oficial del Registro Nacional `[OFICIAL]` (<https://www.rnpdigital.com/direccion_servicios/Documentos/Cambios%20en%20la%20Asignacion%20de%20Matriculas%20de%20Automoviles%20Particulares.pdf>):

- El nuevo reglamento se publicó el **25 de setiembre de 2024**; el servicio arrancó el **28 de octubre de 2024 al mediodía**.
- Las nuevas matrículas **pueden incluir vocales**, antes limitadas a consonantes.
- **La letra "Ñ" es la única que no se puede elegir**, _"por limitaciones técnicas en el troquelado de las placas metálicas"_.

> ⚠️ **El patrón exacto de caracteres (`AAA123` o similar) y las series concretas quedaron `[NO CONFIRMADO]`.** Ni la Ley 9078 ni el Decreto 44649-MJP lo fijan; ambos remiten a lo que _"administrativamente disponga la Dirección de Bienes Muebles"_ (art. 131). Vive en directrices internas del Registro que no están publicadas. **Implicación directa de diseño: no se puede escribir una validación de formato de placa costarricense con base normativa citable. Cualquier regexp sería una invención.**

### 4.3 Tipos de placa: la existencia de códigos de clase está confirmada; el catálogo, no

Decreto 44649-MJP, art. 128 — `[LEY]`:

> "El Registro asignará la matrícula de los vehículos automotores **conforme a su clase o uso, sea éste oficial, particular o diplomático**, y los identificará con **un código específico**, encontrándose autorizado para crear los códigos de matrícula que sean necesarios."

Lo que **sí** está confirmado desde la ley:

- Existen **prefijos reservados que actúan como código de clase**, y las matrículas particulares no pueden colisionar con ellos (arts. 131 y 144.d).
- **Placas especiales** (Ley 9078, art. 22): vehículos oficiales de los supremos poderes, misiones internacionales acreditadas (cuerpo diplomático) y vehículos con régimen especial de circulación. Cruz Roja y Bomberos tienen distintivos propios que **no** eximen de portar la placa reglamentaria.
- **Taxi: régimen aparte y numeración reutilizable.** Art. 127: _"**No se repetirán números de matrículas ya adjudicadas, salvo en las concesiones de transporte público de personas, modalidad taxi**."_ La placa de taxi va ligada a la **concesión**, no al vehículo — es el único caso confirmado en que un mismo número puede corresponder a dos carros distintos a lo largo del tiempo.
- **Transporte público queda excluido de la elección de matrícula** (art. 132), y sus placas dependen del contrato de concesión y de la autorización del CTP (art. 114.e).
- **Clases registrales nombradas literalmente** en el art. 126: Equipo Especial Genérico, Equipo Especial Agrícola, Equipo Especial de Obras Civiles, Remolque genérico, Remolque Liviano, Semirremolque.
- **Los remolques de menos de 750 kg no llevan placa**, sino _"plaqueta de pesos y dimensiones"_ (Ley 9078, art. 2 def. 92).

> ⚠️ `[NO CONFIRMADO]`: **ningún prefijo concreto** (`C`, `MOT`, `AP`, `TSJ`, `AB`, `EE`, `CD`, `VE`…) pudo verificarse contra fuente primaria. Son de uso corriente y probablemente correctos, pero el catálogo vive en directrices internas. Tampoco se confirmó el régimen de placas provisionales ni una serie específica para vehículos eléctricos.

### 4.4 Estabilidad ante el traspaso: **la placa NO cambia al vender el vehículo**

Esta era la pregunta clave del ticket. La respuesta es **no**, y se apoya en evidencia normativa convergente:

1. **La matrícula está atada al bien, no al titular.** Decreto 44649-MJP, art. 139 — `[LEY]`:

   > "La solicitud de elección es personal e intransferible, de manera que **no procederá su traslado a otro vehículo automotor**. La persona usuaria no podrá disponerla, cederla o enajenarla, **por encontrarse asociada directamente a un bien en específico**."

2. **El Registro lleva dos índices independientes.** Ley 9078, art. 17: _"El Registro Nacional llevará **un índice por el número de placas** y **otro índice por los nombres de los propietarios**."_ Cambiar de propietario no toca el índice de placa.

3. **El traspaso es un acto registral distinto de la matriculación.** El art. 113 enumera los actos inscribibles (_"a) Inscripciones por primera vez. b) **Traspasos**. c) Cambios de características. d) Desinscripciones. e) Reinscripciones…"_) y **ni el art. 113 ni ningún artículo del Título V (Matrícula, arts. 127-149) vincula el traspaso con una reasignación de matrícula**. Los únicos supuestos de cambio de matrícula son voluntarios.

4. **No se repiten matrículas ya adjudicadas** (art. 127), salvo taxi.

> **Honestidad metodológica:** no existe un artículo que diga con esas palabras "el traspaso conserva la placa". La conclusión es **inferencia por ausencia de disposición en contrario**, apoyada en los arts. 127, 139 y 17. Es una inferencia fuerte, pero es una inferencia.

### 4.5 …pero la placa **sí** cambia por voluntad del dueño, y sin límite

Éste es el hallazgo que corrige a #15. Decreto 44649-MJP, art. 147 — `[LEY]`:

> "La persona usuaria **podrá realizar el cambio de matrícula las veces que así requiera**… en aquellos vehículos automotores que consten inscritos con cualquier matrícula, sea numérica o alfanumérica, con el formato vigente, de acuerdo con su categoría."

Y el comunicado del Registro Nacional lo confirma como cambio deliberado de política: desde el 28 de octubre de 2024 se puede cambiar matrícula alfanumérica por otra alfanumérica **cuantas veces se quiera**, en automóviles particulares.

Casos confirmados en que la placa cambia o se pierde:

| Supuesto                                        | Efecto sobre la placa                                                                                               | Fuente                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Cambio voluntario** (particulares)            | Nueva matrícula, **sin límite de veces**. Exige reserva previa y **depósito de la placa anterior** más el adhesivo. | Decreto 44649-MJP, arts. 147-149 |
| **Cambio de numérica → alfanumérica**           | Obliga a elegir una **nueva** matrícula alfanumérica. **No conserva el número.**                                    | Art. 147, párr. 2                |
| **Desinscripción**                              | Exige _"el depósito de las placas metálicas"_. La matrícula se cancela.                                             | Art. 116                         |
| **Pérdida total**                               | Devolución de placas en 10 días hábiles tras la anotación de desinscripción.                                        | Ley 9078                         |
| **Retiro/inmovilización administrativa**        | Retención **temporal**; _"solamente serán devueltas por el Cosevi"_. No es cambio de matrícula.                     | Ley 9078, art. 151               |
| **Reinscripción**                               | La solicitud debe indicar _"la matrícula que tenía asignada"_ → indicio de que la recupera, pero `[NO CONFIRMADO]`. | Art. 117.a                       |
| **Cambio de clase/uso** (taxi→particular, etc.) | `[NO CONFIRMADO]`. Es lo esperable dados los arts. 128 y 147, pero **no hay artículo expreso**.                     | —                                |

---

## 5. El VIN en Costa Rica

### 5.1 Qué es un VIN, normativamente

Las normas ISO que definen el VIN son **de pago** y no se pudieron leer. Se confirmó su alcance vía la ANSI Webstore (distribuidor autorizado):

- **ISO 3779:2009** — _"Road vehicles — Vehicle identification number (VIN) — Content and structure"_, que _"specifies the content and structure of a vehicle identification number (VIN) in order to establish, on a world-wide basis, a uniform identification numbering system for road vehicles"_ — <https://webstore.ansi.org/standards/iso/iso37792009>
- **ISO 3780:2009** — _"World manufacturer identifier (WMI) code"_; el WMI _"constitutes the first section of the vehicle identification number (VIN) described in ISO 3779"_ — <https://webstore.ansi.org/standards/iso/iso37802009>
- **ISO 4030** — _"VIN — Location and attachment"_. Existe; contenido no leído.

Los detalles estructurales sí se confirmaron desde **49 CFR Part 565**, texto legal abierto, leído íntegro desde GovInfo — `[LEY]` (<https://www.govinfo.gov/content/pkg/CFR-2024-title49-vol6/xml/CFR-2024-title49-vol6-part565.xml>):

- **§ 565.13(b)**: _"Each VIN shall consist of seventeen (17) characters."_
- **§ 565.13(c)**: _"A check digit shall be part of each VIN. The check digit shall appear in position nine (9)…"_ — **obligatorio bajo norma estadounidense.**
- **§ 565.13(g)**: el conjunto permitido es `[ABCDEFGHJKLMNPRSTUVWXYZ]` más dígitos → **omite exactamente I, O y Q**.
- **Corrección a una creencia común:** la **U sí es válida** en el VIN. Solo está excluida de la **posición 10** (año-modelo), junto con I, O, Q, Z y 0. Lo corrobora el error 11 de vPIC: _"Position 10 does not match valid model year codes (I, O, Q, U, Z, 0)"_.
- **§ 565.13(f)**: el VIN de turismos y camiones ligeros _"shall be located inside the passenger compartment… readable, without moving any part of the vehicle, through the vehicle glazing… by an observer… adjacent to the left windshield pillar"_, con caracteres de **mínimo 4 mm**.

Esa última cita es la buena noticia de esta sección: **el VIN es legible por diseño desde fuera del parabrisas, sin abrir nada**, lo que hace viable una captura por OCR con la cámara del teléfono — **para vehículos que cumplen norma norteamericana**.

Que el dígito verificador **no** sea obligatorio en Europa solo se pudo sostener desde Wikipedia `[TERCEROS]` (_"compulsory for vehicles in North America and China, but not so in Europe"_ — <https://en.wikipedia.org/wiki/Vehicle_identification_number>), **pero está respaldado empíricamente** por las pruebas de §5.3.

### 5.2 ¿Está a mano el VIN en el mostrador tico?

**El único proceso oficial que se pudo leer completo dice que no lo necesita.** DEKRA Costa Rica, Preguntas Frecuentes — `[OFICIAL]` (<https://www.dekra.cr/es/preguntas-frecuentes/>):

> "¿Qué datos debo proporcionar para obtener mi cita de inspección o reinspección? — **Número de placa / DUA (para vehículos de inscripción)**, Tipo de vehículo…, Estación DEKRA…, Fecha y hora, Correo Electrónico, Número de teléfono"

> "Lo único que debe presentar a la hora de realizar su inspección es **la licencia de conducir**."

(DUA = Declaración Única Aduanera, para vehículos importados aún no inscritos.) Es decir: **el trámite obligatorio anual de todo vehículo costarricense se agenda y se ejecuta por placa, y el VIN no aparece.**

> ⚠️ Quedó `[NO CONFIRMADO]` si el **marchamo** del INS imprime el número de chasis/VIN — `marchamo.grupoins.com` es una SPA de la que no se obtiene contenido sin navegador. Tampoco se pudo verificar qué campos trae la **certificación registral** del Registro Nacional (todo detrás de login). Y el **manual de RTV de COSEVI**, que resolvería definitivamente si la inspección coteja el chasis, está tras captcha. **Estos tres son los pendientes de mayor valor de toda la investigación.**

### 5.3 El VIN decodifica mal en la flota costarricense

La API **vPIC** de la NHTSA es la opción obvia y es genuinamente buena en sus términos: **gratis, sin API key, sin registro y sin límite práctico** (_"there is no limit… we can easily handle between 1000 – 2000 transactions / minute"_), con ~99 % de acierto desde el año-modelo 1995 — <https://vpic.nhtsa.dot.gov/api/home/index/faq>

Pero la propia NHTSA declara el límite `[OFICIAL]`, en el mismo FAQ:

> **"Foreign Vehicle Information:** …there is information on vehicles within the dataset with regards to foreign vehicles **provided that the manufacturers registered with the intention of having them be sold, used and or registered within the United States. If they did not register with vPIC in this fashion through the 565 process then we would not have the data.**"

Pruebas ejecutadas en vivo contra `DecodeVinValues` el 2026-08-18:

| VIN probado         | Qué es                              | Resultado                                                         |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `1G4AH59H5G118341`  | EE. UU. (ejemplo del propio CFR)    | ✅ Buick Century 1986, USA                                        |
| `JTDBR32E060123456` | Toyota Japón, VIN 17 de exportación | ✅ Toyota Corolla 2006, JAPAN                                     |
| `WVWZZZ1KZ8W123456` | VW Golf, mercado europeo            | ⚠️ Marca + fabricante + año, **sin modelo**                       |
| `VF1BB05CF31234567` | Renault, mercado europeo            | ⚠️ Solo _"RENAULT GROUP"_. Error 8: _no detailed data_            |
| `MR0FZ22G001234567` | Toyota Hilux fabricado en Tailandia | ❌ **Nada.** Error 7: _manufacturer is not registered with NHTSA_ |
| `ZRE1429012345`     | Chasis JDM corto                    | ❌ **Nada.** Errores 6 (_incomplete VIN_) + 7                     |

Tres conclusiones operativas:

1. **"Japonés" ≠ "sin VIN".** Un Toyota fabricado en Japón **para exportación** lleva VIN de 17 y decodifica perfecto. El problema es específicamente el **JDM** (mercado interno japonés), que lleva un número de chasis corto tipo `ZRE142-9012345`. Que los JDM no lleven VIN de 17 quedó `[NO CONFIRMADO]` contra fuente oficial japonesa, pero es **consistente con el comportamiento observado**: la propia NHTSA lo clasifica como _"incomplete VIN"_.
2. **El Hilux tailandés es el caso que debería preocupar**, porque es un vehículo abundante y perfectamente normal en Centroamérica, con VIN de 17 caracteres válido, que vPIC no decodifica en absoluto.
3. **No se puede usar el dígito verificador como validación de VIN en Costa Rica.** Falla sistemáticamente en vehículos no norteamericanos aunque el VIN sea correcto.

> ⚠️ `[NO CONFIRMADO]`: la **composición real de la flota costarricense** por origen de importación. No se obtuvo ninguna estadística de Aduanas, PROCOMER ni COMEX. El argumento de §5.3 se sostiene sobre el comportamiento de la API, no sobre cuántos carros de cada tipo hay en el país. Es el hueco más incómodo del documento.

---

## 6. Cambio de dueño: el historial debe seguir al carro

Tres productos independientes documentan el mismo patrón: **el vehículo se reasigna, nunca se duplica.**

**Mitchell 1** es el que lo resuelve con más precisión — `[SOPORTE]` (<https://kb.mitchell1.com/articles/id-156/>):

> "The **Change Vehicle Ownership** dialog box allows you to easily **transfer a Vehicle from one customer to another**."
>
> "In future searches based on **customer**, the invoices as originally posted per customer will display."
>
> "**If search is on vehicle (license #, VIN), posted invoices for both prior and current owners will all be seen together on the History screen.**"
>
> "Invoices posted will retain the original customer's name; there is no effect on any outstanding balances they may have."

Es la respuesta exacta a la pregunta del ticket, y hay que subrayar la forma que tiene: **no es "el historial pertenece al carro" ni "pertenece al cliente", sino que el eje de consulta determina qué se ve.** Historial técnico indexado por vehículo, atraviesa dueños; historial contable inmutable por cliente. Nótese además que Mitchell 1 trata **`license #` y `VIN` como ejes de búsqueda equivalentes**.

**Workshop Software** hace lo mismo con un matiz más agresivo — `[SOPORTE]` (<https://workshopsoftware.com/knowledge-base/vehicles/transfer-vehicle-ownership/>): _"The vehicle and any invoices created for it **have now moved** and show against the details of the new owner"_, aunque _"the invoice history will show under the Customer Details of the old owner as well but **not the details of the actual vehicle**"_.

**Shopmonkey** — `[SOPORTE]` (<https://support.shopmonkey.io/hc/en-us/articles/38743934303252-Add-Vehicles>): _"navigate to the Vehicle List page, search for the vehicle, and **update the owner**"_.

> ⚠️ **Falso amigo que costó tiempo verificar:** el artículo de Shopmonkey _"Change of Ownership & Data Transfer"_ (<https://support.shopmonkey.io/hc/en-us/articles/38742927835924-Change-of-Ownership-Data-Transfer>) **no trata de vehículos** — trata del traspaso de la cuenta Shopmonkey cuando **el taller** cambia de dueño (formularios SS-4/147C, cuenta de merchant). No citarlo por error.

---

## 7. Cómo lo resuelven los sistemas internacionales

### 7.1 Nadie usa VIN ni placa como llave primaria

**Shopmonkey** — `[DOCS/API]` (<https://shopmonkey.dev/schema/Vehicle>). PK: `id: string`. Y el hallazgo estructural:

| Campo                 | Tipo   | Nulable     |
| --------------------- | ------ | ----------- |
| `id`                  | string | **No — PK** |
| `vin`                 | string | **Sí**      |
| `hin`                 | string | **Sí**      |
| `coalescedVINorHIN`   | string | **Sí**      |
| `licensePlate`        | string | **Sí**      |
| `licensePlateState`   | string | **Sí**      |
| `licensePlateCountry` | enum   | **Sí**      |
| `serial`              | string | **Sí**      |
| `ownerCount`          | int    | No          |

**Todos los identificadores externos son nulables simultáneamente.** Un vehículo de Shopmonkey puede existir con solo su `id` interno. Y `configurationStatus` (`Custom | Incomplete | Invalid | NotSupported | Valid`) hace del vehículo mal identificado un **estado de primera clase, no un error**.

`coalescedVINorHIN` es revelador: Shopmonkey **necesitó fabricar** un identificador natural unificado precisamente porque ninguno individual es obligatorio.

**Tekmetric** toma el camino opuesto en la relación, pero coincide en la llave — `[TERCEROS]`, cliente Go de la comunidad que mapea el JSON real (<https://github.com/beetlebugorg/tekmetric-mcp>, `pkg/tekmetric/vehicles.go`):

```go
type Vehicle struct {
    ID           int    `json:"id"`
    CustomerID   int    `json:"customerId"`
    ShopID       int    `json:"shopId"`
    VIN          string `json:"vin"`
    LicensePlate string `json:"licensePlate,omitempty"`
    // …
}
```

Tres diferencias de fondo: PK `int` en vez de UUID; **`customerId` escalar dentro del vehículo → relación 1:N, sin tabla puente**; y **`vin` sin `omitempty` mientras `licensePlate` sí lo lleva** — en Go eso significa que el VIN siempre se serializa y la placa se omite si está vacía. Es la jerarquía americana hecha código. Que Tekmetric permita crear un vehículo sin VIN quedó `[NO CONFIRMADO]`: su API pública solo documenta lectura y el esquema completo requiere aprobación manual.

### 7.2 Cliente ↔ vehículo: dos escuelas incompatibles

**Shopmonkey usa muchos-a-muchos** con una tabla de unión pura — `[DOCS/API]` (<https://shopmonkey.dev/schema/VehicleOwner>): `id`, `companyId`, `customerId`, `vehicleId`, `createdDate`, `updatedDate`, `metadata`. No hay `customerId` en `Vehicle`; la relación vive solo aquí.

**Y tiene un defecto que no hay que copiar:** `VehicleOwner` **no tiene `isPrimary`, ni `ownedFrom`/`ownedUntil`, ni flag de traspaso**. Es una asociación desnuda con timestamps. Consecuencia: Shopmonkey **no puede responder "¿quién era el dueño en marzo de 2024?"**, ni distinguir copropiedad simultánea de sucesión histórica.

**Tekmetric usa uno-a-muchos** (`customerId` escalar). Simple, un dueño, cambio = `UPDATE`, y se pierde por completo el historial de propiedad.

### 7.3 El estándar del sector no asume VIN como identidad

- ACES — _"the aftermarket industry data standard for the management and communication of **product fitment** data"_ (<https://www.autocare.org/aces/>)
- VCdb — _"a fully normalized, relational database of **vehicle configurations**"_ (<https://digital.autocare.org/vcdb/>)
- MOTOR — el kit de mapeo _"maps the **first 10 digits** of a vehicle's VIN (positions 1-10) to fields in the ACES Vehicle Configuration Database"_ (<https://www.motor.com/wp-content/uploads/2025/08/MOTOR_VIN_to_VCdb_US_ContentDevKit.pdf>)

**ACES/VCdb no identifica ejemplares, identifica configuraciones.** Y la dirección del mapeo lo dice todo: usa las **posiciones 1-10**, que son las que codifican el modelo — **no** las 11-17, que identifican la unidad física. El VIN se decodifica **hacia** el catálogo; el catálogo no está indexado por VIN.

Esto se refleja literalmente en el esquema de Shopmonkey, donde `vcdbId` / `vcdbVehicleId` / `baseId` son campos **separados y nulables** respecto de `vin`.

> **No se encontró ningún estándar de intercambio del sector que use el VIN como llave primaria de la entidad vehículo.**

### 7.4 En los mercados de matrícula, el VIN es un decodificador

El patrón es unánime en España y LatAm. **TallerMatic** (España) `[MARKETING]` lo dice con una claridad que ningún otro alcanza — <https://www.tallermatic.com/historial-vehiculo-taller-mecanico/>:

> "Introduces la **matrícula** en el buscador y en menos de dos segundos aparece la ficha completa."
>
> "También puedes buscar por nombre de cliente, **número de bastidor** o número de orden."
>
> "si introduces el número de **bastidor** el programa **rellena automáticamente marca, modelo y tipo de motor**."

**El bastidor cumple exactamente el rol que el VIN cumple en ACES: auto-relleno de especificaciones, no identidad.** Lo mismo en **Mekuora** (_"La **matrícula** es una de las búsquedas más importantes del taller"_; el bastidor **no aparece** en la ficha documentada — <https://mekuora.com/vehiculos-taller-mecanico>), **Inkrapp** (<https://www.inkrapp.com/para/taller>), **Historial Mecánico** (_"Busca cualquier vehículo **por patente**"_ — <https://historialmecanico.com>) y **Mekavo Chile** (_"Consulta cualquier **patente chilena**"_ — <https://mekavo.com/cl/verify>).

| Eje                      | EE. UU. (Shopmonkey / Tekmetric)               | España / LatAm                              |
| ------------------------ | ---------------------------------------------- | ------------------------------------------- |
| Identificador de negocio | VIN                                            | Matrícula / patente / placa                 |
| Rol del otro             | Placa: opcional, búsqueda **de pago** (Carfax) | VIN/bastidor: opcional, auto-rellena ficha  |
| Llave técnica real       | `id` interno, siempre                          | `[NO CONFIRMADO]` — ninguno publica esquema |

Esa última casilla importa: **que la matrícula sea la llave de _búsqueda_ no implica que sea la llave _primaria_**, y ningún producto hispanohablante publica su modelo de datos para confirmarlo.

### 7.5 Deduplicación: prevención en el alta, no fusión posterior

Shopmonkey `[SOPORTE]`, sección _"Prevent Duplicate Vehicles"_:

> "When creating a new vehicle, if the **license plate, VIN, or Year/Make/Model** you enter matches that of an existing vehicle, a prompt will indicate that a **customer vehicle match was found**."

Tres claves de distinta fuerza, detección **blanda** (un aviso al usuario), no un constraint de base de datos — lo que refuerza que **no hay `UNIQUE` sobre `vin`**. Y nótese que Y/M/M es deliberadamente laxo: dos Corollas 2015 distintos harían match.

Del mismo artículo, sobre alta sin VIN: _"You can also select **add a vehicle manually**"_, y la búsqueda por placa _"is available by activating Carfax for your shop"_ y limitada a tiers superiores. **El VIN no es obligatorio en Shopmonkey, y la placa cuesta dinero.**

> ⚠️ **Nadie documenta oficialmente un _merge_ de dos vehículos ya creados.** Ni Shopmonkey, ni Tekmetric, ni ninguno de los revisados. La estrategia del sector es prevenir en la creación y no reconciliar después. Esto es una oportunidad, no un modelo a imitar: en un mercado donde la placa cambia (§4.5), la fusión posterior **va a hacer falta**.

---

## 8. ¿Hay alguna fuente pública consultable por placa en CR?

### 8.1 Se verificaron seis. Ninguna sirve para un backend.

| Fuente                  | Estado verificado                                                                                                             | Barrera para un sistema                                                                                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Registro Nacional**   | Vivo: <https://www.rnpdigital.com/shopping/login.jspx> — _"Sistema de Certificaciones e Informes Digitales"_                  | **Login obligatorio** y modal propio del sitio: _"durante el plan piloto **no es posible realizar un auto registro**"_. Además WAF F5 (_"Request Rejected… support ID"_) y **bloqueo por IP de datacenter** (_"su dirección IP… ha sido incluida… en alguna lista negra"_). |
| **INS — marchamo**      | Vivo: <https://marchamo.grupoins.com/> (_"Consultá y pagá tu Marchamo"_)                                                      | SPA React/Vite; el HTML inicial viene vacío. **Sin API documentada**; el bundle JS no expone endpoints absolutos.                                                                                                                                                           |
| **RTV / DEKRA**         | **Ninguna URL oficial de consulta por placa confirmada.** `rtv.co.cr` redirige a un blog comercial; `dekra.co.cr` es NXDOMAIN | Pendiente. Es la fuente más incierta del informe.                                                                                                                                                                                                                           |
| **COSEVI**              | El dominio real es **`csv.go.cr`** — `cosevi.go.cr` es **NXDOMAIN**                                                           | **Captcha comercial confirmado** (PerfDrive/ShieldSquare) + fingerprinting Radware. `consultas.csv.go.cr` resuelve pero no responde.                                                                                                                                        |
| **Hacienda**            | Portal devuelve **HTTP 400** con interstitial anti-bot; ATV es solo login                                                     | No enumerable. Y probablemente redundante: el marchamo del INS ya expone el valor fiscal.                                                                                                                                                                                   |
| **datosabiertos.go.cr** | **HTTP 522** (origen caído) al momento de la verificación                                                                     | No evaluable.                                                                                                                                                                                                                                                               |

**No existe API oficial pública documentada para consulta vehicular por placa en Costa Rica.** El modelo del Registro Nacional es de **convenio y cuenta** (contacto publicado en su propio sitio: `rnpdigital@rnp.go.cr`, 2202-0888), no de API abierta.

### 8.2 Y el marco legal desaconseja raspar aunque se pudiera

**Ley N.º 8968**, Protección de la Persona frente al Tratamiento de sus Datos Personales, y su reglamento (Decreto 37554-JP). PRODHAB confirma en su propia página de normativa que _"Al día de hoy, la Ley no ha sufrido ninguna reforma"_ — <https://www.prodhab.go.cr/acercade/normativa/>

> ⚠️ **El articulado NO se pudo verificar textualmente** (SCIJ carga el texto por AJAX). **No se citan artículos.** Lo que sigue es criterio de ingeniería, no dictamen legal, y debe validarse con un abogado antes de construir sobre ello.

Que el Registro Nacional sea un registro **público** habilita **consultar** con finalidad legítima; no convierte los datos del propietario en libremente **almacenables y reutilizables**. En el momento en que el sistema los guarda y perfila, es responsable de una base de datos bajo la Ley 8968: deber de informar finalidad, principio de finalidad (datos para reparar un carro no sirven para marketing), derechos de acceso/rectificación/eliminación, y probable inscripción de la base ante PRODHAB.

**Recomendación de diseño defensivo, que además coincide con lo barato:** guardar por defecto solo **datos del bien** (placa, marca, modelo, año, VIN si se tiene) y capturar los **datos del cliente por consentimiento directo en el taller**, no raspándolos del registro.

### 8.3 Evidencia local de práctica: apunta a placa, pero es floja

Los dos productos de software de taller construidos específicamente para Costa Rica que se pudieron inspeccionar usan placa:

- **Para Talleres Mecánicos** `[MARKETING]` (<https://paratalleresmecanicos.com/>) — literal: _"Búsqueda por placa"_, _"Vehículos por placa"_, y el módulo de ingreso rápido captura _"**Placa**, cliente nuevo o existente, fotos obligatorias del vehículo"_. **La placa va primero, antes que el cliente.** Cero menciones de VIN o chasis.
- **TallerOne / Merced Software** `[MARKETING]` (<https://mercedsoftware.com/>) — el **portal público de seguimiento para el cliente final** se abre con la placa: _"Demo del sistema… **Ingresa la placa: 1111**"_. Es la llave que teclea el dueño del carro, no un dato interno.

Contraste útil: **ComparaSoftware CR** (<https://comparasoftware.cr/taller-mecanico>), pese al dominio `.cr`, lista productos **mexicanos** y la función de identificación que destaca es **"Decodificador VIN"**. El VIN parece ser una importación de mercados con Carfax/NHTSA.

Y los marketplaces de usados ticos **no publican ni placa ni VIN**: crautos.com filtra por marca/modelo/estilo/año/precio/provincia y encuentra24 por marca/modelo/precio/kilómetros. **No se encontró ningún servicio tipo Carfax por placa en Costa Rica.**

> ⚠️ **Debilidad reconocida:** la evidencia de campo más valiosa — **formularios de cita en producción de agencias ticas y cotizadores de aseguradoras** — **no se obtuvo**. `purdymotor.com` está literalmente _"En construcción"_; `autostar.cr` devuelve 403; `qualitas.cr` da timeout; `assanet.com/costa-rica` 404. La conclusión de §8.3 descansa sobre **dos sitios de marketing y una demo**, todos del mismo tipo de fuente (vendedores de software, que pueden estar copiándose entre sí). **No cerrar la decisión solo con esto.** Afortunadamente, §5.2 (DEKRA) es evidencia oficial e independiente que apunta en la misma dirección.

---

## 9. Veredicto

### 9.1 Sobre la propuesta de #15

> _"Placa como llave en CR y VIN como índice, no llave."_

**Confirmada en el fondo, refutada en la letra, y le falta una pieza.**

- ✅ **Confirmado:** en Costa Rica el identificador operativo es la **placa**. El trámite obligatorio anual (RTV) se agenda por placa; el software local busca por placa; el cliente dice la placa por teléfono. El VIN no está a mano.
- ✅ **Confirmado:** el VIN debe ser **índice y decodificador, no llave**. Y hay un argumento más fuerte del que #15 tenía: **ni siquiera el estándar del sector (ACES/VCdb) usa el VIN como identidad** — lo usa para mapear configuraciones, con las posiciones 1-10.
- ❌ **Refutado:** la placa **no puede ser la llave primaria**. Cambia por voluntad del dueño, sin límite de veces, desde octubre de 2024. Una PK sobre placa parte el historial en dos el día que un cliente personaliza su matrícula — y el historial acumulado es, según #15, el foso del producto. **Sería un tiro en el pie.**
- ➕ **Pieza que faltaba:** la placa necesita **dimensión temporal**. No es un campo, es una serie.

### 9.2 La formulación correcta

> **Llave primaria: `id` sintético.** Placa = **identificador operativo obligatorio, mutable e historiado**. VIN = **atributo opcional de decodificación, nunca requisito de alta**.

Y esto es exactamente lo que hacen los líderes: Shopmonkey `id: string`, Tekmetric `id: int`, con **todos** los identificadores externos nulables. La diferencia con el mercado americano no está en la llave — está en **cuál de los dos campos es obligatorio para el usuario**: allá el VIN y la placa cuesta extra; acá al revés.

---

## 10. Implicaciones concretas para el modelo de datos de #21

No son decisiones tomadas — son las restricciones que la evidencia impone.

1. **`Vehiculo.id` sintético (UUID). Ni placa ni VIN son PK.** Universal en el sector, y en CR hay una razón local adicional (§4.5).

2. **`placa` es obligatoria (NOT NULL) pero NO única globalmente, y necesita historial.** Modelar `VehiculoPlaca { vehiculoId, placa, vigenteDesde, vigenteHasta }` con a lo sumo una fila vigente por vehículo. Razones acumuladas: cambio voluntario ilimitado (art. 147), cambio numérica→alfanumérica (art. 147 párr. 2), y **reutilización legal de números en placas de taxi** (art. 127). Un `UNIQUE(placa)` global es incorrecto en Costa Rica. Lo correcto es `UNIQUE(tallerId, placa) WHERE vigenteHasta IS NULL`.
   Beneficio directo: buscar por una placa vieja debe encontrar el carro. Es justo el caso que hace valioso el historial.

3. **`vin` nulable, sin `UNIQUE`, sin validación de dígito verificador.** El VIN puede faltar (JDM sin VIN de 17), puede venir mal digitado, y el check digit **falla legítimamente** en vehículos no norteamericanos (§5.1, §5.3). Validar longitud 17 y el alfabeto sin I/O/Q **como advertencia suave**, nunca como rechazo. Guardar también un `numeroChasis` libre para los JDM, que no son VIN.

4. **Cliente ↔ Vehículo muchos-a-muchos, y con fechas — el error que Shopmonkey no arregló.** Tabla `PropiedadVehiculo { clienteId, vehiculoId, desde, hasta, esPrincipal }`. Shopmonkey tiene la tabla puente pero **sin rango temporal ni `isPrimary`**, y por eso no puede responder quién era el dueño en una fecha dada. Copiar la forma, corregir el defecto.

5. **El cambio de dueño es una reasignación, nunca una duplicación**, y el historial es **dual según el eje de consulta** (modelo Mitchell 1): las órdenes de trabajo cuelgan de `vehiculoId` y viajan con el carro; **las facturas emitidas congelan el nombre del cliente del momento** y no se reasignan. Esto no es un detalle contable — es lo que protege al taller en una disputa.

6. **El alta no puede exigir VIN, y probablemente tampoco marca/modelo verificados.** Replicar el `configurationStatus` de Shopmonkey (`Completo | Incompleto | Inválido | NoSoportado`): un vehículo mal identificado es un **estado legítimo**, no un error que bloquea el mostrador. En un taller, el carro entra primero y los datos se completan después.

7. **Deduplicación multi-clave y blanda en el alta** (modelo Shopmonkey): placa vigente (fuerte), VIN (fuerte), marca+modelo+año (débil, solo advertencia). Aviso al usuario, no constraint que rechace.

8. **Pero además hace falta un `merge` de vehículos, que nadie en el sector documenta.** En un mercado donde la placa cambia, el duplicado **se va a producir** (el mismo carro entra con placa nueva y nadie lo reconoce). Prever `vehiculoId` canónico y `fusionadoEn` desde el día uno; es mucho más barato que reconstruirlo después sobre historial ya acumulado.

9. **Cero dependencia de enriquecimiento automático por placa en el MVP.** Ninguna de las seis fuentes públicas es viable para un backend (§8.1). El flujo es **captura manual asistida**. Si el negocio lo justifica más adelante: convenio formal con el Registro Nacional, y evaluar el marchamo del INS con navegador headless e IP costarricense — asumiendo fragilidad y revisando términos de uso.

10. **vPIC de la NHTSA solo como conveniencia opcional, degradando en silencio.** Es gratis y sin key, así que vale la pena para el subconjunto que sí decodifica; pero un decodificador que devuelve "nada" para el Hilux tailandés del cliente **no puede ser un paso obligatorio del alta**. Cachear resultados, no bloquear nunca.

11. **No escribir una validación de formato de placa costarricense.** El patrón exacto no tiene base normativa citable (§4.2) y conviven formatos numéricos y alfanuméricos. Normalizar (mayúsculas, sin espacios ni guiones) y ya. Un regexp inventado rechazaría placas legítimas en el mostrador — el peor fallo posible en este producto.

12. **Guardar por defecto solo datos del bien; los del cliente, por consentimiento directo** (§8.2).

---

## 11. Incertidumbres

Lo que **no** quedó resuelto, para no construir sobre arena.

| Incertidumbre                                                              | Estado y por qué importa                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **¿El marchamo imprime el chasis/VIN?**                                    | `[NO CONFIRMADO]`. `marchamo.grupoins.com` es una SPA. **Es el pendiente de mayor valor**: si el marchamo trae el VIN, el VIN sí está a mano y parte de §5.2 se debilita. Se resuelve abriendo el portal con una placa real en un navegador. |
| **¿Qué campos trae la certificación registral?**                           | `[NO CONFIRMADO]`. Todo detrás de login sin auto-registro.                                                                                                                                                                                   |
| **¿La RTV coteja o imprime el chasis?**                                    | `[NO CONFIRMADO]`. El manual de COSEVI está tras captcha. Resolvería si el VIN circula en el ecosistema oficial más allá del Registro.                                                                                                       |
| **Patrón exacto de la placa alfanumérica y catálogo de prefijos de clase** | `[NO CONFIRMADO]`. Vive en directrices internas del Registro. **Ya está mitigado en el diseño** (implicación 11: no validar formato).                                                                                                        |
| **Composición de la flota CR por origen de importación**                   | `[NO CONFIRMADO]`. Sin dato de Aduanas/PROCOMER/COMEX. El argumento de §5.3 se sostiene sobre el comportamiento de vPIC, no sobre cuántos carros de cada tipo hay.                                                                           |
| **Que los JDM no lleven VIN de 17**                                        | `[NO CONFIRMADO]` contra fuente japonesa (MLIT). Consistente con que vPIC clasifique el chasis corto como _"incomplete VIN"_.                                                                                                                |
| **¿Un cambio de clase/uso obliga a cambiar la placa?**                     | `[NO CONFIRMADO]`. Inferencia fuerte desde arts. 128 y 147, sin artículo expreso. Si se confirma, es otra razón más para historiar la placa — no cambia la decisión.                                                                         |
| **Que el traspaso conserve la placa**                                      | **Inferencia por ausencia**, no cita textual. Es la base de la implicación 5. Sólida (arts. 127/139/17) pero conviene confirmarla con un notario tico.                                                                                       |
| **Formularios reales de agencias y aseguradoras ticas**                    | `[NO CONFIRMADO]` — todos los sitios fallaron. **La debilidad de campo más grande.** §8.3 se apoya en 2 sitios de marketing + 1 demo.                                                                                                        |
| **¿Qué pide el repuestero tico: placa, VIN o marca/modelo/año?**           | Sin evidencia alguna. Relevante para el módulo de repuestos, no para la identidad del vehículo.                                                                                                                                              |
| **Articulado de la Ley 8968**                                              | `[NO CONFIRMADO]` — SCIJ carga por AJAX. §8.2 es criterio de ingeniería, **no dictamen legal**.                                                                                                                                              |
| **Fecha del cambio Riteve → DEKRA**                                        | `[NO CONFIRMADO]`. Irrelevante para el modelo de datos; se anota por higiene.                                                                                                                                                                |
| **`UNIQUE` sobre `vin` en Shopmonkey**                                     | No declarado en el esquema. La evidencia indirecta (dedup blanda por prompt) sugiere que **no existe**.                                                                                                                                      |

**Ninguna de estas incertidumbres invalida el veredicto de §9.** La más peligrosa es la del marchamo: resolvería si el VIN está o no a mano. Pero incluso si el marchamo trajera el VIN, seguiría siendo cierto que la placa es lo que se teclea, que el VIN decodifica mal en la flota local, y que la placa es mutable — que son los tres pilares de las implicaciones.

---

## 12. Fuentes

### Normativa costarricense (leída íntegra desde el PDF oficial)

| Norma                                                                           | Enlace                                                                                                                                                      |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ley N.º 9078**, Ley de Tránsito por Vías Públicas Terrestres y Seguridad Vial | <https://www.imprentanacional.go.cr/pub/2012/10/26/ALCA165_26_10_2012.pdf> (_La Gaceta_ 207, Alcance Digital 165, 26/10/2012)                               |
| **Decreto 44649-MJP**, Reglamento del Registro de Bienes Muebles                | <https://www.imprentanacional.go.cr/pub/2024/09/25/ALCA164_25_09_2024.pdf> (_La Gaceta_ 178, Alcance 164, 25/09/2024) — Título V "Matrícula", arts. 127-149 |
| Registro Nacional — Cambios en la asignación de matrículas                      | <https://www.rnpdigital.com/direccion_servicios/Documentos/Cambios%20en%20la%20Asignacion%20de%20Matriculas%20de%20Automoviles%20Particulares.pdf>          |
| Registro Nacional — Cambio de matrícula numérica a alfanumérica                 | <https://www.rnpdigital.com/placas/Procedimiento%20de%20Cambio%20de%20Matricula%20Numerica%20a%20Alfanumerica.pdf>                                          |
| Registro Nacional — Placas y otros servicios                                    | <https://www.rnpdigital.com/tramites_servicios/tramitesregistros/servicios/PlacasyOtrosServicios.htm>                                                       |
| Ley 8968 (Protección de datos) y Decreto 37554-JP — **texto no verificado**     | <https://www.prodhab.go.cr/acercade/normativa/>                                                                                                             |

### Norma técnica del VIN

| Fuente                                       | Enlace                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **49 CFR Part 565** (texto íntegro, GovInfo) | <https://www.govinfo.gov/content/pkg/CFR-2024-title49-vol6/xml/CFR-2024-title49-vol6-part565.xml> |
| ISO 3779:2009 (abstract vía ANSI)            | <https://webstore.ansi.org/standards/iso/iso37792009>                                             |
| ISO 3780:2009 (abstract vía ANSI)            | <https://webstore.ansi.org/standards/iso/iso37802009>                                             |
| NHTSA vPIC — API                             | <https://vpic.nhtsa.dot.gov/api/>                                                                 |
| NHTSA vPIC — FAQ (límite de cobertura)       | <https://vpic.nhtsa.dot.gov/api/home/index/faq>                                                   |

### Instituciones y servicios costarricenses

| Fuente                                      | Enlace                                           |
| ------------------------------------------- | ------------------------------------------------ |
| DEKRA Costa Rica — Preguntas frecuentes     | <https://www.dekra.cr/es/preguntas-frecuentes/>  |
| DEKRA Costa Rica — Inspección vehicular     | <https://www.dekra.cr/es/inspeccion-vehicular/>  |
| Registro Nacional — Certificaciones (login) | <https://www.rnpdigital.com/shopping/login.jspx> |
| INS — Marchamo                              | <https://marchamo.grupoins.com/>                 |
| COSEVI (dominio real)                       | <https://www.csv.go.cr/>                         |
| Hacienda — ATV                              | <https://atv.hacienda.go.cr/ATV/login.aspx>      |
| PRODHAB — Normativa                         | <https://www.prodhab.go.cr/acercade/normativa/>  |

### Esquemas y documentación de producto

| Fuente                                              | Enlace                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Shopmonkey — esquema `Vehicle`                      | <https://shopmonkey.dev/schema/Vehicle>                                                   |
| Shopmonkey — esquema `VehicleOwner`                 | <https://shopmonkey.dev/schema/VehicleOwner>                                              |
| Shopmonkey — esquema `HQVehicleOwner`               | <https://shopmonkey.dev/schema/HQVehicleOwner>                                            |
| Shopmonkey — Add Vehicles (alta y dedup)            | <https://support.shopmonkey.io/hc/en-us/articles/38743934303252-Add-Vehicles>             |
| Mitchell 1 — Change Vehicle Ownership               | <https://kb.mitchell1.com/articles/id-156/>                                               |
| Workshop Software — Transfer vehicle ownership      | <https://workshopsoftware.com/knowledge-base/vehicles/transfer-vehicle-ownership/>        |
| Tekmetric — cliente Go de la comunidad `[TERCEROS]` | <https://github.com/beetlebugorg/tekmetric-mcp>                                           |
| Auto Care — ACES                                    | <https://www.autocare.org/aces/>                                                          |
| Auto Care — VCdb                                    | <https://digital.autocare.org/vcdb/>                                                      |
| MOTOR — VIN to VCdb                                 | <https://www.motor.com/wp-content/uploads/2025/08/MOTOR_VIN_to_VCdb_US_ContentDevKit.pdf> |

### Software de taller — Costa Rica, España y LatAm `[MARKETING]`

| Fuente                            | Enlace                                                            |
| --------------------------------- | ----------------------------------------------------------------- |
| Para Talleres Mecánicos (CR)      | <https://paratalleresmecanicos.com/>                              |
| TallerOne / Merced Software (CR)  | <https://mercedsoftware.com/>                                     |
| ComparaSoftware CR (contraste MX) | <https://comparasoftware.cr/taller-mecanico>                      |
| TallerMatic (ES)                  | <https://www.tallermatic.com/historial-vehiculo-taller-mecanico/> |
| Mekuora (ES)                      | <https://mekuora.com/vehiculos-taller-mecanico>                   |
| Inkrapp (ES)                      | <https://www.inkrapp.com/para/taller>                             |
| Historial Mecánico (LatAm)        | <https://historialmecanico.com>                                   |
| Mekavo (CL)                       | <https://mekavo.com/cl/verify>                                    |
| crautos.com (marketplace CR)      | <https://www.crautos.com/autosusados/>                            |
| encuentra24 CR (marketplace)      | <https://www.encuentra24.com/costa-rica-es/autos-usados>          |
