# Chạy và kiểm tra dự án từng bước

## 1. Hiểu phần nào đã có, phần nào bạn phải cấu hình

Code, giao diện, backend, kiểm thử và kịch bản demo đã nằm trong repo. Đăng nhập TideCloak thật cần realm được cấp phép, tài khoản thật đã liên kết và adapter xuất từ realm đó. Plugin Tide trong ChatGPT chỉ giúp agent đọc hướng dẫn; nó không tự tạo các tài khoản và quyền cho ứng dụng.

Bạn có thể luyện giao diện ngay mà chưa cần realm. Muốn nộp bài, phải hoàn thành cả phần TideCloak thật và quay demo ở phần 7. Không dùng trang `/lab` làm bằng chứng tích hợp thật.

## 2. Chuẩn bị máy

Mac: cài Node.js 24 LTS, Git và Docker Desktop. Mở Docker Desktop, đợi engine chạy.

```bash
node --version
npm --version
git --version
docker info
```

Cài jq nếu chưa có: `brew install jq`. Máy cần truy cập npm registry, Docker registry, máy chủ Tide và mạng ORK; chỉ localhost hoạt động là chưa đủ.

Giải nén repo, mở Terminal ở thư mục có `package.json`:

```bash
cd dual-control-desk
npm ci
npm run dev
```

Mở **http://localhost:3000/lab**. Thử thanh toán trước hai lượt duyệt → bị chặn trong mô phỏng; duyệt Finance và Compliance → thử lại. Thử một admin ký thay đổi quyền → còn pending; admin thứ hai ký → committed trong mô phỏng. Bấm Reset để làm lại. `Ctrl+C` dừng server.

## 3A. Nếu team ĐÃ có TideCloak chạy

Không chạy `npm run init` để ghi đè. Script mới sẽ từ chối khi thấy container `tidecloak` đã tồn tại, không dừng hoặc xóa nó.

1. Mở console của **realm ứng dụng**, không dùng master realm để demo.
2. Xác nhận realm đã được cấp phép, bật IGA với attestor Tide; client public có standard flow, PKCE và DPoP. Cần flow/mappers Tide đúng, không phải realm Keycloak thông thường.
3. Client mặc định của repo là `dual-control-desk-client`, realm `dual-control-desk`. Nếu dùng tên khác, adapter là nguồn xác thực tên thật. Liên kết console trên giao diện hiện mặc định localhost/dual-control-desk; sửa link trong `src/app/dashboard/page.tsx` theo realm thật nếu khác.
4. Đặt redirect URI của client bao gồm `http://localhost:3000/*`, Web Origins là `http://localhost:3000`. Cấu hình client-origin auth đúng origin và ký lại IDP settings theo Tide; thay đổi được IGA quản lý phải qua quorum. Không tắt DPoP để chữa lỗi đăng nhập.
5. Thêm đủ ba admin và app roles theo phần 4; kiểm tra chính change request hiển thị threshold **ít nhất 2**. Không suy ra số admin chỉ từ số người trong team.
6. Xuất adapter bằng mục installation của client, provider **keycloak-oidc-keycloak-json**, lưu thành `data/tidecloak.json`. Phải có `jwk.keys` không rỗng, `vendorId` và client-origin authorization. Không dùng adapter Keycloak thường thiếu khóa Tide.

Có thể dùng helper chỉ đọc để xuất adapter nếu bạn quản lý deployment:

```bash
cp .env.bootstrap.example .env.bootstrap
# Điền thông tin operator thật trong .env.bootstrap, đúng URL/realm/client.
# Không gửi password vào chat hoặc commit file này.
npm run export:adapter
```

Helper chỉ đọc client và export adapter; không tạo, đổi hay tự phê duyệt quyền. Master token chỉ dùng trong tiến trình operator này, không đưa vào runtime.

## 3B. Nếu cần tạo realm MỚI trên Docker cục bộ

Đây là lựa chọn local Docker. Nếu muốn dùng Skycloak, dừng ở đây và cấu hình hosted realm theo Tide, sau đó dùng nhánh 3A; không dùng script Docker cho hosting khác.

```bash
cp .env.bootstrap.example .env.bootstrap
```

Mở `.env.bootstrap` trong VS Code, điền:

