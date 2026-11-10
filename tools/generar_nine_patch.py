"""
Genera el archivo nine-patch (fondo.9.png) a partir de la imagen original del fondo.

Un nine-patch es un PNG con un borde extra de 1 px alrededor:
  - Borde SUPERIOR  -> columnas que se pueden ESTIRAR horizontalmente.
  - Borde IZQUIERDO -> filas que se pueden ESTIRAR verticalmente.
  - Borde DERECHO   -> zona vertical donde va el CONTENIDO (padding).
  - Borde INFERIOR  -> zona horizontal donde va el CONTENIDO (padding).

Para que el marcianito Android NO se deforme:
  - Horizontalmente se estiran solo las franjas de cielo/nubes a la IZQUIERDA y a la
    DERECHA del Android (dos zonas), por lo que la columna central queda intacta.
  - Verticalmente se estira solo el cielo que esta POR ENCIMA del Android; el Android
    y las nubes de la parte inferior conservan su alto.

Uso:  python tools/generar_nine_patch.py
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "resources" / "fondo_original.png"
DESTINOS = [
    RAIZ / "resources" / "fondo.9.png",
    RAIZ / "src" / "assets" / "fondo" / "fondo.9.png",
    RAIZ / "android" / "app" / "src" / "main" / "res" / "drawable" / "fondo.9.png",
]

# Zonas medidas sobre la imagen original (1024 x 853). El Android ocupa x:440-615, y:498-691.
ESTIRABLE_X = [(16, 424), (632, 1008)]  # cielo/nubes a izquierda y derecha del Android
ESTIRABLE_Y = [(8, 470)]                # cielo por encima del Android
CONTENIDO_X = (24, 1000)                # zona de contenido horizontal
CONTENIDO_Y = (24, 470)                 # el contenido va en el cielo, sobre el Android

NEGRO = (0, 0, 0, 255)


def generar() -> Image.Image:
    original = Image.open(ORIGEN).convert("RGBA")
    w, h = original.size
    np_img = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    np_img.paste(original, (1, 1))
    px = np_img.load()

    for x0, x1 in ESTIRABLE_X:
        for x in range(x0, x1):
            px[x + 1, 0] = NEGRO
    for y0, y1 in ESTIRABLE_Y:
        for y in range(y0, y1):
            px[0, y + 1] = NEGRO
    for x in range(*CONTENIDO_X):
        px[x + 1, h + 1] = NEGRO
    for y in range(*CONTENIDO_Y):
        px[w + 1, y + 1] = NEGRO
    return np_img


if __name__ == "__main__":
    imagen = generar()
    for destino in DESTINOS:
        if not destino.parent.parent.exists() and "android" in destino.parts:
            continue  # la plataforma Android aun no se ha agregado
        destino.parent.mkdir(parents=True, exist_ok=True)
        imagen.save(destino)
        print(f"Nine-patch generado: {destino.relative_to(RAIZ)}")
