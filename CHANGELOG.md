# Changelog

All notable changes to the **Quản Lý Án Hành Chính** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-03-27

### Added
- **Hệ thống Quản lý Tài khoản (Account Management):**
  - Phát triển trang Quản lý tài khoản (`/quan-ly-tai-khoan`) cho phép Admin thực hiện các thao tác CRUD người dùng một cách trực quan.
  - Tích hợp API Route bảo mật sử dụng `service_role_key` để quản trị an toàn danh sách người dùng trong Supabase Auth và Profile.
  - **Dropdown Đơn vị Hành chính:** Tự động hóa việc chọn tên hiển thị từ danh sách 102 xã/phường/đặc khu (truy xuất từ dữ liệu chuẩn `DVHC.xlsx`).
  - **Tự động hóa Phân quyền (Auto-Scoping):** Hệ thống tự động thiết lập phạm vi quản lý án (mặc định gồm UBND và Chủ tịch UBND địa phương) ngay khi tạo tài khoản, loại bỏ hoàn toàn các bước cấu hình thủ công.

### Changed
- **Tối ưu giao diện Modal:** Chuyển đổi toàn bộ logic Modal Thêm/Sửa tài khoản sang Tailwind CSS thuần, khắc phục lỗi tương phản màu sắc và xung đột React Context (Toast).
- **Loại bỏ dữ liệu dư thừa:** Gỡ bỏ các truy vấn danh mục cơ quan không cần thiết tại trang quản lý tài khoản để tăng tốc độ phản hồi.

## [1.5.0] - 2026-03-26

### Added
- **Hệ thống Xác thực & Phân quyền (Auth & RBAC):** Triển khai toàn diện khả năng bảo mật và phân quyền truy cập.
  - Tích hợp **Supabase Auth** để quản lý tài khoản người dùng.
  - Xây dựng trang **Đăng nhập (`/login`)** với phong cách Dark Mode hiện đại, tối ưu trải nghiệm người dùng.
  - Sử dụng **Middleware** để kiểm soát truy cập trang, bảo vệ các dữ liệu nội bộ.
  - Phát triển **AuthProvider** context để quản lý trạng thái phiên làm việc (session) và quyền hạn xuyên suốt ứng dụng.
- **Quản lý Hồ sơ Người dùng:** Tạo bảng `user_profiles` lưu trữ vai trò (`admin`/`user`) và phạm vi quản lý dữ liệu (`scope`).

### Changed
- **Cải tiến Header:** 
  - Hiển thị tên người dùng đang đăng nhập và nút Đăng xuất trực quan.
  - **Phân quyền Menu:** Tự động ẩn mục "Danh mục Cơ quan" đối với những tài khoản không có quyền Admin.
- **Giới hạn Dữ liệu theo Phạm vi (Data Scoping):**
  - **Trang Quản lý Án & Tổng Quan:** Tự động lọc toàn bộ danh sách và thống kê theo `scope` của tài khoản (Ví dụ: Tài khoản Phú Quốc chỉ tiếp cận được các hồ sơ thuộc UBND/Chủ tịch UBND Đặc khu Phú Quốc).
  - **Modal Thêm Án:** Giới hạn danh sách gợi ý "Người phải thi hành" đúng theo phạm vi được phân công của người dùng.
- **Bảo mật Database:** Thiết lập các chính sách RLS (Row Level Security) trên bảng `user_profiles`.


## [1.4.1] - 2026-03-25

### Added
- **Tính năng Tải file Excel mẫu:** Bổ sung khả năng tạo và tải xuống file Excel mẫu (.xlsx) trực tiếp từ trình duyệt.
  - File mẫu gồm 3 sheet: "Mẫu - Đang thi hành", "Mẫu - Đã thi hành" và "Hướng dẫn".
  - Thiết kế chuyên nghiệp với Header đỏ đậm, hướng dẫn chi tiết từng cột và dữ liệu mẫu thực tế hỗ trợ người dùng nhập liệu chính xác.
  - Tích hợp logic tự động bóc tách ngày tháng và mapping đơn vị hành chính.

### Changed
- **Giao diện AnHanhChinhPage:** Thay thế nút "Tải lại" bằng nút "Tải file Excel mẫu" với icon Download và màu sắc xanh dương đồng bộ, giúp người dùng dễ dàng tiếp cận biểu mẫu chuẩn để import dữ liệu.


## [1.4.0] - 2026-03-25

