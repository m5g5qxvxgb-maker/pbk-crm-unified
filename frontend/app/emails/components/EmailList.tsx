interface EmailListProps {
  emails: any[];
  loading: boolean;
  onEmailClick: (email: any) => void;
  onRefresh: () => void;
}

export default function EmailList({ emails, loading, onEmailClick, onRefresh }: EmailListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow text-center py-12">
        <p className="text-gray-500">📭 No emails found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {emails.map((email) => (
          <li
            key={email.id}
            onClick={() => onEmailClick(email)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!email.is_read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                  <p className={`text-sm font-medium ${!email.is_read ? 'font-bold' : ''}`}>
                    {email.direction === 'incoming' ? email.from_email : email.to_email}
                  </p>
                  {email.client_id && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Client
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-1 ${!email.is_read ? 'font-semibold' : 'text-gray-900'}`}>
                  {email.subject}
                </p>
                <p className="text-sm text-gray-500 line-clamp-2">{email.preview || email.body_text?.substring(0, 150)}</p>
              </div>
              <div className="ml-4 flex-shrink-0 text-sm text-gray-500">
                {new Date(email.created_at).toLocaleDateString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
