import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatVND, monthLabel } from "../utils.js";

export default function TrendChart({ data }) {
  const chartData = data.map((d) => ({
    ...d,
    label: monthLabel(d.month).replace("Tháng ", "T"),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#e3dbe0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#7c6a83", fontFamily: "Inter" }}
          axisLine={{ stroke: "#e3dbe0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a89bae", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}tr` : v)}
        />
        <Tooltip
          formatter={(value, name) => [formatVND(value), name === "expense" ? "Chi" : "Thu"]}
          labelFormatter={(label) => label}
          contentStyle={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            border: "1px solid #e3dbe0",
            borderRadius: 8,
          }}
        />
        <Bar dataKey="expense" fill="#e83c91" radius={[3, 3, 0, 0]} barSize={22} />
        <Line
          type="monotone"
          dataKey="income"
          stroke="#43334c"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
