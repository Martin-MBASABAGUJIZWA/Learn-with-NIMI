"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Trophy, User, BookOpenCheck, Clock4, AlertTriangle } from "lucide-react";

interface MetricState {
  students: number;
  courses: number;
  todayLogins: number;
  todayMissions: number;
  pendingSubmissions: number;
}

interface TrendData { date: string; count: number; }
interface TopStudent { student_id: number; count: number; }
interface Submission { id: number; student_id: number; submitted_at: string; title: string; }

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<MetricState | null>(null);
  const [loginTrend, setLoginTrend] = useState<TrendData[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [recentSubs, setRecentSubs] = useState<Submission[]>([]);
  const [statusOk, setStatusOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];

        const [
          { count: students },
          { count: courses },
          { count: todayLogins },
          { count: todayMissions },
          { count: pendingSubmissions },
        ] = await Promise.all([
          supabase.from("students").select("id", { count: "exact" }),
          supabase.from("courses").select("id", { count: "exact" }),
          supabase.from("logins").select("id", { count: "exact" }).eq("date", today),
          supabase.from("mission_completions").select("id", { count: "exact" }).eq("date", today),
          supabase.from("submissions").select("id", { count: "exact" }).eq("status", "pending"),
        ]);

        setMetrics({
          students: students ?? 0,
          courses: courses ?? 0,
          todayLogins: todayLogins ?? 0,
          todayMissions: todayMissions ?? 0,
          pendingSubmissions: pendingSubmissions ?? 0,
        });

        const { data: trendData } = await supabase.rpc("get_login_trend");
        setLoginTrend(trendData || []);

        const { data: topData } = await supabase
          .from("mission_completions")
          .select("student_id, count:id", { count: "exact" })
          .group("student_id")
          .order("count", { ascending: false })
          .limit(3);
        setTopStudents(topData || []);

        const { data: subsData } = await supabase
          .from("submissions")
          .select("id, student_id, submitted_at, title")
          .order("submitted_at", { ascending: false })
          .limit(5);
        setRecentSubs(subsData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setStatusOk(false);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="animate-spin h-10 w-10 text-[#5e548e]" />
    </div>
  );

  return (
    <div className="p-6 space-y-10 bg-[#f9f7f2] min-h-screen">
      <h1 className="text-3xl font-bold text-[#5e548e]">Good morning, Admin 🎉</h1>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-xl font-semibold text-[#5e548e]">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push("/admin/missions/create")}
            className="px-4 py-2 bg-[#5e548e] text-white rounded hover:bg-[#3f3560] transition"
          >
            ➕ Create Mission
          </button>
          <button
            onClick={() => router.push("/admin/students/create")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            🎓 Add Student
          </button>
          <button
            onClick={() => router.push("/admin/courses/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            📚 Add Course
          </button>
          <button
            onClick={() => router.push("/admin/assign")}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
          >
            🧠 Assign Daily Mission
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[{
          label: "Total Students",
          value: metrics?.students,
          icon: <User className="text-blue-600" />,
        }, {
          label: "Active Courses",
          value: metrics?.courses,
          icon: <BookOpenCheck className="text-green-600" />,
        }, {
          label: "Logins Today",
          value: metrics?.todayLogins,
          icon: <Clock4 className="text-indigo-600" />,
        }, {
          label: "Missions Done Today",
          value: metrics?.todayMissions,
          icon: <Trophy className="text-pink-600" />,
        }, {
          label: "Pending Submissions",
          value: metrics?.pendingSubmissions,
          icon: <AlertTriangle className="text-yellow-600" />,
        }, {
          label: "System Status",
          value: statusOk ? "✅ OK" : "❌ Offline",
          icon: statusOk ? <span className="text-green-600">🟢</span> : <span className="text-red-600">🔴</span>,
        }].map(({ label, value, icon }) => (
          <Card key={label} className="rounded-xl shadow hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-[#5e548e]">{value}</p>
              </div>
              {icon}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Login Trend */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-[#5e548e] mb-4">
          Login Activity (Last 7 Days)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={loginTrend}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#5e548e" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Students */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-[#5e548e] mb-4">
          Top Students This Week 🎓
        </h2>
        <ul className="space-y-3">
          {topStudents.map((s) => (
            <li key={s.student_id} className="flex justify-between text-sm">
              <span>🎖️ Student #{s.student_id}</span>
              <span className="text-gray-500">{(s as any).count} missions</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-[#5e548e] mb-4">
          Recent Submissions 📥
        </h2>
        <ul className="space-y-3">
          {recentSubs.map(sub => (
            <li key={sub.id} className="flex justify-between text-sm text-gray-700">
              <span>📄 {sub.title} — Student #{sub.student_id}</span>
              <span className="text-gray-400">
                {new Date(sub.submitted_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}