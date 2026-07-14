# ĐỀ ÁN XÂY DỰNG BACKEND — MUSIC SOCIAL NETWORK

**Ngày:** 2026-07-14  
**Codebase:** `app-nghe-nhac/backend/`  
**Stack:** Node.js + Express.js + Sequelize + MySQL  
**Tài liệu tham chiếu:** `so_do_database_appmobile_team7.txt` · `usecase_chuc_nang.txt` · `MÔ TẢ BÀI TOÁN.txt`

---

## 1. PHÂN TÍCH HIỆN TRẠNG

### Đã có (giữ lại & chỉnh sửa)

| File | Hiện trạng | Hành động |
|---|---|---|
| `src/app.js` | Đúng cấu trúc Express | Thêm `cookieParser`, CORS whitelist |
| `middlewares/auth.middleware.js` | Hoạt động, đủ `protect` + `adminOnly` | Thêm `suspendedCheck`, `creatorOnly` |
| `middlewares/consent.middleware.js` | Đúng logic ToS check | Giữ nguyên |
| `middlewares/error.middleware.js` | Chuẩn | Giữ nguyên |
| `middlewares/validate.middleware.js` | Chuẩn | Giữ nguyên |
| `models/user_consent.model.js` | Đúng schema | Giữ nguyên |
| `controllers/auth.controller.js` | Có register/login/getMe nhưng User model sai field | Sửa sau khi cập nhật User model |

### Cần sửa ngay

| Vấn đề | File | Lý do |
|---|---|---|
| `User` model sai tên trường | `models/user.model.js` | Schema dùng `username`, `password_hash`, `auth_provider`, `avatar_url` — code dùng `name`, `password`, `avatar` |
| `LegalDocument` model thiếu trường | `models/legal_document.model.js` | Thiếu `type`, `version`, `content_url`, `is_active` |
| `Product` model sai domain | `models/product.model.js` | Xóa — thay bằng `Song` |
| Router còn `/products` | `routers/index.js` | Thay bằng đúng domain |
| JWT dùng secret fallback `'secret'` | `controllers/auth.controller.js` | Bắt buộc require `.env` |

### Chưa có (cần tạo mới — 20 models, 8 router groups)

Xem chi tiết phần 2 và 3 bên dưới.

---

## 2. TOÀN BỘ MODELS CẦN XÂY DỰNG

> Mỗi model phải khớp 100% với `so_do_database_appmobile_team7.txt`

### 2.1 Nhóm User & Auth

#### `models/user.model.js` — VIẾT LẠI

```js
// Trường đúng theo DB schema:
{
  id:                 INTEGER PK autoIncrement,
  username:           STRING(100) unique not null,
  email:              STRING(255) unique null,
  phone_number:       STRING(20) unique null,
  password_hash:      STRING(255) null,          // null khi dùng OAuth
  auth_provider:      STRING(50) default 'email', // 'email','phone','google','apple'
  apple_user_id:      STRING(255) unique null,   // thêm cho Apple Sign-In
  avatar_url:         TEXT null,
  bio:                TEXT null,
  strike_count:       INTEGER default 0,
  theme_preference:   STRING(20) default 'dark',
  status:             STRING(20) default 'active', // 'active','suspended','deleted'
  last_tos_accepted_at: DATE null,
  deleted_at:         DATE null,                 // paranoid soft delete
  // Sequelize timestamps: created_at, updated_at tự động
}
// Hook: bcrypt.hash(password_hash, 10) trước beforeCreate/beforeUpdate
// Method: comparePassword(plain)
// Method: toJSON() — xóa password_hash khỏi output
```

#### `models/role.model.js` — MỚI

```js
{ id, name: STRING(50) unique, description: TEXT }
// tableName: 'roles'
// Seed mặc định: 'super_admin', 'content_mod', 'user', 'creator'
```

#### `models/permission.model.js` — MỚI

```js
{ id, name: STRING(100) unique }
// tableName: 'permissions'
// Seed: 'ban_user', 'delete_song', 'approve_music', 'view_audit_logs', 'manage_groups'
```

#### `models/role_permission.model.js` — MỚI (junction)

```js
{ role_id: INTEGER FK, permission_id: INTEGER FK }
// tableName: 'role_permissions', timestamps: false
```

#### `models/user_role.model.js` — MỚI (junction)

```js
{ user_id: INTEGER FK, role_id: INTEGER FK }
// tableName: 'user_roles', timestamps: false
```

