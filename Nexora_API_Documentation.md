# NEXORA BACKEND — TÀI LIỆU TỔNG HỢP API

> **Cập nhật:** 2026-08-30  
> **Base URL Development:** `http://localhost:5000/api/v1` (hoặc cổng mà backend đang chạy)  
> **CORS:** Đã kích hoạt cho `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:5173` (có `credentials: true`)

---

## 1. QUY ƯỚC CHUNG VÀ TÍCH HỢP

### 1.1. Cấu trúc Response chuẩn

Mọi phản hồi từ backend đều được đóng gói theo chuẩn envelope:

#### Phản hồi thành công (HTTP 200, 201, 202):
```json
{
  "data": {
    /* Dữ liệu trả về */
  }
}
```

#### Phản hồi thất bại (HTTP 4xx, 5xx):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thông điệp lỗi thân thiện cho người dùng.",
    "requestId": "0HN123456789:00000001"
  }
}
```

### 1.2. Các Header quan trọng
- `Content-Type: application/json`: Bắt buộc cho các request POST / PUT / PATCH có payload.
- `Authorization: Bearer <accessToken>`: Bắt buộc cho các API yêu cầu đăng nhập.
- `Idempotency-Key: <UUIDv4>`: Bắt buộc cho các thao tác tạo mới / đột biến dữ liệu nhạy cảm (Tạo đơn thanh toán, Tạo/kết thúc phỏng vấn, Nộp câu trả lời, Phân tích CV, Yêu cầu xóa tài khoản).
  - *Gợi ý cho FE:* Dùng hàm `crypto.randomUUID()` để sinh key này cho mỗi lần bấm nút gửi thao tác.

### 1.3. Quản lý Token & Refresh Token
- **Access Token:** Nhận được khi login/register, lưu ở bộ nhớ frontend (state/memory). Hạn dùng ngắn (15 phút).
- **Refresh Token:** Backend tự động lưu vào **HttpOnly Cookie** tên `nexora.refresh`.
- **Lưu ý Frontend:** 
  - Khi dùng `fetch`, luôn thêm `credentials: 'include'`.
  - Khi dùng `axios`, cấu hình `axios.defaults.withCredentials = true`.
  - Khi access token hết hạn (nhận lỗi 401), FE tự động gọi `POST /api/v1/auth/refresh` (cookie sẽ tự đính kèm) để lấy accessToken mới.

---

## 2. PHÂN LOẠI API

- **[Public]**: Không cần token, ai cũng gọi được.
- **[User]**: Yêu cầu Bearer Token của tài khoản người dùng, tuân thủ quyền sở hữu dữ liệu (Resource Ownership).
- **[Admin]**: Dành riêng cho tài khoản quản trị viên vận hành (`Role: Admin`).

---

## 3. DANH SÁCH CHI TIẾT CÁC API

---

### I. AUTHENTICATION & TÀI KHOẢN

#### 1. Đăng ký tài khoản
- **Method & Endpoint:** `POST /api/v1/auth/register` `[Public]`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "candidate@example.com",
  "password": "Password@123",
  "displayName": "Nguyễn Văn A"
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-08-30T16:00:00Z",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "candidate@example.com",
      "displayName": "Nguyễn Văn A",
      "roles": ["Candidate"]
    }
  }
}
```

#### 2. Đăng nhập
- **Method & Endpoint:** `POST /api/v1/auth/login` `[Public]`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "candidate@example.com",
  "password": "Password@123"
}
```
- **Response (200 OK):** (Trả về access token và set HttpOnly cookie `nexora.refresh`)
```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-08-30T16:00:00Z",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "candidate@example.com",
      "displayName": "Nguyễn Văn A",
      "roles": ["Candidate"]
    }
  }
}
```

#### 3. Làm mới Access Token (Refresh)
- **Method & Endpoint:** `POST /api/v1/auth/refresh` `[Public / Credentials required]`
- **Yêu cầu:** Gửi kèm Cookie trình duyệt (`credentials: 'include'`).
- **Response (200 OK):** Trả về Access Token mới và xoay vòng Refresh Token trong Cookie.

#### 4. Đăng xuất phiên hiện tại
- **Method & Endpoint:** `POST /api/v1/auth/logout` `[User]`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (204 No Content):** Thu hồi refresh token hiện tại và xóa cookie.

#### 5. Đăng xuất khỏi mọi thiết bị
- **Method & Endpoint:** `POST /api/v1/auth/logout-all` `[User]`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (204 No Content)**

---

### II. THÔNG TIN CÁ NHÂN & QUYỀN RIÊNG TƯ (ME)

#### 1. Lấy thông tin cá nhân, quyền lợi gói & lịch sử đơn hàng
- **Method & Endpoint:** `GET /api/v1/me` `[User]`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "candidate@example.com",
    "displayName": "Nguyễn Văn A",
    "roles": ["Candidate"],
    "billing": {
      "entitlement": {
        "id": "8c59f0f9-2e06-4fb4-9c59-3fa44293f0b2",
        "planCode": "pro",
        "startsAt": "2026-08-01T00:00:00Z",
        "endsAt": "2026-09-01T00:00:00Z",
        "limit": 10,
        "reserved": 0,
        "consumed": 2,
        "available": 8
      },
      "orders": [
        {
          "id": "9b12a874-320d-4029-a1b4-2b7ef7cb7e69",
          "planCode": "pro",
          "amountMinor": 199000,
          "currency": "VND",
          "status": "paid",
          "createdAt": "2026-08-01T10:00:00Z"
        }
      ]
    }
  }
}
```

