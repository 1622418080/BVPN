export default function LoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </main>
  );
}
