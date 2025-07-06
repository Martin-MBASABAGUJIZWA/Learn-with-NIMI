// app/admin/settings/page.tsx
"use client"

export default function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#5e548e]">Settings</h2>

      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span>Dark Mode</span>
          <input type="checkbox" className="toggle toggle-sm" />
        </label>

        <label className="flex items-center justify-between">
          <span>Email Notifications</span>
          <input type="checkbox" className="toggle toggle-sm" />
        </label>

        <label className="block">
          <span>Language</span>
          <select className="mt-1 block w-full border px-4 py-2 rounded">
            <option>English</option>
            <option>Kinyarwanda</option>
            <option>French</option>
          </select>
        </label>
      </div>
    </div>
  );
}
