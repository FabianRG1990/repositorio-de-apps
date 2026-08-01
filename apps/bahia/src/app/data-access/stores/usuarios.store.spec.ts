import { TestBed } from '@angular/core/testing';
import { UsuariosStore } from './usuarios.store';

describe('UsuariosStore', () => {
  it('loads the seeded usuarios on init', () => {
    const store = TestBed.inject(UsuariosStore);
    expect(store.entities()).toHaveLength(3);
  });
});
