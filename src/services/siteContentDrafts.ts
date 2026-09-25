import type { AboutContent } from './siteContentApi';

export const RECOMMENDED_ABOUT_CONTENT: AboutContent = {
  heroTitle: 'Luyện đúng điều cần cải thiện.\nTự tin hơn ở mỗi lần phỏng vấn.',
  heroSubtitle:
    'Nexora kết nối CV, mục tiêu nghề nghiệp và chính câu trả lời của bạn để biến mỗi buổi luyện tập thành một bước tiến có thể nhìn thấy.',
  heroAssetId: null,
  missionTitle: 'Biến mỗi lần luyện tập thành tiến bộ thật.',
  missionBody:
    'Phỏng vấn không chỉ là biết câu trả lời đúng. Bạn cần hiểu cách mình trình bày, bằng chứng mình đưa ra và điều gì khiến câu trả lời thuyết phục hơn.\n\nNexora giúp bạn luyện từ chính CV, mục tiêu nghề nghiệp và bối cảnh ứng tuyển của mình. Sau mỗi lần thực hành, hệ thống phản hồi theo tiêu chí, chỉ ra điểm mạnh, điểm còn thiếu và gợi ý bước luyện tập tiếp theo.\n\nMục tiêu của Nexora không phải dự đoán bạn có được tuyển hay không. Mục tiêu là giúp bạn chuẩn bị tốt hơn, trả lời rõ ràng hơn và nhìn thấy sự tiến bộ qua từng lần luyện tập.',
  missionAssetId: null,
  values: [
    {
      title: 'Phản hồi có căn cứ',
      description:
        'Nhận xét bám vào CV, bối cảnh và nội dung bạn thực sự cung cấp, không biến giả định thành thành tích của bạn.',
      iconKey: 'evidence',
    },
    {
      title: 'Luyện tập có chủ đích',
      description:
        'Tập trung vào câu hỏi, kỹ năng và tình huống đang cần cải thiện thay vì luyện ngẫu nhiên.',
      iconKey: 'practice',
    },
    {
      title: 'Tiến bộ có thể nhìn thấy',
      description:
        'Kết quả, năng lực và lịch sử luyện tập giúp bạn nhìn lại mình đã cải thiện ở đâu và nên tập gì tiếp theo.',
      iconKey: 'progress',
    },
  ],
  milestones: [],
  teamSectionEnabled: false,
  teamHeading: null,
  teamMembers: [],
};

export const INITIAL_ABOUT_DRAFT: AboutContent = RECOMMENDED_ABOUT_CONTENT;