#### 2. Cập nhật hồ sơ
- **Method & Endpoint:** `PATCH /api/v1/me/profile` `[User]`
- **Request Body:**
```json
{
  "displayName": "Nguyễn Văn B"
}
```

#### 3. Xuất toàn bộ dữ liệu cá nhân (GDPR Export)
- **Method & Endpoint:** `GET /api/v1/me/export` `[User]`
- **Response (200 OK):** Xuất toàn bộ profile, CV metadata, JD, phỏng vấn, báo cáo và đơn hàng thuộc về tài khoản.

#### 4. Yêu cầu xóa tài khoản (GDPR Deletion)
- **Method & Endpoint:** `POST /api/v1/me/deletion-requests` `[User]`
- **Headers:** `Idempotency-Key: <UUID>`
- **Response (202 Accepted):** Lập lịch xóa tài khoản ngầm và thu hồi toàn bộ token đăng nhập.

---

### III. GÓI DỊCH VỤ & THANH TOÁN (PLANS & CHECKOUT)

#### 1. Lấy danh sách các gói dịch vụ
- **Method & Endpoint:** `GET /api/v1/plans` `[Public]`
- **Response (200 OK):**
```json
{
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "code": "free",
      "name": "Free Tier",
      "prices": [
        {
          "id": "22222222-2222-2222-2222-222222222222",
          "amountMinor": 0,
          "currency": "VND",
          "durationDays": null,
          "interviewQuota": 1
        }
      ]
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "code": "pro",
      "name": "Pro Monthly",
      "prices": [
        {
          "id": "44444444-4444-4444-4444-444444444444",
          "amountMinor": 199000,
          "currency": "VND",
          "durationDays": 30,
          "interviewQuota": 10
        }
      ]
    }
  ]
}
```

#### 2. Tạo phiên thanh toán (Checkout)
- **Method & Endpoint:** `POST /api/v1/checkout-sessions` `[User]`
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
```json
{
  "planPriceId": "44444444-4444-4444-4444-444444444444"
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "orderId": "55555555-5555-5555-5555-555555555555",
    "status": "pending",
    "amountMinor": 199000,
    "currency": "VND",
    "provider": "FakePayment",
    "checkoutUrl": "http://localhost:5000/mock-checkout/..."
  }
}
```
*(FE chuyển hướng người dùng tới `checkoutUrl` để thanh toán).*

---

### IV. TẢI LÊN FILE & QUẢN LÝ TÀI LIỆU

#### Quy trình tải CV:
1. Gọi `POST /api/v1/uploads/presign` lấy `uploadUrl` và `token`.
2. Gửi binary file bằng `PUT` đến `uploadUrl` (hoặc `/api/v1/uploads/{token}`).
3. Gọi `POST /api/v1/resumes` truyền `uploadToken` để backend hoàn tất lưu CV vào hồ sơ.

#### 1. Xin Pre-signed URL để tải lên file
- **Method & Endpoint:** `POST /api/v1/uploads/presign` `[User]`
- **Request Body:**
```json
{
  "fileName": "MyResume.pdf",
  "contentType": "application/pdf",
  "size": 1048576
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "token": "d7b23...",
    "uploadUrl": "/api/v1/uploads/d7b23...",
    "expiresAt": "2026-08-30T17:00:00Z"
  }
}
```

