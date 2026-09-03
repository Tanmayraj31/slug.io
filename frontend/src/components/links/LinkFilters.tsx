import type { StatusFilter } from "@/hooks/useLinks";

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Disabled", value: "DISABLED" },
];

interface LinkFiltersProps {
  active: StatusFilter;
  onChange: (filter: StatusFilter) => void;
}

export function LinkFilters({ active, onChange }: LinkFiltersProps) {
  return (
    <div role="tablist" aria-label="Filter links by status" className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white/60 p-1 backdrop-blur">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          role="tab"
          aria-selected={active === filter.value}
          onClick={() => onChange(filter.value)}
          className={`rounded-md px-4 py-2 text-base font-medium transition-all duration-300 ${
            active === filter.value
              ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
