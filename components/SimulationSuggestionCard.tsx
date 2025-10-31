import React from 'react';

export interface SimulationSuggestion {
  id?: string;
  title: string;
  description?: string;
  subject?: string;
  image_url?: string;
  url: string;
}

interface SimulationSuggestionCardProps {
  simulation: SimulationSuggestion;
  onLaunch: (sim: SimulationSuggestion) => void;
}

const SimulationSuggestionCard: React.FC<SimulationSuggestionCardProps> = ({ simulation, onLaunch }) => {
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-start gap-3">
        {simulation.image_url && (
          <img src={simulation.image_url} alt={simulation.title} className="w-20 h-20 object-cover rounded" />
        )}
        <div className="flex-1">
          <div className="font-semibold">{simulation.title}</div>
          {simulation.subject && (
            <div className="text-xs text-gray-500">{simulation.subject}</div>
          )}
          {simulation.description && (
            <div className="text-sm text-gray-600 mt-1">{simulation.description}</div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => onLaunch(simulation)}
            >
              Launch Simulation
            </button>
            <a
              className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              href={simulation.url}
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationSuggestionCard;