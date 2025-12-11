import React from 'react';
import { MessageSquare, Code, BookOpen, LogOut, Plus, FolderOpen, Trophy } from 'lucide-react';
import { Project, Challenge, Roadmap } from '../types';

interface SidebarProps {
  activeView: 'chat' | 'code' | 'notebook';
  onViewChange: (view: 'chat' | 'code' | 'notebook') => void;
  user: any;
  projects: Project[];
  challenges: Challenge[];
  roadmaps: Roadmap[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, description: string) => void;
  onStartChallenge: (challengeId: string) => void;
  onLogout: () => void;
  onShowProfile: () => void;
  isGuestMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  user,
  projects,
  challenges,
  roadmaps,
  activeProject,
  onSelectProject,
  onCreateProject,
  onStartChallenge,
  onLogout,
  onShowProfile,
  isGuestMode
}) => {
  const [showNewProject, setShowNewProject] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDesc, setNewProjectDesc] = React.useState('');

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName, newProjectDesc);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowNewProject(false);
    }
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          TILA AI
        </h1>
        <p className="text-xs text-gray-400 mt-1">Welcome, {user?.username || user?.name}</p>
      </div>

      {/* View Tabs */}
      <div className="p-4 border-b border-gray-700">
        <div className="space-y-2">
          <button
            onClick={() => onViewChange('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'chat'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Chat</span>
          </button>
          <button
            onClick={() => onViewChange('code')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'code'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span className="text-sm">Code Editor</span>
          </button>
          <button
            onClick={() => onViewChange('notebook')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'notebook'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">Notebook</span>
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">Projects</h3>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="text-purple-400 hover:text-purple-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNewProject && (
            <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-2 py-1 mb-2 bg-gray-800 border border-gray-600 rounded text-sm text-white"
              />
              <input
                type="text"
                placeholder="Description"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="w-full px-2 py-1 mb-2 bg-gray-800 border border-gray-600 rounded text-sm text-white"
              />
              <button
                onClick={handleCreateProject}
                className="w-full px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Create
              </button>
            </div>
          )}

          {isGuestMode && projects.length === 0 && (
            <div className="text-xs text-gray-500 italic p-2 text-center">
              Sign up to create and save projects
            </div>
          )}

          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project._id || project.id}
                onClick={() => onSelectProject(project)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeProject?._id === project._id || activeProject?.id === project.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="text-sm truncate">{project.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Challenges */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Challenges</h3>
          <div className="space-y-1">
            {challenges.slice(0, 5).map((challenge) => (
              <button
                key={challenge._id}
                onClick={() => onStartChallenge(challenge._id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Trophy className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{challenge.title}</div>
                  <div className="text-xs text-gray-500">{challenge.difficulty}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onShowProfile}
          className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {isGuestMode ? '👤' : (user?.username?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U')}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-white">{user?.username || user?.name}</div>
            <div className="text-xs text-gray-500">{isGuestMode ? 'Guest Mode' : 'View Profile'}</div>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">{isGuestMode ? 'Exit Guest Mode' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
};
