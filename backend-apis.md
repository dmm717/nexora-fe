# Nexora Backend API Documentation

This document lists all the available API endpoints in the Nexora backend currently implemented in the `Nexora.Api` project.

## Authentication (`api/v1/auth`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Anonymous | Đăng ký tài khoản mới |
| `POST` | `/api/v1/auth/login` | Anonymous | Đăng nhập |
| `POST` | `/api/v1/auth/refresh` | Anonymous | Làm mới access token |
| `POST` | `/api/v1/auth/logout` | Authorized | Đăng xuất phiên hiện tại |
| `POST` | `/api/v1/auth/logout-all` | Authorized | Đăng xuất tất cả các phiên |

## User / Me (`api/v1/me`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/v1/me` | Authorized | Lấy thông tin người dùng hiện tại |
| `PATCH` | `/api/v1/me/profile` | Authorized | Cập nhật thông tin profile |
| `GET` | `/api/v1/me/export` | Authorized | Trích xuất (export) dữ liệu người dùng |
| `POST` | `/api/v1/me/deletion-requests` | Authorized | Yêu cầu xóa tài khoản |

## Dashboard (`api/v1/dashboard`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard` | Authorized | Lấy dữ liệu tổng quan cho Dashboard |

## Interviews (`api/v1/interviews`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/interviews` | Authorized | Bắt đầu một bài phỏng vấn mới (Start) |
| `GET` | `/api/v1/interviews/{id}` | Authorized | Lấy thông tin bài phỏng vấn theo ID |
| `POST` | `/api/v1/interviews/{id}/answers` | Authorized | Gửi câu trả lời cho một bài phỏng vấn |
| `POST` | `/api/v1/interviews/{id}/complete` | Authorized | Hoàn thành bài phỏng vấn |
| `GET` | `/api/v1/interviews/{id}/report` | Authorized | Lấy báo cáo/kết quả bài phỏng vấn |

## Resume Analyses (`api/v1/resume-analyses`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/resume-analyses` | Authorized | Tạo một yêu cầu phân tích CV (Resume) mới |
| `GET` | `/api/v1/resume-analyses/{id}` | Authorized | Lấy chi tiết kết quả phân tích CV theo ID |

## Resumes (`api/v1/resumes`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/resumes` | Authorized | Tạo mới (Finalize) một Resume |

## Job Descriptions (`api/v1/job-descriptions`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/job-descriptions` | Authorized | Tạo mới mô tả công việc (Job Description) |

## Plans & Billing (`api/v1/plans` & `api/v1/checkout-sessions`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/v1/plans` | Anonymous | Lấy danh sách các gói dịch vụ (Plans) |
| `POST` | `/api/v1/checkout-sessions`| Authorized | Tạo phiên thanh toán (Checkout session) |

## Uploads (`api/v1/uploads`)
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/uploads/presign` | Authorized | Tạo URL presign để upload file |
| `PUT` | `/api/v1/uploads/{token}` | Anonymous | Thực hiện upload file thông qua token |

## Webhooks
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/webhooks/payments/{provider}`| Anonymous | Nhận webhook từ các cổng thanh toán |