#### `models/user_session.model.js` — MỚI

```js
{
  id, user_id: INTEGER FK,
  refresh_token: STRING(500) unique not null,
  device_id: STRING(255) null,
  is_revoked: BOOLEAN default false,
  expires_at: DATE not null,
  // created_at tự động
}
// tableName: 'user_sessions'
```

#### `models/legal_document.model.js` — VIẾT LẠI

```js
{
  id,
  type: STRING(50),    // 'terms_of_use', 'privacy_policy', 'copyright_policy'
  version: STRING(20), // 'v1.0', 'v1.1'...
  content_url: TEXT,   // Link hoặc nội dung
  is_active: BOOLEAN default true,
  effective_at: DATE not null,
  // created_at tự động
}
// tableName: 'legal_documents'
```

---

### 2.2 Nhóm Music & Bản quyền

#### `models/song.model.js` — MỚI

```js
{
  id,
  title:               STRING(255) not null,
  hls_streaming_url:   TEXT not null,       // URL .m3u8 sau khi convert
  duration:            INTEGER null,         // giây
  creator_id:          INTEGER FK users.id,
  genre_id:            INTEGER null,         // FK genres (optional)
  lyrics_timestamp:    TEXT null,            // JSON [{time, text}]

  // Kiểm duyệt
  status:              STRING(20) default 'pending',
                       // 'pending','approved','rejected','flagged'

  // Bản quyền
  copyright_status:    STRING(20) default 'unverified',
                       // 'clean','matched','flagged','disputed'
  external_song_title: STRING(255) null,
  external_artist_name:STRING(255) null,
  external_buy_link:   TEXT null,
  match_score:         FLOAT default 0,
  is_eligible_for_monetization: BOOLEAN default true,

  deleted_at:          DATE null,           // paranoid
}
// tableName: 'songs'
```

#### `models/audio_fingerprint.model.js` — MỚI

```js
{
  song_id:            INTEGER PK FK songs.id,
  file_hash_sha256:   STRING(64) unique,
  file_hash_md5:      STRING(32) unique,
  fingerprint_code:   TEXT null,
  acoustid_id:        STRING(36) null,      // UUID
  // created_at tự động
}
// tableName: 'audio_fingerprints', timestamps: false (chỉ created_at)
```

#### `models/copyright_blacklist.model.js` — MỚI

```js
{
  id,
  file_hash_sha256:    STRING(64) unique not null,
  original_song_title: STRING(255) null,
  reason:              TEXT null,
  // added_at = created_at
}
// tableName: 'copyright_blacklist'
```

#### `models/copyright_dispute.model.js` — MỚI

```js
{
  id,
  song_id:      INTEGER FK songs.id,
  reporter_id:  INTEGER FK users.id,
  evidence_url: TEXT null,
  reason:       TEXT null,
  status:       STRING(20) default 'pending', // 'pending','resolved','rejected'
  admin_note:   TEXT null,
  resolved_at:  DATE null,
  // created_at tự động
}
// tableName: 'copyright_disputes'
```

#### `models/hashtag.model.js` — MỚI

```js
{ id, name: STRING(100) unique not null }
// tableName: 'hashtags'
```

#### `models/song_hashtag.model.js` — MỚI (junction)

```js
{ song_id: INTEGER FK, hashtag_id: INTEGER FK }
// tableName: 'song_hashtags', timestamps: false
```

---

### 2.3 Nhóm Social Feed

#### `models/post.model.js` — MỚI

```js
{
  id,
  user_id:       INTEGER FK users.id,
  song_id:       INTEGER FK songs.id,
  caption:       TEXT null,
  start_time:    INTEGER null,   // giây bắt đầu snippet
  end_time:      INTEGER null,   // giây kết thúc snippet
  privacy_level: STRING(20) default 'public', // 'public','friends','private'
  status:        STRING(20) default 'active', // 'active','hidden','flagged'
  deleted_at:    DATE null,      // paranoid
}
// tableName: 'posts'
```

#### `models/post_reaction.model.js` — MỚI (junction)

```js
{
  post_id:       INTEGER FK posts.id,
  user_id:       INTEGER FK users.id,
  reaction_type: STRING(50) default 'like',
}
// tableName: 'post_reactions', timestamps: false
// PK: composite (post_id, user_id)
```

#### `models/post_hashtag.model.js` — MỚI (junction)

```js
{ post_id: INTEGER FK, hashtag_id: INTEGER FK }
// tableName: 'post_hashtags', timestamps: false
```

