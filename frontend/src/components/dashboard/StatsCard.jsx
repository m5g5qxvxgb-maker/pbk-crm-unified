import React from 'react';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    gold: 'bg-gold-500/10 text-gold-500',
    red: 'bg-red-500/10 text-red-500'
  };

  return (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-text-muted text-sm ml-1">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
            <Icon size={32} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