- `KC_BOOTSTRAP_ADMIN_PASSWORD`: mật khẩu mạnh do bạn chọn cho operator.
- `TIDE_LICENSE_EMAIL`: địa chỉ email thật bạn kiểm soát.
- `TIDE_TERMS_ACCEPTED=yes`: **chỉ chính bạn điền sau khi đọc và đồng ý** [điều khoản Tide](https://tide.org/legal). Không đồng ý thì không khởi tạo.

```bash
npm run init
```

Script dựa trên bootstrap chính thức Tide Agent Pack v1.9.33, tạo instance và realm mới, bật IGA, liên kết admin đầu tiên và xuất adapter. Nó dùng Docker named volume `dual-control-desk-tidecloak-h2` để giữ database riêng với database app. Script không tự reset container cũ.

Khi có invite URL, mở link trong browser và hoàn thành Tide account linking. Không đóng terminal trong lúc script chờ. Script có hướng dẫn về branding và thông tin người dùng; giữ giao diện đăng nhập Tide mặc định nếu chưa muốn tùy chỉnh. Ứng dụng dùng subject/username và không cần thu email của người dùng cuối.

Script bootstrap tạo **một admin ban đầu**, chưa đủ để chứng minh quorum hai người. Tiếp tục phần 4. Sau khi cấu hình xong, giữ `.env.bootstrap` ở máy operator, không đặt nó trong server chạy ứng dụng hoặc mock rail.

> Nếu script bị ngắt sau khi đã tạo container: không chạy lại để reset. `docker logs tidecloak` xem trạng thái, vào console hoàn tất các CR còn pending rồi export adapter theo 3A. Không bấm đồng ý toàn bộ change request khi chưa đọc nội dung.

## 4. Tài khoản và quyền cho team bốn người

Tạo bốn tài khoản Tide riêng, liên kết bằng invite flow, không chia sẻ một tài khoản hoặc browser session.

| Thành viên | Realm roles của app             | Client role quản trị                    |
| ---------- | ------------------------------- | --------------------------------------- |
| M1         | `requester`, `payment-executor` | `realm-management` → `tide-realm-admin` |
| M2         | `finance-approver`              | `realm-management` → `tide-realm-admin` |
| M3         | `compliance-approver`           | `realm-management` → `tide-realm-admin` |
| M4         | `auditor`                       | Không cần admin                         |

Trong console của governed realm:

1. Vào **Realm roles**, tạo đúng năm role ở bảng; đây là realm roles, không đặt trong client khác.
2. Trong **Users**, tạo các người dùng còn lại. Dùng tên hiển thị thật hoặc tên demo đã thống nhất; không bịa email cấp phép hay email recovery.
3. Các thao tác tạo user/role có thể tạo CR; mở **Change requests** (tên hiển thị tùy phiên bản), đọc nội dung và hoàn tất approval/commit cần thiết để user tồn tại.
4. Với M2, M3, trong Role mapping chọn client `realm-management`, gán `tide-realm-admin`. Role quản trị này là **client role**, khác năm realm roles của app. Hoàn tất IGA ceremony trên console bằng danh tính admin được yêu cầu; ở chế độ MultiAdmin cần ký trong enclave, không chỉ nhấn authorize cũ.
5. Tạo invite liên kết Tide account cho từng user bằng console. Nếu console không có nút invite ở bản đang dùng, dùng helper `npm run invite -- <username>` sau khi user được commit. Mỗi người tự mở link và liên kết tài khoản riêng. Link invite là bí mật tạm thời, không đưa vào GitHub/video.
6. Gán app roles đúng bảng và qua các change request tương ứng. Không cho requester vai trò reviewer trong bài demo. Không dùng role composite để âm thầm thêm reviewer.
7. Đảm bảo **ba tài khoản quản trị đã linked và grants đã committed**. Công thức pack hiện tại là `max(1, floor(TotalAdmins × 0.7))`: 2 admin chỉ cho threshold 1; 3 admin mới cho threshold 2. Chính CR đang thử phải cho thấy threshold ≥2, không chỉ dựa trên công thức.
8. Cấu hình access token lifespan ngắn, khoảng **120 giây**, qua governance. API/rail của repo còn giới hạn tuổi token tối đa 5 phút. Mọi người logout/login để có token chứa quyền mới.
9. Export adapter lần cuối. Nếu realm UI yêu cầu sign IDP settings sau thay đổi origin, hoàn tất trước khi export.

## 5. Chạy phiên bản tích hợp thật

Mỗi terminal cần `cd` vào cùng repo. Không source `.env.bootstrap` trong các terminal runtime.

```bash
npm run preflight
```

Phải PASS các kiểm tra adapter. Nó không tự chứng nhận IGA quorum; phần đó cần test thật.

Terminal 1:

```bash
npm run rail
```

Terminal 2:

```bash
npm run dev
```

Mở **http://localhost:3000**, Sign in with TideCloak. Dùng browser profiles riêng cho M1, M2, M3, M4; một cửa sổ private không đồng nghĩa nhiều tài khoản tách biệt nếu cùng private session.

Mặc định origin được ghim `http://localhost:3000`. Không thay bằng `127.0.0.1:3000` trên thanh địa chỉ. Server listen loopback vẫn chấp nhận hostname localhost. Nếu đổi port/host, đặt `APP_ORIGIN` nhất quán cho cả app và rail; cấu hình realm client-origin/redirect tương ứng, ký settings và export lại. Rail chạy bằng Node không tự đọc `.env`; có thể chạy `node --env-file=.env --import tsx rail/server.ts` khi dùng file runtime `.env`.

Bằng chứng duyệt có thời hạn: **sớm hơn giữa exp của access token, iat + 5 phút và tuổi DPoP 5 phút**. Thực hiện hai lượt duyệt và execute nhanh. Hết hạn → người duyệt login/refresh, bấm **Renew**; không thay đổi thông tin khoản chi.

## 6. Test trước khi quay

```bash
npm run check
```

Lệnh chạy TypeScript, unit/adversarial tests và build production. Tests dùng khóa ngẫu nhiên chỉ trong tiến trình test; không có account test có thể dùng đăng nhập runtime.

Đọc và làm toàn bộ [ACCEPTANCE.md](ACCEPTANCE.md), đặc biệt test role escalation IGA. `npm run check` xanh chưa chứng minh tài khoản Tide thật đã cấu hình đúng.

Muốn chạy bằng Docker cho app + rail, sau khi export adapter thật:

```bash
docker compose up --build
```

TideCloak vẫn chạy riêng trên localhost:8080, browser nói chuyện trực tiếp với nó. Đổi adapter phải rebuild. Hai service có volume database riêng; không dùng `docker compose down -v` nếu muốn giữ dữ liệu. Compose dành cho demo cục bộ, không phải deployment sản xuất đã harden.

## 7. Lỗi thường gặp

| Hiện tượng                        | Cách kiểm tra                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Trang báo setup required          | Adapter chưa export hoặc còn `_unconfigured`; export thật và restart app/rail.                                    |
| 401 khi gọi API                   | Dùng `secureFetch`; kiểm tra JWT/DPoP, đúng localhost origin, giờ máy, adapter và khóa; không chuyển sang Bearer. |
| 403                               | Role nằm sai scope/chưa commit hoặc token cũ. App dùng realm roles; logout/login.                                 |
| 412 lúc execute                   | Thiếu hai proofs hợp lệ, trùng người, proof hết hạn hoặc chi tiết đã đổi. Hai reviewer Renew rồi execute.         |
| Connection refused lúc execute    | Chưa chạy `npm run rail`, hoặc sai `RAIL_URL`.                                                                    |
| Một admin vẫn commit role grant   | Chưa đủ ba linked admins/threshold thực tế thấp, đang ở master realm hoặc IGA chưa đúng. Dừng demo và sửa realm.  |
| Login popup treo                  | Đúng DPoP relay, origin auth và signed IDP settings; browser cho phép popup.                                      |
| Init từ chối vì container tồn tại | Đây là bảo vệ dữ liệu. Dùng realm cũ/3A; không xóa container chỉ để bỏ lỗi.                                       |
| npm báo node:sqlite không có      | Cài Node.js 24 LTS và mở terminal mới.                                                                            |
| Dữ liệu mất sau tắt máy chủ cloud | Prototype dùng SQLite persistent disk; không triển khai kiểu serverless/ephemeral filesystem.                     |

## 8. Nộp bài

Làm theo [TEAM_GITHUB_VI.md](TEAM_GITHUB_VI.md) để tạo public repo và mời thành viên. Quay video theo [DEMO_SCRIPT_VI.md](DEMO_SCRIPT_VI.md), đặt tại `demo/demo.mp4`, thay link README. Mở repo khi đã logout GitHub để xác nhận public và link video chạy. Cuối cùng nộp repo URL qua Google Form của ban tổ chức.
