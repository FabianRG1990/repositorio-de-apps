// PROTOTYPE — barra flotante para cambiar entre variantes. Descartable, oculta fuera de desarrollo.
import {
  Component,
  HostListener,
  computed,
  input,
  isDevMode,
  output,
} from '@angular/core';

export interface VariantePrototipo {
  clave: string;
  nombre: string;
}

@Component({
  selector: 'app-prototype-switcher',
  template: `
    @if (esDevMode) {
      <div class="switcher" role="toolbar" aria-label="Selector de variantes de prototipo">
        <button type="button" class="switcher__flecha" (click)="anterior()" aria-label="Variante anterior">
          ←
        </button>
        <span class="switcher__label">{{ etiquetaActual() }}</span>
        <button type="button" class="switcher__flecha" (click)="siguiente()" aria-label="Variante siguiente">
          →
        </button>
      </div>
    }
  `,
  styles: `
    .switcher {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #111;
      color: #fff;
      padding: 0.5rem 0.75rem;
      border-radius: 999px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 35%);
      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;
      font-size: 0.8rem;
      z-index: 9999;
    }

    .switcher__flecha {
      appearance: none;
      border: none;
      background: rgb(255 255 255 / 12%);
      color: inherit;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }

    .switcher__flecha:hover {
      background: rgb(255 255 255 / 22%);
    }

    .switcher__label {
      min-width: 12ch;
      text-align: center;
    }
  `,
})
export class PrototypeSwitcher {
  variantes = input.required<VariantePrototipo[]>();
  actual = input.required<string>();
  cambio = output<string>();

  protected readonly esDevMode = isDevMode();

  etiquetaActual = computed(() => {
    const v = this.variantes().find((x) => x.clave === this.actual());
    return v ? `${v.clave} — ${v.nombre}` : this.actual();
  });

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName;
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      target?.isContentEditable
    ) {
      return;
    }
    if (e.key === 'ArrowLeft') this.anterior();
    if (e.key === 'ArrowRight') this.siguiente();
  }

  anterior() {
    this.mover(-1);
  }

  siguiente() {
    this.mover(1);
  }

  private mover(delta: number) {
    const lista = this.variantes();
    const i = lista.findIndex((v) => v.clave === this.actual());
    const siguiente = (i + delta + lista.length) % lista.length;
    this.cambio.emit(lista[siguiente].clave);
  }
}
