'use client';

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00E0B8', '#3ABFF8', '#FFCB2B', '#FF4E3D', '#7E8691'];

interface ChartData {
    type: 'bar' | 'pie' | 'line';
    data: any[];
}

interface ReportChartsProps {
    chartData: ChartData;
}

export default function ReportCharts({ chartData }: ReportChartsProps) {
    return (
        <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
                {chartData.type === 'pie' ? (
                    <PieChart>
                        <Pie
                            data={chartData.data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => {
                                const percent = entry.percent || 0;
                                return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.data.map((_entry: unknown, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1A1E23',
                                border: '1px solid #2A3038',
                                borderRadius: '8px',
                                color: '#D0D6DE',
                            }}
                        />
                        <Legend />
                    </PieChart>
                ) : (
                    <BarChart data={chartData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
                        <XAxis
                            dataKey="name"
                            stroke="#7E8691"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#7E8691"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1A1E23',
                                border: '1px solid #2A3038',
                                borderRadius: '8px',
                                color: '#D0D6DE',
                            }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#00E0B8" />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
