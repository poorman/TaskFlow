"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Clock, AlertCircle, Target, DollarSign } from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AnalyticsDashboard() {
  const { analytics, fetchAnalytics } = useTaskStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (!analytics) {
    return (
      <div className="neumorphism-dashboard-card">
        <h2 className="mb-4 text-xl font-bold neumorphism-text-primary" style={{ 
          background: 'linear-gradient(135deg, var(--neumorphism-primary) 0%, var(--neumorphism-primary-dark) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          Analytics
        </h2>
        <div className="neumorphism-text-secondary">Loading analytics...</div>
      </div>
    );
  }

  const statusData = Object.entries(analytics.tasks_by_status).map(([status, count]) => ({
    name: status.replace("_", " ").toUpperCase(),
    value: count,
  }));

  const priorityData = Object.entries(analytics.tasks_by_priority).map(([priority, count]) => ({
    name: priority.toUpperCase(),
    value: count,
  }));

  const priceByStatusData = Object.entries(analytics.price_by_status || {})
    .filter(([_, price]) => price > 0)
    .map(([status, price]) => ({
      name: status.replace("_", " ").toUpperCase(),
      value: price,
    }));

  const priceByPriorityData = Object.entries(analytics.price_by_priority || {})
    .filter(([_, price]) => price > 0)
    .map(([priority, price]) => ({
      name: priority.toUpperCase(),
      value: price,
    }));

  return (
    <div className="space-y-6">
      <div className="neumorphism-dashboard-card">
        <h2 className="mb-6 text-xl font-bold neumorphism-text-primary" style={{ 
          background: 'linear-gradient(135deg, var(--neumorphism-primary) 0%, var(--neumorphism-primary-dark) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          Analytics
        </h2>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="neumorphism-metric-card">
            <div className="flex items-center space-x-2 neumorphism-text-secondary mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs font-semibold">Productivity</span>
            </div>
            <div className="text-2xl font-bold neumorphism-text-accent">
              {analytics.productivity_score.toFixed(1)}%
            </div>
          </div>
          <div className="neumorphism-metric-card">
            <div className="flex items-center space-x-2 neumorphism-text-secondary mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold">Today</span>
            </div>
            <div className="text-2xl font-bold neumorphism-text-primary">
              {analytics.tasks_completed_today}
            </div>
          </div>
          <div className="neumorphism-metric-card">
            <div className="flex items-center space-x-2 neumorphism-text-secondary mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">This Week</span>
            </div>
            <div className="text-2xl font-bold neumorphism-text-primary">
              {analytics.tasks_completed_this_week}
            </div>
          </div>
          <div className="neumorphism-metric-card">
            <div className="flex items-center space-x-2 neumorphism-text-secondary mb-2">
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--neumorphism-error)' }} />
              <span className="text-xs font-semibold">Overdue</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--neumorphism-error)' }}>
              {analytics.tasks_overdue}
            </div>
          </div>
          <div className="neumorphism-metric-card">
            <div className="flex items-center space-x-2 neumorphism-text-secondary mb-2">
              <DollarSign className="w-4 h-4" style={{ color: 'var(--neumorphism-primary)' }} />
              <span className="text-xs font-semibold">Total Price</span>
            </div>
            <div className="text-2xl font-bold neumorphism-text-primary">
              ${analytics.total_price?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Tasks by Status */}
        <div className="mb-6">
          <h3 className="mb-4 text-sm font-bold neumorphism-text-primary uppercase tracking-wide">
            Tasks by Status
          </h3>
          <div className="neumorphism-dashboard-card p-4" style={{ background: 'var(--neumorphism-bg)' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--neumorphism-bg)', 
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: '6px 6px 12px var(--neumorphism-shadow-dark), -6px -6px 12px var(--neumorphism-shadow-light)',
                    color: 'var(--neumorphism-text)',
                    padding: '0.5rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="mb-6">
          <h3 className="mb-4 text-sm font-bold neumorphism-text-primary uppercase tracking-wide">
            Tasks by Priority
          </h3>
          <div className="neumorphism-dashboard-card p-4" style={{ background: 'var(--neumorphism-bg)' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neumorphism-shadow-dark)" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--neumorphism-text-light)" 
                  fontSize={12}
                  tick={{ fill: 'var(--neumorphism-text-light)' }}
                />
                <YAxis 
                  stroke="var(--neumorphism-text-light)" 
                  fontSize={12}
                  tick={{ fill: 'var(--neumorphism-text-light)' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'var(--neumorphism-bg)', 
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: '6px 6px 12px var(--neumorphism-shadow-dark), -6px -6px 12px var(--neumorphism-shadow-light)',
                    color: 'var(--neumorphism-text)',
                    padding: '0.5rem'
                  }}
                  cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
                />
                <Bar dataKey="value" fill="var(--neumorphism-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price by Status */}
        {priceByStatusData.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-bold neumorphism-text-primary uppercase tracking-wide">
              Price by Status
            </h3>
            <div className="neumorphism-dashboard-card p-4" style={{ background: 'var(--neumorphism-bg)' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neumorphism-shadow-dark)" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--neumorphism-text-light)" 
                    fontSize={12}
                    tick={{ fill: 'var(--neumorphism-text-light)' }}
                  />
                  <YAxis 
                    stroke="var(--neumorphism-text-light)" 
                    fontSize={12}
                    tick={{ fill: 'var(--neumorphism-text-light)' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'var(--neumorphism-bg)', 
                      border: 'none',
                      borderRadius: '0.75rem',
                      boxShadow: '6px 6px 12px var(--neumorphism-shadow-dark), -6px -6px 12px var(--neumorphism-shadow-light)',
                      color: 'var(--neumorphism-text)',
                      padding: '0.5rem'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Price by Priority */}
        {priceByPriorityData.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-bold neumorphism-text-primary uppercase tracking-wide">
              Price by Priority
            </h3>
            <div className="neumorphism-dashboard-card p-4" style={{ background: 'var(--neumorphism-bg)' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceByPriorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neumorphism-shadow-dark)" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--neumorphism-text-light)" 
                    fontSize={12}
                    tick={{ fill: 'var(--neumorphism-text-light)' }}
                  />
                  <YAxis 
                    stroke="var(--neumorphism-text-light)" 
                    fontSize={12}
                    tick={{ fill: 'var(--neumorphism-text-light)' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'var(--neumorphism-bg)', 
                      border: 'none',
                      borderRadius: '0.75rem',
                      boxShadow: '6px 6px 12px var(--neumorphism-shadow-dark), -6px -6px 12px var(--neumorphism-shadow-light)',
                      color: 'var(--neumorphism-text)',
                      padding: '0.5rem'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Contributors */}
        {analytics.top_contributors.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-bold neumorphism-text-primary uppercase tracking-wide">
              Top Contributors
            </h3>
            <div className="space-y-2">
              {analytics.top_contributors.slice(0, 5).map((contributor, index) => (
                <div 
                  key={contributor.user_id} 
                  className="neumorphism-metric-card flex items-center justify-between p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="neumorphism-badge text-xs font-bold" style={{ 
                      background: 'linear-gradient(135deg, var(--neumorphism-primary) 0%, var(--neumorphism-primary-dark) 100%)',
                      color: 'white',
                      minWidth: '1.5rem',
                      height: '1.5rem',
                      justifyContent: 'center',
                      padding: 0
                    }}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium neumorphism-text-primary">
                      {contributor.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold neumorphism-text-accent">
                    {contributor.tasks_completed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

