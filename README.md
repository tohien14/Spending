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
   chuỗi kết nối đó vào biến `DATABASE_URL`.

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

## Đăng nhập & tài khoản

Ứng dụng hỗ trợ **2 tài khoản độc lập hoàn toàn** — mỗi người đăng nhập
riêng, dữ liệu (giao dịch, danh mục, ngân sách, thu nhập) của người này
**không ai khác xem được**, kể cả người dùng chung 1 database.

Tài khoản mặc định (dùng được ngay, không cần cấu hình gì thêm):

| Tên đăng nhập | Mật khẩu | Hiển thị |
|---|---|---|
| `hien` | `1234&` | Hiền |
| `duc` | `1234@` | Đức |

**Muốn đổi tên đăng nhập/mật khẩu/tên hiển thị?** Mở `backend/.env`, thêm
các dòng (xem đầy đủ trong `.env.example`):

```
USER1_USERNAME=hien
USER1_PASSWORD=mat-khau-moi-cua-ban
USER1_DISPLAY_NAME=Hiền

USER2_USERNAME=duc
USER2_PASSWORD=mat-khau-moi-cua-ban
USER2_DISPLAY_NAME=Đức
```

⚠️ Các biến này **chỉ có tác dụng ở lần chạy đầu tiên** — tức là lúc tài
khoản được tạo ra trong database. Nếu tài khoản đã tồn tại rồi (bạn đã
chạy `npm run dev` ít nhất 1 lần), đổi biến môi trường sau đó sẽ không tự
đổi mật khẩu tài khoản cũ. Cách đổi mật khẩu cho tài khoản đã tồn tại: xoá
dòng tương ứng trong bảng `users` của database rồi khởi động lại backend
để nó tạo lại tài khoản đó với mật khẩu mới (dữ liệu chi tiêu của tài
khoản đó vẫn giữ nguyên vì được liên kết theo `user_id`, không theo tên
đăng nhập) — nếu cần hỗ trợ, cứ nhắn lại.

**Nếu bạn đang nâng cấp từ bản 1-người-dùng cũ (đã có sẵn dữ liệu)** —
không cần làm gì cả. Lần chạy đầu tiên với bản mới, hệ thống tự động gán
toàn bộ dữ liệu cũ đó cho tài khoản **đầu tiên** trong danh sách (mặc định
là `hien`) — không mất dữ liệu, tài khoản `duc` sẽ bắt đầu với dữ liệu
trống (8 danh mục mặc định).

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

- **Đăng nhập 2 tài khoản độc lập** — mỗi người có dữ liệu chi tiêu hoàn
  toàn riêng, không ai thấy được dữ liệu của người kia (xem mục "Đăng nhập
  & tài khoản" ở trên)
- Thêm / sửa / xoá giao dịch (chi tiêu hoặc thu nhập), theo ngày, danh mục, ghi chú
- **Thêm nhiều giao dịch cùng lúc**: ở trang Giao dịch, bấm "+ Thêm nhiều
  giao dịch" để mở bảng nhập nhiều dòng một lần (ngày, loại, danh mục, số
  tiền, ghi chú mỗi dòng riêng), bấm "+ Thêm dòng" để thêm dòng trống, rồi
  "Lưu tất cả" để lưu một lần. Nếu có dòng nào bị lỗi (thiếu số tiền, sai
  danh mục...), hệ thống báo rõ lỗi ở dòng thứ mấy và **không lưu bất kỳ
  dòng nào** cho đến khi bạn sửa đúng hết — tránh tình trạng lưu sót nửa
  chừng.
- Trang **Tổng quan**: tổng chi/thu trong tháng, số dư, ngân sách còn lại,
  biểu đồ tròn theo danh mục, thanh tiến độ ngân sách từng danh mục, biểu
  đồ **nhịp độ chi tiêu trong tháng** (chi từng ngày + đường luỹ kế so với
  vạch ngân sách, thay cho biểu đồ 6 tháng cũ — hợp lý hơn vì dữ liệu giờ
  chỉ giữ tối đa 3 tháng, xem mục "Tự động xoá dữ liệu cũ" bên dưới)
