# La Aseguradora entra solo como Pagador de la Línea de servicio

El taller objetivo es mixto: hace pintura que paga el Cliente y pintura que paga una aseguradora por colisión. **Decidimos que la Aseguradora exista únicamente como Pagador de una Línea de servicio**, y que el Pagador sea atributo de la línea y no de la Orden. Una misma Orden puede llevar mecánica a cargo del Cliente y pintura a cargo de la Aseguradora sin partirse en dos documentos.

Bitácora no modela estimación, aprobación de la aseguradora, suplementos por daño oculto ni deducible. Registra a quién se le cobra cada trabajo, y nada más.

## Considered Options

- **Aseguradora como Pagador** (elegida): un atributo por línea. Cubre el caso real del taller mixto sin construir un módulo de colisión.
- **Ignorar el trabajo de aseguradora**: asumir que todo es _customer-pay_ y que el taller siga llevando la colisión por fuera. Se descartó porque el taller objetivo sí hace ambos, y facturarle a la aseguradora sin dejar constancia de quién paga obliga a llevar la cuenta en papel — justo lo que el producto viene a eliminar.
- **Flujo de colisión completo** (estimación, suplementos, ajustador, deducible): fiel a cómo funciona el trabajo de aseguradora, pero es notoriamente el módulo más pesado del rubro y duplicaría el alcance de la fase 1.

## Consequences

- El taller sigue negociando con la aseguradora por fuera del sistema. Bitácora no sabe si un monto fue aprobado por el ajustador ni si hubo suplemento; solo sabe a quién se le cobra.
- Si más adelante hace falta el flujo de colisión, el Pagador ya está en el lugar correcto para colgarle estado (estimado / aprobado / suplementado) sin rehacer el modelo. Lo que sí faltaría es la Estimación como entidad, que hoy no existe.
- La investigación de organización multi-especialidad ([#16](https://github.com/FabianRG1990/repositorio-de-apps/issues/16)) encontró que **ningún vendor cubre mecánica general y colisión con el mismo producto**, y que los talleres mixtos terminan con un stack partido. Esta decisión no resuelve esa división: la esquiva, quedándose del lado mecánico y tratando la colisión como un cobro distinto en vez de un proceso distinto.
- El Diagnóstico no gana entidad propia por la misma lógica de austeridad: es una Línea de servicio que se cobra o se deja en cero según el caso ([#34](https://github.com/FabianRG1990/repositorio-de-apps/issues/34)).
