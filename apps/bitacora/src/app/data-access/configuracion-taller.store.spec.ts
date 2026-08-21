import { TestBed } from '@angular/core/testing';
import { ConfiguracionTallerStore } from './configuracion-taller.store';

const CLAVE = 'bitacora.apariencia';

describe('ConfiguracionTallerStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('arranca en oficina y normal cuando no hay nada guardado', () => {
    const store = TestBed.inject(ConfiguracionTallerStore);

    expect(store.piel()).toBe('oficina');
    expect(store.densidad()).toBe('normal');
  });

  it('recuerda lo elegido entre sesiones', () => {
    TestBed.inject(ConfiguracionTallerStore).cambiarDensidad('guantes');

    // Segunda "sesión": un store nuevo tiene que leer lo que dejó el anterior.
    TestBed.resetTestingModule();
    expect(TestBed.inject(ConfiguracionTallerStore).densidad()).toBe('guantes');
  });

  it('escribe la apariencia en la raíz del documento', () => {
    const store = TestBed.inject(ConfiguracionTallerStore);
    TestBed.tick();

    store.cambiarPiel('taller');
    TestBed.tick();

    expect(document.documentElement.dataset['piel']).toBe('taller');
    expect(document.documentElement.dataset['densidad']).toBe('normal');
  });

  it('ignora lo guardado si viene con basura', () => {
    localStorage.setItem(
      CLAVE,
      JSON.stringify({ piel: 'neón', densidad: 'gigante', marca: 'rojo' }),
    );

    const store = TestBed.inject(ConfiguracionTallerStore);

    expect(store.piel()).toBe('oficina');
    expect(store.densidad()).toBe('normal');
    expect(store.marca()).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('no se cae si lo guardado no es JSON', () => {
    localStorage.setItem(CLAVE, 'esto no es json');

    expect(() => TestBed.inject(ConfiguracionTallerStore)).not.toThrow();
  });
});
