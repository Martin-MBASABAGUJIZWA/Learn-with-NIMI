export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4 animate-pulse">
      <div className="h-8 w-36 bg-gray-100 rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-2xl w-full" />
      ))}
    </div>
  );
}
