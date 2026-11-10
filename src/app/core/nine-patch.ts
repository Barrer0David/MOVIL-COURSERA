/**
 * Implementación del formato nine-patch (.9.png) de Android para la web/WebView.
 *
 * Lee las guías negras de 1 px del borde de la imagen y la dibuja en un <canvas>
 * estirando ÚNICAMENTE las zonas marcadas, exactamente como lo hace Android con
 * los recursos NinePatchDrawable. Así el marcianito Android (zona no estirable)
 * nunca se deforma, sin importar el tamaño u orientación de la pantalla.
 */

export interface Segmento {
  inicio: number; // en píxeles de la imagen original (sin el borde de guías)
  fin: number;
  estirable: boolean;
}

export interface NinePatch {
  imagen: HTMLCanvasElement; // imagen sin el borde de guías
  ancho: number;
  alto: number;
  segmentosX: Segmento[];
  segmentosY: Segmento[];
  contenidoX: [number, number];
  contenidoY: [number, number];
}

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

const esGuia = (data: Uint8ClampedArray, i: number) =>
  data[i + 3] > 128 && data[i] < 32 && data[i + 1] < 32 && data[i + 2] < 32;

function leerSegmentos(marcas: boolean[]): Segmento[] {
  const segmentos: Segmento[] = [];
  marcas.forEach((estirable, i) => {
    const ultimo = segmentos[segmentos.length - 1];
    if (ultimo && ultimo.estirable === estirable) {
      ultimo.fin = i + 1;
    } else {
      segmentos.push({ inicio: i, fin: i + 1, estirable });
    }
  });
  return segmentos;
}

function leerRango(marcas: boolean[]): [number, number] {
  const inicio = marcas.indexOf(true);
  const fin = marcas.lastIndexOf(true);
  return inicio === -1 ? [0, marcas.length] : [inicio, fin + 1];
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar el nine-patch: ${url}`));
    img.src = url;
  });
}

/** Carga un archivo .9.png y extrae sus zonas estirables y de contenido. */
export async function cargarNinePatch(url: string): Promise<NinePatch> {
  const img = await cargarImagen(url);
  const lienzo = document.createElement('canvas');
  lienzo.width = img.naturalWidth;
  lienzo.height = img.naturalHeight;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, lienzo.width, lienzo.height);

  const ancho = lienzo.width - 2;
  const alto = lienzo.height - 2;
  const pixel = (x: number, y: number) => esGuia(data, (y * lienzo.width + x) * 4);

  const superior = Array.from({ length: ancho }, (_, x) => pixel(x + 1, 0));
  const izquierda = Array.from({ length: alto }, (_, y) => pixel(0, y + 1));
  const inferior = Array.from({ length: ancho }, (_, x) => pixel(x + 1, alto + 1));
  const derecha = Array.from({ length: alto }, (_, y) => pixel(ancho + 1, y + 1));

  const imagen = document.createElement('canvas');
  imagen.width = ancho;
  imagen.height = alto;
  imagen.getContext('2d')!.drawImage(lienzo, 1, 1, ancho, alto, 0, 0, ancho, alto);

  return {
    imagen,
    ancho,
    alto,
    segmentosX: leerSegmentos(superior),
    segmentosY: leerSegmentos(izquierda),
    contenidoX: leerRango(inferior),
    contenidoY: leerRango(derecha),
  };
}

/**
 * Calcula, para un eje, en qué coordenada destino empieza cada segmento.
 * Los segmentos fijos conservan su tamaño (multiplicado por la escala) y el
 * espacio sobrante se reparte entre los estirables de forma proporcional.
 */
function distribuir(segmentos: Segmento[], destino: number, escala: number): number[] {
  const fijo = segmentos.filter((s) => !s.estirable).reduce((t, s) => t + (s.fin - s.inicio), 0);
  const estirable = segmentos.filter((s) => s.estirable).reduce((t, s) => t + (s.fin - s.inicio), 0);
  const sobrante = Math.max(0, destino - fijo * escala);
  const posiciones = [0];
  for (const s of segmentos) {
    const largo = s.fin - s.inicio;
    const tam = s.estirable ? (estirable ? (sobrante * largo) / estirable : 0) : largo * escala;
    posiciones.push(posiciones[posiciones.length - 1] + tam);
  }
  return posiciones;
}

/** Convierte una coordenada de la imagen original a coordenada de pantalla. */
function mapear(valor: number, segmentos: Segmento[], posiciones: number[]): number {
  for (let i = 0; i < segmentos.length; i++) {
    const s = segmentos[i];
    if (valor <= s.fin) {
      const t = (valor - s.inicio) / (s.fin - s.inicio);
      return posiciones[i] + t * (posiciones[i + 1] - posiciones[i]);
    }
  }
  return posiciones[posiciones.length - 1];
}

/** Escala máxima a la que caben las zonas fijas dentro del destino. */
export function escalaMaxima(np: NinePatch, ancho: number, alto: number): number {
  const fijo = (segs: Segmento[]) => segs.filter((s) => !s.estirable).reduce((t, s) => t + s.fin - s.inicio, 0);
  return Math.min(ancho / fijo(np.segmentosX), alto / fijo(np.segmentosY));
}

/**
 * Dibuja el nine-patch ocupando todo el canvas y devuelve el rectángulo de
 * contenido (en px CSS) definido por las guías derecha e inferior.
 */
export function dibujarNinePatch(
  ctx: CanvasRenderingContext2D,
  np: NinePatch,
  ancho: number,
  alto: number,
  escalaDeseada: number,
): Rect {
  // Una sola escala para ambos ejes: las zonas fijas mantienen su proporción.
  const escala = Math.min(escalaDeseada, escalaMaxima(np, ancho, alto));
  const px = distribuir(np.segmentosX, ancho, escala);
  const py = distribuir(np.segmentosY, alto, escala);

  ctx.clearRect(0, 0, ancho, alto);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  np.segmentosY.forEach((sy, j) => {
    np.segmentosX.forEach((sx, i) => {
      const dx = Math.floor(px[i]);
      const dy = Math.floor(py[j]);
      const dw = Math.ceil(px[i + 1]) - dx;
      const dh = Math.ceil(py[j + 1]) - dy;
      if (dw <= 0 || dh <= 0) return;
      ctx.drawImage(np.imagen, sx.inicio, sy.inicio, sx.fin - sx.inicio, sy.fin - sy.inicio, dx, dy, dw, dh);
    });
  });

  const x0 = mapear(np.contenidoX[0], np.segmentosX, px);
  const x1 = mapear(np.contenidoX[1], np.segmentosX, px);
  const y0 = mapear(np.contenidoY[0], np.segmentosY, py);
  const y1 = mapear(np.contenidoY[1], np.segmentosY, py);
  return { x: x0, y: y0, ancho: x1 - x0, alto: y1 - y0 };
}
