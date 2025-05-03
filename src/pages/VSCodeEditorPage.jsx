import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomVSCode from '../components/CustomVSCode';

const VSCodeEditorPage = () => {
  const { projectId } = useParams();
  const [error, setError] = useState(null);

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {/* VSCode benzeri çalışma alanı */}
        <CustomVSCode projectId={projectId} />
      </div>
    </div>
  );
};

export default VSCodeEditorPage;
