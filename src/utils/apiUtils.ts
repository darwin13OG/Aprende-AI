/**
 * Utility to safely fetch JSON from the API backend.
 * Provides clear, friendly error messages if running on static hosts (like Cloudflare Pages)
 * where the Express backend (/api/*) is not present.
 */

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    // Check if response is not JSON (e.g. 404 HTML page returned by static hosting)
    if (!contentType.includes('application/json')) {
      const rawText = await res.text();
      if (!res.ok) {
        if (res.status === 404) {
          return {
            ok: false,
            status: 404,
            error:
              'El servidor backend (/api) no fue encontrado (Error 404). En Cloudflare Pages necesitas vincular la URL del backend o desplegar el servidor en Cloud Run / Render.',
          };
        }
        return {
          ok: false,
          status: res.status,
          error: `Error del servidor (${res.status}): ${rawText.slice(0, 120) || 'Respuesta no válida'}`,
        };
      }

      // If ok but returned HTML
      return {
        ok: false,
        status: res.status,
        error:
          'La respuesta del servidor no tiene formato JSON. Asegúrate de que el backend de Node.js esté activo.',
      };
    }

    try {
      const data = await res.json();
      return {
        ok: res.ok,
        status: res.status,
        data,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        error:
          'Error al procesar los datos JSON devueltos por el servidor. Respuesta incompleta o no válida.',
      };
    }
  } catch (networkErr: any) {
    return {
      ok: false,
      status: 0,
      error:
        networkErr?.message ||
        'Error de conexión con el servidor. Verifica tu conexión a internet.',
    };
  }
}