export const RECOMMENDED_TERMS_TEMPLATE = `## 1. Phạm vi và mục đích dịch vụ
Nexora là nền tảng hỗ trợ chuẩn bị nghề nghiệp và luyện phỏng vấn. Các chức năng có thể bao gồm quản lý hồ sơ nghề nghiệp và mục tiêu, tải và phân tích CV, làm việc với mô tả công việc, luyện phỏng vấn AI, luyện tình huống và STAR, theo dõi năng lực, lộ trình học tập, báo cáo và các chức năng liên quan được hiển thị trong sản phẩm.

Nexora là công cụ hỗ trợ luyện tập. Dịch vụ không phải là nhà tuyển dụng, không thay mặt doanh nghiệp đưa ra quyết định tuyển dụng và không đảm bảo bạn sẽ nhận được việc làm, lời mời phỏng vấn hoặc một kết quả tuyển dụng cụ thể.

## 2. Tài khoản và bảo mật
Bạn chịu trách nhiệm cung cấp thông tin tài khoản phù hợp, bảo vệ thông tin đăng nhập và kiểm soát các phiên đăng nhập của mình.

Bạn không được truy cập tài khoản của người khác, né tránh cơ chế phân quyền, khai thác lỗ hổng, gây quá tải hệ thống hoặc sử dụng Nexora theo cách xâm phạm quyền của người khác.

Nếu phát hiện phiên đăng nhập không nhận ra, bạn nên thu hồi phiên và thay đổi thông tin bảo mật phù hợp.

## 3. Nội dung AI và giới hạn của phản hồi
Một số chức năng của Nexora sử dụng hệ thống AI để phân tích hoặc tạo phản hồi. Nội dung AI có thể chưa đầy đủ, chưa chính xác hoặc không phù hợp với mọi bối cảnh.

Điểm số, nhận xét, câu trả lời mẫu, phân tích CV, gợi ý cải thiện và lộ trình học tập chỉ phục vụ mục đích chuẩn bị và luyện tập. Bạn cần tự đánh giá trước khi sử dụng chúng cho các quyết định nghề nghiệp thực tế.

Nexora cố gắng bám phản hồi vào dữ liệu và câu trả lời bạn cung cấp, nhưng không biến phản hồi AI thành xác nhận về kinh nghiệm, thành tích hoặc năng lực mà bạn chưa thực sự có.

## 4. Nội dung do bạn cung cấp
Bạn vẫn giữ quyền đối với CV, mô tả công việc, câu trả lời phỏng vấn, thông tin nghề nghiệp, phản hồi và các nội dung khác mà bạn có quyền cung cấp.

Khi gửi dữ liệu vào Nexora, bạn cho phép hệ thống lưu trữ, truyền và xử lý dữ liệu đó trong phạm vi cần thiết để thực hiện chức năng bạn yêu cầu, duy trì lịch sử liên quan, bảo vệ hệ thống và vận hành dịch vụ.

Bạn không được tải lên dữ liệu hoặc tài liệu mà bạn không có quyền sử dụng.

## 5. Sử dụng hợp lệ
Nexora được thiết kế cho việc chuẩn bị và luyện tập trước phỏng vấn.

Bạn không được sử dụng Nexora để gian lận trong một buổi phỏng vấn, bài đánh giá hoặc quy trình tuyển dụng trực tiếp khi việc sử dụng công cụ hỗ trợ bị cấm hoặc làm sai lệch năng lực thực tế của bạn.

Bạn cũng không được dùng dịch vụ để phát tán nội dung trái pháp luật, mã độc, nội dung xâm phạm quyền sở hữu trí tuệ hoặc thực hiện hành vi gây hại cho hệ thống hay người khác.

## 6. Gói dịch vụ, hạn mức và thanh toán
Một số chức năng hoặc hạn mức phụ thuộc vào gói dịch vụ đang áp dụng cho tài khoản của bạn. Giá, chu kỳ, hạn mức và quyền lợi được hiển thị tại giao diện bảng giá hoặc thanh toán tại thời điểm thực hiện giao dịch.

Quyền lợi trả phí chỉ được ghi nhận sau khi hệ thống xác nhận giao dịch hợp lệ. Một giao dịch ở trạng thái chờ hoặc thất bại không tạo ra quyền lợi đã thanh toán.

Nexora không mặc nhiên cam kết hoàn tiền nếu chưa có chính sách hoàn tiền riêng được công bố cho giao dịch tương ứng.

## 7. Khả dụng và thay đổi sản phẩm
Nexora có thể cập nhật, sửa lỗi, thay đổi hoặc tạm ngừng một phần dịch vụ để bảo trì, bảo mật hoặc cải thiện sản phẩm.

Các nhà cung cấp hạ tầng, AI, email, thanh toán, lưu trữ hoặc giọng nói có thể thay đổi theo cấu hình và nhu cầu vận hành, miễn là việc sử dụng vẫn phù hợp với chức năng dịch vụ và chính sách bảo mật hiện hành.

## 8. Tạm ngưng và xóa tài khoản
Nexora có thể giới hạn quyền truy cập khi phát hiện hành vi lạm dụng, rủi ro bảo mật hoặc vi phạm nghiêm trọng các điều khoản này.

Bạn có thể sử dụng chức năng yêu cầu xóa tài khoản khi chức năng đó được cung cấp trong phần cài đặt. Việc xóa được xử lý theo quy trình bảo mật và chính sách dữ liệu hiện hành.

## 9. Trách nhiệm khi sử dụng kết quả
Bạn chịu trách nhiệm đối với nội dung cuối cùng mình sử dụng trong CV, hồ sơ, câu trả lời phỏng vấn và các quyết định nghề nghiệp.

Nexora không chịu trách nhiệm thay cho nhà tuyển dụng, nền tảng tuyển dụng hoặc bên thứ ba đối với tiêu chí, quyết định hoặc kết quả tuyển dụng của họ.

## 10. Thay đổi điều khoản và liên hệ
Khi nội dung điều khoản thay đổi, bản được công bố sẽ hiển thị ngày hiệu lực hoặc ngày cập nhật tương ứng.

Nếu có câu hỏi về điều khoản dịch vụ, liên hệ nexorainterview@gmail.com.`;

export const INITIAL_TERMS_DRAFT = RECOMMENDED_TERMS_TEMPLATE;

