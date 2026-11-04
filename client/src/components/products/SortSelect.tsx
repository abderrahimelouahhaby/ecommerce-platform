import { isSort, SORT_OPTIONS, type SortValue } from "@/features/products/filters";

type SortSelectProps = {
  value: SortValue;
  onChange: (value: SortValue) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="shop-sort" className="text-muted-foreground">
        Sort by
      </label>
      <select
        id="shop-sort"
        value={value}
        onChange={(event) => {
          const next = event.target.value;

          if (isSort(next)) {
            onChange(next);
          }
        }}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