#### `models/feed_recommendation.model.js` — MỚI

```js
{
  user_id:               INTEGER FK PK,
  recommended_post_ids:  TEXT,  // JSON array string
  // updated_at tự động
}
// tableName: 'feed_recommendations', timestamps: false (chỉ updated_at)
```

---

### 2.4 Nhóm Groups (No-Chat)

#### `models/music_group.model.js` — MỚI

```js
{
  id, name: STRING(255) not null, description: TEXT null,
  creator_id: INTEGER FK users.id,
  status: STRING(20) default 'active',
  deleted_at: DATE null,
}
// tableName: 'music_groups'
```

#### `models/group_role.model.js` — MỚI

```js
{
  id, group_id: INTEGER FK,
  name: STRING(50) not null,
  permissions_json: TEXT,  // JSON: { post: true, approve: false, delete: false }
}
// tableName: 'group_roles'
```

#### `models/group_member.model.js` — MỚI (junction)

```js
{
  group_id:      INTEGER FK music_groups.id,
  user_id:       INTEGER FK users.id,
  group_role_id: INTEGER FK group_roles.id,
  joined_at:     DATE default NOW,
}
// tableName: 'group_members', timestamps: false
```

#### `models/group_post.model.js` — MỚI (junction)

```js
{
  group_id:  INTEGER FK music_groups.id,
  post_id:   INTEGER FK posts.id,
  shared_by: INTEGER FK users.id,
  shared_at: DATE default NOW,
}
// tableName: 'group_posts', timestamps: false
```

---

### 2.5 Nhóm Library & Analytics

#### `models/playlist.model.js` — MỚI

```js
{
  id, user_id: INTEGER FK, name: STRING(255) not null,
  is_private: BOOLEAN default false,
  deleted_at: DATE null,
}
// tableName: 'playlists'
```

#### `models/playlist_song.model.js` — MỚI (junction)

```js
{ playlist_id: INTEGER FK, song_id: INTEGER FK, added_at: DATE default NOW }
// tableName: 'playlist_songs', timestamps: false
```

#### `models/user_download.model.js` — MỚI (junction)

```js
{ user_id: INTEGER FK, song_id: INTEGER FK, downloaded_at: DATE default NOW }
// tableName: 'user_downloads', timestamps: false
```

#### `models/user_listening_detail.model.js` — MỚI

```js
{
  id, user_id: INTEGER FK, song_id: INTEGER FK,
  duration_listened: INTEGER null,   // giây
  completion_rate:   FLOAT null,     // 0.0 - 1.0
  is_skipped:        BOOLEAN default false,
  // created_at tự động
}
// tableName: 'user_listening_details'
```

---

### 2.6 Nhóm System

#### `models/report.model.js` — MỚI

```js
{
  id, reporter_id: INTEGER FK users.id,
  target_type: STRING(50),  // 'song','post','group','user'
  target_id:   INTEGER not null,
  reason:      TEXT not null,
  status:      STRING(20) default 'pending', // 'pending','resolved','dismissed'
  admin_id:    INTEGER null FK users.id,
  // created_at tự động
}
// tableName: 'reports'
```

#### `models/notification.model.js` — MỚI

```js
{
  id, user_id: INTEGER FK, sender_id: INTEGER null,
  type:    STRING(50),   // 'like','follow','group_invite','system','copyright'
  title:   STRING(255) null,
  content: TEXT null,
  is_read: BOOLEAN default false,
  // created_at tự động
}
// tableName: 'notifications'
```

#### `models/search_history.model.js` — MỚI

```js
{
  id, user_id: INTEGER FK,
  search_query: TEXT not null,
  searched_at: DATE default NOW,
}
// tableName: 'search_history', timestamps: false
```

#### `models/admin_audit_log.model.js` — MỚI

```js
{
  id, admin_id: INTEGER FK users.id,
  action:      STRING(100),  // 'ban_user','approve_song','delete_group'...
  target_type: STRING(50),   // 'users','songs','posts','music_groups'
  target_id:   INTEGER not null,
  reason:      TEXT null,
  ip_address:  STRING(45) null,
  // created_at tự động
}
// tableName: 'admin_audit_logs'
```

---

## 3. TOÀN BỘ ENDPOINTS CẦN XÂY DỰNG

> Format: `METHOD /api/path` — `[middleware]` — mô tả ngắn

