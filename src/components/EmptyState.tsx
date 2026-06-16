export function EmptyState({ children, title }: { children?: React.ReactNode; title: string }) {
  return (
    <div className="panel grid min-h-52 place-items-center p-8 text-center">
      <div>
        <h2 className="text-xl font-black text-[#17130f]">{title}</h2>
        {children ? <div className="mt-2 text-sm font-medium text-[#6d6258]">{children}</div> : null}
      </div>
    </div>
  );
}