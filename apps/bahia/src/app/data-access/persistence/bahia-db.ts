import { deleteDB, DBSchema, IDBPDatabase, openDB } from 'idb';
import { Cliente } from '../models/cliente.model';
import { OrdenTrabajo } from '../models/orden-trabajo.model';
import { Taller } from '../models/taller.model';
import { Usuario } from '../models/usuario.model';
import { Vehiculo } from '../models/vehiculo.model';
import {
  SEED_CLIENTES,
  SEED_ORDENES,
  SEED_TALLER,
  SEED_USUARIOS,
  SEED_VEHICULOS,
} from '../seed/seed-data';

interface BahiaDbSchema extends DBSchema {
  talleres: { key: string; value: Taller };
  usuarios: { key: string; value: Usuario };
  clientes: { key: string; value: Cliente };
  vehiculos: { key: string; value: Vehiculo };
  ordenes: { key: string; value: OrdenTrabajo };
}

const DB_NAME = 'bahia-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BahiaDbSchema>> | undefined;

// Base de datos única para las 5 entidades (ver ticket "Persistencia local
// para no perder datos de la demo"). Cada DataService la usa directamente
// como su almacén — esta es la costura hacia un backend real: cuando exista,
// solo cambian los DataServices (a HttpClient), no los stores ni la UI.
//
// Se siembra una sola vez, dentro de `upgrade`, la primera vez que el
// navegador abre esta base — las siguientes aperturas reciben los datos
// tal como quedaron persistidos.
export function getBahiaDb(): Promise<IDBPDatabase<BahiaDbSchema>> {
  dbPromise ??= openDB<BahiaDbSchema>(DB_NAME, DB_VERSION, {
    async upgrade(db) {
      const talleres = db.createObjectStore('talleres', { keyPath: 'id' });
      await talleres.put(SEED_TALLER);

      const usuarios = db.createObjectStore('usuarios', { keyPath: 'id' });
      await Promise.all(SEED_USUARIOS.map((usuario) => usuarios.put(usuario)));

      const clientes = db.createObjectStore('clientes', { keyPath: 'id' });
      await Promise.all(
        SEED_CLIENTES.map((cliente) => clientes.put(cliente)),
      );

      const vehiculos = db.createObjectStore('vehiculos', { keyPath: 'id' });
      await Promise.all(
        SEED_VEHICULOS.map((vehiculo) => vehiculos.put(vehiculo)),
      );

      const ordenes = db.createObjectStore('ordenes', { keyPath: 'id' });
      await Promise.all(SEED_ORDENES.map((orden) => ordenes.put(orden)));
    },
  });
  return dbPromise;
}

// Solo para tests: cierra y borra la base para que cada test arranque de
// una base recién sembrada, en vez de arrastrar mutaciones de tests
// anteriores (el singleton de arriba, por diseño, sobrevive entre tests).
export async function resetBahiaDbForTests(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = undefined;
  }
  await deleteDB(DB_NAME);
}
