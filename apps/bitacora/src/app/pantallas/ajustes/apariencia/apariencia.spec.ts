import { TestBed } from '@angular/core/testing';
import { PerfilStore } from '../../../data-access/perfil.store';
import { Apariencia } from './apariencia';

describe('Apariencia', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function montar() {
    const fixture = TestBed.createComponent(Apariencia);
    await fixture.whenStable();
    return fixture;
  }

  it('el Dueño ve los controles', async () => {
    TestBed.inject(PerfilStore).elegir('dueno');
    const fixture = await montar();

    expect(
      fixture.nativeElement.querySelectorAll('[role="radio"]').length,
    ).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('#marca')).toBeTruthy();
  });

  /* El ADR 0005 manda: el Perfil decide qué se OFRECE, no qué está permitido.
     Por eso el Asesor ve exactamente los mismos datos —sin controles— y NO ve
     un aviso de "no tenés permiso": un muro sobre un selector sin login sería
     teatro, y además dejaría al Asesor sin saber cómo está configurado su
     propio Taller. */
  it('el Asesor ve los mismos valores, sin controles y sin muro', async () => {
    TestBed.inject(PerfilStore).elegir('asesor');
    const fixture = await montar();
    const texto = fixture.nativeElement.textContent as string;

    expect(
      fixture.nativeElement.querySelectorAll('[role="radio"]').length,
    ).toBe(0);
    expect(fixture.nativeElement.querySelector('#marca')).toBeNull();
    expect(texto).toContain('Oficina');
    expect(texto).toContain('La apariencia del Taller la configura el Dueño.');
    expect(texto).not.toContain('permiso');
  });
});
