# Context Map

Este monorepo aloja varias aplicaciones cliente, cada una con su propio dominio. Los contextos no comparten modelo ni vocabulario: un mismo término puede significar cosas distintas en cada uno.

## Contexts

- [Bitácora](./apps/bitacora/CONTEXT.md) — órdenes de trabajo para talleres automotrices multi-especialidad (mecánica, electricidad, pintura)

## Relationships

Ninguna por ahora. **Bitácora no comparte modelo, decisiones ni investigación con `apps/bahia`**, por instrucción explícita: aunque conviven en el mismo monorepo Nx, se decidió todo desde cero para Bitácora. Si en el futuro un contexto necesita algo de otro, se referencia por identificador y se documenta aquí.

`apps/bahia` y `apps/shell` todavía no tienen `CONTEXT.md`; se crearán cuando su vocabulario se fije.
