/**
 * Lo que tiene que existir ANTES de que se cargue el primer archivo de prueba.
 *
 * `fake-indexeddb/auto` se limitaba a estar importado arriba de
 * `esquema.spec.ts`, y eso resultó frágil: el módulo se evalúa UNA sola vez y
 * asigna `globalThis.indexedDB` en el entorno que toque primero. En cuanto
 * entraron archivos de prueba nuevos y cambió el orden de carga, las catorce
 * pruebas del esquema pasaron a fallar en bloque con `IndexedDB API missing`
 * — sin que nadie hubiera tocado ni el esquema ni sus pruebas.
 *
 * Acá corre para todos, siempre, y deja de depender de quién se cargue antes.
 */
import 'fake-indexeddb/auto';

/**
 * El reloj de las pruebas es el de Costa Rica.
 *
 * `fechaLarga` existe para que un `2026-12-01` no se corra un día, y ese
 * error solo se manifiesta al oeste de Greenwich: en un CI que corra en UTC
 * la prueba que lo vigila pasaría con el bug puesto y no vigilaría nada.
 * La app tiene `LOCALE_ID: 'es-CR'` cableado; el huso va con él.
 */
declare const process: { env: { TZ?: string } };

process.env.TZ = 'America/Costa_Rica';
