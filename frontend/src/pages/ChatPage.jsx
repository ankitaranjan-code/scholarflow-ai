/**
 * ChatPage — Wraps the ChatInterface component with a header.
 */
import ChatInterface from '../components/Chat/ChatInterface';
import { chatMessages, studentProfile } from '../data/mockData';

export default function ChatPage() {
  return (
    <div className="chat-page">
      <ChatInterface initialMessages={chatMessages} student={studentProfile} />
    </div>
  );
}
