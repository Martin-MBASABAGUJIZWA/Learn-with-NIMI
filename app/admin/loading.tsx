export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 animate-pulse">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-56 border-r border-gray-100 bg-white shrink-0 p-4 gap-3">
        <div className="h-8 w-32 bg-gray-100 rounded-lg mb-2" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-7 bg-gray-100 rounded-lg" />
        ))}
      </div>
      {/* Main area skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 border-b border-gray-100 bg-white shrink-0 flex items-center px-6 gap-3">
          <div className="h-7 w-40 bg-gray-100 rounded-lg" />
          <div className="flex-1" />
          <div className="h-7 w-24 bg-gray-100 rounded-full" />
        </div>
        <div className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="h-8 w-48 bg-gray-100 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-100" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-xl border border-gray-100" />
        </div>
      </div>
    </div>
  );
}