#### 2. Tải dữ liệu nhị phân của file
- **Method & Endpoint:** `PUT /api/v1/uploads/{token}` `[Public]`
- **Headers:** `Content-Type: application/pdf` (hoặc Content-Type tương ứng)
- **Body:** Binary Stream của file.
- **Response (204 No Content)**

#### 3. Khởi tạo Resume sau khi tải file thành công
- **Method & Endpoint:** `POST /api/v1/resumes` `[User]`
- **Request Body:**
```json
{
  "uploadToken": "d7b23..."
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "id": "66666666-6666-6666-6666-666666666666",
    "fileName": "MyResume.pdf",
    "contentType": "application/pdf",
    "size": 1048576,
    "status": "ready",
    "createdAt": "2026-08-30T16:00:00Z"
  }
}
```

#### 4. Tạo mô tả công việc (Job Description)
- **Method & Endpoint:** `POST /api/v1/job-descriptions` `[User]`
- **Request Body:**
```json
{
  "title": "Backend .NET Developer",
  "content": "Yêu cầu từ 2 năm kinh nghiệm ASP.NET Core, PostgreSQL, Clean Architecture..."
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "id": "77777777-7777-7777-7777-777777777777",
    "title": "Backend .NET Developer",
    "content": "...",
    "createdAt": "2026-08-30T16:00:00Z"
  }
}
```

---

### V. PHÂN TÍCH CV VỚI JD (RESUME ANALYSIS)

#### 1. Khởi tạo job phân tích CV - JD
- **Method & Endpoint:** `POST /api/v1/resume-analyses` `[User]`
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
```json
{
  "resumeId": "66666666-6666-6666-6666-666666666666",
  "jobDescriptionId": "77777777-7777-7777-7777-777777777777"
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "id": "88888888-8888-8888-8888-888888888888",
    "status": "completed",
    "result": {
      "overallMatch": 85,
      "summary": "Ứng viên có kiến thức tốt về .NET và kiến trúc monolith...",
      "strengths": ["C# .NET 10", "PostgreSQL", "Unit Testing"],
      "gaps": ["Chưa có kinh nghiệm AWS thực tế"],
      "recommendations": ["Nên bổ sung chứng chỉ cloud hoặc dự án thực chiến"]
    },
    "createdAt": "2026-08-30T16:00:00Z",
    "completedAt": "2026-08-30T16:00:05Z"
  }
}
```

#### 2. Lấy kết quả phân tích CV
- **Method & Endpoint:** `GET /api/v1/resume-analyses/{id}` `[User]`
- **Response (200 OK):** Trả về đối tượng `ResumeAnalysisView` như trên.

---

### VI. LUYỆN TẬP PHỎNG VẤN (MOCK INTERVIEWS)

#### Vòng đời phiên phỏng vấn (`status`):
`draft` ➔ `starting` ➔ `active` ➔ `completing` ➔ `completed` (hoặc `failed` / `abandoned`)

#### 1. Khởi tạo và bắt đầu phỏng vấn
- **Method & Endpoint:** `POST /api/v1/interviews` `[User]`
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
```json
{
  "role": "Backend Developer",
  "seniority": "Junior",
  "interviewType": "Technical",
  "difficulty": "Medium",
  "resumeId": "66666666-6666-6666-6666-666666666666",
  "jobDescriptionId": "77777777-7777-7777-7777-777777777777"
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "id": "99999999-9999-9999-9999-999999999999",
    "status": "active",
    "role": "Backend Developer",
    "seniority": "Junior",
    "interviewType": "Technical",
    "difficulty": "Medium",
    "version": 1,
    "questions": [
      {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "sequence": 1,
        "content": "Hãy giải thích sự khác nhau giữa IEnumerable và IQueryable trong C#?",
        "createdAt": "2026-08-30T16:00:00Z"
      }
    ],
    "answers": [],
    "createdAt": "2026-08-30T16:00:00Z",
    "updatedAt": "2026-08-30T16:00:00Z"
  }
}
```

#### 2. Lấy thông tin phiên phỏng vấn hiện tại
- **Method & Endpoint:** `GET /api/v1/interviews/{id}` `[User]`
- **Response (200 OK):** Trả về đối tượng `InterviewView` với danh sách câu hỏi đã đặt và câu trả lời đã nộp.

