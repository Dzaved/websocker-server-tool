import { WebSocketProvider } from "./contexts/WebSocketContext";
import WebSocketServerCompleteInterface from "./components/WebSocketServerCompleteInterface";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <WebSocketProvider>
      <WebSocketServerCompleteInterface />
      <Toaster />
    </WebSocketProvider>
  );
}

export default App;