### 3.1 Auth (`/api/auth`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | validate | Đăng ký + lưu UserConsent + gán role 'user' |
| POST | `/auth/login` | validate | Đăng nhập → trả access_token + refresh_token + strike_count |
| POST | `/auth/refresh` | — | Đổi refresh_token → access_token mới |
| POST | `/auth/logout` | protect | Thu hồi refresh_token (is_revoked=true) |
| GET | `/auth/me` | protect | Lấy thông tin user hiện tại |
| PATCH | `/auth/change-password` | protect, validate | Đổi mật khẩu |
| POST | `/auth/google` | validate | OAuth Google → tạo/tìm user |
| POST | `/auth/apple` | validate | OAuth Apple → tạo/tìm user |
| POST | `/auth/accept-tos` | protect | Ký ToS mới → cập nhật last_tos_accepted_at |

### 3.2 Users (`/api/users`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/users/:id` | protect | Xem profile người dùng |
| PATCH | `/users/me` | protect, checkConsent | Cập nhật profile (username, bio, avatar_url) |
| DELETE | `/users/me` | protect | Soft delete tài khoản (status='deleted') |
| GET | `/users/me/library` | protect | Lấy playlists + downloads của mình |

### 3.3 Songs (`/api/songs`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/songs` | optionalAuth | Danh sách nhạc đã approved |
| GET | `/songs/trending` | optionalAuth | Top hashtag trending |
| GET | `/songs/top-chart` | optionalAuth | Top chart theo lượt nghe/tim |
| GET | `/songs/recommended` | protect | Gợi ý dựa trên user listening history |
| GET | `/songs/:id` | optionalAuth | Chi tiết bài hát + external_buy_link nếu matched |
| POST | `/songs` | protect, creatorOnly, checkConsent | Upload metadata (creator upload) |
| POST | `/songs/:id/listen` | protect | Ghi nhận user_listening_details |
| DELETE | `/songs/:id` | protect | Soft delete (chỉ creator hoặc admin) |

### 3.4 Upload Audio (`/api/upload`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| POST | `/upload/audio` | protect, creatorOnly | Upload file MP3/WAV: checksum SHA-256 → lưu S3/local → trả URL |
| GET | `/upload/status/:song_id` | protect | Kiểm tra trạng thái xử lý HLS + fingerprint |

> **Quy trình 3 giai đoạn:**
> 1. FE gửi file → BE tính SHA-256 → kiểm tra `copyright_blacklist` → nếu có trả 403
> 2. Lưu file, lên lịch worker chuyển đổi HLS (ffmpeg)
> 3. Worker gửi fingerprint lên AcoustID → cập nhật `copyright_status`

### 3.5 Posts & Feed (`/api/posts`, `/api/feed`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/feed` | protect, checkConsent | Lấy feed từ feed_recommendations |
| POST | `/posts` | protect, checkConsent | Tạo post (snippet: lưu song_id, start_time, end_time) |
| GET | `/posts/:id` | optionalAuth | Chi tiết post + song info + buy link |
| DELETE | `/posts/:id` | protect | Soft delete post của mình |
| POST | `/posts/:id/react` | protect | Like/unlike post (toggle) |
| GET | `/posts/:id/reactions` | optionalAuth | Danh sách người like |

### 3.6 Groups (`/api/groups`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/groups` | optionalAuth | Danh sách groups |
| POST | `/groups` | protect, checkConsent | Tạo group mới |
| GET | `/groups/:id` | optionalAuth | Chi tiết group |
| PATCH | `/groups/:id` | protect, groupAdmin | Cập nhật group info |
| DELETE | `/groups/:id` | protect, groupAdmin | Soft delete group |
| POST | `/groups/:id/join` | protect | Tham gia group |
| DELETE | `/groups/:id/leave` | protect | Rời group |
| GET | `/groups/:id/posts` | optionalAuth | Danh sách posts trong group |
| POST | `/groups/:id/posts` | protect, groupMember | Chia sẻ post vào group |

> **Ràng buộc No-Chat:** Mọi endpoint `/groups/*` đều có middleware kiểm tra: nếu request body chứa field `message` hoặc `chat_text` → trả 400.

### 3.7 Library (`/api/library`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/library/downloads` | protect | Danh sách bài đã tải |
| POST | `/library/downloads/:song_id` | protect | Đánh dấu download (lưu user_downloads) |
| GET | `/library/playlists` | protect | Danh sách playlist của user |
| POST | `/library/playlists` | protect | Tạo playlist mới |
| POST | `/library/playlists/:id/songs` | protect | Thêm bài vào playlist |
| DELETE | `/library/playlists/:id/songs/:song_id` | protect | Xóa bài khỏi playlist |

