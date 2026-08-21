import { TestBed } from '@angular/core/testing';
import { DetalleStore } from './detalle.store';

describe('la petición de detalle', () => {
  /* Es un contador y no un booleano: pedir el detalle de la misma Orden dos
     veces seguidas tiene que volver a abrir el panel si entretanto se cerró, y
     un booleano que ya vale `true` no vuelve a notificar. */
  it('cada petición avisa, aunque sea la misma Orden dos veces', () => {
    const store = TestBed.inject(DetalleStore);
    const vistos: number[] = [];
    TestBed.runInInjectionContext(() => {
      // Leer la señal en cada paso es lo que hace un `effect` del shell.
      vistos.push(store.peticiones());
      store.pedir();
      vistos.push(store.peticiones());
      store.pedir();
      vistos.push(store.peticiones());
    });

    expect(vistos).toEqual([0, 1, 2]);
  });

  /* El 0 inicial no puede abrir nada: si lo hiciera, el panel se abriría solo
     al cargar la app en una tableta. */
  it('arranca en cero, que es el valor que el shell ignora', () => {
    expect(TestBed.inject(DetalleStore).peticiones()).toBe(0);
  });
});
