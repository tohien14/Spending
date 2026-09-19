# Sổ Chi Tiêu — Hệ thống quản lý chi tiêu cá nhân

Ứng dụng web quản lý chi tiêu cá nhân, gồm 2 phần:

- **backend/** — API viết bằng Node.js + Express, lưu dữ liệu vào **SQLite**
  qua module **`node:sqlite`** tích hợp sẵn trong Node.js (không phải một
  gói cài thêm). Toàn bộ dữ liệu nằm trong **1 file duy nhất**
  `backend/data/expenses.db` — không cần cài đặt hay khởi chạy bất kỳ server
  cơ sở dữ liệu nào (không MySQL, không PostgreSQL, không Docker...). File
  này tự được tạo ra trong lần chạy đầu tiên.
- **frontend/** — Giao diện viết bằng React (Vite), gọi API của backend.

## Yêu cầu

- **Node.js phiên bản 22.5 trở lên** (khuyến nghị bản 22 LTS mới nhất hoặc
  bản 24 trở lên) — kiểm tra bằng `node -v`. Vì backend dùng module
  `node:sqlite` tích hợp sẵn trong Node.js thay vì gói `better-sqlite3` phải
  biên dịch native, nên bạn **không cần cài Python hay Visual Studio Build
  Tools** như một số hướng dẫn Node + SQLite khác trên Windows.
- npm (đi kèm sẵn với Node.js)

## Cài đặt

Mở 2 cửa sổ terminal (1 cho backend, 1 cho frontend).

**Terminal 1 — Backend**

```bash
cd backend
npm install
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`. Khi chạy lần đầu, hệ thống sẽ tự
tạo file `backend/data/expenses.db` và seed sẵn 8 danh mục chi tiêu mặc định
(Ăn uống, Di chuyển, Nhà ở, Giải trí, Sức khỏe, Mua sắm, Hóa đơn, Khác).

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`. Mở địa chỉ này trên trình
duyệt để sử dụng ứng dụng.

> Nếu bạn đổi cổng (port) của backend, hãy copy `frontend/.env.example`
> thành `frontend/.env` và sửa giá trị `VITE_API_URL` cho khớp.

## Sử dụng hằng ngày

Sau khi cài đặt xong lần đầu, mỗi lần dùng bạn chỉ cần mở 2 terminal và chạy
lại `npm run dev` ở mỗi thư mục (không cần `npm install` lại, trừ khi có
cập nhật dependency mới).

## Sao lưu / chuyển dữ liệu sang máy khác

Vì toàn bộ dữ liệu nằm trong file `backend/data/expenses.db`, bạn chỉ cần
copy file này sang máy khác (đặt đúng vị trí `backend/data/expenses.db`) là
có đầy đủ lịch sử chi tiêu. Nên định kỳ copy file này ra nơi khác để sao lưu.

## Tính năng

- Thêm / sửa / xoá giao dịch (chi tiêu hoặc thu nhập), theo ngày, danh mục, ghi chú
- Trang **Tổng quan**: tổng chi/thu trong tháng, số dư, ngân sách còn lại,
  biểu đồ tròn theo danh mục, thanh tiến độ ngân sách từng danh mục, biểu
  đồ xu hướng thu/chi 6 tháng gần nhất
- Trang **Giao dịch**: danh sách đầy đủ, lọc theo tháng / danh mục / loại
- Trang **Danh mục**: thêm danh mục mới, đặt ngân sách hàng tháng cho từng
  danh mục, sửa/xoá danh mục

## Build bản production cho frontend (tuỳ chọn)

Nếu muốn build file tĩnh để deploy:

```bash
cd frontend
npm run build
```

Kết quả nằm ở `frontend/dist/`. Bạn cần host thư mục này bằng một web server
tĩnh bất kỳ, và đảm bảo backend vẫn đang chạy để frontend gọi API tới.

## Xử lý sự cố

**Lỗi khi `npm install` ở backend liên quan đến `node-gyp`, `python`,
`Visual Studio Build Tools`...**
Đây là lỗi của các bản cũ dùng gói `better-sqlite3` (cần biên dịch native
bằng Python/C++). Bản hiện tại đã chuyển sang dùng `node:sqlite` tích hợp
sẵn trong Node.js nên sẽ không còn lỗi này nữa. Nếu bạn vẫn gặp lỗi này:
1. Kiểm tra `node -v` — cần từ **22.5.0** trở lên. Nếu thấp hơn, hãy cập
   nhật Node.js tại https://nodejs.org.
2. Xoá `backend/node_modules` và `backend/package-lock.json` rồi chạy lại
   `npm install`.

**Thấy dòng cảnh báo `ExperimentalWarning: SQLite is an experimental
feature...` khi chạy backend** — đây chỉ là cảnh báo, không phải lỗi. Module
`node:sqlite` vẫn đang ở trạng thái "experimental" theo cách gọi của
Node.js nhưng hoạt động ổn định, ứng dụng vẫn chạy bình thường.
