export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-20 h-20 bg-green-200 rounded-full" />
        <div className="h-5 w-40 bg-green-200 rounded-full" />
        <div className="h-3 w-24 bg-green-100 rounded-full" />
      </div>
    </div>
  );
}
