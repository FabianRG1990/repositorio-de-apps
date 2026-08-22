import { TestBed } from '@angular/core/testing';
import { OFRECIDO, PERFILES, PerfilStore } from './perfil.store';

describe('el Perfil', () => {
  beforeEach(() => localStorage.clear());

  const store = () => TestBed.inject(PerfilStore);

  /* Si arrancara con un valor no habría forma de distinguir "todavía no
     eligió" de "eligió Dueño", y la pantalla de entrada no sabría si le toca
     aparecer. */
  it('arranca sin elegir, que no es lo mismo que arrancar en Dueño', () => {
    expect(store().perfil()).toBeNull();
    expect(store().elegido()).toBe(false);
  });

  it('lo elegido se guarda en el aparato', () => {
    store().elegir('tecnico');

    expect(localStorage.getItem('bitacora.perfil')).toBe('tecnico');
    expect(store().perfil()).toBe('tecnico');
    expect(store().elegido()).toBe(true);
  });

  it('un valor guardado que no es un Perfil se ignora', () => {
    localStorage.setItem('bitacora.perfil', 'gerente');
    TestBed.resetTestingModule();

    expect(TestBed.inject(PerfilStore).perfil()).toBeNull();
  });

  /* El ADR 0008: la apariencia del Taller la fija el Dueño. Sin Perfil
     elegido no la fija nadie. */
  it('solo el Dueño configura el Taller', () => {
    expect(store().configuraElTaller()).toBe(false);

    store().elegir('asesor');
    expect(store().configuraElTaller()).toBe(false);

    store().elegir('dueno');
    expect(store().configuraElTaller()).toBe(true);
  });

  it('olvidar deja el aparato como recién instalado', () => {
    store().elegir('dueno');
    store().olvidar();

    expect(store().perfil()).toBeNull();
    expect(localStorage.getItem('bitacora.perfil')).toBeNull();
  });

  it('cada Perfil tiene su pantalla de entrada y su menú', () => {
    store().elegir('tecnico');
    expect(store().ofrecido()).toBe(OFRECIDO.tecnico);

    store().elegir('dueno');
    expect(store().ofrecido().inicio).toBe('/');
  });
});

describe('lo que se le ofrece a cada Perfil', () => {
  /* Un destino de entrada que no esté en su propio menú dejaría al usuario
     entrando por una pantalla que el menú no reconoce. */
  it('la pantalla de entrada de cada uno está en su menú', () => {
    for (const perfil of PERFILES) {
      expect(OFRECIDO[perfil].menu).toContain(OFRECIDO[perfil].inicio);
    }
  });

  /* Ofrecer no es prohibir, y con un subconjunto sí prohibía: medido sobre la
     app, un Dueño no tenía NINGÚN camino en la interfaz hasta Recepción ni
     hasta Próximas visitas. Lo que cambia por Perfil es el orden. */
  it('a los tres se les ofrecen TODAS las pantallas, solo cambia el orden', () => {
    const todas = [...OFRECIDO.asesor.menu].sort();

    for (const perfil of PERFILES) {
      expect([...OFRECIDO[perfil].menu].sort()).toEqual(todas);
    }

    const ordenes = PERFILES.map((p) => OFRECIDO[p].menu.join(','));
    expect(new Set(ordenes).size).toBe(PERFILES.length);
  });

  /* Nadie debe aterrizar en una pantalla vacía: Recepción, Próximas visitas y
     la pestaña Taller de Ajustes son todavía un párrafo. */
  it('nadie entra por una pantalla sin contenido', () => {
    const VACIAS = ['/recepcion', '/proximas-visitas', '/ajustes'];

    for (const perfil of PERFILES) {
      expect(VACIAS).not.toContain(OFRECIDO[perfil].inicio);
    }
  });

  /* El ADR 0005 es explícito: "todos ven todas las Órdenes". Que a alguien no
     se le OFREZCA una pantalla en el menú es otra cosa —y sigue abriéndose por
     URL—, pero la lista de Órdenes se le ofrece a los tres. */
  it('a los tres se les ofrece la lista de Órdenes', () => {
    for (const perfil of PERFILES) {
      expect(
        OFRECIDO[perfil].menu.some((r) => r === '/' || r === '/ordenes'),
      ).toBe(true);
    }
  });
});
