import { interpretar } from './interpretar-reporte';

describe('qué se entiende de la queja', () => {
  it('reconoce la señal y cuándo pasa', () => {
    const r = interpretar('Chilla cuando freno, sobre todo bajando');

    expect(r.senales).toContain('ruido');
    expect(r.cuando).toContain('al-frenar');
    expect(r.titulo).toBe('Ruido al frenar');
  });

  it('propone la Especialidad por la pieza, no por la señal', () => {
    /* El mismo ruido, dos oficios: lo que decide es de qué parte del carro se
       está hablando. */
    expect(interpretar('suena el freno').especialidad).toBe('mecanica');
    expect(interpretar('suena la batería').especialidad).toBe('electricidad');
  });

  /* El titular sale de la señal MÁS GRAVE que se reconozca, no de la primera
     que aparezca en el texto: un carro que no arranca no se titula por el
     ruido que además hace. */
  it('el título lo encabeza lo que deja al cliente a pie', () => {
    const r = interpretar(
      'En la mañana cuesta que prenda, hace un ruido y no arranca',
    );

    expect(r.senales).toEqual(expect.arrayContaining(['no-enciende', 'ruido']));
    expect(r.titulo).toBe('No enciende en frío');
  });

  it('junta varias señales de la misma queja', () => {
    const r = interpretar('Bota humo y huele a quemado');

    expect(r.senales).toEqual(expect.arrayContaining(['humo', 'olor']));
  });

  it('entiende igual con tildes que sin ellas', () => {
    expect(interpretar('vibración al frenar').senales).toContain('vibracion');
    expect(interpretar('vibracion al frenar').senales).toContain('vibracion');
  });
});

describe('lo que NO se entiende', () => {
  /* Una moneda al aire con cara de certeza es peor que un espacio en blanco:
     quien recibe lo llena en dos segundos si sabe que está vacío. */
  it('no propone Especialidad cuando dos empatan', () => {
    const r = interpretar('Le dieron un golpe y desde entonces suena el motor');

    expect(r.especialidad).toBeNull();
  });

  it('no propone nada de un texto sin vocabulario conocido', () => {
    const r = interpretar('Buenos días, vengo de parte de doña Marta');

    expect(r.especialidad).toBeNull();
    expect(r.senales).toEqual([]);
    expect(r.porque).toEqual([]);
  });

  it('con el texto vacío no inventa', () => {
    expect(interpretar('   ')).toMatchObject({
      senales: [],
      cuando: [],
      especialidad: null,
      titulo: '',
    });
  });
});

describe('la negación', () => {
  /* "No hace ruido" no es una queja de ruido. Sin esto lo sería, y la ficha
     diría lo contrario de lo que el Cliente vino a decir. */
  it('no marca lo que el Cliente negó', () => {
    expect(interpretar('No hace ruido, solo vibra').senales).not.toContain(
      'ruido',
    );
    expect(interpretar('No hace ruido, solo vibra').senales).toContain(
      'vibracion',
    );
  });

  /* "Tampoco" aparece en cuanto el Cliente dice más de una cosa, y sin esto
     la segunda queja se quedaba sin señal reconocida. Salió de recorrer la
     pantalla en el navegador, no de leer las listas. */
  it('"tampoco prende" también es señal', () => {
    const r = interpretar('Y tampoco prende el aire acondicionado');

    expect(r.senales).toContain('no-enciende');
    expect(r.especialidad).toBe('electricidad');
    expect(r.titulo).toBe('No enciende');
  });

  it('pero "no prende" SÍ es una señal, no una negación', () => {
    const r = interpretar('En la mañana no prende');

    expect(r.senales).toContain('no-enciende');
    expect(r.cuando).toContain('en-frio');
    expect(r.titulo).toBe('No enciende en frío');
  });
});

describe('las palabras completas', () => {
  /* El falso positivo caro: en Costa Rica el marchamo sale en toda
     conversación de taller, y "aro" vive dentro de "claro" y de "aroma". */
  it('no confunde marchamo con el motor de arranque', () => {
    expect(
      interpretar('Vengo a que me revisen para el marchamo'),
    ).toMatchObject({ especialidad: null, senales: [] });
  });

  /* Esta es la colisión de verdad, y las dos palabras están en las listas:
     "radio" es de electricidad y vive entera dentro de "radiador", que es de
     mecánica. Sin el límite de la derecha, una fuga del radiador se le
     mandaría al electricista. */
  it('no confunde el radiador con el radio', () => {
    expect(interpretar('gotea el radiador').especialidad).toBe('mecanica');
    expect(interpretar('no se oye el radio').especialidad).toBe('electricidad');
  });

  it('sí reconoce el plural y el gerundio', () => {
    expect(interpretar('suenan los frenos').senales).toContain('ruido');
    expect(interpretar('vibrando en carretera').cuando).toContain(
      'a-velocidad',
    );
  });
});

describe('el porqué de la sugerencia', () => {
  /* Una etiqueta sin explicación obliga a creerle a ciegas o a ignorarla
     siempre. Las dos salidas son malas. */
  it('cita las palabras del Cliente, no las del diccionario', () => {
    const r = interpretar('Vibración cuando freno en la autopista');

    expect(r.porque).toContain('Vibración');
    expect(r.porque.join(' ')).not.toContain('vibracion');
  });

  /* "Chilla cuando freno" acierta tres reglas y devolvía «Chilla» «cuando
     freno» «freno»: el último no añade nada y se lee como un tartamudeo. */
  it('no repite un motivo que ya está dicho dentro de otro', () => {
    const r = interpretar('Chilla cuando freno');

    expect(r.porque).toContain('cuando freno');
    expect(r.porque).not.toContain('freno');
  });

  it('no repite la misma palabra dos veces', () => {
    const r = interpretar('golpe, un golpe grande');

    expect(new Set(r.porque).size).toBe(r.porque.length);
  });
});

describe('el título de la ficha', () => {
  it('sin señal reconocida usa la primera oración entera', () => {
    const r = interpretar('Quiere que le revisen todo. Va para la playa.');

    expect(r.titulo).toBe('Quiere que le revisen todo');
  });

  it('nunca parte una palabra por la mitad', () => {
    const largo = interpretar(
      'Necesito una revisión general completa antes del viaje',
    );

    expect(largo.titulo.endsWith('…')).toBe(false);
    expect(largo.titulo).toBe(
      'Necesito una revisión general completa antes del viaje',
    );
  });
});
