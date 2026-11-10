import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { language } from 'ionicons/icons';

import { IDIOMAS, IdiomaService } from '../core/idioma.service';
import { Rect } from '../core/nine-patch';
import { FondoNinePatchComponent } from '../shared/fondo-nine-patch.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, TranslatePipe, FondoNinePatchComponent],
})
export class HomePage {
  protected readonly idioma = inject(IdiomaService);
  private readonly translate = inject(TranslateService);
  private readonly hojaAcciones = inject(ActionSheetController);

  /** Zona donde va el texto, según las guías de contenido del nine-patch. */
  protected readonly zona = signal<Rect | null>(null);

  constructor() {
    addIcons({ language });
  }

  protected async elegirIdioma(): Promise<void> {
    const t = (clave: string) => this.translate.instant(clave);
    const hoja = await this.hojaAcciones.create({
      header: t('IDIOMA.TITULO'),
      cssClass: 'hoja-idioma',
      buttons: [
        ...IDIOMAS.map((i) => ({
          text: i.nombre,
          cssClass: this.idioma.elegidoPorUsuario() && i.codigo === this.idioma.actual() ? 'activo' : undefined,
          handler: () => void this.idioma.cambiar(i.codigo),
        })),
        {
          text: t('IDIOMA.DISPOSITIVO'),
          cssClass: this.idioma.elegidoPorUsuario() ? undefined : 'activo',
          handler: () => void this.idioma.usarIdiomaDispositivo(),
        },
        { text: t('IDIOMA.CANCELAR'), role: 'cancel' },
      ],
    });
    await hoja.present();
  }
}
