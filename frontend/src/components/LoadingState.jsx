import { useEffect, useState } from "react";

const MESSAGES = [
  "Đang đếm từng đồng...",
  "Đang xếp lại ví tiền...",
  "Đang gọi hỏi To Hin...",
  "Đang cộng sổ chi tiêu...",
  "Đang nhặt từng hoá đơn...",
  "Sắp xong rồi, chờ chút xíu...",
  "Te te tò ti té, đang load dữ liệu...",
];

export default function LoadingState({ label }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{label || MESSAGES[i]}</p>
    </div>
  );
}
