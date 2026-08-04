import { TestBed } from '@angular/core/testing';
import { Usuario } from '../models/usuario.model';
import { SesionStore } from './sesion.store';

const usuarioDePrueba: Usuario = {
  id: 'usuario-1',
  tallerId: 'taller-1',
  nombre: 'Ana Torres',
  puesto: 'Recepción',
  permisos: ['recibir'],
};

describe('SesionStore', () => {
  it('starts with no active session', () => {
    const store = TestBed.inject(SesionStore);
    expect(store.usuarioActual()).toBeNull();
    expect(store.haySesion()).toBe(false);
    expect(store.tienePermiso('recibir')).toBe(false);
  });

  it('iniciarSesion sets the active usuario and its permisos', () => {
    const store = TestBed.inject(SesionStore);

    store.iniciarSesion(usuarioDePrueba);

    expect(store.usuarioActual()).toEqual(usuarioDePrueba);
    expect(store.haySesion()).toBe(true);
    expect(store.tienePermiso('recibir')).toBe(true);
    expect(store.tienePermiso('facturar')).toBe(false);
  });

  it('cerrarSesion clears the active usuario', () => {
    const store = TestBed.inject(SesionStore);
    store.iniciarSesion(usuarioDePrueba);

    store.cerrarSesion();

    expect(store.usuarioActual()).toBeNull();
    expect(store.haySesion()).toBe(false);
  });
});
