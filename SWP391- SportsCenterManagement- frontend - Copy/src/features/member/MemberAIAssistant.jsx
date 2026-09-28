import { memberApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useRef, useEffect } = React;

export function MemberAIAssistant() {
  const { currentUser } = useAuth();
  const { showError } = useToast();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Xin chào ${currentUser?.fullName || 'bạn'}! Tôi là Trợ lý Thể thao AI độc quyền của trung tâm SCMS. Tôi có thể hỗ trợ bạn về kiến thức dinh dưỡng thể thao, tư vấn phục hồi cơ bắp, hướng dẫn các quy chuẩn sử dụng 15 cụm sân Olympic hoặc giải đáp thắc mắc về lịch tập. Bạn muốn hỏi điều gì hôm nay?`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Chế độ dinh dưỡng và nạp protein tối ưu trước & sau buổi tập?',
    'Cách xử lý đau mỏi cơ bắp (DOMS) sau khi tập cường độ cao?',
    'Giờ mở cửa và điều kiện sử dụng bể bơi Olympic & phòng Gym?',
    'Lộ trình kết hợp tập Gym và Bơi lội để tăng sức bền tim mạch?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleSend = async (questionToSend) => {
    const text = (questionToSend || inputQuestion).trim();
    if (!text) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const response = await memberApi.askAI(text, currentUser?.fullName || 'Hội viên');
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      showError('Không thể kết nối dịch vụ AI. Vui lòng thử lại!');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-700 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs uppercase tracking-widest text-red-200 font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            SCMS AI FITNESS ASSISTANT
          </span>
          <h1 className="font-chivo text-2xl font-black mt-1">
            Trợ Lý Thể Thao & Dinh Dưỡng AI
          </h1>
          <p className="text-xs text-red-100 max-w-xl mt-1">
            Hệ thống hỗ trợ hội viên 24/7 dựa trên chuẩn kiến thức thể thao Olympic, giáo án HLV và tài liệu sức khỏe chính thống.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold flex items-center gap-2 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Mô hình AI SCMS trực tuyến</span>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Gợi ý câu hỏi phổ biến:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isAsking}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-200 shadow-sm transition-all text-left disabled:opacity-50"
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${msg.sender === 'user'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900 text-white'
                  }`}
              >
                {msg.sender === 'user' ? (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-line'
                  }`}
              >
                <div className="font-medium">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono ${msg.sender === 'user' ? 'text-red-200 text-right' : 'text-slate-400'
                    }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Trợ lý AI SCMS đang suy nghĩ câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Nhập câu hỏi của bạn về dinh dưỡng, kỹ thuật tập, lịch sân SCMS..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isAsking}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-slate-50"
          />
          <button
            type="submit"
            disabled={isAsking || !inputQuestion.trim()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl font-chivo font-bold text-xs uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 shrink-0"
          >
            <span>Gửi</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