### 3.8 Search (`/api/search`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/search?q=&type=` | optionalAuth | Tìm kiếm (songs, users, groups, hashtags) |
| POST | `/search/history` | protect | Lưu search query vào search_history |
| GET | `/search/history` | protect | Lấy lịch sử tìm kiếm |

### 3.9 Notifications (`/api/notifications`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/notifications` | protect | Danh sách thông báo của user |
| PATCH | `/notifications/:id/read` | protect | Đánh dấu đã đọc |
| PATCH | `/notifications/read-all` | protect | Đánh dấu tất cả đã đọc |

### 3.10 Reports (`/api/reports`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| POST | `/reports` | protect, checkConsent | Gửi báo cáo vi phạm |

### 3.11 Copyright (`/api/copyright`)

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| POST | `/copyright/disputes` | protect | Gửi khiếu nại bản quyền kèm evidence_url |

### 3.12 Admin (`/api/admin/*`)

> **Mọi endpoint `/api/admin/*` đều có middleware `auditLog` tự động ghi `admin_audit_logs`**

| Method | Endpoint | Middleware | Mô tả |
|---|---|---|---|
| GET | `/admin/songs/pending` | protect, adminOnly | Danh sách nhạc chờ duyệt |
| PATCH | `/admin/songs/:id/approve` | protect, adminOnly, auditLog | Duyệt nhạc |
| PATCH | `/admin/songs/:id/reject` | protect, adminOnly, auditLog | Từ chối nhạc |
| GET | `/admin/reports` | protect, adminOnly | Danh sách báo cáo |
| PATCH | `/admin/reports/:id/resolve` | protect, adminOnly, auditLog | Xử lý báo cáo |
| GET | `/admin/disputes` | protect, adminOnly | Danh sách khiếu nại bản quyền |
| PATCH | `/admin/disputes/:id/resolve` | protect, adminOnly, auditLog | Giải quyết khiếu nại |
| PATCH | `/admin/users/:id/ban` | protect, adminOnly, auditLog | Cấm tài khoản (status='suspended') |
| GET | `/admin/audit-logs` | protect, adminOnly | Xem nhật ký quản trị |

---

## 4. MIDDLEWARE CẦN BỔ SUNG

### `middlewares/auth.middleware.js` — Thêm vào file hiện có

```js
// creatorOnly: kiểm tra user có is_creator = true hoặc role 'creator'
const creatorOnly = (req, res, next) => { ... }

// suspendedCheck: tích hợp vào protect — nếu status='suspended' trả 403
// (Đã có một phần, cần bổ sung check status='deleted' → 401)
```

### `middlewares/audit.middleware.js` — MỚI

```js
// Tự động ghi AdminAuditLog sau khi response 2xx
// Dùng res.on('finish', ...) để log sau khi xử lý xong
const auditLog = (action, targetType) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await AdminAuditLog.create({
        admin_id: req.user.id,
        action,
        target_type: targetType,
        target_id: req.params.id || req.body.target_id,
        ip_address: req.ip,
      });
    }
  });
  next();
};
```

### `middlewares/no_chat.middleware.js` — MỚI

```js
// Kiểm tra No-Chat policy cho Group endpoints
const noChatPolicy = (req, res, next) => {
  const forbidden = ['message', 'chat_text', 'chat', 'msg'];
  const hasChat = forbidden.some(f => req.body[f] !== undefined);
  if (hasChat) {
    return res.status(400).json({ success: false, message: 'Groups không hỗ trợ chat text.' });
  }
  next();
};
```

---

## 5. QUY TẮC NGHIỆP VỤ CẦN IMPLEMENT

### Rule 1: 3 Gậy (Strike Policy)

```
Khi Admin giải quyết copyright_dispute với kết quả 'rejected' (bác bỏ khiếu nại của user)
hoặc resolve report là vi phạm bản quyền:
  → users.strike_count += 1
  → Nếu strike_count >= 3: users.status = 'suspended'
  → Tạo Notification cho user: type='copyright', content='Tài khoản bị đình chỉ'

Xử lý trong: controllers/admin.controller.js → hàm resolveDispute và handleReport
```

### Rule 2: Soft Delete Cascade

