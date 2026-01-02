interface PipelineListProps {
  pipelines: any[];
  loading: boolean;
  onPipelineClick: (pipeline: any) => void;
  onRefresh: () => void;
}

export default function PipelineList({ pipelines, loading, onPipelineClick, onRefresh }: PipelineListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow text-center py-12">
        <p className="text-gray-500 mb-4">🔄 No pipelines yet</p>
        <p className="text-sm text-gray-400">Create your first sales pipeline</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pipelines.map((pipeline) => (
        <div
          key={pipeline.id}
          onClick={() => onPipelineClick(pipeline)}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{pipeline.name}</h3>
              {pipeline.is_default && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Default
                </span>
              )}
            </div>

            {pipeline.description && (
              <p className="text-sm text-gray-600 mb-4">{pipeline.description}</p>
            )}

            {/* Stages */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">Stages ({pipeline.stages?.length || 0})</p>
              <div className="space-y-1">
                {pipeline.stages?.slice(0, 3).map((stage: any, index: number) => (
                  <div key={stage.id} className="flex items-center text-sm">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{stage.name}</span>
                  </div>
                ))}
                {pipeline.stages?.length > 3 && (
                  <p className="text-xs text-gray-500 ml-8">+{pipeline.stages.length - 3} more</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Active Leads</p>
                <p className="text-lg font-semibold text-gray-900">{pipeline.active_leads || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Conversion</p>
                <p className="text-lg font-semibold text-green-600">
                  {pipeline.conversion_rate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
