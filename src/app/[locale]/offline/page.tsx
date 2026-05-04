export default function OfflinePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
      <span className="text-7xl">📡</span>
      <h1 className="font-display text-2xl font-bold">Sin conexión</h1>
      <p className="text-muted-foreground max-w-xs">
        No tienes conexión a internet. Las tareas que hayas completado en modo offline
        se sincronizarán cuando vuelvas a conectarte.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
      >
        Intentar de nuevo
      </button>
    </main>
  );
}