```
Khi user xóa tài khoản (status='deleted', deleted_at=NOW()):
  → Tất cả songs của user: status = 'hidden' (không xóa thật)
  → Tất cả posts của user: deleted_at = NOW()
  → Các post trong feed sẽ không hiển thị (WHERE deleted_at IS NULL)

Xử lý trong: controllers/user.controller.js → hàm deleteSelf (transaction)
```

### Rule 3: Copyright First

```
Khi API trả về song hoặc post có song.copyright_status = 'matched':
  → Response PHẢI bao gồm: external_artist_name, external_buy_link
  → FE hiển thị nút "Mua nhạc gốc"

Xử lý trong: controllers/song.controller.js → helper formatSongResponse()
```

### Rule 4: No-Chat Groups

```
Mọi endpoint /api/groups/* phải pass qua middleware noChatPolicy
Không có bảng messages trong toàn bộ schema
```

### Rule 5: Feed Recommendation (đơn giản)

```
Khi user nghe nhạc → ghi user_listening_details
Algorithm (SQL-based):
  1. Lấy top hashtag_id mà user hay nghe (JOIN songs → song_hashtags GROUP BY hashtag_id)
  2. Lấy ngẫu nhiên 20 posts có song thuộc các hashtag đó
  3. Lưu vào feed_recommendations.recommended_post_ids (JSON array)
  4. Cron job chạy mỗi 6 giờ cập nhật feed

Xử lý trong: services/recommendation.service.js (tạo mới)
```

---

## 6. CẤU TRÚC THƯ MỤC SAU KHI HOÀN THÀNH

```
backend/src/
├── app.js
├── config/
│   └── database.js
│
├── models/
│   ├── index.js                     ← Load tất cả models + associations
│   │
│   │  ── Nhóm User ──
│   ├── user.model.js                ← VIẾT LẠI
│   ├── role.model.js                🆕
│   ├── permission.model.js          🆕
│   ├── role_permission.model.js     🆕
│   ├── user_role.model.js           🆕
│   ├── user_session.model.js        🆕
│   ├── legal_document.model.js      ← VIẾT LẠI
│   ├── user_consent.model.js        ✅ Giữ nguyên
│   │
│   │  ── Nhóm Music ──
│   ├── song.model.js                🆕
│   ├── audio_fingerprint.model.js   🆕
│   ├── copyright_blacklist.model.js 🆕
│   ├── copyright_dispute.model.js   🆕
│   ├── hashtag.model.js             🆕
│   ├── song_hashtag.model.js        🆕
│   │
│   │  ── Nhóm Social ──
│   ├── post.model.js                🆕
│   ├── post_reaction.model.js       🆕
│   ├── post_hashtag.model.js        🆕
│   ├── feed_recommendation.model.js 🆕
│   │
│   │  ── Nhóm Groups ──
│   ├── music_group.model.js         🆕
│   ├── group_role.model.js          🆕
│   ├── group_member.model.js        🆕
│   ├── group_post.model.js          🆕
│   │
│   │  ── Nhóm Library ──
│   ├── playlist.model.js            🆕
│   ├── playlist_song.model.js       🆕
│   ├── user_download.model.js       🆕
│   ├── user_listening_detail.model.js 🆕
│   │
│   │  ── Nhóm System ──
│   ├── report.model.js              🆕
│   ├── notification.model.js        🆕
│   ├── search_history.model.js      🆕
│   └── admin_audit_log.model.js     🆕
│
├── controllers/
│   ├── auth.controller.js           ← SỬA (fix field names + OAuth + refresh token)
│   ├── user.controller.js           ← SỬA (soft delete cascade)
│   ├── song.controller.js           🆕 (CRUD + formatSongResponse + copyright check)
│   ├── upload.controller.js         🆕 (file upload + SHA256 + HLS + AcoustID)
│   ├── post.controller.js           🆕 (CRUD + snippet validation)
│   ├── feed.controller.js           🆕 (get feed từ recommendations)
│   ├── group.controller.js          🆕 (CRUD + join/leave + no-chat)
│   ├── library.controller.js        🆕 (downloads + playlists)
│   ├── search.controller.js         🆕 (full-text search + history)
│   ├── notification.controller.js   🆕 (list + mark read)
│   ├── report.controller.js         🆕 (submit report)
│   ├── copyright.controller.js      🆕 (submit dispute)
│   └── admin.controller.js          🆕 (approve/ban/resolve + audit log)
│
├── routers/
│   ├── index.js                     ← VIẾT LẠI (đăng ký tất cả routers)
│   ├── auth.router.js               ← SỬA (thêm /google, /apple, /refresh)
│   ├── user.router.js               ← SỬA (thêm /me DELETE, /me/library)
│   ├── song.router.js               🆕
│   ├── upload.router.js             🆕
│   ├── post.router.js               🆕
│   ├── feed.router.js               🆕
│   ├── group.router.js              🆕
│   ├── library.router.js            🆕
│   ├── search.router.js             🆕
│   ├── notification.router.js       🆕
│   ├── report.router.js             🆕
│   ├── copyright.router.js          🆕
│   └── admin.router.js              🆕
│
├── middlewares/
│   ├── auth.middleware.js           ← SỬA (thêm creatorOnly)
│   ├── consent.middleware.js        ✅ Giữ nguyên
│   ├── error.middleware.js          ✅ Giữ nguyên
│   ├── validate.middleware.js       ✅ Giữ nguyên
│   ├── audit.middleware.js          🆕 (auditLog factory)
│   └── no_chat.middleware.js        🆕 (noChatPolicy)
│
└── services/
    └── recommendation.service.js    🆕 (feed recommendation algorithm)
```

