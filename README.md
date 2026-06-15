# Game OST Guesser

Aplicación web para adivinar videojuegos a partir de fragmentos de sus bandas sonoras (OST). Inspirada en Wordle y Heardle, con estética táctica inspirada en menús militares modernos.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite, React Query, Zustand, React Router, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Media (local) | Python, Flask, yt-dlp, ffmpeg |
| Datos | JSON local (`data/levels.json`) |
| API juegos | [RAWG API](https://rawg.io/apidocs) |

## Estructura del proyecto

```
ostdle/
├── frontend/          # App React
├── backend/           # API Express
├── python-service/    # Descarga y recorte de audio (uso local)
├── data/
│   └── levels.json    # Niveles del juego
├── assets/
│   └── audio/         # Fragmentos de audio
└── .env               # Variables de entorno
```

## Requisitos

- **Node.js** 20+
- **Python** 3.10+ (solo para el panel admin / generación de niveles)
- **ffmpeg** instalado en el sistema (para recortar audio)
- **Clave RAWG API** gratuita en [rawg.io/apidocs](https://rawg.io/apidocs)

## Configuración

1. Clona el repositorio e instala dependencias:

```bash
npm run install:all
```

2. Copia el archivo de entorno:

```bash
cp .env.example .env
```

3. Añade tu clave RAWG en `.env`:

```
RAWG_API_KEY=tu_clave_aqui
```

4. (Opcional) Instala el servicio Python para generar niveles desde YouTube:

```bash
cd python-service
pip install -r requirements.txt
```

## Desarrollo

Arrancar backend + frontend:

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

O ambos a la vez:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Panel admin: http://localhost:5173/admin (solo en desarrollo)

### Servicio Python (opcional, para admin)

Solo necesario si quieres buscar vídeos en YouTube y generar fragmentos de audio desde el panel `/admin`:

```bash
npm run dev:python
```

Requisitos: `ffmpeg` en PATH y dependencias Python instaladas.

## Mecánica del juego

- Cada nivel reproduce un fragmento de OST de un videojuego.
- Empiezas con **1 segundo** de audio y **5 vidas**.
- Puedes fallar hasta **3 veces** antes de perder (cada error o skip consume una vida).
- Cada error o skip **añade 1 segundo** al fragmento reproducible.
- Al acertar: portada, título, año y plataformas.
- Al perder: se revela la respuesta.

## Panel de administración

Ruta: `/admin` — **solo accesible en modo desarrollo**.

Permite:

1. Buscar vídeos en YouTube (o pegar URL)
2. Seleccionar fragmento con timeline visual
3. Detectar automáticamente el videojuego (RAWG)
4. Generar nivel (descarga y recorta solo el fragmento)
5. Listar, reordenar (drag & drop) y eliminar niveles

## API principal

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/levels` | Todos los niveles |
| GET | `/api/levels/daily` | Nivel del día |
| GET | `/api/levels/number/:n` | Nivel por número |
| GET | `/api/games/search?q=` | Autocompletado RAWG |
| POST | `/api/games/guess` | Comprobar respuesta |
| GET | `/api/health` | Health check |

Rutas `/api/admin/*` bloqueadas fuera de `NODE_ENV=development`.

## Formato de niveles

```json
{
  "id": "uuid",
  "gameTitle": "Metal Gear Solid 3: Snake Eater",
  "gameId": "5230",
  "coverImage": "https://...",
  "audioFile": "level_abc123.mp3"
}
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Backend + frontend (+ python si está configurado) |
| `npm run dev:backend` | Solo API |
| `npm run dev:frontend` | Solo frontend |
| `npm run dev:python` | Solo servicio media |
| `npm run build` | Build producción |

## Próximos pasos

- Rotación diaria de niveles
- Persistencia de progreso del usuario
- Modo multijugador / puntuaciones
