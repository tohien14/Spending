# Sổ Chi Tiêu — Hệ thống quản lý chi tiêu cá nhân

Ứng dụng web quản lý chi tiêu cá nhân, gồm 2 phần:

- **backend/** — API viết bằng Node.js + Express, lưu dữ liệu vào
  **PostgreSQL**. Bạn cần một chuỗi kết nối Postgres (xem hướng dẫn lấy
  miễn phí ở mục "Cơ sở dữ liệu PostgreSQL" bên dưới) — đặt vào biến môi
  trường `DATABASE_URL`.
- **frontend/** — Giao diện viết bằng React (Vite), gọi API của backend.

> **Đã đổi từ SQLite sang PostgreSQL** để dữ liệu không bị mất khi deploy
> lên các nền tảng có ổ đĩa tạm thời như Render (xem mục "Đưa lên Render"
> bên dưới để biết lý do).

## Yêu cầu

- Node.js phiên bản 18 trở lên — kiểm tra bằng `node -v`.
- npm (đi kèm sẵn với Node.js).
- Một cơ sở dữ liệu PostgreSQL (chuỗi kết nối `DATABASE_URL`) — xem mục
  ngay dưới đây để lấy miễn phí trong vài phút, không cần cài gì lên máy.

## Cơ sở dữ liệu PostgreSQL

Bạn **không cần cài PostgreSQL lên máy**. Cách nhanh nhất là dùng một dịch
vụ Postgres miễn phí trên mạng (giống Google Sheets — họ giữ hộ dữ liệu
của bạn, bạn chỉ cần 1 chuỗi kết nối):

1. Tạo tài khoản miễn phí tại **[Neon](https://neon.tech)** (khuyên dùng —
   không tự ngủ, không giới hạn thời gian) hoặc **[Supabase](https://supabase.com)**.
2. Tạo 1 project/database mới.
3. Copy chuỗi kết nối họ đưa cho bạn, dạng:
   ```
   postgres://user:password@ep-xyz-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Trong thư mục `backend`, copy file `.env.example` thành `.env`, dán
   chuỗi kết nối đó vào biến `.`.

Dùng đúng 1 database này cho cả lúc chạy ở máy bạn (local) lẫn khi deploy
online — dữ liệu sẽ đồng nhất giữa 2 nơi.

> Nếu bạn muốn chạy Postgres ngay trên máy mình (không bắt buộc): cài
> [Postgres.app](https://postgresapp.com) (Mac) hoặc
> [PostgreSQL Windows installer](https://www.postgresql.org/download/windows/),
> tạo 1 database, rồi dùng chuỗi kết nối dạng
> `postgres://postgres:matkhau@localhost:5432/ten_database`.

## Cài đặt

Mở 2 cửa sổ terminal (1 cho backend, 1 cho frontend).

**Terminal 1 — Backend**

```bash
cd backend
npm install
cp .env.example .env   # rồi mở file .env vừa tạo, dán DATABASE_URL của bạn vào
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`. Khi chạy lần đầu, hệ thống sẽ
tự tạo các bảng cần thiết trong database và seed sẵn 8 danh mục chi tiêu
mặc định (Ăn uống, Di chuyển, Nhà ở, Giải trí, Sức khỏe, Mua sắm, Hóa đơn,
Khác).

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

## Sao lưu dữ liệu

Vì dữ liệu giờ nằm trong Postgres (không còn là 1 file trên máy bạn), cách
sao lưu là dùng công cụ export của nhà cung cấp Postgres bạn chọn (Neon và
Supabase đều có nút "Backup"/"Export" trong dashboard), hoặc dùng lệnh
`pg_dump` chuẩn của Postgres nếu bạn quen dùng dòng lệnh:

```bash
pg_dump "chuoi-ket-noi-DATABASE_URL-cua-ban" > backup.sql
```

## Tính năng

- Thêm / sửa / xoá giao dịch (chi tiêu hoặc thu nhập), theo ngày, danh mục, ghi chú
- Trang **Tổng quan**: tổng chi/thu trong tháng, số dư, ngân sách còn lại,
  biểu đồ tròn theo danh mục, thanh tiến độ ngân sách từng danh mục, biểu
  đồ xu hướng thu/chi 6 tháng gần nhất
- Trang **Giao dịch**: danh sách đầy đủ, lọc theo tháng / danh mục / loại
- Trang **Danh mục**: nhập **lương / thu nhập riêng cho từng tháng**, đặt
  ngân sách riêng cho từng tháng ở mỗi danh mục, xem thanh tiến độ đã phân
  bổ bao nhiêu so với thu nhập, nút "chia đều" thu nhập cho các danh mục.
  **Mỗi tháng hoàn toàn độc lập** — đổi lương hoặc ngân sách của tháng 10
  không làm thay đổi số liệu đã lưu của tháng 9.

## Build bản production cho frontend (tuỳ chọn)

Nếu muốn build file tĩnh để deploy:

```bash
cd frontend
npm run build
```

Kết quả nằm ở `frontend/dist/`. Bạn cần host thư mục này bằng một web server
tĩnh bất kỳ, và đảm bảo backend vẫn đang chạy để frontend gọi API tới.

## Đưa lên Render (deploy online)

Bạn có thể deploy miễn phí lên [Render](https://render.com) để dùng ứng
dụng từ điện thoại/máy khác.

### 1. Chuẩn bị database Postgres

Làm theo mục "Cơ sở dữ liệu PostgreSQL" ở trên (Neon hoặc Supabase) để có
sẵn 1 chuỗi `DATABASE_URL`. (Bạn cũng có thể dùng Render Postgres — New →
PostgreSQL — nhưng bản Free của Render Postgres **tự xoá sau 30 ngày**,
nên Neon/Supabase là lựa chọn bền hơn cho dùng lâu dài miễn phí.)

### 2. Deploy backend (Web Service)

- New → Web Service → trỏ tới repo, **Root Directory**: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Vào tab **Environment**, thêm biến:
  ```
  DATABASE_URL = <chuỗi kết nối Postgres của bạn>
  ```
- Sau khi deploy xong, bạn sẽ có 1 địa chỉ dạng
  `https://ten-backend-cua-ban.onrender.com`. Mở
  `https://ten-backend-cua-ban.onrender.com/api/health` để kiểm tra — thấy
  `{"ok":true,...}` là backend đã chạy đúng.

### 3. Deploy frontend (Static Site) — bước hay bị thiếu

- New → Static Site → trỏ tới repo, **Root Directory**: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- **Quan trọng nhất**: vào tab **Environment** của service frontend, thêm
  biến:
  ```
  VITE_API_URL = https://ten-backend-cua-ban.onrender.com/api
  ```
  (thay bằng địa chỉ backend thật của bạn ở bước 2, nhớ có `/api` ở cuối).
- Vì Vite gắn cứng biến này vào file build lúc build, nên **sau khi thêm
  biến bạn phải bấm Manual Deploy → Clear build cache & deploy** để build
  lại — chỉ lưu biến môi trường mà không build lại thì frontend vẫn dùng
  giá trị cũ (mặc định là `localhost`, không tồn tại khi đã lên mạng —
  đây chính là lý do trang có thể bị treo ở "Đang tải..." mãi không hết).

Sau khi làm đúng các bước trên, mở lại trang frontend, trang sẽ tải được
dữ liệu bình thường. Nếu vẫn lỗi, ứng dụng đã có khung báo lỗi rõ ràng
("Không tải được dữ liệu...") thay vì treo vô thời hạn — bạn xem nội dung
lỗi hiển thị để biết chính xác chỗ sai.

### Vì sao phải đổi sang Postgres?

Gói Free của Render **không lưu file ổ đĩa lâu dài** — mỗi khi service tự
ngủ (sau 15 phút không ai truy cập) hoặc mỗi lần deploy lại, mọi file trên
service (kể cả 1 file SQLite) sẽ bị xoá sạch. Vì database Postgres của bạn
(Neon/Supabase) là **một dịch vụ tách biệt, độc lập với backend**, dữ liệu
được giữ nguyên dù backend trên Render có redeploy hay ngủ/thức bao nhiêu
lần đi nữa.

## Xử lý sự cố

**Backend báo lỗi "Thiếu biến môi trường DATABASE_URL" rồi thoát ngay
khi chạy** — bạn chưa tạo file `backend/.env` hoặc chưa dán chuỗi kết nối
vào. Xem mục "Cơ sở dữ liệu PostgreSQL" ở trên.

**Lỗi kết nối kiểu `ECONNREFUSED`, `self signed certificate`, hoặc
`password authentication failed`** — kiểm tra lại bạn đã copy đúng, đủ
chuỗi `DATABASE_URL` (không thiếu ký tự, không thừa khoảng trắng) từ đúng
dashboard Neon/Supabase/Render Postgres bạn đang dùng.

**Trang frontend treo ở "Đang tải..." khi đã deploy** — 99% là do
`VITE_API_URL` chưa trỏ đúng backend hoặc chưa build lại sau khi đổi biến
môi trường. Xem mục "Đưa lên Render" ở trên.

**Nếu bạn từng dùng bản cũ chạy bằng SQLite** — dữ liệu cũ nằm trong file
`backend/data/expenses.db` trên máy bạn, không tự động chuyển sang
Postgres được (2 loại cơ sở dữ liệu khác nhau). Ứng dụng bản Postgres sẽ
bắt đầu với dữ liệu trống (chỉ có 8 danh mục mặc định). Nếu bạn cần mang
dữ liệu cũ từ SQLite sang, cứ nhắn lại để được hỗ trợ viết 1 script chuyển
đổi riêng.
