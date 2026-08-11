import { ReactNode } from 'react';

interface StatCardProps {
  value: ReactNode;
  label: string;
  subtext?: string;
  color?: 'default' | 'success' | 'danger' | 'warning';
}

export default function StatCard({
  value,
  label,
  subtext,
  color = 'default',
}: StatCardProps) {
  const colorClasses = {
    default: 'text-charcoal-900',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-brass-600',
  };

  return (
    <div className="stat-card">
      <div className={`stat-value ${colorClasses[color]}`}>{value}</div>
      <div className="stat-label">{label}</div>
      {subtext && (
        <div className="text-xs text-charcoal-400 mt-1">{subtext}</div>
      )}
    </div>
  );
}
