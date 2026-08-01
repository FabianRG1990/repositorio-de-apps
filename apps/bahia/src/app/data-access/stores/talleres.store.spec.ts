import { TestBed } from '@angular/core/testing';
import { TalleresStore } from './talleres.store';

describe('TalleresStore', () => {
  it('loads the seeded taller on init', () => {
    const store = TestBed.inject(TalleresStore);
    expect(store.entities()).toHaveLength(1);
    expect(store.entities()[0].nombre).toBe('Taller Bahía Centro');
  });
});
