import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Permiso, Usuario } from '../models/usuario.model';

interface SesionState {
  usuarioActual: Usuario | null;
}

const initialState: SesionState = {
  usuarioActual: null,
};

// Login simulado (ver ticket "Autenticación para la demo"): sin OTP ni
// contraseña, sin selector de taller (un solo taller sembrado). El usuario
// elegido no se persiste entre recargas a propósito — cada recarga vuelve
// a mostrar el selector, precisamente para poder demostrar el cambio de
// perfil en vivo. Un sistema real guardaría un token de sesión.
export const SesionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ usuarioActual }) => ({
    haySesion: computed(() => usuarioActual() !== null),
  })),
  withMethods((store) => ({
    iniciarSesion(usuario: Usuario): void {
      patchState(store, { usuarioActual: usuario });
    },
    cerrarSesion(): void {
      patchState(store, { usuarioActual: null });
    },
    // Consultado hoy solo por la vista de sesión, para mostrar los
    // permisos del usuario activo. `recibir`/`diagnosticar` empiezan a
    // gatear UI real recién cuando existan esas pantallas; `facturar`,
    // `asignar_bahia` y `ver_reportes` quedan listos sin ningún punto de
    // la UI que los consulte todavía (ver Usuario.permisos).
    tienePermiso(permiso: Permiso): boolean {
      return store.usuarioActual()?.permisos.includes(permiso) ?? false;
    },
  })),
);
