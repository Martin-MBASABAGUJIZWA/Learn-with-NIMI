// app/admin/notifications/page.tsx
"use client"

export default function Notifications() {
  const notifications = [
    { id: 1, message: "New student registered", time: "2 mins ago" },
    { id: 2, message: "Mission completed by Alice", time: "1 hour ago" },
    { id: 3, message: "Reflection submitted", time: "Yesterday" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#5e548e]">Notifications</h2>

      <ul className="space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className="bg-white border-l-4 border-[#ff9a9e] p-4 rounded shadow-sm">
            <div className="flex justify-between">
              <p>{n.message}</p>
              <span className="text-sm text-gray-400">{n.time}</span>
            </div>
          </li>
        ))}
      </ul>

      <button className="text-sm text-pink-600 hover:underline">Clear all</button>
    </div>
  );
}
