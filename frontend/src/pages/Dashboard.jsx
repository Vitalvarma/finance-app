import { useEffect } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Activity,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import useDashboardStore from "../stores/dashboardStore";
import useAuthStore from "../stores/authStore";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"];

const fmt = (n) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Number(n || 0).toFixed(2)}`;

const Dashboard = () => {
  const { user } = useAuthStore();
  const { summary, trends, categoryBreakdown, recentActivity, loading, fetchAll } = useDashboardStore();

  useEffect(() => { fetchAll(user?.role); }, [user?.role]);

  const trendData = trends.map((t) => ({
    name: `${MONTH_NAMES[t.month]} ${t.year}`,
    Income: t.income || 0,
    Expense: t.expense || 0,
  }));

  const pieData = [...new Set(categoryBreakdown.map((b) => b.category))].map((cat) => ({
    name: cat,
    value: categoryBreakdown.filter((b) => b.category === cat).reduce((s, b) => s + b.total, 0),
  }));

  const canSeeCharts = user?.role === "analyst" || user?.role === "admin";

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {user?.name}. Here's your financial overview.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
        )}

        {/* Stat Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Total Income"
              value={fmt(summary.totalIncome)}
              icon={TrendingUp}
              color="green"
              sub={`${summary.incomeCount} transactions`}
            />
            <StatCard
              title="Total Expenses"
              value={fmt(summary.totalExpenses)}
              icon={TrendingDown}
              color="red"
              sub={`${summary.expenseCount} transactions`}
            />
            <StatCard
              title="Net Balance"
              value={fmt(summary.netBalance)}
              icon={Wallet}
              color={summary.netBalance >= 0 ? "indigo" : "amber"}
              sub={summary.netBalance >= 0 ? "Surplus" : "Deficit"}
            />
            <StatCard
              title="Total Transactions"
              value={summary.totalTransactions}
              icon={Activity}
              color="blue"
              sub="All time"
            />
          </div>
        )}

        {/* Charts — analyst & admin only */}
        {canSeeCharts && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
            {/* Line chart */}
            <div className="card xl:col-span-2">
              <h3 className="text-base font-semibold text-gray-800 mb-5">Monthly Trends</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                    <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, undefined]} />
                    <Legend />
                    <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No trend data yet.</div>
              )}
            </div>

            {/* Pie chart */}
            <div className="card">
              <h3 className="text-base font-semibold text-gray-800 mb-5">Category Split</h3>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, undefined]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-3">
                    {pieData.slice(0, 5).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-gray-600 truncate max-w-[100px]">{d.name}</span>
                        </div>
                        <span className="font-medium text-gray-800">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No category data yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-5">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Date", "Category", "Type", "Amount", "Notes"].map((h) => (
                      <th key={h} className="text-left text-gray-500 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentActivity.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 text-gray-500">{new Date(t.date).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">{t.category}</td>
                      <td className="py-3 pr-4">
                        <span className={t.type === "income" ? "badge-income" : "badge-expense"}>
                          {t.type === "income" ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                          {t.type}
                        </span>
                      </td>
                      <td className={`py-3 pr-4 font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </td>
                      <td className="py-3 text-gray-400 truncate max-w-[180px]">{t.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
