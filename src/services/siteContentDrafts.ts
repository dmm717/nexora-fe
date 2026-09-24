import type { AboutContent } from './siteContentApi';

export const INITIAL_ABOUT_DRAFT: AboutContent = {
  heroTitle: 'Giới thiệu Nexora',
  heroSubtitle: 'Luyện phỏng vấn có định hướng từ CV, mục tiêu nghề nghiệp và chính câu trả lời của bạn.',
  heroAssetId: null,
  missionTitle: 'Luyện tập có chủ đích, nhìn rõ tiến bộ',
  missionBody: 'Nexora hỗ trợ chuẩn bị cho phỏng vấn bằng phân tích CV, luyện trả lời, phản hồi theo tiêu chí và gợi ý bước tiếp theo. Đây là công cụ luyện tập, không phải dự đoán tuyển dụng.',
  missionAssetId: null,
  values: [
    { title: 'Phản hồi có căn cứ', description: 'Gắn nhận xét với dữ liệu và câu trả lời được cung cấp.', iconKey: 'evidence' },
    { title: 'Luyện tập có chủ đích', description: 'Tập trung vào kỹ năng và tình huống cần cải thiện.', iconKey: 'practice' },
    { title: 'Theo dõi tiến bộ', description: 'Xem lại kết quả theo thời gian.', iconKey: 'progress' },
  ],
  milestones: [], teamSectionEnabled: false, teamHeading: null, teamMembers: [],
};

// Product drafts only. These are never exposed by public page API until an admin reviews and publishes them.
export const INITIAL_TERMS_DRAFT = `## Phạm vi dịch vụ
Nexora hỗ trợ luyện phỏng vấn, phân tích CV và mô tả công việc, đánh giá câu trả lời, theo dõi tiến bộ và gợi ý luyện tập. Phản hồi do AI hỗ trợ tạo ra chỉ nhằm mục đích học tập và không phải dự đoán kết quả tuyển dụng hay quyết định nhân sự.
## Tài khoản và sử dụng hợp lệ
Bạn cần bảo vệ thông tin đăng nhập và chịu trách nhiệm về hoạt động trong tài khoản của mình. Không sử dụng Nexora để gian lận trong phỏng vấn trực tiếp, xâm phạm hệ thống hoặc gửi nội dung vi phạm quyền của người khác.
## Nội dung bạn gửi
Bạn giữ quyền với CV, mô tả công việc và câu trả lời của mình. Khi gửi nội dung, bạn cho phép Nexora lưu trữ và xử lý nội dung đó trong phạm vi cần thiết để cung cấp các chức năng bạn yêu cầu. Không gửi dữ liệu của người khác khi bạn không có quyền.
## Gói dịch vụ và thanh toán
Quyền truy cập và hạn mức phụ thuộc gói được hiển thị tại thời điểm chọn mua. Trạng thái đơn hàng và quyền lợi chỉ được xác nhận sau khi hệ thống xử lý thanh toán hợp lệ. Điều kiện hoàn tiền, nếu có, phải được xác nhận riêng; bản nháp này không cam kết chính sách hoàn tiền.
## Khả dụng và giới hạn
Nexora có thể thay đổi hoặc tạm gián đoạn để bảo trì. Nội dung AI có thể chưa chính xác hoặc chưa đầy đủ; bạn cần tự đánh giá trước khi sử dụng trong quyết định cá nhân.
## Tạm ngưng, xóa tài khoản và thay đổi điều khoản
Hoạt động lạm dụng có thể dẫn tới hạn chế truy cập theo chính sách được công bố. Bạn có thể gửi yêu cầu xóa tài khoản trong phần cài đặt. Khi điều khoản thay đổi, bản công bố mới sẽ hiển thị ngày cập nhật.
## Liên hệ
Nếu có câu hỏi, liên hệ nexorainterview@gmail.com.`;

export const INITIAL_PRIVACY_DRAFT = `## Dữ liệu được xử lý
Nexora xử lý thông tin tài khoản, email, tên hiển thị, ảnh đại diện, mục tiêu nghề nghiệp, CV tải lên và nội dung trích xuất, mô tả công việc, câu trả lời phỏng vấn, dữ liệu luyện tập STAR/tình huống, báo cáo, tín hiệu năng lực, phản hồi sản phẩm, thông tin đơn hàng và dữ liệu phiên đăng nhập/bảo mật khi bạn sử dụng các chức năng tương ứng.
## Mục đích sử dụng
Dữ liệu được dùng để xác thực, cung cấp chức năng luyện tập và phản hồi, duy trì lịch sử và quyền lợi gói, bảo vệ hệ thống, xử lý yêu cầu hỗ trợ, và cải thiện chất lượng sản phẩm trong phạm vi được phép.
## Xử lý qua nhà cung cấp
Một số tác vụ có thể sử dụng nhà cung cấp AI, thanh toán, email hoặc hạ tầng lưu trữ theo cấu hình môi trường hiện hành. Nội dung CV và câu trả lời có thể được gửi tới nhà cung cấp AI để thực hiện tác vụ bạn yêu cầu. Bản này không khẳng định một nhà cung cấp cố định cho mọi môi trường.
## Quyền kiểm soát của bạn
Bạn có thể cập nhật hồ sơ, gỡ ảnh đại diện, thu hồi phiên đăng nhập, xuất dữ liệu lõi và gửi yêu cầu xóa tài khoản bằng các chức năng hiện có. Phản hồi sản phẩm chỉ hiển thị công khai khi bạn đồng ý và được duyệt theo quy trình.
## Bảo mật và lưu giữ
Nexora áp dụng kiểm soát truy cập phía máy chủ và giới hạn quyền truy cập tệp riêng tư. Thời hạn lưu giữ cụ thể cần được xác nhận trong chính sách cuối cùng; bản nháp này không cam kết một thời hạn hoặc khu vực lưu trữ cố định.
## Liên hệ và cập nhật
Để hỏi về dữ liệu cá nhân, liên hệ nexorainterview@gmail.com. Ngày cập nhật sẽ hiển thị cùng bản chính sách đã công bố.`;
