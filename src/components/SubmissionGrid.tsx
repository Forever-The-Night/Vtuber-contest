import { SubmissionCard } from "@/components/SubmissionCard";

type Card = React.ComponentProps<typeof SubmissionCard>;

export function SubmissionGrid({ items }: { items: Card[] }) {
  if (items.length === 0) {
    return (
      <div className="panel grid min-h-64 place-items-center p-8 text-center text-[#6d6258]">
        这里还没有可展示的作品。
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <SubmissionCard key={item.id} {...item} />
      ))}
    </div>
  );
}