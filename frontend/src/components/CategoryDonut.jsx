import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatVND } from "../utils.js";

export default function CategoryDonut({ data }) {
  const chartData = data.filter((d) => d.spent > 0);

  if (chartData.length === 0) {
    return <div className="empty-state">Chưa có khoản chi nào trong tháng này.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="spent"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={2}
          stroke="none"
        >
          {chartData.map((entry) => (
            <Cell key={entry.id} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatVND(value), name]}
          contentStyle={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            border: "1px solid #e3dbe0",
            borderRadius: 8,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
