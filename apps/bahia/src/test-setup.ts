// jsdom (el entorno de test) no implementa IndexedDB — este polyfill hace
// que los DataServices respaldados por IndexedDB (ver
// data-access/persistence/bahia-db.ts) funcionen igual bajo test que en un
// navegador real.
import 'fake-indexeddb/auto';
