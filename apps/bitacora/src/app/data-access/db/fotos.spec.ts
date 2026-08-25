import { pesoLegible } from './fotos';

/* El peso se enseña en pantalla junto a las fotos: "309 kB en el aparato". Si
   se lee mal, el aviso de espacio deja de significar nada. */
describe('el peso legible', () => {
  it('usa la unidad que le toca a cada tamaño', () => {
    expect(pesoLegible(512)).toBe('512 B');
    expect(pesoLegible(1024)).toBe('1 kB');
    expect(pesoLegible(316_416)).toBe('309 kB');
    expect(pesoLegible(5_600_000)).toBe('5,3 MB');
  });

  /* El separador decimal de Costa Rica es la coma, no el punto. */
  it('escribe el decimal a la tica', () => {
    expect(pesoLegible(2_411_724)).toContain(',');
    expect(pesoLegible(2_411_724)).not.toContain('.');
  });
});
