# Aprende AI 🚀
**Plataforma de Micro-Aprendizaje Activo y Estudio Multimodal con IA**

Aprende AI es una aplicación web progresiva (PWA) de alto rendimiento inspirada en el flujo de trabajo de *NotebookLM*. Permite a estudiantes, docentes y profesionales cargar cualquier material de estudio (documentos PDF, fotos de apuntes con la cámara, enlaces web o vídeos de YouTube) y transformarlo al instante en una experiencia de aprendizaje interactiva guiada por inteligencia artificial.

---

## ✨ Características Principales

### 📁 Entornos de Estudio Independientes
- Organiza tus proyectos o materias en **Entornos** dedicados.
- Cada entorno conserva sus propias fuentes, historial de chat interactivo y módulos generados.
- Nomenclatura secuencial inteligente (*"Nuevo Entorno"*, *"Nuevo Entorno 2"*, etc.) con edición y eliminación rápida.

### 📚 Fuentes Multimodales
- **Documentos PDF y Archivos de Texto**: Extracción y análisis de contenido estructurado.
- **Cámara Directa y Fotos**: Captura instantánea de pizarras, apuntes de cuaderno o páginas de libros.
- **Enlaces Web y YouTube**: Procesamiento de artículos y recursos en línea.
- **Notas de Texto**: Apuntes rápidos enriquecidos.

### 💬 Chat Interactivo con Fuentes
- Tutor virtual que responde basándose **exclusivamente en tus fuentes cargadas**.
- Cita de fuentes en cada respuesta para verificar la procedencia de la información.
- **Reconocimiento y Renderizado Enriquecido de Markdown**: Bolds (`**texto**`), cursivas y subtítulos (`*texto*`), listas numeradas y viñetas, bloques de código, citas y divisores (`---`).
- **Dictado por Voz**: Integración nativa con Web Speech API para formular preguntas hablando.
- Interfaz pulida y limpia sin barras de desplazamiento intrusivas (`no-scrollbar`).

### ⚡ Experiencias de Aprendizaje Generadas por IA
1. **Cuestionario Interactivo (Quiz)**:
   - Preguntas de opción múltiple calculadas según la profundidad del material.
   - Cronómetro de sesión y cálculo de precisión en vivo.
   - Explicación didáctica inmediata tras cada respuesta y citación de la fuente.
   - Confeti al completar el reto con puntuación destacada.

2. **Flashcards 3D de Repaso Espaciado**:
   - Tarjetas interactivas con volteo 3D táctil (`perspective-1000`).
   - Categorización del ritmo de dominio (*Fácil*, *Normal*, *Difícil*).
   - Indicador de progreso y resumen final de asimilación.

3. **Mapa Mental Conceptual**:
   - Grafo jerárquico generado dinámicamente con nodos centrales, ramas principales y conceptos derivados.
   - Paneo y zoom interactivos con recentrado rápido.
   - Esquema de colores por nivel para facilitar la memoria visual.

### 🔗 Enlaces Compartibles Cortos
- Comparte el paquete completo de estudio o un módulo específico (*Solo Cuestionario*, *Solo Flashcards*, *Solo Mapa*).
- **Privacidad Garantizada**: El destinatario recibe el material de estudio generado sin tener acceso a tu chat privado ni a los archivos fuente originales.
- Rutas amigables y limpias (`#share?id=...`, `#quiz?id=...`, `#cards?id=...`, `#map?id=...`).

### 📱 Progressive Web App (PWA)
- **Instalable** en Android, iOS (Safari "Agregar a pantalla de inicio") y ordenadores (Chrome/Edge).
- **Experiencia Nativa a Pantalla Completa**: Sin barras del navegador.
- **Barra de Estado Móvil**: Cabecera ajustada con soporte para áreas seguras (`safe-area-inset-top`) y color predeterminado negro/oscuro (`#070d1a`) para integrarse con la hora y los indicadores del teléfono.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**:
  - React 19 + TypeScript
  - Tailwind CSS v4
  - Motion (`motion/react`) para transiciones fluidas
  - `react-markdown` + `remark-gfm` para análisis fiel de respuestas de la IA
  - `lucide-react` para iconografía consistente
  - `canvas-confetti` para retroalimentación positiva
- **Backend y Conectividad**:
  - Express.js (servidor proxy seguro para llamadas a Gemini)
  - Google Gen AI SDK (`@google/genai`) con modelos `gemini-2.5-flash` y fallback a `gemini-1.5-flash`
  - `lz-string` para compresión eficiente de paquetes de estudio
- **PWA**:
  - `vite-plugin-pwa` + Workbox
  - Web App Manifest con iconos de alta resolución y soporte de máscaras (`maskable`)

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Node.js 18 o superior
- Clave de API de Google Gemini (obtenible gratuitamente en [Google AI Studio](https://aistudio.google.com/))

### Instalación

1. Clona el repositorio o abre el proyecto:
   ```bash
   git clone <url-del-repositorio>
   cd aprende-ai
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura tu clave de API en un archivo `.env`:
   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   ```
   *(Nota: Los usuarios también pueden introducir su clave directamente desde la interfaz si se agotan las cuotas compartidas).*

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

5. Para construir la versión de producción:
   ```bash
   npm run build
   npm start
   ```

---

## 📄 Licencia
Este proyecto está disponible bajo la licencia MIT.