---

## 7. DEPENDENCIES CẦN CÀI THÊM

```bash
cd backend

# Upload file & xử lý audio
npm install multer           # nhận multipart/form-data
npm install fluent-ffmpeg    # chuyển đổi HLS (.m3u8)
npm install @ffmpeg-installer/ffmpeg  # binary ffmpeg

# Bảo mật & crypto
npm install crypto           # built-in Node — tính SHA-256

# OAuth
npm install axios            # gọi Google UserInfo API + AcoustID API
npm install apple-signin-auth # xác thực Apple JWT

# Lưu trữ file (chọn 1)
# Option A: Local storage (đơn giản, dev/staging)
# Không cần cài thêm

# Option B: AWS S3 (production)
npm install @aws-sdk/client-s3

# Cron job cho recommendation
npm install node-cron

# Cookie (Refresh Token)
npm install cookie-parser
```

---

## 8. BIẾN MÔI TRƯỜNG `.env` CẦN BỔ SUNG

```env
# Hiện có:
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lt_web
DB_USER=appuser
DB_PASSWORD=apppassword
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Cần thêm:
JWT_REFRESH_SECRET=another_secret_for_refresh
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Apple OAuth
APPLE_BUNDLE_ID=com.ltweb.mobile
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Upload
UPLOAD_DIR=./uploads          # local
MAX_FILE_SIZE_MB=50

# AcoustID (fingerprinting - optional)
ACOUSTID_API_KEY=your_acoustid_key

# CORS
CORS_ORIGIN=http://localhost:19000,https://yourproductiondomain.com

# Node
NODE_ENV=development
```

---

## 9. LỘ TRÌNH THỰC HIỆN THEO SPRINT

### Sprint 1 — Nền tảng (Ưu tiên cao nhất)

**Mục tiêu:** App đăng ký/login/logout được, user model đúng schema

| # | Việc làm | File |
|---|---|---|
| 1.1 | Viết lại `user.model.js` theo schema | `models/user.model.js` |
| 1.2 | Viết lại `legal_document.model.js` | `models/legal_document.model.js` |
| 1.3 | Tạo `user_session.model.js`, `role.model.js` | Mới |
| 1.4 | Cập nhật `models/index.js` load đủ models + associations | `models/index.js` |
| 1.5 | Sửa `auth.controller.js`: dùng đúng field names, thêm refresh token, OAuth Google/Apple | `controllers/auth.controller.js` |
| 1.6 | Sửa `auth.router.js`: thêm `/refresh`, `/google`, `/apple` | `routers/auth.router.js` |
| 1.7 | Sửa CORS + thêm `cookieParser` vào `app.js` | `app.js` |
| 1.8 | Cập nhật `.env` với biến mới | `.env` |

---

### Sprint 2 — Music Core

**Mục tiêu:** Upload nhạc, xem danh sách, Top Chart, Trending Hashtags

| # | Việc làm | File |
|---|---|---|
| 2.1 | Tạo `song.model.js`, `hashtag.model.js`, `song_hashtag.model.js`, `audio_fingerprint.model.js`, `copyright_blacklist.model.js` | Mới |
| 2.2 | Tạo `song.controller.js` (CRUD + formatSongResponse + copyright check) | Mới |
| 2.3 | Tạo `upload.controller.js` (Giai đoạn 1: nhận file + checksum SHA-256) | Mới |
| 2.4 | Tạo `song.router.js`, `upload.router.js` | Mới |
| 2.5 | Cập nhật `routers/index.js` | `routers/index.js` |
| 2.6 | Thêm `creatorOnly` middleware | `middlewares/auth.middleware.js` |
| 2.7 | Cài `multer`, `crypto` | `package.json` |

