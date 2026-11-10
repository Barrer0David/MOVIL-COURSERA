import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NinePatch, Rect, cargarNinePatch, dibujarNinePatch } from '../core/nine-patch';

/**
 * Fondo de pantalla completa que dibuja un archivo .9.png respetando sus
 * zonas estirables. Se redibuja al cambiar el tamaño o la orientación.
 * Emite el rectángulo de contenido para ubicar la interfaz sobre el cielo.
 */
@Component({
  selector: 'app-fondo-nine-patch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #lienzo aria-hidden="true"></canvas>`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      display: block;
      background: #0888ff;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class FondoNinePatchComponent {
  readonly src = input('assets/fondo/fondo.9.png');
  readonly contenido = output<Rect>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zona = inject(NgZone);
  private ninePatch?: NinePatch;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      this.ninePatch = await cargarNinePatch(this.src());
      const observador = new ResizeObserver(() => this.dibujar());
      this.zona.runOutsideAngular(() => observador.observe(this.host.nativeElement));
      destroyRef.onDestroy(() => observador.disconnect());
      this.dibujar();
    });
  }

  /**
   * Escala de las zonas fijas (Android + nubes): se adapta a la pantalla para
   * que en teléfonos, tabletas y escritorio, vertical u horizontal, se vea bien.
   */
  private escalaPara(ancho: number, alto: number): number {
    return Math.max(0.3, Math.min(1.15, (alto * 0.45) / 373, ancho / 600));
  }

  private dibujar(): void {
    const np = this.ninePatch;
    if (!np) return;
    const canvas = this.lienzo().nativeElement;
    const { width, height } = this.host.nativeElement.getBoundingClientRect();
    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rect = dibujarNinePatch(ctx, np, width, height, this.escalaPara(width, height));
    this.zona.run(() => this.contenido.emit(rect));
  }
}
