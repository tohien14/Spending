import { formatThousands, parseThousands } from "../utils.js";

// Input hiển thị số có dấu chấm ngăn cách hàng nghìn (VD: 1.000.000) trong
// lúc gõ, nhưng vẫn trả về cho component cha một số nguyên thuần (1000000).
export default function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  autoFocus = false,
  className = "input",
}) {
  function handleChange(e) {
    onChange(parseThousands(e.target.value));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      value={formatThousands(value)}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}
