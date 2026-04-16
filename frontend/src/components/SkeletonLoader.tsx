export default function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading analysis...">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>

      {/* Activity chart */}
      <div className="skeleton h-72 rounded-2xl" />

      {/* Insights */}
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}
