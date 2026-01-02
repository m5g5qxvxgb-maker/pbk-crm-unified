import React from 'react';
import { Phone, Mail, Calendar, FileText, User, MessageSquare } from 'lucide-react';

const ActivityTimeline = ({ activities = [] }) => {
  const getIcon = (type) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
      note: FileText,
      message: MessageSquare,
      default: User
    };
    const Icon = icons[type] || icons.default;
    return <Icon size={20} />;
  };

  const getColor = (type) => {
    const colors = {
      call: 'bg-blue-500/10 text-blue-500 border-blue-500',
      email: 'bg-purple-500/10 text-purple-500 border-purple-500',
      meeting: 'bg-green-500/10 text-green-500 border-green-500',
      note: 'bg-yellow-500/10 text-yellow-500 border-yellow-500',
      message: 'bg-pink-500/10 text-pink-500 border-pink-500',
      default: 'bg-gray-500/10 text-gray-500 border-gray-500'
    };
    return colors[type] || colors.default;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No activities yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-border-light my-2 min-h-[40px]" />
            )}
          </div>
          <div className="flex-1 pb-8">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-text-primary">{activity.title}</h4>
              <span className="text-sm text-text-muted">{activity.time}</span>
            </div>
            <p className="text-sm text-text-secondary mb-2">{activity.description}</p>
            {activity.metadata && (
              <div className="bg-bg-tertiary rounded-lg p-3 text-sm text-text-secondary mt-2">
                {activity.metadata}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
