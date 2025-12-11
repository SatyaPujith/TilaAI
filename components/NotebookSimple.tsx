import React from 'react';

interface NotebookProps {
  cells: Array<{ type: 'code' | 'markdown'; content: string }>;
  onCellsChange: (cells: Array<{ type: 'code' | 'markdown'; content: string }>) => void;
}

export const Notebook: React.FC<NotebookProps> = ({ cells, onCellsChange }) => {
  const addCell = (type: 'code' | 'markdown') => {
    onCellsChange([...cells, { type, content: '' }]);
  };

  const updateCell = (index: number, content: string) => {
    const newCells = [...cells];
    newCells[index].content = content;
    onCellsChange(newCells);
  };

  const deleteCell = (index: number) => {
    onCellsChange(cells.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Notebook</h2>
          <div className="flex gap-2">
            <button
              onClick={() => addCell('markdown')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Markdown
            </button>
            <button
              onClick={() => addCell('code')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Code
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {cells.map((cell, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  {cell.type === 'code' ? '📝 Code' : '📄 Markdown'}
                </span>
                <button
                  onClick={() => deleteCell(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
              <textarea
                value={cell.content}
                onChange={(e) => updateCell(index, e.target.value)}
                className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm"
                rows={cell.type === 'code' ? 10 : 5}
                placeholder={cell.type === 'code' ? 'Enter code...' : 'Enter markdown...'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
