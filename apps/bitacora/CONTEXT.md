# Bitácora

Gestión de órdenes de trabajo para talleres automotrices de rango medio-alto que pueden ofrecer mecánica, electricidad y pintura, en cualquier combinación. El nombre viene de lo que el producto sostiene: el registro acumulado de lo que le ha pasado a cada vehículo.

## Language

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

**Asesor**:
La persona del taller que recibe el vehículo, cotiza y trata con el Cliente.
_Evitar_: recepcionista, vendedor

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
El número visible de la Orden, el que el Cliente y el taller usan para referirse al trabajo y el que va impreso en la factura.
_Evitar_: número de orden, consecutivo, ID

**Línea de servicio**:
Cada trabajo concreto dentro de una Orden — "cambio de pastillas", "alternador", "guardabarros derecho". **Es la Línea de servicio la que lleva la Especialidad**, no la Orden.
_Evitar_: ítem, servicio, tarea, renglón

**Especialidad**:
El oficio que ejecuta una Línea de servicio: mecánica, electricidad o pintura. Un taller puede tener una, dos o las tres.
_Evitar_: departamento, área, rubro

**Trabajo declinado**:
Una Línea de servicio que el taller recomendó y el Cliente no aprobó. Conserva su motivo y su monto, y vuelve a proponerse cuando el Vehículo regresa.
_Evitar_: rechazado, cancelado, pendiente

**Autorización**:
El consentimiento del Cliente a una Línea de servicio concreta, con constancia de quién autorizó y por qué medio. Se autoriza trabajo por trabajo, no la Orden completa.
_Evitar_: aprobación, OK del cliente

**Horas facturadas** / **Horas reales**:
Las horas que se le cobran al Cliente por una Línea de servicio, y las que efectivamente tomó ejecutarla. Son dos cantidades distintas y se registran por separado.
_Evitar_: horas (a secas), tiempo
