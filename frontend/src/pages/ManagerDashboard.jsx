import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, PhoneIncoming } from 'lucide-react';

const data = [
  { name: 'Mon', queries: 20 },
  { name: 'Tue', queries: 40 },
  { name: 'Wed', queries: 35 },
  { name: 'Thu', queries: 50 },
  { name: 'Fri', queries: 45 },
  { name: 'Sat', queries: 30 },
  { name: 'Sun', queries: 25 },
];

const sentimentData = [
  { name: 'Positive', value: 75, color: '#10b981' },
  { name: 'Negative', value: 25, color: '#ef4444' },
];

const ManagerDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Head Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Companies', value: '12', icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Total Sales', value: '$124.5k', icon: Target, color: 'text-green-400' },
          { label: 'Sales Team', value: '45', icon: Users, color: 'text-purple-400' },
          { label: 'Calls/SMS', value: '1,200', icon: PhoneIncoming, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <stat.icon className={stat.color} size={28} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">Queries Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar dataKey="queries" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">Sentiment Analysis</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {sentimentData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-sm text-slate-400">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="text-primary-400" size={24} />
          <h3 className="text-xl font-bold">Sales Rep Performance Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 pb-2">Representative</th>
                <th className="px-6 pb-2">Total Resolved</th>
                <th className="px-6 pb-2">Avg Speed (Mins)</th>
                <th className="px-6 pb-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alex Johnson', email: 'alex@sales.com', solved: 156, speed: 12.4, rating: 4.8 },
                { name: 'Sarah Miller', email: 'sarah@sales.com', solved: 142, speed: 15.1, rating: 4.5 },
                { name: 'Mike Ross', email: 'mike@sales.com', solved: 98, speed: 10.2, rating: 4.2 },
              ].map((rep, index) => (
                <tr key={index} className="bg-white/5 hover:bg-white/10 transition-all rounded-xl">
                  <td className="px-6 py-4 rounded-l-xl">
                    <p className="font-semibold">{rep.name}</p>
                    <p className="text-xs text-slate-500">{rep.email}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-primary-400">{rep.solved}</td>
                  <td className="px-6 py-4 text-slate-300">{rep.speed}m</td>
                  <td className="px-6 py-4 rounded-r-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{rep.rating}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <div 
                            key={star} 
                            className={`w-1.5 h-1.5 rounded-full ${star <= Math.floor(rep.rating) ? 'bg-amber-400' : 'bg-slate-700'}`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
