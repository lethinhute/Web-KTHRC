import './MemberPage.css';

const members = [
  {
    name: 'Võ Diệp Trung Tín',
    image: '/img/member/trungtin.JPG',
    role: 'LEADER - FOUNDER',
    year: '2022',
    quote: 'Đang xem signal, đợi tí !',
  },
  {
    name: 'Hà Tuấn Tài',
    image: '/img/member/hatuantai.jpg',
    role: 'CO - FOUNDER',
    year: '2022',
    quote: 'Phòng còn gì ăn không?',
  },
  {
    name: 'Trần Quốc Huy',
    image: '/img/member/tranquochuy.JPG',
    role: null,
    year: '2023',
    quote: 'Dễ mà',
  },
  {
    name: 'Từ Đức Mạnh',
    image: '/img/member/tuducmanh.jpg',
    role: null,
    year: '2024',
    quote: 'Hàn thì rung tay, tương lai thì vững',
  },
  {
    name: 'Hà Thái Bảo',
    image: '/img/member/hathaibao.JPG',
    role: null,
    year: '2024',
    quote: 'học ko chơi đánh rơi tuổi trẻ, chơi không học ... hẹn lại sau 6h30',
  },
  {
    name: 'Nguyễn Thành Nhân',
    image: '/img/member/nguyenthanhnhan.JPG',
    role: null,
    year: '2024',
    quote: 'Mọi thứ sẽ ổn thôi',
  },
  {
    name: 'Hà Công Danh',
    image: '/img/member/hacongdanh.JPG',
    role: null,
    year: '2024',
    quote: 'Phải thử mới biết được',
  },
  {
    name: 'Trần Khánh Ninh',
    image: '/img/member/trankhanhninh.jpg',
    role: null,
    year: '2024',
    quote: 'Em thấy cũng bình thường',
  },
  {
    name: 'Lê Trường Thọ',
    image: '',
    role: null,
    year: '2022',
    quote: 'Quote là gì?',
  },
];

export default function MemberPage() {
  return (
    <div className="member-page">
      <div className="member-header">
        <h1 className="member-page-title">Our Members</h1>
      </div>
      <div className="member-list">
        {members.map((m, i) => (
          <div key={i} className="member-card">
            <div className="member-card-accent" />
            <div className="member-card-body">
              <div className="member-avatar-wrap">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="member-avatar" />
                ) : (
                  <div className="member-avatar-placeholder">
                    {m.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="member-details">
                <p className="member-name">{m.name}</p>
                {m.role && (
                  <span className="member-role">{m.role}</span>
                )}
                <p className="member-year">
                  <span className="meta-label">School year: </span>
                  {m.year}
                </p>
                <p className="member-quote">
                  <span className="meta-label">Slogan: </span>
                  <em>{m.quote}</em>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
