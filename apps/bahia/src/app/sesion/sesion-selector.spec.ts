import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../data-access/persistence/bahia-db';
import { SesionStore } from '../data-access/stores/sesion.store';
import { UsuariosStore } from '../data-access/stores/usuarios.store';
import { waitFor } from '../data-access/testing/wait-for';
import { SesionSelector } from './sesion-selector';

describe('SesionSelector', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('lists the seeded usuarios when there is no active sesion', async () => {
    const usuariosStore = TestBed.inject(UsuariosStore);
    await waitFor(() => usuariosStore.cargado());

    const fixture = TestBed.createComponent(SesionSelector);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const botones = compiled.querySelectorAll('.sesion__usuario');
    expect(botones).toHaveLength(3);
    expect(compiled.textContent).toContain('¿Quién eres?');
  });

  it('shows the active usuario and its permisos after iniciarSesion', async () => {
    const usuariosStore = TestBed.inject(UsuariosStore);
    await waitFor(() => usuariosStore.cargado());

    const fixture = TestBed.createComponent(SesionSelector);
    fixture.detectChanges();
    await fixture.whenStable();

    const sesionStore = TestBed.inject(SesionStore);
    const [primerUsuario] = usuariosStore.entities();
    sesionStore.iniciarSesion(primerUsuario);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(primerUsuario.nombre);
    expect(compiled.querySelector('.sesion__boton')?.textContent).toContain(
      'Cambiar de usuario',
    );
  });
});