#### 3. Nộp câu trả lời cho câu hỏi
- **Method & Endpoint:** `POST /api/v1/interviews/{id}/answers` `[User]`
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
```json
{
  "questionId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "content": "IEnumerable phù hợp khi truy vấn trên dữ liệu trong bộ nhớ (in-memory), còn IQueryable dùng để truy vấn cơ sở dữ liệu ngoài (out-of-memory)...",
  "durationSeconds": 45
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "answer": {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "questionId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "content": "...",
      "durationSeconds": 45,
      "evaluation": {
        "score": 8,
        "feedback": "Giải thích rõ ràng, đúng trọng tâm."
      },
      "createdAt": "2026-08-30T16:01:00Z"
    },
    "nextQuestion": {
      "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "sequence": 2,
      "content": "Dependency Injection có các loại service lifetime nào trong .NET?",
      "createdAt": "2026-08-30T16:01:02Z"
    },
    "isComplete": false
  }
}
```
*(Nếu `isComplete == true`, `nextQuestion` sẽ là `null`, phiên đã sẵn sàng để complete).*

#### 4. Kết thúc phỏng vấn và kích hoạt chấm điểm tổng thể
- **Method & Endpoint:** `POST /api/v1/interviews/{id}/complete` `[User]`
- **Headers:** `Idempotency-Key: <UUID>`
- **Response (202 Accepted):** Phiên chuyển sang trạng thái `completed`.

#### 5. Xem báo cáo đánh giá chi tiết (Rubric Report)
- **Method & Endpoint:** `GET /api/v1/interviews/{id}/report` `[User]`
- **Response (200 OK):**
```json
{
  "data": {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "interviewId": "99999999-9999-9999-9999-999999999999",
    "overallScore": 82,
    "rubric": {
      "technicalKnowledge": 85,
      "communication": 80,
      "problemSolving": 80
    },
    "strengths": [
      "Hiểu rõ kiến trúc backend và phân tầng .NET",
      "Trả lời tự tin và mạch lạc"
    ],
    "gaps": [
      "Cần bổ sung chi tiết hơn về cách xử lý concurrency"
    ],
    "actionPlan": [
      "Đọc thêm tài liệu về EF Core concurrency token",
      "Luyện tập thêm các câu hỏi tình huống phức tạp"
    ],
    "disclaimer": "Đánh giá được hỗ trợ bởi AI nhằm mục đích luyện tập và tham khảo.",
    "createdAt": "2026-08-30T16:05:00Z"
  }
}
```

---

### VII. DASHBOARD TỔNG QUAN

#### 1. Lấy dữ liệu trang chủ cá nhân
- **Method & Endpoint:** `GET /api/v1/dashboard` `[User]`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "data": {
    "billing": {
      "quotaRemaining": 8,
      "planCode": "pro"
    },
    "interviews": [
      {
        "id": "99999999-9999-9999-9999-999999999999",
        "role": "Backend Developer",
        "status": "completed",
        "updatedAt": "2026-08-30T16:05:00Z"
      }
    ],
    "reports": [
      {
        "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
        "interviewId": "99999999-9999-9999-9999-999999999999",
        "overallScore": 82,
        "createdAt": "2026-08-30T16:05:00Z"
      }
    ]
  }
}
```

---

### VIII. HEALTH CHECKS & GIÁM SÁT

- `GET /health/live`: Kiểm tra dịch vụ có đang chạy hay không (Liveness).
- `GET /api/v1/health`: Kiểm tra các thành phần phụ thuộc (Readiness: Database, v.v.).
- `GET /api/v1/health/operations`: Trạng thái tổng quát vận hành (Healthy/Degraded).

---

### IX. ADMIN API (VẬN HÀNH & HỖ TRỢ — SPECIFICATION)

> **Ghi chú:** Các API dưới đây yêu cầu tài khoản có `Role: Admin`, kèm header `Idempotency-Key`.  
> *Admin tuyệt đối không có quyền xem trực tiếp nội dung raw CV hay transcript nhạy cảm của ứng viên.*

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/orders` | Tra cứu đơn hàng (thông tin người dùng được che/redacted). |
| `POST` | `/api/v1/admin/orders/{id}/refunds` | Thực hiện hoàn tiền đơn hàng và thu hồi quyền lợi tương ứng. |
| `POST` | `/api/v1/admin/users/{id}/entitlement-adjustments` | Cấp bù hoặc điều chỉnh lượt phỏng vấn / ngày sử dụng cho người dùng. |
| `GET` | `/api/v1/admin/audit-logs` | Xem danh sách audit log các thao tác vận hành của admin. |
| `GET` | `/api/v1/admin/operations/jobs` | Xem danh sách background jobs thất bại để retry thủ công có kiểm soát. |
