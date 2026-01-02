#!/bin/bash

echo "🚀 Creating Modern CRM Components..."

# Create Card component
cat > frontend/src/components/ui/Card.jsx << 'EOF'
import React from 'react';

const Card = ({ children, hover = true, padding = 'md', className = '', onClick }) => {
  const paddingClass = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }[padding];

  return (
    <div
      onClick={onClick}
      className={`
        bg-bg-secondary rounded-xl border border-border-light
        transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:border-gold-500/50 hover:-translate-y-1 cursor-pointer' : ''}
        ${paddingClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
EOF

# Create Modal component
cat > frontend/src/components/ui/Modal.jsx << 'EOF'
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-bg-secondary rounded-xl shadow-2xl w-full ${sizes[size]} animate-scale-in`}>
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-h3 text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
EOF

# Create Input component
cat > frontend/src/components/ui/Input.jsx << 'EOF'
import React from 'react';

const Input = ({
  label,
  error,
  required,
  icon,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`
            w-full px-4 py-3 bg-bg-primary border border-border-light
            rounded-lg text-text-primary placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
EOF

echo "✅ UI Components created"

# Create StatsCard component
cat > frontend/src/components/dashboard/StatsCard.jsx << 'EOF'
import React from 'react';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
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
EOF

echo "✅ Dashboard components created"

# Create simple KanbanBoard (placeholder for now)
cat > frontend/src/components/pipeline/KanbanBoard.jsx << 'EOF'
import React, { useState } from 'react';
import Card from '../ui/Card';

const KanbanBoard = ({ deals = [], onDealMove }) => {
  const stages = [
    { id: 'lead', name: 'New Lead', color: 'blue' },
    { id: 'qualified', name: 'Qualified', color: 'purple' },
    { id: 'proposal', name: 'Proposal', color: 'yellow' },
    { id: 'negotiation', name: 'Negotiation', color: 'orange' },
    { id: 'won', name: 'Won', color: 'green' },
    { id: 'lost', name: 'Lost', color: 'red' }
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => (
        <div key={stage.id} className="flex-shrink-0 w-80">
          <div className="bg-bg-secondary rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
              <h3 className="font-semibold text-text-primary">{stage.name}</h3>
              <span className="text-sm text-text-muted ml-auto">
                {deals.filter(d => d.stage === stage.id).length}
              </span>
            </div>
            <div className="space-y-3">
              {deals
                .filter(d => d.stage === stage.id)
                .map(deal => (
                  <Card key={deal.id} hover className="p-4">
                    <h4 className="font-medium text-text-primary mb-2">{deal.title}</h4>
                    <p className="text-sm text-text-muted mb-3">{deal.client}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gold-500">
                        ${deal.value?.toLocaleString() || 0}
                      </span>
                      <span className="text-xs text-text-muted">
                        {deal.probability || 0}% chance
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
EOF

# Create ActivityTimeline
cat > frontend/src/components/timeline/ActivityTimeline.jsx << 'EOF'
import React from 'react';
import { Phone, Mail, Calendar, FileText, User } from 'lucide-react';

const ActivityTimeline = ({ activities = [] }) => {
  const getIcon = (type) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
      note: FileText,
      default: User
    };
    const Icon = icons[type] || icons.default;
    return <Icon size={20} />;
  };

  const getColor = (type) => {
    const colors = {
      call: 'bg-blue-500/10 text-blue-500',
      email: 'bg-purple-500/10 text-purple-500',
      meeting: 'bg-green-500/10 text-green-500',
      note: 'bg-yellow-500/10 text-yellow-500',
      default: 'bg-gray-500/10 text-gray-500'
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-border-light my-2" />
            )}
          </div>
          <div className="flex-1 pb-8">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-text-primary">{activity.title}</h4>
              <span className="text-sm text-text-muted">{activity.time}</span>
            </div>
            <p className="text-sm text-text-secondary">{activity.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
EOF

echo "✅ Timeline component created"

echo "🎉 All modern components created successfully!"
