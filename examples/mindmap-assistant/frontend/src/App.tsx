import { useAppStore } from './store/useAppStore';
import { MindmapCanvas } from './components/MindmapCanvas';
import { ChatKitPanel } from './components/ChatKitPanel';
import { Toolbar } from './components/Toolbar';

function App() {
  const { theme } = useAppStore();

  return (
    <div className={`${theme} flex h-screen w-screen`}>
      {/* Left: Mindmap Canvas */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        <Toolbar />
        <div className="flex-1">
          <MindmapCanvas />
        </div>
      </div>

      {/* Right: ChatKit Panel */}
      <div className="w-[420px] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatKitPanel />
      </div>
    </div>
  );
}

export default App;
