# Changelog

All notable changes to the **Quản Lý Án Hành Chính** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Changed
- Color palette chuyển từ slate/dark theme cơ bản (của template VBPL) sang tone màu đỏ đậm (Crimson/Maroon) cho Header và Footer theo yêu cầu mỹ thuật mới.
