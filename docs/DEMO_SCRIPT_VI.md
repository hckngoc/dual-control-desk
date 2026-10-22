# Video 2 phút — lời nói và thao tác

Quay live app + console. Dùng screen recorder của Mac/OBS; bạn tự bổ sung video. Trước khi quay: mọi tài khoản đã liên kết, role đúng, CR governance chuẩn bị sẵn nhưng chưa đủ chữ ký. Ẩn mật khẩu, invite URL, token và email cá nhân. Có thể cắt đoạn đổi profile; không cắt để tạo ấn tượng kết quả không có thật.

| Thời gian | Màn hình và thao tác                                                       | Lời nói gợi ý                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00–15s    | App live, khoản chi thiết bị phòng khám 75 triệu VND                       | “Hai chữ ký phê duyệt sẽ vô nghĩa nếu một quản trị viên có thể tự biến mình thành cả hai người duyệt. Chúng tôi bảo vệ cả khoản chi lẫn quyền được duyệt.”                          |
| 15–30s    | Requester submit hoặc mở yêu cầu mới, thử Execute khi chưa đủ approvals    | “Ứng dụng dùng danh tính TideCloak. Đây là dữ liệu giả và thanh toán giả. Một yêu cầu chưa có đủ người duyệt bị chặn.”                                                              |
| 30–48s    | Finance profile Approve, Compliance profile Approve                        | “Finance và Compliance là hai subject độc lập. Người tạo không tự duyệt; một người không thể chiếm cả hai vị trí.”                                                                  |
| 48–65s    | Executor chạy mock payment; hiện receipt                                   | “Bộ thực thi riêng kiểm tra lại token Tide, DPoP và mã băm nội dung. Sửa cột đã duyệt trong database không đủ để qua bước này.”                                                     |
| 65–90s    | Realm console: role grant CR, threshold 2, Admin A ký một lần; vẫn pending | “Điểm thay đổi nằm ở đây: quyền trở thành approver được IGA quản lý. Realm có ba admin đã liên kết. Một admin không thể tự cấp quyền này; yêu cầu vẫn pending sau chữ ký thứ nhất.” |
| 90–108s   | Admin B ký qua enclave; CR committed; fresh target token/login có quyền    | “Khi admin độc lập thứ hai đồng ý, quorum mới đạt và quyền mới có hiệu lực. Ứng dụng không giữ master credential để bỏ qua bước này.”                                               |
| 108–120s  | Quay lại request/receipt, tên repo                                         | “Nhờ vậy nhóm cộng đồng có thể cùng chi tiêu mà không giao toàn bộ quyền quyết định cho một người. Repo có hướng dẫn chạy, kiểm thử và giới hạn bảo mật rõ ràng.”                   |

Không dùng `/lab` làm cảnh chứng minh IGA thật. Đừng nói rằng Tide ký trực tiếp giao dịch ngân hàng: đây là mock rail và policy nghiệp vụ là code ứng dụng, còn Tide bảo vệ danh tính/quyền và governance. Nếu reviewer proof hết hạn giữa các cảnh, Renew hai approvals rồi quay lại; không tắt expiry để quay.

## Chèn video

1. Xuất MP4 khoảng 2 phút, tối ưu dưới giới hạn file thông thường của GitHub (nên khoảng 20–50 MB).
2. Lưu `demo/demo.mp4`; không đưa token/secret vào file.
3. Thay dòng Recording pending trong README bằng `[Watch the demo](demo/demo.mp4)`.
4. Commit/push, mở link trên public repo khi đã logout. Nếu dùng Git LFS, kiểm tra người chấm thực sự xem được; video nhỏ lưu trực tiếp đơn giản hơn.
