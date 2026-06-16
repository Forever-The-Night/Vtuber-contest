export default function AdminLoading() {
  return (
    <main className="page-shell grid gap-6">
      <div>
        <div className="h-9 w-36 rounded-md bg-black/10" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className="h-10 w-24 rounded-md bg-white/70 shadow-sm" />
          ))}
        </div>
      </div>
      <section className="grid gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="panel grid gap-3 p-5">
            <div className="h-6 w-44 rounded-md bg-black/10" />
            <div className="h-4 w-3/4 rounded-md bg-black/5" />
            <div className="h-4 w-1/2 rounded-md bg-black/5" />
          </div>
        ))}
      </section>
    </main>
  );
}
