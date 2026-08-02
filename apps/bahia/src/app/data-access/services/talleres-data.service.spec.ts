import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { TalleresDataService } from './talleres-data.service';

describe('TalleresDataService', () => {
  let service: TalleresDataService;

  beforeEach(async () => {
    await resetBahiaDbForTests();
    service = TestBed.inject(TalleresDataService);
  });

  it('returns the seeded taller', async () => {
    const talleres = await firstValueFrom(service.getAll());
    expect(talleres).toHaveLength(1);
    expect(talleres[0].nombre).toBe('Taller Bahía Centro');
  });
});
