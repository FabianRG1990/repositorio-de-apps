import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  ETIQUETA_PERFIL,
  OFICIO_PERFIL,
  PERFILES,
  PerfilStore,
  type Perfil,
} from '../../data-access/perfil.store';

const ICONO: Record<Perfil, IconProp> = {
  asesor: ['fas', 'headset'],
  tecnico: ['fas', 'screwdriver-wrench'],
  dueno: ['fas', 'chart-line'],
};

/**
 * Se entra eligiendo un Perfil, que es como el ADR 0005 dice que se entra.
 *
 * NO es una pantalla de inicio de sesión, y el vocabulario lo cuida: no dice
 * "iniciar sesión" ni "entrar como", no pide nada que haya que saberse, y
 * elegir mal no cuesta nada porque se cambia en un clic desde el menú. Lo que
 * pregunta es quién tiene el aparato en la mano.
 *
 * Vive fuera del Shell: sin Perfil todavía no hay menú que ofrecer, y el menú
 * es justamente una de las cosas que el Perfil decide.
 */
@Component({
  selector: 'app-entrar',
  templateUrl: './entrar.html',
  styleUrl: './entrar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule],
})
export class Entrar {
  readonly #perfiles = inject(PerfilStore);
  readonly #router = inject(Router);

  protected readonly perfiles = PERFILES;
  protected readonly etiqueta = ETIQUETA_PERFIL;
  protected readonly oficio = OFICIO_PERFIL;
  protected readonly icono = ICONO;

  protected elegir(perfil: Perfil) {
    this.#perfiles.elegir(perfil);
    /* Acá SÍ se navega, y es el único sitio donde pasa: esto es entrar. El
       cambio de Perfil desde el menú no navega, porque ahí sí habría estado
       que perder. */
    void this.#router.navigateByUrl(this.#perfiles.ofrecido().inicio);
  }
}