---

### Sprint 3 — Social Feed & Snippets

**Mục tiêu:** Tạo post snippet, xem feed, like

| # | Việc làm | File |
|---|---|---|
| 3.1 | Tạo `post.model.js`, `post_reaction.model.js`, `post_hashtag.model.js`, `feed_recommendation.model.js` | Mới |
| 3.2 | Tạo `post.controller.js` (validate start_time < end_time, check copyright_status != 'flagged') | Mới |
| 3.3 | Tạo `feed.controller.js` + `recommendation.service.js` (SQL-based algorithm) | Mới |
| 3.4 | Tạo `post.router.js`, `feed.router.js` | Mới |

---

### Sprint 4 — Groups (No-Chat)

| # | Việc làm | File |
|---|---|---|
| 4.1 | Tạo `music_group.model.js`, `group_role.model.js`, `group_member.model.js`, `group_post.model.js` | Mới |
| 4.2 | Tạo `group.controller.js` | Mới |
| 4.3 | Tạo `no_chat.middleware.js` | Mới |
| 4.4 | Tạo `group.router.js` | Mới |

---

### Sprint 5 — Library, Search, Notifications

| # | Việc làm | File |
|---|---|---|
| 5.1 | Tạo Library models + controller + router | Mới |
| 5.2 | Tạo `search.controller.js` (LIKE query + search_history) | Mới |
| 5.3 | Tạo `notification.controller.js` + router | Mới |

---

### Sprint 6 — Admin, Reports, Audit Logs

| # | Việc làm | File |
|---|---|---|
| 6.1 | Tạo `admin_audit_log.model.js`, `report.model.js`, `copyright_dispute.model.js` | Mới |
| 6.2 | Tạo `audit.middleware.js` | Mới |
| 6.3 | Tạo `admin.controller.js` (approve, ban, 3-strike rule) | Mới |
| 6.4 | Tạo `report.controller.js`, `copyright.controller.js` | Mới |
| 6.5 | Tạo `admin.router.js` | Mới |

---

## 10. CHECKLIST TỔNG HỢP

```
Sprint 1 — Auth & User Foundation
[ ] user.model.js viết lại
[ ] legal_document.model.js viết lại
[ ] user_session.model.js tạo mới
[ ] role.model.js tạo mới
[ ] models/index.js cập nhật
[ ] auth.controller.js sửa (field names + OAuth + refresh token)
[ ] auth.router.js sửa (/refresh, /google, /apple)
[ ] app.js sửa (CORS whitelist + cookieParser)
[ ] .env cập nhật

Sprint 2 — Music Core
[ ] song.model.js
[ ] hashtag.model.js + song_hashtag.model.js
[ ] audio_fingerprint.model.js + copyright_blacklist.model.js
[ ] song.controller.js
[ ] upload.controller.js (SHA-256 checksum)
[ ] song.router.js + upload.router.js
[ ] creatorOnly middleware

Sprint 3 — Social Feed
[ ] post.model.js + post_reaction.model.js + post_hashtag.model.js
[ ] feed_recommendation.model.js
[ ] post.controller.js + feed.controller.js
[ ] recommendation.service.js
[ ] post.router.js + feed.router.js

Sprint 4 — Groups
[ ] music_group.model.js + group_role.model.js
[ ] group_member.model.js + group_post.model.js
[ ] group.controller.js
[ ] no_chat.middleware.js
[ ] group.router.js

Sprint 5 — Library, Search, Notifications
[ ] playlist.model.js + playlist_song.model.js
[ ] user_download.model.js + user_listening_detail.model.js
[ ] library.controller.js + library.router.js
[ ] search_history.model.js + search.controller.js + search.router.js
[ ] notification.model.js + notification.controller.js + notification.router.js

Sprint 6 — Admin & Moderation
[ ] admin_audit_log.model.js + report.model.js + copyright_dispute.model.js
[ ] audit.middleware.js
[ ] admin.controller.js (3-strike rule, approve/ban)
[ ] report.controller.js + copyright.controller.js
[ ] admin.router.js
[ ] routers/index.js đăng ký tất cả
```
