# Ứng Dụng Ôn Tập & Thi Thử Trắc Nghiệm - Chủ Nghĩa Xã Hội Khoa Học

Ứng dụng web ôn tập trắc nghiệm và thi thử cá nhân môn **Chủ Nghĩa Xã Hội Khoa Học**, được xây dựng trên nền tảng **React 19 + TypeScript + Vite** với phong cách thiết kế **Modern Study Dashboard**, tối ưu cho cả máy tính và điện thoại di động.

---

## 🌟 Tính năng nổi bật

1. **Ngân hàng 197 câu hỏi phân bổ trong 6 chủ đề**:
   - Được trích xuất chính xác 100% từ 6 tài liệu Word (.docx) gốc của môn học.
   - Hỗ trợ đầy đủ 4 dạng câu hỏi:
     - Chọn 1 đáp án.
     - Chọn nhiều đáp án (2 hoặc 3 phương án đúng).
     - Đúng / Sai với từng mệnh đề độc lập (không gộp phương án A/B).
     - Kéo thả, ghép nối và phân loại theo cột.

2. **Chế độ Luyện tập (Practice Mode - Focus Mode)**:
   - Học theo từng chủ đề hoặc luyện tất cả.
   - Tùy chọn **Tự động hiển thị đáp án sau khi chọn** (lưu trạng thái trong `localStorage`).
   - Lọc câu hỏi thông minh: *Tất cả*, *Chưa làm*, *Đã làm sai*, *Câu khó đã đánh dấu*.
   - Cho phép làm lại, sửa lựa chọn mà không cộng trùng điểm hay tăng số câu.

3. **Chế độ Thi thử (Mock Exam)**:
   - Tùy chỉnh số lượng câu (20, 30, 40 hoặc toàn bộ) và thời gian (15 - 60 phút).
   - Đồng hồ đếm ngược trực quan với cảnh báo khi thời gian dưới 5 phút.
   - Bảng câu hỏi sidebar trên desktop hoặc ngăn drawer trên mobile.
   - **Bảo vệ 100%**: Không hiển thị đáp án, màu xanh/đỏ hay giải thích trước khi nộp bài thi.
   - Chấm điểm chuẩn xác theo thang điểm 10 kèm xếp loại (Xuất sắc, Giỏi, Khá, Trung bình).
   - Xem lại chi tiết từng câu hỏi và lọc danh sách câu sai để ôn lại ngay.

4. **Giao diện Modern Study Dashboard & Dark Mode hoàn chỉnh**:
   - 3 chế độ giao diện: **Sáng (Light)**, **Tối (Dark)**, **Theo hệ thống (System)**.
   - Thiết kế thân thiện cho sinh viên, font chữ tiếng Việt rõ ràng, độ tương phản cao.
   - **Thanh điều hướng dưới (Bottom Navigation)** tiện lợi trên điện thoại di động.
   - Thao tác câu ghép nối hỗ trợ cả chuột máy tính lẫn chạm chọn trên màn hình cảm ứng.

5. **Quản lý dữ liệu & Đổi môn học linh hoạt**:
   - **Nhập file Word (.docx)**: Bóc tách câu hỏi và nhận diện chữ đỏ tự động cho bất kỳ môn học nào.
   - **Sao lưu / Phục hồi**: Xuất và nhập toàn bộ ngân hàng câu hỏi bằng file JSON.
   - **Khu vực nâng cao**: Khôi phục dữ liệu gốc 197 câu môn CNXHKH hoặc đặt lại lịch sử học tập.
   - Hoạt động 100% ngoại tuyến (Offline) trên trình duyệt, không cần tài khoản hay backend.

---

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ

### Yêu cầu
- Node.js version 18 trở lên (Khuyến nghị Node.js 20 hoặc 22/24).
- Trình duyệt web hiện đại (Chrome, Edge, Firefox, Safari).

### Cài đặt và khởi chạy

```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Khởi chạy môi trường phát triển cục bộ
npm run dev
# Truy cập vào: http://localhost:5173

# 3. Đóng gói cho môi trường production
npm run build
```

Trên Windows, bạn có thể click đúp chuột vào file `start.bat` để tự động cài đặt và mở ứng dụng.

---

## 🌐 Triển khai trên Vercel

Dự án đã được cấu hình sẵn tệp `vercel.json`:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Single Page Application Rewrite**: chuyển toàn bộ routes về `index.html`.

---

## 📁 Cấu trúc thư mục

```
quiz-app/
├── src/
│   ├── components/       # Các màn hình: HomeView, PracticeView, ExamView, ResultView, BankManagerView, Navbar, QuestionCard
│   ├── data/             # Dữ liệu ngân hàng câu hỏi mặc định môn CNXHKH
│   ├── types/            # Định nghĩa kiểu dữ liệu TypeScript (quiz.ts)
│   ├── utils/            # Bóc tách Word (.docx), lưu trữ localStorage, quản lý Theme
│   ├── App.tsx           # Component điều hướng chính
│   ├── main.tsx          # Điểm khởi chạy React
│   └── index.css         # Hệ thống Design Tokens CSS (Light & Dark mode)
├── all_questions.json    # File sao lưu 197 câu hỏi gốc
├── Chủ đề 1.docx - 6.docx # 6 tài liệu Word gốc môn học
├── vercel.json           # Cấu hình triển khai Vercel
├── vite.config.ts        # Cấu hình Vite bundler
├── tsconfig.json         # Cấu hình TypeScript compiler
└── package.json          # Danh sách dependencies & scripts
```

---

*Phát triển phục vụ mục đích học tập và ôn thi cá nhân.*