- Trang **Giao dịch**: danh sách đầy đủ, lọc theo tháng / danh mục / loại
- Trang **Danh mục**: nhập **lương / thu nhập riêng cho từng tháng**, đặt
  ngân sách riêng cho từng tháng ở mỗi danh mục, xem thanh tiến độ đã phân
  bổ bao nhiêu so với thu nhập, nút "chia đều" thu nhập cho các danh mục.
  **Mỗi tháng hoàn toàn độc lập** — đổi lương hoặc ngân sách của tháng 10
  không làm thay đổi số liệu đã lưu của tháng 9. Tháng đã nhập lương rồi
  sẽ hiển thị ở dạng xem (số lớn, rõ ràng) kèm nút "Sửa" — không hiện lại
  ô nhập trừ khi bạn bấm sửa.
- Bấm vào logo "Spending" ở góc trên sidebar để quay về trang Tổng quan
  từ bất kỳ đâu trong app.

## Tự động xoá dữ liệu cũ

Để database không phình to mãi theo thời gian, ứng dụng **tự động xoá
vĩnh viễn** dữ liệu cũ hơn một khoảng thời gian nhất định — mặc định **giữ
lại 3 tháng** (tháng hiện tại + 2 tháng trước), xoá từ tháng thứ 4 trở về
trước. Ví dụ: dữ liệu tháng 9 sẽ bị xoá khi hệ thống sang đến tháng 12.

Việc dọn dẹp này chạy tự động mỗi khi backend khởi động, và lặp lại mỗi 24
giờ nếu backend chạy liên tục không tắt. Không cần bạn làm gì cả.

⚠️ **Đây là xoá vĩnh viễn, không có cách khôi phục lại.** Nếu bạn muốn giữ
dữ liệu lâu hơn:

- Đổi biến môi trường `RETENTION_MONTHS` trong `backend/.env` (VD đặt
  `RETENTION_MONTHS=12` để giữ cả năm) — xem giải thích chi tiết trong
  `.env.example`.
- Hoặc tự sao lưu định kỳ trước khi dữ liệu tới hạn (xem mục "Sao lưu dữ
  liệu" ở trên).

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
  Nếu muốn đổi tên đăng nhập/mật khẩu mặc định khỏi tài khoản mẫu, thêm
  luôn các biến `USER1_USERNAME`, `USER1_PASSWORD`, `USER2_USERNAME`,
  `USER2_PASSWORD`, `JWT_SECRET`... như mô tả ở mục "Đăng nhập & tài
  khoản" — chỉ áp dụng cho lần deploy đầu tiên (lúc tài khoản được tạo).
  Muốn giữ dữ liệu lâu hơn 3 tháng mặc định, thêm biến `RETENTION_MONTHS`
  (xem mục "Tự động xoá dữ liệu cũ" ở trên).
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

**Đăng nhập báo "Sai tên đăng nhập hoặc mật khẩu"** — kiểm tra lại đúng
tài khoản mặc định (`hien`/`1234&` hoặc `duc`/`1234@`), phân biệt hoa
thường ở mật khẩu (tên đăng nhập thì không phân biệt hoa thường). Nếu bạn
đã đổi qua biến môi trường, nhớ là biến đó **chỉ áp dụng lúc tài khoản
được tạo lần đầu** (xem mục "Đăng nhập & tài khoản").

**Trang tự động quay về màn hình Đăng nhập dù vừa đăng nhập xong** —
thường do 2 lý do: (1) `JWT_SECRET` đổi giữa các lần chạy backend (mỗi lần
đổi sẽ làm mọi token cũ hết hiệu lực, phải đăng nhập lại — đây là hành vi
bình thường, không phải lỗi); (2) đồng hồ hệ thống trên máy chủ sai giờ,
khiến token bị coi là hết hạn ngay lập tức.