export const RECOMMENDED_PRIVACY_TEMPLATE = `## 1. Dữ liệu Nexora có thể xử lý
Tùy chức năng bạn sử dụng, Nexora có thể xử lý thông tin tài khoản và xác thực, email, tên hiển thị, ảnh đại diện, hồ sơ nghề nghiệp, mục tiêu nghề nghiệp, CV và nội dung được trích xuất từ CV, mô tả công việc, câu trả lời phỏng vấn, kết quả đánh giá, báo cáo, dữ liệu luyện tập STAR hoặc tình huống, tín hiệu năng lực, lộ trình học tập, phản hồi sản phẩm, thông tin đơn hàng và dữ liệu phiên đăng nhập hoặc bảo mật.

Nexora chỉ nên yêu cầu dữ liệu cần thiết cho chức năng bạn đang sử dụng.

## 2. Mục đích xử lý
Dữ liệu được xử lý để xác thực tài khoản, cung cấp chức năng phân tích và luyện tập, duy trì lịch sử và trạng thái tiến bộ, quản lý quyền lợi gói, xử lý giao dịch, vận hành các tính năng giọng nói khi bạn chủ động sử dụng, gửi email cần thiết, bảo vệ tài khoản, xử lý yêu cầu hỗ trợ và duy trì an toàn hệ thống.

## 3. Xử lý bởi AI và dịch vụ giọng nói
Khi bạn yêu cầu phân tích CV, đánh giá câu trả lời, tạo câu hỏi, báo cáo hoặc chức năng AI tương ứng, phần dữ liệu cần thiết cho tác vụ có thể được gửi tới nhà cung cấp AI được cấu hình cho môi trường đang vận hành.

Khi bạn chủ động sử dụng chức năng giọng nói, dữ liệu âm thanh hoặc văn bản liên quan có thể được xử lý bởi nhà cung cấp nhận dạng hoặc tổng hợp giọng nói để thực hiện chức năng đó.

Không nên xem phản hồi của nhà cung cấp AI hoặc giọng nói là dữ liệu xác minh độc lập về kinh nghiệm hoặc năng lực của bạn.

## 4. Hạ tầng và nhà cung cấp dịch vụ
Nexora sử dụng các dịch vụ hạ tầng cần thiết như cơ sở dữ liệu, lưu trữ đối tượng riêng tư, hosting, email, AI, thanh toán và dịch vụ giọng nói.

Tệp CV, ảnh đại diện và các tài sản riêng tư được lưu trong cơ chế lưu trữ có kiểm soát truy cập. Một số thao tác tải tệp có thể sử dụng URL ký tạm thời để trình duyệt truyền tệp trực tiếp tới kho lưu trữ mà không biến tệp thành tài nguyên công khai.

Nhà cung cấp cụ thể có thể thay đổi theo môi trường và cấu hình vận hành.

## 5. Phản hồi được chia sẻ công khai
Phản hồi sản phẩm của bạn không mặc nhiên trở thành nội dung công khai.

Việc hiển thị phản hồi trên trang công khai phụ thuộc vào trạng thái đồng ý chia sẻ và quy trình kiểm duyệt của Nexora. Bạn có thể thay đổi hoặc rút lại phản hồi theo các chức năng được cung cấp.

## 6. Bảo mật tài khoản và phiên đăng nhập
Nexora áp dụng kiểm soát truy cập phía máy chủ, phân quyền đối với tài nguyên riêng tư và cơ chế quản lý phiên đăng nhập.

Bạn có thể xem và thu hồi các phiên đăng nhập được hỗ trợ trong phần cài đặt. Khi có yêu cầu xóa tài khoản, các phiên hoạt động liên quan được thu hồi theo quy trình của hệ thống.

Không có hệ thống trực tuyến nào có thể đảm bảo an toàn tuyệt đối; vì vậy bạn cũng cần bảo vệ thông tin đăng nhập và thiết bị của mình.

## 7. Quyền kiểm soát dữ liệu của bạn
Tùy chức năng hiện có, bạn có thể cập nhật hồ sơ, thay đổi hoặc gỡ ảnh đại diện, quản lý mục tiêu nghề nghiệp và CV, thu hồi phiên đăng nhập, tải bản xuất dữ liệu cốt lõi và gửi yêu cầu xóa tài khoản.

Bản xuất dữ liệu cốt lõi có thể bao gồm những nhóm dữ liệu như hồ sơ, thông tin CV, mô tả công việc, mục tiêu nghề nghiệp, lộ trình học, kết quả phân tích, lịch sử phỏng vấn và báo cáo, phản hồi sản phẩm và thông tin quyền lợi hoặc giao dịch liên quan.

## 8. Lưu giữ và xóa dữ liệu
Nexora lưu dữ liệu trong thời gian cần thiết để cung cấp chức năng đang sử dụng, duy trì tính toàn vẹn của giao dịch, bảo vệ hệ thống và đáp ứng các nghĩa vụ vận hành hoặc pháp lý có liên quan.

Khi yêu cầu xóa tài khoản được xử lý, hệ thống thu hồi quyền truy cập phù hợp, xóa các tệp riêng tư và xóa hoặc ẩn danh dữ liệu cá nhân thuộc quy trình xóa của sản phẩm.

Một số bản ghi tối thiểu liên quan đến giao dịch, bảo mật, kiểm toán hoặc nghĩa vụ pháp lý có thể cần được giữ lại khi việc xóa hoàn toàn không phù hợp với mục đích đó.

Không công bố một thời hạn lưu giữ cố định nếu hệ thống chưa thực sự áp dụng thời hạn đó.

## 9. Thay đổi chính sách và liên hệ
Khi chính sách này thay đổi, bản được công bố sẽ hiển thị ngày hiệu lực hoặc ngày cập nhật tương ứng.

Nếu có câu hỏi về dữ liệu cá nhân hoặc chính sách bảo mật, liên hệ nexorainterview@gmail.com.`;

export const INITIAL_PRIVACY_DRAFT = RECOMMENDED_PRIVACY_TEMPLATE;
