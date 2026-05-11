import { Category } from "@/lib/data";

const colors: Record<Category, string> = {
  Adventure: "bg-orange-100 text-orange-700",
  View: "bg-sky-100 text-sky-700",
  Hiking: "bg-emerald-100 text-emerald-700",
  Cave: "bg-stone-200 text-stone-700",
  Forest: "bg-green-100 text-green-800",
  Waterfall: "bg-cyan-100 text-cyan-700",
  Other: "bg-slate-100 text-slate-700",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[category]}`}>
      {category}
    </span>
  );
}
