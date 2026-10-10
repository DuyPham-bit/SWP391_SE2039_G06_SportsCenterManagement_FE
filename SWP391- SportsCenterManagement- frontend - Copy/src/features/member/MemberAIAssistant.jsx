import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

const { useState, useRef, useEffect } = React;

/**
 * Bộ tạo phản hồi AI chuyên môn thể thao Olympic SCMS trực tiếp (Không phụ thuộc API cũ)
 */
function generateLocalAIResponse(query, memberName = 'Hội viên') {
  const text = (query || '').toLowerCase().trim();

  // Dinh dưỡng / Protein / Nạp năng lượng / Thực đơn / Giảm mỡ / Tăng cân
  if (
    text.includes('dinh dưỡng') ||
    text.includes('protein') ||
    text.includes('nạp') ||
    text.includes('ăn') ||
    text.includes('uống') ||
    text.includes('calo') ||
    text.includes('whey') ||
    text.includes('ức gà') ||
    text.includes('thực đơn') ||
    text.includes('giảm mỡ') ||
    text.includes('tăng cơ')
  ) {
    return `Chào ${memberName}! Dưới đây là chiến lược dinh dưỡng và nạp năng lượng chuẩn vận động viên thể thao:

1. TRƯỚC BUỔI TẬP (Cách 1.5 - 2 tiếng):
- Nạp Carb phức hợp hấp thu chậm: Yến mạch, khoai lang luộc, bánh mì đen hoặc 1 quả chuối chín.
- Bổ sung 400 - 500ml nước lọc để cơ bắp đủ độ ẩm trước khi vận động.

2. SAU BUỔI TẬP (Khung giờ vàng 30 - 60 phút):
- Nạp Protein sinh học cao: 25g - 35g protein (Whey Protein Isolate, 150g ức gà, lòng trắng trứng hoặc cá hồi).
- Bổ sung Carb nhanh (chuối, nước dừa tươi, cơm trắng) để tái tạo lượng Glycogen dự trữ trong cơ.

3. NGUYÊN TẮC TOÀN NGÀY:
- Mức protein mục tiêu: 1.6 - 2.2g / kg thể trọng đối với người tập kháng lực.
- Bù nước & điện giải: Uống đủ 2.5 - 3.5 lít nước/ngày, bổ sung Natri, Kali, Magie nếu ra nhiều mồ hôi.`;
  }

  // Đau mỏi cơ bắp / DOMS / Phục hồi / Chấn thương / Giãn cơ
  if (
    text.includes('doms') ||
    text.includes('đau') ||
    text.includes('mỏi') ||
    text.includes('cơ bắp') ||
    text.includes('phục hồi') ||
    text.includes('chấn thương') ||
    text.includes('giãn cơ') ||
    text.includes('căng cơ') ||
    text.includes('chuột rút') ||
    text.includes('nhức')
  ) {
    return `Chào ${memberName}! Hiện tượng đau nhức sau các buổi tập nặng thường là hội chứng DOMS (Delayed Onset Muscle Soreness) do các vi tổn thương lành tính kích thích cơ bắp phát triển.

Các biện pháp giải phóng mỏi cơ và phục hồi nhanh nhất:

1. GIÃN CƠ & FOAM ROLLER:
- Dành 10 - 15 phút giãn cơ tĩnh (Static Stretching) cuối buổi tập.
- Dùng con lăn bọt (Foam Roller) xoa bóp nhẹ nhàng mạc cơ ở các nhóm cơ lớn (đùi, lưng xô, bắp chuối).

2. TƯƠNG PHẢN NHIỆT (CONTRAST THERAPY):
- Tắm vòi sen nước ấm hoặc ngâm bồn nóng - lạnh luân phiên để kích thích mao mạch tuần hoàn, đào thải nhanh axit lactic.

3. DINH DƯỠNG & GIẤC NGỦ:
- Bổ sung thực phẩm giàu Magie, Kẽm, Omega-3 để kháng viêm tự nhiên.
- Duy trì giấc ngủ sâu 7 - 8 tiếng vì 90% hormone tăng trưởng phục hồi mô cơ được tiết ra khi ngủ sâu.

*Lưu ý: Nếu bị đau nhói cục bộ tại khớp hoặc dây chằng, hãy thông báo ngay cho Huấn luyện viên tại phòng tập để được kiểm tra trực tiếp.*`;
  }

  // Bể bơi Olympic / Gym / Giờ mở cửa / Cơ sở vật chất / Tiện ích
  if (
    text.includes('bể bơi') ||
    text.includes('hồ bơi') ||
    text.includes('gym') ||
    text.includes('giờ') ||
    text.includes('mở cửa') ||
    text.includes('sân') ||
    text.includes('thiết bị') ||
    text.includes('olympic') ||
    text.includes('cơ sở')
  ) {
    return `Chào ${memberName}! Thông tin chi tiết về cơ sở vật chất và thời gian hoạt động của SCMS:

1. THỜI GIAN HOẠT ĐỘNG:
- Mở cửa: 06:00 - 22:00 tất cả các ngày trong tuần (Bao gồm Thứ 7, Chủ Nhật và ngày lễ).

2. CỤM BỂ BƠI TIÊU CHUẨN OLYMPIC:
- Kích thước: Chuẩn 50m, 8 làn bơi thi đấu, phao giảm sóng công nghệ FINA.
- Độ sâu: 1.4m - 2.0m.
- Khử khuẩn: Công nghệ xử lý nước bằng Ozone vi sinh sinh học tuần hoàn, không gây cay mắt hay kích ứng da.
- Quy định: Bắt buộc trang bị đồ bơi thể thao và nón bơi khi xuống nước.

3. PHÒNG TẬP FITNESS & GYM HIỆN ĐẠI:
- 100% dàn máy tập cao cấp Technogym & Hammer Strength.
- Chia thành 3 khu chức năng riêng biệt: Tạ tự do (Free Weights), Máy khối kháng lực và Phân khu Cardio ngắm trọn toàn cảnh trung tâm.`;
  }

  // Lộ trình Gym & Bơi / Tim mạch / Sức bền / Giảm cân / Tăng cơ
  if (
    text.includes('lộ trình') ||
    text.includes('kết hợp') ||
    text.includes('tim mạch') ||
    text.includes('sức bền') ||
    text.includes('cardio') ||
    text.includes('giảm cân') ||
    text.includes('bơi lội') ||
    text.includes('hiit')
  ) {
    return `Chào ${memberName}! Phối hợp Gym kháng lực và Bơi lội là phương pháp tối ưu để vừa xây dựng cơ bắp săn chắc, vừa nâng cao chỉ số tim mạch (VO2 Max):

LỊCH TẬP PHỐI HỢP ĐỀ XUẤT (5 BUỔI / TUẦN):
- Thứ 2: Gym Thân Trên (Ngực, Lưng Xô, Vai, Tay) - Rèn luyện sức mạnh đa khớp.
- Thứ 3: Bơi Lội Kỹ Thuật (500m - 800m duy trì nhịp tim vùng 2 - 3) - Tăng dung tích phổi, giảm áp lực cột sống.
- Thứ 4: Gym Thân Dưới & Core (Chân, Đùi, Mông, Cơ bụng) - Tạo trụ cơ thể vững chắc.
- Thứ 5: Nghỉ chủ động hoặc bơi thả lỏng nhẹ nhàng 20 phút.
- Thứ 6: Bơi Lội Biến Tốc (Interval Swimming) hoặc Gym toàn thân (Full Body Circuit).
- Thứ 7: Phục hồi năng động (Active Recovery) / Yoga giãn cơ.
- Chủ Nhật: Nghỉ ngơi hoàn toàn.

Ưu điểm nổi bật: Bơi lội nâng đỡ cơ thể trong môi trường nước, giúp giải phóng áp lực đĩa đệm và khớp gối sau các buổi nâng tạ nặng!`;
  }

  // Lớp học / Đặt lịch / HLV / PT / Ca tập
  if (
    text.includes('lớp') ||
    text.includes('đặt lịch') ||
    text.includes('hlv') ||
    text.includes('huấn luyện viên') ||
    text.includes('pt') ||
    text.includes('book') ||
    text.includes('ca học') ||
    text.includes('lịch tập')
  ) {
    return `Chào ${memberName}! Về các lớp học và dịch vụ Huấn luyện viên (PT) tại SCMS:

1. ĐẶT CHỖ LỚP HỌC (Yoga, Pilates, Bơi lội, Boxing, Fitness):
- Bạn có thể tra cứu lịch ca và đặt chỗ trực tuyến tại tab "Lịch Học & Đặt Chỗ".
- Cổng đặt chỗ mở trước 24 giờ và kết thúc trước ca học 30 phút.
- Bạn có thể hủy đặt chỗ trước giờ học ít nhất 2 tiếng nếu có việc đột xuất.

2. HUẤN LUYỆN VIÊN CÁ NHÂN (PT):
- Đội ngũ HLV SCMS đạt chứng chỉ chuyên môn thể thao Olympic, luôn sẵn sàng hỗ trợ chỉnh tư thế (form) và thiết kế giáo án phù hợp với thể trạng của bạn.
- Bạn có thể liên hệ trực tiếp tại quầy Lễ tân hoặc trao đổi với HLV trưởng tại sân tập.`;
  }

  // Gói tập / Gia hạn / Thẻ / VNPay / Thanh toán
  if (
    text.includes('gói') ||
    text.includes('gia hạn') ||
    text.includes('thẻ') ||
    text.includes('vnpay') ||
    text.includes('thanh toán') ||
    text.includes('mua') ||
    text.includes('giá') ||
    text.includes('tiền')
  ) {
    return `Chào ${memberName}! Về chính sách gói tập và gia hạn thẻ hội viên SCMS:

1. HỆ THỐNG GÓI TẬP:
- Trung tâm cung cấp đa dạng gói: Gói Ngày, Gói Cơ Bản (Bronze/Silver), Gói Nâng Cao (Gold/Diamond) và Gói VIP toàn quyền trải nghiệm mọi bộ môn và dịch vụ.

2. GIA HẠN TRỰC TUYẾN QUA VNPAY:
- Bạn chỉ cần vào mục "Gói Tập Của Tôi", chọn gói mong muốn và nhấn "Đăng Ký / Gia Hạn".
- Thanh toán tức thì qua cổng VNPay (hỗ trợ quét VNPAY-QR, thẻ ngân hàng nội địa ATM hoặc thẻ quốc tế Visa/MasterCard).
- Ngay khi giao dịch hoàn tất, hệ thống sẽ tự động cập nhật ngày hết hạn mới vào thẻ hội viên của bạn!`;
  }

  // Lời chào / Giới thiệu
  if (
    text.includes('chào') ||
    text.includes('hi') ||
    text.includes('hello') ||
    text.includes('alo') ||
    text.includes('bạn là ai') ||
    text.includes('ơi')
  ) {
    return `Xin chào ${memberName}! Rất vui được đồng hành cùng bạn! 

Tôi là Trợ lý Thể thao AI SCMS, sẵn sàng hỗ trợ bạn 24/7 về:
- Chế độ dinh dưỡng, nạp protein và thực đơn khoa học.
- Cách xử lý đau mỏi cơ bắp (DOMS) và phục hồi thể lực.
- Lịch hoạt động, quy chuẩn bể bơi Olympic & phòng Gym.
- Lộ trình tập luyện phối hợp và hướng dẫn gói tập, đặt lớp.

Hôm nay bạn đang có mục tiêu rèn luyện hay thắc mắc nào cần tôi giải đáp không?`;
  }

  // Phản hồi chuyên môn mặc định
  return `Chào ${memberName}! Cảm ơn câu hỏi của bạn. Dưới đây là những nguyên tắc huấn luyện thể thao chuyên nghiệp tại trung tâm SCMS:

1. NGUYÊN TẮC LUYỆN TẬP KHOA HỌC:
- Luôn khởi động kỹ các khớp và làm nóng cơ thể 10 phút trước buổi tập.
- Áp dụng nguyên lý tăng tải lũy tiến (Progressive Overload) để cơ thể thích ứng tự nhiên, hạn chế chấn thương do quá tải đột ngột.

2. DINH DƯỠNG & NƯỚC UỐNG:
- Duy trì lượng nước 2.5 - 3.5 lít mỗi ngày; cung cấp đủ protein từ thịt nạc, cá, trứng, đậu đỗ.
- Tránh tập khi bụng quá đói hoặc ngay sau khi ăn no.

3. PHỤC HỒI & NGHỈ NGƠI:
- Phân bổ ít nhất 1 - 2 ngày nghỉ mỗi tuần để cơ bắp có thời gian hồi phục và phát triển.

Nếu bạn cần hướng dẫn chi tiết cho từng bài tập hoặc tiện ích cụ thể, hãy đặt câu hỏi chi tiết hơn hoặc trao đổi trực tiếp với HLV tại sân nhé!`;
}

