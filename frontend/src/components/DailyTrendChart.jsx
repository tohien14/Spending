import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatVND } from "../utils.js";

export default function DailyTrendChart({ data, budget }) {
  const hasSpending = data.some((d) => d.expense > 0);

  if (!hasSpending) {
    return <div className="empty-state">Chưa có khoản chi nào trong tháng này để vẽ biểu đồ.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
        <CartesianGrid stroke="#e3dbe0" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#7c6a83", fontFamily: "Inter" }}
          axisLine={{ stroke: "#e3dbe0" }}
          tickLine={false}
          interval={data.length > 20 ? 2 : 0}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#a89bae", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          width={54}
          tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}tr` : v)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#a89bae", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          width={54}
          tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}tr` : v)}
        />
        <Tooltip
          formatter={(value, name) => {
            if (value === null || value === undefined) return ["—", name];
            const label = name === "expense" ? "Chi ngày này" : "Luỹ kế từ đầu tháng";
            return [formatVND(value), label];
          }}
          labelFormatter={(day) => `Ngày ${day}`}
          contentStyle={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            border: "1px solid #e3dbe0",
            borderRadius: 8,
          }}
        />
        <Bar yAxisId="left" dataKey="expense" fill="#e83c91" radius={[3, 3, 0, 0]} barSize={10} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulative"
          stroke="#43334c"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        {budget > 0 && (
          <ReferenceLine
            yAxisId="right"
            y={budget}
            stroke="#ff8fb7"
            strokeWidth={2}
            strokeDasharray="5 4"
            label={{ value: "Ngân sách", position: "insideTopRight", fill: "#7c6a83", fontSize: 11 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
