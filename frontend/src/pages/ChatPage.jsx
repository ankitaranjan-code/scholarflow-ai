/**
 * ChatPage — Wraps the ChatInterface component with a header.
 */
import ChatInterface from '../components/Chat/ChatInterface';
import { chatMessages, studentProfile } from '../data/mockData';
import { useStudent } from '../context/StudentContext';

export default function ChatPage() {
  const { studentId, student } = useStudent();

  return (
    <div className="chat-page">
      <ChatInterface 
        initialMessages={chatMessages} 
        student={student || studentProfile} 
        studentId={studentId}
      />
    </div>
  );
}

