import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';

export type CodigoIdioma = 'es' | 'en' | 'fr' | 'de';

export interface Idioma {
  codigo: CodigoIdioma;
  nombre: string; // nombre nativo del idioma
}

export const IDIOMAS: Idioma[] = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'fr', nombre: 'Français' },
  { codigo: 'de', nombre: 'Deutsch' },
];

export const IDIOMA_POR_DEFECTO: CodigoIdioma = 'es';
const CLAVE = 'idioma';

/**
 * Gestiona el idioma de la app:
 *  1. Si el usuario eligió uno, se usa (se guarda con Capacitor Preferences).
 *  2. Si no, se usa el idioma del dispositivo cuando es uno de los soportados.
 *  3. En cualquier otro caso, Español (idioma por defecto).
 */
@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private readonly translate = inject(TranslateService);
  readonly actual = signal<CodigoIdioma>(IDIOMA_POR_DEFECTO);
  readonly elegidoPorUsuario = signal(false);

  async iniciar(): Promise<void> {
    this.translate.addLangs(IDIOMAS.map((i) => i.codigo));
    this.translate.setFallbackLang(IDIOMA_POR_DEFECTO);
    const { value } = await Preferences.get({ key: CLAVE });
    const guardado = this.soportado(value);
    this.elegidoPorUsuario.set(!!guardado);
    this.aplicar(guardado ?? this.idiomaDispositivo());
  }

  async cambiar(codigo: CodigoIdioma): Promise<void> {
    this.elegidoPorUsuario.set(true);
    this.aplicar(codigo);
    await Preferences.set({ key: CLAVE, value: codigo });
  }

  async usarIdiomaDispositivo(): Promise<void> {
    this.elegidoPorUsuario.set(false);
    await Preferences.remove({ key: CLAVE });
    this.aplicar(this.idiomaDispositivo());
  }

  idiomaDispositivo(): CodigoIdioma {
    const preferidos = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of preferidos) {
      const codigo = this.soportado(tag?.slice(0, 2).toLowerCase());
      if (codigo) return codigo;
    }
    return IDIOMA_POR_DEFECTO;
  }

  private aplicar(codigo: CodigoIdioma): void {
    this.actual.set(codigo);
    this.translate.use(codigo);
    document.documentElement.lang = codigo;
  }

  private soportado(valor: string | null | undefined): CodigoIdioma | null {
    return IDIOMAS.some((i) => i.codigo === valor) ? (valor as CodigoIdioma) : null;
  }
}
