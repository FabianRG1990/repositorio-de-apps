import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
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
import { QuienUsaStore } from '../../data-access/quien-usa.store';

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
 * Desde el ticket del personal lo pregunta en dos pasos, y el segundo es
 * OPCIONAL: elegido el Papel, se ofrece decir cuál de las Personas de ese
 * Papel es. Sigue sin ser un login —nadie demuestra nada— pero es lo que
 * permite que una Orden quede a nombre de alguien sin volver a preguntarlo.
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
  protected readonly quienUsa = inject(QuienUsaStore);

  protected readonly perfiles = PERFILES;
  protected readonly etiqueta = ETIQUETA_PERFIL;
  protected readonly oficio = OFICIO_PERFIL;
  protected readonly icono = ICONO;

  /** El Papel ya elegido mientras se pregunta quién es. `null` en el paso 1. */
  protected readonly preguntando = signal<Perfil | null>(null);

  protected elegir(perfil: Perfil) {
    this.#perfiles.elegir(perfil);

    /* Sin nadie de ese Papel configurado no hay segundo paso: una pantalla con
       un título y ninguna opción se ve como una app rota, y además es el huevo
       y la gallina del primer arranque —el Dueño tiene que poder entrar a
       crear la primera Persona. */
    if (this.quienUsa.hayAQuienPreguntar()) {
      this.preguntando.set(perfil);
      return;
    }
    this.#entrar();
  }

  protected soy(personaId: string) {
    this.#perfiles.elegirPersona(personaId);
    this.#entrar();
  }

  /** Entrar sin decir quién. Es una salida, no un descuido: ver `elegir`. */
  protected sinDecir() {
    this.#perfiles.elegirPersona(null);
    this.#entrar();
  }

  protected volver() {
    this.preguntando.set(null);
  }

  #entrar() {
    /* Acá SÍ se navega, y es el único sitio donde pasa: esto es entrar. El
       cambio de Perfil desde el menú no navega, porque ahí sí habría estado
       que perder. */
    void this.#router.navigateByUrl(this.#perfiles.ofrecido().inicio);
  }
}
