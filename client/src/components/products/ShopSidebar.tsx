import type { UseQueryResult } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { hasActiveFilters, type ShopFilters } from "@/features/products/filters";
import type { Category } from "@/features/products/types";
import { dollarsToCents } from "@/lib/money";

function SearchForm({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex gap-2">
      <Label htmlFor="shop-search" className="sr-only">
        Search products
      </Label>
      <Input
        id="shop-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products"
        maxLength={100}
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}

function CategoryList({
  selected,
  query,
  onSelect,
}: {
  selected: string;
  query: UseQueryResult<Category[]>;
  onSelect: (slug: string) => void;
}) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-label="Loading categories">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return <p className="text-sm text-muted-foreground">Categories could not be loaded.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={selected === "" ? "secondary" : "ghost"}
        size="sm"
        className="justify-start"
        aria-pressed={selected === ""}
        onClick={() => onSelect("")}
      >
        All products
      </Button>
      {query.data.map((category) => (
        <Button
          key={category.id}
          variant={selected === category.slug ? "secondary" : "ghost"}
          size="sm"
          className="justify-between"
          aria-pressed={selected === category.slug}
          onClick={() => onSelect(selected === category.slug ? "" : category.slug)}
        >
          <span>{category.name}</span>
          <span className="text-xs text-muted-foreground">{category.productCount}</span>
        </Button>
      ))}
    </div>
  );
}

function PriceForm({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice: string;
  maxPrice: string;
  onApply: (minPrice: string, maxPrice: string) => void;
}) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const minCents = dollarsToCents(min);
    const maxCents = dollarsToCents(max);

    if ((min.trim() && minCents === undefined) || (max.trim() && maxCents === undefined)) {
      setError("Enter amounts like 19.99");
      return;
    }

    if (minCents !== undefined && maxCents !== undefined && minCents > maxCents) {
      setError("The minimum must not be above the maximum");
      return;
    }

    setError(null);
    onApply(min.trim(), max.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="min-price" className="text-xs text-muted-foreground">
            Min price
          </Label>
          <Input
            id="min-price"
            inputMode="decimal"
            placeholder="0"
            value={min}
            onChange={(event) => setMin(event.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="max-price" className="text-xs text-muted-foreground">
            Max price
          </Label>
          <Input
            id="max-price"
            inputMode="decimal"
            placeholder="Any"
            value={max}
            onChange={(event) => setMax(event.target.value)}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary" size="sm">
        Apply price
      </Button>
    </form>
  );
}

type ShopSidebarProps = {
  filters: ShopFilters;
  categoriesQuery: UseQueryResult<Category[]>;
  onChange: (changes: Partial<ShopFilters>) => void;
  onClear: () => void;
};

export function ShopSidebar({ filters, categoriesQuery, onChange, onClear }: ShopSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* key: when the URL changes the filter, the form restarts with the new value */}
      <SearchForm
        key={filters.search}
        initialValue={filters.search}
        onSearch={(search) => onChange({ search })}
      />

      <Separator />

      <section aria-labelledby="categories-heading" className="flex flex-col gap-3">
        <h2 id="categories-heading" className="text-sm font-semibold">
          Categories
        </h2>
        <CategoryList
          selected={filters.category}
          query={categoriesQuery}
          onSelect={(category) => onChange({ category })}
        />
      </section>

      <Separator />

      <section aria-labelledby="price-heading" className="flex flex-col gap-3">
        <h2 id="price-heading" className="text-sm font-semibold">
          Price (USD)
        </h2>
        <PriceForm
          key={`${filters.minPrice}-${filters.maxPrice}`}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </section>

      {hasActiveFilters(filters) && (
        <Button variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
