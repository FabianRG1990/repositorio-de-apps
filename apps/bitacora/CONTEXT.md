# Bitácora

Gestión de órdenes de trabajo para talleres automotrices de rango medio-alto que pueden ofrecer mecánica, electricidad y pintura, en cualquier combinación. El nombre viene de lo que el producto sostiene: el registro acumulado de lo que le ha pasado a cada vehículo.

## Language

### El taller

**Taller**:
El negocio que usa Bitácora, con sus datos, las Especialidades que ofrece, sus Tarifas y su personal. Es lo único que el Dueño configura, y lo que configura tiene efecto visible: un Taller de una sola Especialidad no muestra el filtro del tablero.
_Evitar_: empresa, negocio, sucursal, organización

**Tarifa**:
Cuánto cobra el Taller la hora de una Especialidad. Son distintas entre oficios: la hora de pintura no vale lo mismo que la de mecánica.
_Evitar_: precio, costo, rate

**Puesto**:
Cada lugar del Taller desde donde se crean Órdenes — la recepción, la tablet del patio. Tiene una letra que lo identifica y lleva su propia numeración de Folios, para que dos Puestos sin conexión nunca acuñen el mismo.
_Evitar_: dispositivo, terminal, equipo, caja

**Tiempo parado**:
Cuánto lleva un Vehículo en el Taller desde que entró. Es el criterio que ordena el tablero — arriba lo que más duele.
_Evitar_: antigüedad, demora, tiempo de espera

### Personas y organizaciones

**Cliente**:
La persona u organización dueña del vehículo, a cuyo nombre van la factura y el historial.
_Evitar_: propietario, usuario, cuenta

**Quien entrega**:
La persona que físicamente deja el vehículo en el taller en una visita concreta, y a quien se le avisa cuando está listo. Puede no ser el Cliente — en una flotilla es un chofer distinto cada vez.
_Evitar_: contacto, portador, chofer

**Técnico**:
La persona del taller que ejecuta el trabajo. Un mismo Técnico puede dominar varias Especialidades.
_Evitar_: mecánico (eso es una Especialidad, no un rol), operario

**Responsable**:
El Técnico a cuyo nombre queda una Orden. Es uno solo por Orden, aunque por dentro la toquen varios: responde por el trabajo, no necesariamente lo ejecuta todo.
_Evitar_: asignado, encargado, dueño de la orden

**Asesor**:
La persona del taller que recibe el vehículo, cotiza y trata con el Cliente.
_Evitar_: recepcionista, vendedor

**Dueño**:
La persona que responde por el taller: define qué Especialidades ofrece y qué tarifas cobra, y mira cómo va el negocio.
_Evitar_: administrador, gerente, jefe

**Perfil**:
Con cuál de los tres papeles — Asesor, Técnico o Dueño — se está usando la app. Determina qué pantalla se abre y qué se ofrece hacer, **no qué está permitido**: todos ven todas las Órdenes.
_Evitar_: rol, permiso, usuario, sesión

**Aseguradora**:
La organización que cubre el costo de ciertas Líneas de servicio, típicamente de pintura por colisión. Aparece únicamente como Pagador: el taller no negocia estimaciones ni suplementos dentro de Bitácora.
_Evitar_: seguro, compañía

### El vehículo y su identidad

**Vehículo**:
El automóvil concreto que entra al taller. Tiene identidad propia y estable, independiente de quién lo posea: el historial sigue al carro, no a la persona.
_Evitar_: carro, unidad, activo

**Placa**:
La matrícula vigente del Vehículo. Es como el taller lo reconoce y es obligatoria al recibirlo, pero **no es su identidad**: puede cambiar durante la vida del vehículo y se conserva su historial de vigencia.
_Evitar_: matrícula, número de placa

**VIN**:
El número de chasis del Vehículo. Opcional, porque no siempre está a mano al recibir.
_Evitar_: chasis, número de serie, VIN number

**Fusión de vehículos**:
La operación de unir dos registros de Vehículo que resultaron ser el mismo carro, conservando el historial de ambos.
_Evitar_: merge, deduplicación

### El trabajo

**Visita**:
Una entrada del Vehículo al taller, de principio a fin. Es la unidad con la que se cuenta el historial: "este carro ha venido 3 veces". Una Visita puede tocar varias Especialidades.
_Evitar_: entrada, estadía, atención

**Orden**:
El documento de trabajo de una Visita. Visita y Orden son una sola cosa vista desde dos lados: la Visita es el hecho, la Orden es el papel.
_Evitar_: orden de trabajo, OT, ticket, job

**Folio**:
El número visible de la Orden, el que el Cliente y el Taller usan para referirse al trabajo y el que va impreso en la factura. Lleva la letra del Puesto que lo acuñó y un consecutivo propio de ese Puesto — `A-241` —, así que los Folios de un Taller no forman una sola serie corrida. Se acuña al crear la Orden: ninguna Orden vive sin Folio.
_Evitar_: número de orden, consecutivo, ID

