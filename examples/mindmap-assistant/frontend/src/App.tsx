import { useAppStore } from './store/useAppStore';
import { MindmapCanvas } from './components/MindmapCanvas';
import { ChatKitPanel } from './components/ChatKitPanel';
import { Toolbar } from './components/Toolbar';

function App() {
  const { theme } = useAppStore();

  return (
    <div className={`${theme} app-container flex h-screen w-screen overflow-hidden`}>
      {/* Left: Mindmap Canvas */}
      <div className="flex-1 flex flex-col canvas-area">
        <Toolbar />
        <div className="flex-1 relative">
          <MindmapCanvas />
        </div>
      </div>

      {/* Right: ChatKit Panel */}
      <div className="w-[440px] chat-panel">
        <div className="chat-panel-wrapper">
          <ChatKitPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