### Added
- **Trang Tổng Quan Thống Kê:** Khởi tạo trang `/tong-quan` mới hoạt động như Dashboard chính thay thế danh sách án.
  - Tích hợp 4 KPI Cards nổi bật: Tổng số án, Số án đã thi hành, Số án đang thi hành, và Số án chờ theo dõi.
  - Logic thống kê thông minh: Nhận diện án "Chờ theo dõi" trực tiếp từ danh sách "Đang thi hành" (thông qua dữ liệu có trong cột Lý do chờ theo dõi).
  - Tích hợp thư viện `Chart.js` hiển thị trực quan tỷ lệ bằng Biểu đồ Tròn (Trạng thái án), Biểu đồ Cột (So sánh trạng thái), và Biểu đồ Thanh ngang (Top 8 cơ quan có nhiều án nhất).
  - Thanh tiến độ (Progress bar) hiển thị tỷ lệ % án đã hoàn thành.

### Changed
- Cập nhật Redirect mặc định của trang chủ (`/`) chuyển hướng sang trang Tổng Quan thay vì trang danh sách Quản lý án như trước.
- **Tối ưu hiển thị nhiều người:** Cải tiến UI bảng danh sách tại `AnHanhChinhPage`. Cột "Người khởi kiện" giờ đây hỗ trợ tự động xuống dòng và phân cách bằng đường kẻ mờ đối với các vụ án có nhiều người khởi kiện (đọc từ ký tự xuống dòng `\r\n`).

## [1.3.0] - 2026-03-24

### Added
- **UI Nhận diện bằng số:** Đánh số thứ tự (1-7) tại các cột bảng danh sách `AnHanhChinhPage` (với thiết kế vòng tròn nền đỏ, chữ trắng) và trên tiêu đề field ở `AddAnModal`, `DetailModal` để phản ánh đúng logic quy trình luân chuyển án.
- **Icon mới:** Thêm biểu tượng Cái cân (`Scale`) cho mục "Nghĩa vụ phải Thi hành án" (Số 5).
- **Mục "Chờ theo dõi" (Số 8):** Bổ sung trường nhập liệu mới `ly_do_cho_theo_doi` trong bảng CSDL `an_hanh_chinh`. Tại `DetailModal`, khi nhập dữ liệu vào ô này sẽ hiển thị nút "Chuyển sang Chờ theo dõi" màu đỏ.
- **Mục "Kết quả thi hành án" (Số 9):** Tương tự như trên, khi nhập dữ liệu kết quả sẽ tự động hiện ra nút "Chuyển sang Án xong" màu xanh lá.

### Changed
- **Logic sắp xếp form:** Bố cục lại thứ tự các trường cả trong `AddAnModal` và `DetailModal` (cột bên trái) một cách thống nhất theo chiều dọc: 2 (Người khởi kiện) -> 3 (Số Bản án) -> 4 (Người phải thi hành) -> 5 (Nghĩa vụ thi hành án) -> 6 (QĐ buộc thi hành án).
- **Layout Detail Modal:** Chuyển phần Quá trình Thi hành án (Số 7) sang cột bên phải (Sidebar Timeline) và các mục thông tin khác vào cột bên trái.

## [1.2.0] - 2026-03-21

### Added
- **Trang Quản lý Danh mục Cơ quan:** Xây dựng trang `/co-quan` hoàn chỉnh với các tính năng:
  - Phân loại đơn vị theo 3 cấp: Cấp tỉnh, Sở Ngành, Cấp xã.
  - Chức năng CRUD (Thêm, Sửa, Xóa) cơ quan trực tiếp trên giao diện.
  - Bộ lọc tìm kiếm nhanh và hiển thị số lượng item theo từng tab.
  - Giao diện tối ưu với thanh cuộn độc lập cho danh sách, cố định Header và Tabs.
- **Import dữ liệu hành chính:** Script tự động parse file `DVHC.xlsx` và import 204 bản ghi (UBND và Chủ tịch UBND) của 102 đơn vị cấp xã vào database.
- **Validation Dropdown bắt buộc:** Áp dụng ràng buộc dữ liệu cho ô "Người phải thi hành" ở cả `AddAnModal` và `DetailModal`. Bắt buộc chọn từ danh sách có sẵn, tô đỏ cảnh báo nếu nhập sai.

### Changed
- **Nâng cấp Form Thêm Án Mới (AddAnModal):** 
  - Đồng bộ giao diện 2 cột và các thành phần nhập liệu cao cấp từ `DetailModal`.
  - Hỗ trợ nhập mảng (Array) cho "Số bản án/Quyết định" và "Quyết định buộc thi hành án" (thêm được nhiều mục cùng lúc).
  - Tích hợp `EditableCombobox` để chọn đơn vị thi hành từ danh mục.
  - Tự động tạo mốc sự kiện đầu tiên trong Timeline khi khởi tạo hồ sơ.
- **Cập nhật Header:** Bổ sung menu điều hướng giữa "Quản lý Án" và "Danh mục Cơ quan".

### Fixed
- Lỗi font chữ màu trắng khó nhìn trên input popup biên tập.
- Lỗi thiếu `ToastProvider` khi truy cập trang danh mục do sai cấu trúc thư mục App Router.

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
