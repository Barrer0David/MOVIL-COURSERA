# Mi primer proyecto Android

Tarea del curso: app que muestra "¡Hola Mundo!" sobre un fondo con el marcianito de Android.
Está hecha con Ionic (Angular) y Capacitor, así que el mismo proyecto genera la app Android.

## Requisitos de la tarea

**1. Idiomas.** Español (por defecto), inglés, francés y alemán. Los textos están en
`src/assets/i18n/`. La app toma el idioma del teléfono y, si no es ninguno de esos cuatro,
queda en español. También se puede cambiar con el botón de idioma de la barra superior.
En Android el nombre de la app está traducido en `res/values`, `values-en`, `values-fr` y `values-de`.

**2. Fondo nine-patch.** El archivo es `resources/fondo.9.png` y se generó a partir de la imagen
original con `tools/generar_nine_patch.py`. Las zonas que se estiran son:

- a lo ancho: el cielo y las nubes a la izquierda y a la derecha del Android;
- a lo alto: solo el cielo que queda encima del Android.

El Android queda fuera de esas zonas, por eso no se deforma. El área de contenido (bordes derecho
e inferior) es el cielo, y ahí va el texto. En Android el `.9.png` está en `res/drawable` y se usa
como fondo al abrir la app; dentro de la app lo dibuja `src/app/core/nine-patch.ts`, que lee las
guías del archivo y estira solo las partes marcadas.

**3. Varias pantallas.** El fondo se vuelve a dibujar cuando cambia el tamaño o la orientación, y
el texto ajusta su tamaño al espacio libre del cielo. Lo probé en 320×568, 360×740, 740×360
(horizontal), 768×1024 y 1024×768.

## Cómo correrlo

Necesita Node 20.19 o superior.

```bash
npm install
npm start
```

Para Android (con Android Studio instalado):

```bash
npm run android
```

Si se cambia la imagen o las zonas del nine-patch: `npm run ninepatch` (Python 3 con Pillow).