**Reporte del Cliente**:
Lo que el Cliente dice que le pasa al carro, guardado **en sus palabras**. Es la queja de las tres C del oficio —queja, causa, corrección—, y lo que después se diagnostica cuelga de ella. Una Visita trae varios: "suena al frenar y además no prende el aire" son dos Reportes, de dos Especialidades. **No es una Línea de servicio**: la queja es del Cliente y existe desde que el carro entra; la Línea es del Taller y nace al diagnosticar.
_Evitar_: síntoma, problema, falla, motivo de ingreso, descripción

**Estado de entrada**:
Cómo venía el Vehículo al recibirlo: kilometraje, cuartos de tanque, daños que ya traía y objetos dejados adentro. Se anota una vez y no se vuelve a tocar. Pertenece a la Orden y no al Vehículo, porque describe esta Visita.
_Evitar_: inventario, checklist, inspección de ingreso

**Foto**:
Una imagen del Vehículo tomada al recibirlo, guardada en la Orden. **Pertenece a la Orden, no a la Línea de servicio**: muestra cómo entró el carro, no justifica un cobro concreto. Se guarda reducida —1600 px de lado largo— porque es una constancia y no una foto de catálogo, y vive solo en el aparato donde se sacó.
_Evitar_: evidencia, adjunto, imagen, inspección

**Línea de servicio**:
Cada trabajo concreto dentro de una Orden — "cambio de pastillas", "alternador", "guardabarros derecho". **Es la Línea de servicio la que lleva la Especialidad**, no la Orden.
_Evitar_: ítem, servicio, tarea, renglón

**Especialidad**:
El oficio que ejecuta una Línea de servicio: mecánica, electricidad o pintura. Un taller puede tener una, dos o las tres.
_Evitar_: departamento, área, rubro

**Pagador**:
Quién paga una Línea de servicio: el Cliente o una Aseguradora. **Es atributo de la Línea de servicio, no de la Orden** — una misma Orden puede llevar mecánica que paga el Cliente y pintura que paga la Aseguradora.
_Evitar_: responsable de pago, financiador, tipo de cobro

**Diagnóstico**:
La revisión que hace el taller para saber qué tiene el Vehículo. No es un concepto aparte: es una Línea de servicio como cualquier otra, que el Asesor cobra o deja en cero según el caso.
_Evitar_: revisión, chequeo, inspección

**Trabajo declinado**:
Una Línea de servicio que el taller recomendó y el Cliente no aprobó. Conserva su motivo y su monto, y vuelve a proponerse cuando el Vehículo regresa.
_Evitar_: rechazado, cancelado, pendiente

**Autorización**:
El consentimiento del Cliente a una Línea de servicio concreta, con constancia de quién autorizó y por qué medio. Se autoriza trabajo por trabajo, no la Orden completa. Una Línea **nunca está autorizada y declinada a la vez**: la constancia existe para poder apoyarse en ella meses después, y una que se contradice no sirve para eso.
_Evitar_: aprobación, OK del cliente

**Sin respuesta**:
Una Línea de servicio que el Taller propuso y sobre la que el Cliente todavía no ha dicho nada. No es lo mismo que declinada: es lo que falta por preguntar, y es lo único que entra en el mensaje que se le manda al Cliente.
_Evitar_: pendiente, en espera, borrador

**Próxima visita**:
La fecha en que el Asesor cree que el Vehículo debería volver, escrita a mano al cerrar la Orden. No se calcula: no hay intervalos ni kilometraje, solo el criterio de quien atendió el carro.
_Evitar_: mantenimiento programado, cita, vencimiento

**Papel de la Orden**:
Lo que se imprime de una Orden. Son **tres documentos distintos**, no el mismo con distinto encabezado: el del Taller va al parabrisas y no lleva montos, el del Cliente dice qué se hizo y qué quedó pendiente, y el de archivo lleva todo con el estado de entrada. Cambia el contenido porque cambia quién lo lee.
_Evitar_: reporte, PDF, impresión, ticket, comprobante (a secas)

**Aviso de listo**:
La constancia de que el Taller le comunicó a Quien entrega que puede venir a recoger el Vehículo, con la fecha y la persona a la que se le avisó. Es un hecho registrado, no el mensaje en sí: el mensaje viaja por WhatsApp, fuera de Bitácora.
_Evitar_: notificación, alerta, recordatorio

**Vehículo sin recoger**:
Un Vehículo cuyo trabajo terminó y del que ya se dio Aviso de listo, pero que sigue en el Taller. Ocupa espacio y por eso el tablero lo señala.
_Evitar_: abandonado, olvidado, en espera

**Horas facturadas** / **Horas reales**:
Las horas que se le cobran al Cliente por una Línea de servicio, y las que efectivamente tomó ejecutarla. Son dos cantidades distintas y se registran por separado.
_Evitar_: horas (a secas), tiempo

**Dictado**:
Hablarle a un campo de texto en vez de teclearlo. Es un acelerador sobre campos que ya funcionan escribiendo, nunca una forma distinta de llenar la Orden: lo dictado queda como texto y se corrige a mano.
_Evitar_: comando de voz, voz, reconocimiento

**Sugerencia**:
Lo que el sistema propone al leer un Reporte del Cliente — una Especialidad, unas señales, un título corto. Siempre viene con las palabras del Cliente que la motivaron y siempre se puede cambiar; ante la duda no propone nada. Nunca es un dato del Taller: el dato lo pone quien recibe.
_Evitar_: detección, predicción, análisis, clasificación automática
