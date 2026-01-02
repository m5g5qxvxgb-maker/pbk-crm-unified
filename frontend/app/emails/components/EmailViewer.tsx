interface EmailViewerProps {
  email: any;
  onClose: () => void;
}

export default function EmailViewer({ email, onClose }: EmailViewerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">📧 Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-2xl font-bold mb-4">{email.subject}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="text-gray-600 w-20">From:</span>
                <span className="font-medium">{email.from_email}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-20">To:</span>
                <span className="font-medium">{email.to_email}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-20">Date:</span>
                <span>{new Date(email.created_at).toLocaleString()}</span>
              </div>
              {email.client_id && (
                <div className="flex">
                  <span className="text-gray-600 w-20">Client:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Linked to CRM
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="prose max-w-none">
            {email.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans">{email.body_text}</pre>
            )}
          </div>

          {/* Attachments */}
          {email.has_attachments && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-2">📎 Attachments</h4>
              <p className="text-sm text-gray-500">Attachments functionality coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
