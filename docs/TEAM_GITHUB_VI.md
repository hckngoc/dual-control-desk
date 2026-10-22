# Team bốn người và public GitHub repo

## Đưa code lên GitHub

Gói ZIP chứa toàn bộ source repo, không kèm node_modules, database, secret hoặc adapter thật. Chưa có URL public chỉ từ việc giải nén.

Cách nhanh bằng GitHub CLI (Mac có Homebrew):

```bash
brew install gh
gh auth login
# cd vào repo đã giải nén:
npm ci
npm run publish:github
```

Script sẽ chạy kiểm thử/build, tạo commit rồi gọi `gh repo create dual-control-desk --public --source . --remote origin --push`. Tên repository đã tồn tại thì không ghi đè; chọn tên khác bằng lệnh `gh repo create TEN-KHAC --public --source . --remote origin --push` sau khi đã commit. Nếu git chưa có tác giả, đặt tên/email GitHub của chính bạn bằng `git config user.name` và `git config user.email`, rồi chạy lại. Không dùng thông tin giả.

Nếu không muốn dùng gh:

1. GitHub → New repository → `dual-control-desk` → **Public**, không thêm README/license/gitignore vì repo đã có.
2. Mở Terminal ở source:

```bash
git init -b main
git add .
git commit -m "Build Dual-Control Expense Desk"
# Thay YOUR-USERNAME bằng tài khoản thật:
git remote add origin https://github.com/YOUR-USERNAME/dual-control-desk.git
git push -u origin main
```

Repo → Settings → Collaborators → Add people → mời đúng username ba người còn lại. Không chia sẻ mật khẩu hay token của chủ repo. Mỗi người Accept invitation rồi clone repo bằng URL thật.

## Chia việc để team chỉnh sửa song song

| Người                 | Nhánh                    | Phạm vi chính                                                              | Điều kiện hoàn thành                                           |
| --------------------- | ------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| M1 · lead/integration | `feat/realm-integration` | Realm TideCloak, 3 linked admins, role grants, runtime/origin, tích hợp PR | Preflight + nghiệm thu IGA thật đạt; không đưa secret lên repo |
| M2 · frontend         | `feat/expense-ui`        | `src/app`, `src/components`, responsive, trải nghiệm reviewer              | Các trạng thái chờ/chặn/đã trả rõ ràng; không bỏ server checks |
| M3 · backend/security | `feat/rail-security`     | `src/lib/desk`, `rail`, adversarial tests                                  | Từ chối giả chứng cứ/sửa chi tiết/trùng danh tính; test xanh   |
| M4 · QA/story         | `docs/demo-and-qa`       | Acceptance, README, quay video, kiểm tra public repo                       | Test trực tiếp đủ hai màn demo, video 2 phút và link hoạt động |

Mọi người có thể bắt đầu ngay từ source có sẵn; thống nhất trước tên role, API và digest contract trong `docs/API.md`. Không đổi tên role một phía hoặc tự bỏ DPoP để chữa lỗi UI.

Luồng làm việc của mỗi thành viên:

```bash
git clone <URL-repo-thật>
cd dual-control-desk
npm ci
git switch -c feat/expense-ui  # thay đúng nhánh của bạn
# chỉnh code
npm run check
git add .
git commit -m "Describe the concrete change"
git push -u origin feat/expense-ui
```

Mở Pull Request vào `main`, một người khác review; merge khi CI xanh. Trước khi làm tiếp, `git switch main` và `git pull`. Adapter/SQLite/invite/`.env.bootstrap` không được chia sẻ qua GitHub; mỗi máy dùng realm/client phù hợp hoặc phối hợp trên máy demo chung.

## Chốt bài trước deadline

- M1 chạy live governance test; M3 kiểm tra rail không tin dữ liệu app.
- M2 giữ giao diện ổn định; M4 quay trên máy và realm đã nghiệm thu.
- Chèn video; cập nhật validation bằng kết quả thật; kiểm tra git diff không có secret.
- Đợi Actions xanh và mở repo từ browser đã logout trước khi gửi URL.