export function MemberAIAssistant() {
  const { currentUser } = useAuth();
  const { showSuccess } = useToast();

  const getInitialMessage = (name) => ({
    id: 'welcome',
    sender: 'ai',
    text: `Xin chào ${name || 'bạn'}! Tôi là Trợ lý Thể thao AI độc quyền của trung tâm SCMS. Tôi có thể hỗ trợ bạn về kiến thức dinh dưỡng thể thao, tư vấn phục hồi cơ bắp, hướng dẫn các quy chuẩn sử dụng 15 cụm sân Olympic hoặc giải đáp thắc mắc về lịch tập. Bạn muốn hỏi điều gì hôm nay?`,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState(() => [getInitialMessage(currentUser?.fullName)]);
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
    if (!text || isAsking) return;

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
      // Giả lập độ trễ suy nghĩ tự nhiên (450ms)
      await new Promise(resolve => setTimeout(resolve, 450));
      const response = generateLocalAIResponse(text, currentUser?.fullName || 'Hội viên');
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleResetChat = () => {
    setMessages([getInitialMessage(currentUser?.fullName)]);
    setInputQuestion('');
    setIsAsking(false);
    showSuccess('Đã làm mới cuộc trò chuyện!');
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all text-white shadow-sm"
            title="Làm mới cuộc trò chuyện để đo đạc hoặc thử nghiệm câu hỏi mới"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Làm mới hội thoại</span>
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold flex items-center gap-2 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trực tuyến</span>
          </div>
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
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                  msg.sender === 'user'
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
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <div className="font-medium">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono ${
                    msg.sender === 'user' ? 'text-red-200 text-right' : 'text-slate-400'
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
                <span>Trợ lý AI SCMS đang xử lý câu trả lời...</span>
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
