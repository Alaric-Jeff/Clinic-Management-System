import React, { useState } from 'react';
import { TrendingUp, Users, UserCheck, Activity } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Sample data - replace with backend data
  const overviewData = {
    totalPatients: "",
    totalReports: "",
    male: "",
    female: "",
  };

  // ✅ Dynamic weekly line graph data
  const weeklyReports = [
    { day: "Mon", value: 5 },
    { day: "Tue", value: 10 },
    { day: "Wed", value: 5 },
    { day: "Thu", value: 20 },
    { day: "Fri", value: 30 },
    { day: "Sat", value: 30 },
    { day: "Sun", value: 50 },
  ];

  const analyticsData = {
    revenue: "",
    revenueChange: "",
    users: "",
    usersChange: "",
    orders: "",
    ordersChange: "",
    pageViews: "",
    pageViewsChange: "",
  };

  // ✅ Dynamic Pie Chart Data
  const patientVisitData = [
    { label: "Elder", value: 35, color: "#6366f1" },
    { label: "Adult", value: 50, color: "#ec4899" },
    { label: "Kid", value: 15, color: "#f59e0b" },
  ];

  // === PIE CHART HELPERS ===
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180.0;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const total = patientVisitData.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  const arcs = patientVisitData.map((item) => {
    const angle = (item.value / total) * 360;
    const endAngle = startAngle + angle;
    const path = describeArc(150, 150, 100, startAngle, endAngle);
    const arc = { ...item, path };
    startAngle = endAngle;
    return arc;
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`toggle-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
      </header>
      

      {activeTab === 'overview' && (
        <div className="dashboard-content">
          <div className="analytics-header">
      <h1 className="dashboard-title">Overview</h1>
    </div>
          {/* Top Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">
                <Activity size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Total Patients</h3>
                <p className="stat-value">{overviewData.totalPatients.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Total Reports</h3>
                <p className="stat-value">{overviewData.totalReports.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Male</h3>
                <p className="stat-value">{overviewData.male}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pink">
                <UserCheck size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Female</h3>
                <p className="stat-value">{overviewData.female}</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid">
            {/* ✅ Dynamic Weekly Reports Line Graph */}
            <div className="chart-card">
              <h3 className="chart-title">Weekly Patient Reports</h3>
              <div className="line-chart-container">
                <svg width="100%" height="100%" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines & Y-axis labels */}
                  {[10, 20, 30, 40, 50].map((v, i) => {
                    const y = 300 - 40 - (v * (220 / 50));
                    return (
                      <g key={i}>
                        <line x1="40" y1={y} x2="460" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                        <text x="15" y={y + 4} fill="#94a3b8" fontSize="10">{v}</text>
                      </g>
                    );
                  })}

                  {/* Line path */}
                  {(() => {
                    const padding = 40;
                    const width = 500;
                    const height = 300;
                    const xStep = (width - padding * 2) / (weeklyReports.length - 1);
                    const yScale = (height - padding * 2) / 50;

                    const generateWeeklyPath = () => {
                      return weeklyReports.map((d, i) => {
                        const x = padding + i * xStep;
                        const y = height - padding - d.value * yScale;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ');
                    };

                    const getWeeklyPoint = (index) => {
                      const x = padding + index * xStep;
                      const y = height - padding - weeklyReports[index].value * yScale;
                      return { x, y };
                    };

                    return (
                      <>
                        <path
                          d={generateWeeklyPath()}
                          stroke="#ef4444"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {weeklyReports.map((point, i) => {
                          const { x, y } = getWeeklyPoint(i);
                          return <circle key={i} cx={x} cy={y} r="5" fill="#ef4444" />;
                        })}
                        {weeklyReports.map((point, i) => {
                          const x = padding + i * xStep;
                          return (
                            <text key={i} x={x} y={height - padding + 20} textAnchor="middle" fill="#94a3b8" fontSize="12">
                              {point.day}
                            </text>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* ✅ Dynamic Patient Visits Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Patient Visits</h3>
              <div className="pie-chart-container">
                <svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
                  {arcs.map((arc, i) => (
                    <path key={i} d={arc.path} fill={arc.color} />
                  ))}
                </svg>
              </div>
              <div className="legend">
                {patientVisitData.map((item, i) => (
                  <div className="legend-item" key={i}>
                    <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-percentage">{((item.value / total) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
  <div className="dashboard-content">
    <div className="analytics-header">
      <h1 className="dashboard-title">Analytics and Forecasting</h1>
    </div>

    {/* Analytics Stats Cards */}
    <div className="stats-grid">
      <div className="stat-card analytics">
        <div className="stat-icon-small green">
          <span>$</span>
        </div>
        <div className="stat-content">
          <h3 className="stat-label-small">Total Revenue</h3>
          <p className="stat-value-large">{analyticsData.revenue.toLocaleString()}</p>
          <div className="stat-trend positive">
            <TrendingUp size={14} />
            <span>{analyticsData.revenueChange}% vs last period</span>
          </div>
        </div>
      </div>

      <div className="stat-card analytics">
        <div className="stat-icon-small purple">
          <Users size={20} />
        </div>
        <div className="stat-content">
          <h3 className="stat-label-small">Top Services</h3>
          <p className="stat-value-large">{analyticsData.users.toLocaleString()}</p>
          <div className="stat-trend positive">
            <TrendingUp size={14} />
            <span>{analyticsData.usersChange}% vs last period</span>
          </div>
        </div>
      </div>

      <div className="stat-card analytics">
        <div className="stat-icon-small pink">
          <UserCheck size={20} />
        </div>
        <div className="stat-content">
          <h3 className="stat-label-small">Top Category</h3>
          <p className="stat-value-large">{analyticsData.orders.toLocaleString()}</p>
          <div className="stat-trend negative">
            <TrendingUp size={14} />
            <span>{analyticsData.ordersChange}% vs last period</span>
          </div>
        </div>
      </div>
    </div>

    {/* === Bottom Charts: Top 5 Category + Top 5 Services === */}
    <div className="charts-grid">
      {/* ✅ Top 5 Category (Dynamic Pie Chart) */}
      <div className="chart-card">
        <h3 className="chart-title">Top 5 Category</h3>
        <div className="pie-chart-container">
          <svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const categoryData = [
                { label: "Hematology", value: 10, color: "#6366f1" },
                { label: "Bacteriology", value: 20, color: "#14b8a6" },
                { label: "Neurology", value: 30, color: "#f59e0b" },
                { label: "Cardiology", value: 20, color: "#ec4899" },
                { label: "Dermatology", value: 20, color: "#8b5cf6" },
              ];
              const total = categoryData.reduce((sum, c) => sum + c.value, 0);
              let startAngle = 0;
              const polarToCartesian = (cx, cy, r, angle) => {
                const rad = (angle - 90) * Math.PI / 180;
                return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
              };
              const describeArc = (cx, cy, r, startAngle, endAngle) => {
                const start = polarToCartesian(cx, cy, r, endAngle);
                const end = polarToCartesian(cx, cy, r, startAngle);
                const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                return [
                  "M", cx, cy,
                  "L", start.x, start.y,
                  "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
                  "Z"
                ].join(" ");
              };

              return categoryData.map((item, i) => {
                const angle = (item.value / total) * 360;
                const endAngle = startAngle + angle;
                const path = describeArc(150, 150, 100, startAngle, endAngle);
                startAngle = endAngle;
                return <path key={i} d={path} fill={item.color} />;
              });
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div className="legend">
          {[
            { label: "Hematology", value: 10, color: "#6366f1" },
            { label: "Bacteriology", value: 20, color: "#14b8a6" },
            { label: "Neurology", value: 30, color: "#f59e0b" },
            { label: "Cardiology", value: 20, color: "#ec4899" },
            { label: "Dermatology", value: 20, color: "#8b5cf6" },
          ].map((item, i) => (
            <div className="legend-item" key={i}>
              <span className="legend-color" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.label}</span>
              <span className="legend-percentage">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Top 5 Services (Dynamic Bar Graph) */}
      <div className="chart-card">
        <h3 className="chart-title">Top 5 Services</h3>
        <div className="bar-chart-container">
          <svg width="100%" height="100%" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const services = [
                { name: "X-ray", value: 10 },
                { name: "Urinalysis", value: 20 },
                { name: "CT Scan", value: 30 },
                { name: "Blood Test", value: 20 },
                { name: "Ultrasound", value: 20 },
              ];
              const max = 50;
              const barWidth = 40;
              const barGap = 60;
              const baseY = 200;
              return services.map((s, i) => {
                const height = (s.value / max) * 150;
                return (
                  <g key={i}>
                    <rect
                      x={50 + i * barGap}
                      y={baseY - height}
                      width={barWidth}
                      height={height}
                      fill="#ef4444"
                      rx="6"
                    />
                    <text
                      x={70 + i * barGap}
                      y={baseY + 20}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="12"
                    >
                      {s.name}
                    </text>
                    <text
                      x={70 + i * barGap}
                      y={baseY - height - 5}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                    >
                      {s.value}%
                    </text>
                  </g>
                );
              });
            })()}
          </svg>
        </div>
      </div>
    </div>

    {/* ✅ Revenue vs Target (Dynamic Line Graph moved below) */}
    <div className="chart-card full-width">
      <div className="chart-header">
        <h3 className="chart-title">Revenue vs Target</h3>
        <select className="time-select">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="area-chart-container">
        <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
          {(() => {
            const data = [
              { month: "Jan", revenue: 100, target: 120 },
              { month: "Feb", revenue: 140, target: 150 },
              { month: "Mar", revenue: 160, target: 170 },
              { month: "Apr", revenue: 180, target: 190 },
              { month: "May", revenue: 210, target: 220 },
              { month: "Jun", revenue: 230, target: 240 },
              { month: "Jul", revenue: 250, target: 260 },
            ];

            const width = 600;
            const height = 300;
            const padding = 40;
            const xStep = (width - 2 * padding) / (data.length - 1);
            const yScale = (height - 2 * padding) / 300;

            const getPoint = (val, i) => ({
              x: padding + i * xStep,
              y: height - padding - val * yScale,
            });

            const makePath = (key) =>
              data
                .map((d, i) => {
                  const { x, y } = getPoint(d[key], i);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ");

            return (
              <>
                <path
                  d={makePath("target")}
                  stroke="#14b8a6"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={makePath("revenue")}
                  stroke="#6366f1"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                {data.map((d, i) => {
                  const { x, y } = getPoint(d.revenue, i);
                  return <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" />;
                })}
                {data.map((d, i) => {
                  const x = padding + i * xStep;
                  return (
                    <text
                      key={i}
                      x={x}
                      y={height - 10}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="12"
                    >
                      {d.month}
                    </text>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </div>
      <div className="chart-legend-horizontal">
        <div className="legend-item-horizontal">
          <span className="legend-line" style={{ backgroundColor: '#6366f1' }}></span>
          <span>Revenue</span>
        </div>
        <div className="legend-item-horizontal">
          <span className="legend-line" style={{ backgroundColor: '#14b8a6' }}></span>
          <span>Target</span>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};
export default Dashboard;