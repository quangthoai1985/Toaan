# Changelog

All notable changes to the **Quản Lý Án Hành Chính** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-21

### Added
- **Trạng thái "Chờ theo dõi":** Bổ sung trạng thái `WATCHING` vào quy trình nghiệp vụ, thêm Tab màu xanh dương tương ứng.
- **Quy trình chuyển trạng thái:** Thêm các nút điều hướng trạng thái thông minh ở mỗi Tab (ví dụ: Chuyển sang Chờ theo dõi, Hoàn tất án) kèm hộp thoại xác nhận.
- **Tính năng Timeline nâng cao:**
  - Tự động sắp xếp quá trình thi hành án theo thời gian thực (Mới nhất lên đầu).
  - Hỗ trợ chỉnh sửa (**Edit**) và xóa (**Delete**) trực tiếp từng mục trong dòng thời gian.
  - Form thêm cập nhật mới được tích hợp inline mượt mà.

### Changed
- **Redesign DetailModal:** Chuyển đổi từ Popup sang giao diện **Toàn màn hình 2 cột**:
  - Cột trái: Quản lý thông tin hồ sơ với khả năng sửa trực tiếp (Inline Editing).
  - Cột phải: Quản lý Quá trình Thi Hành Án (Timeline).
  - Hợp nhất chức năng "Cập nhật Tiến độ" vào làm một với màng hình chi tiết.
- **Chuẩn hóa dữ liệu hiển thị:** 
  - Thống nhất cấu trúc 7 cột cho tất cả các Tab: STT, Người khởi kiện, Số Bản án, Người phải thi hành, Nghĩa vụ, Quyết Định buộc thi hành, Quá trình thi hành.
  - Loại bỏ hoàn toàn các từ viết tắt trên tiêu đề bảng và nhãn trong modal (ví dụ: "QĐ phải TH" ➔ "Quyết Định phải Thi hành án").
- **Tối ưu trải nghiệm (UX):** Nút "Lưu thay đổi" chỉ xuất hiện khi có sự thay đổi dữ liệu, Footer hiển thị trạng thái lưu trữ thời gian thực.


## [1.0.0] - 2026-03-18

### Added
- **Khởi tạo Dự án:** Setup Next.js 16 (App Router), TailwindCSS v4, TypeScript, và Shadcn UI.
- **Tích hợp Backend:** Cấu hình Supabase SSR cho client/server actions. Set up Cloudflare OpenNext config để deploy Lép.
- **Database Schema:** Tạo bảng `an_hanh_chinh` trên Supabase (PostgreSQL) với RLS policies, trigger `updated_at`, index `status`.
- **Database RPC:** Tạo function `append_tien_do` hỗ trợ update cột JSONB `tien_do_cap_nhat` theo dạng append elements.
- **Giao diện cốt lõi (Layout):** 
  - Khởi tạo `layout` với tone màu đỏ Crimson (`bg-red-950`) thể hiện sự trang trọng của cơ quan Tư pháp thi hành án.
  - Component `Header` logo Cán Cân Công Lý, `Footer` tương xứng.
- **Chức năng Dashboard (CRUD):** 
  - Hiển thị danh sách Án Hành Chính với phân trang/tabs ("ĐANG THI HÀNH", "ÁN XONG").
  - Thanh tìm kiếm (theo Số Bản Án, Người khởi kiện).
  - Component `AddAnModal` để tạo mới hồ sơ án (Status: `PENDING`).
  - Component `DetailModal` để xem chi tiết thông tin và Timeline quá trình thi hành án.
  - Component `TimelineModal` cập nhật thêm các bước tiến độ vào biểu đồ Timeline của Án.
  - Component `CompleteAnModal` để chốt Án thành công, điền báo cáo "Kết quả cuối cùng" và chuyển status sang `COMPLETED`.
  - Component `ConfirmModal` hoạt động như tính năng "Hoàn tác" (Undo) chuyển Án từ "ÁN XONG" quay lại "ĐANG THI HÀNH".
- **Chức năng Import Excel:**
  - Component `ImportExcelModal` tự động đọc dữ liệu từ file `.xlsx`, tự động nhận dạng Sheet và mapping cột tương ứng giữa hai định dạng "Đang thi hành" và "Án Xong".
  - Thuật toán bóc tách lịch sử thi hành án linh hoạt (dựa theo Regex Ngày/Tháng/Năm) thành mảng Timeline tiêu chuẩn.
- **Tính năng mở rộng:**
  - Bổ sung Cột "Quyết định buộc thi hành án" vào hệ thống Component và Database Supabase.
  - Chức năng Inline-Editing (Chỉnh sửa Trực tiếp) kèm biểu tượng Pencil (Cây bút) trên Component `DetailModal` đối với Tab hiển thị "Án Xong". Hỗ trợ Textarea nhập liệu Lịch sử với Auto-Parse.

### Changed
- Color palette chuyển từ slate/dark theme cơ bản (của template VBPL) sang tone màu đỏ đậm (Crimson/Maroon) cho Header và Footer theo yêu cầu mỹ thuật mới.
- Cập nhật giao diện component `TimelineModal` (Cập nhật Tiến độ), thay thế thẻ `<input type="date">` mặc định của HTML bằng component `<DateInput />` tuỳ chỉnh với lịch Dropdown sang trọng tiếng Việt và định dạng chuẩn `dd/mm/yyyy`.
