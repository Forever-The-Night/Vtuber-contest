export default function VoteLoading() {
  return (
    <main className="page-shell grid gap-6">
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="h-9 w-36 rounded-md bg-black/10" />
          <div className="mt-3 h-4 w-72 rounded-md bg-black/5" />
        </div>
        <div className="h-10 w-28 rounded-md bg-black/5" />
      </section>
      <section className="panel grid gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="h-9 w-20 rounded-md bg-black/5" />
          ))}
        </div>
      </section>
      <section className="gallery-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="gallery-item overflow-hidden rounded-lg border border-black/10 bg-white/80 shadow-sm">
            <div className="aspect-[3/4] bg-black/10" />
            <div className="grid gap-3 p-3">
              <div className="h-5 w-3/4 rounded-md bg-black/10" />
              <div className="h-4 w-1/2 rounded-md bg-black/5" />
              <div className="h-10 rounded-md bg-black/10" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
