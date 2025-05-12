import { Chat } from './components/chat/chat';

export const App = () => {
  return (
    <div className="container mx-auto py-4 h-screen">
      <Chat title="Redis Chat" />
    </div>
  );
};