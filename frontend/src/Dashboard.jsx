// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { TrendingUp, Users, UserCheck, Activity, DollarSign } from "lucide-react";
import "./Dashboard.css";
import api from "./axios/api";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [weeklyReports, setWeeklyReports] = useState([]);

  // Backend-driven overview data
  const [overviewData, setOverviewData] = useState({
    totalPatients: 0,
    totalReports: 0,
    male: 0,
    female: 0,
  });

  // Age ratio (kid, adult, elder) from backend
  const [ageRatioData, setAgeRatioData] = useState({
    kid: 0,
    adult: 0,
    elder: 0,
  });

  // Monthly revenue with forecasting
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    percentageChange: 0,
    isPositive: true,
    forecast: {
      nextMonthPrediction: 0,
      confidenceScore: 0,
      trend: 'stable',
      dataPointsUsed: 0,
      nextMonthName: '',
    },
  });

  // ===== Fetch overview, counts and age ratio =====
  useEffect(() => {
    const fetchAll = async () => {
      console.log("🔄 Fetching dashboard data...");
      try {
        const [
          maleRes,
          femaleRes,
          totalPatientsRes,
          totalReportsRes,
          ageRatioRes,
        ] = await Promise.all([
          api.get("/patient/get-male-count"),
          api.get("/patient/get-female-count"),
          api.get("/patient/get-total-patients-count"),
          api.get("/document/get-document-count"),
          api.get("/patient/get-age-ratio"),
        ]);

        console.log("🧩 Male:", maleRes.data);
        console.log("🧩 Female:", femaleRes.data);
        console.log("🧩 Total Patients:", totalPatientsRes.data);
        console.log("🧩 Total Reports:", totalReportsRes.data);
        console.log("🧩 Age Ratio response:", ageRatioRes.data);

        // male/female endpoints return plain integers (maleRes.data === 23)
        const male =
          typeof maleRes.data === "number"
            ? maleRes.data
            : Number(maleRes.data) || 0;
        const female =
          typeof femaleRes.data === "number"
            ? femaleRes.data
            : Number(femaleRes.data) || 0;

        // totalPatients/totalReports follow { success, message, data: { count } } shape
        const totalPatients =
          totalPatientsRes?.data?.data?.count ??
          (typeof totalPatientsRes.data === "number"
            ? totalPatientsRes.data
            : 0);

        // totalReports sometimes sits at res.data.count or res.data.data.count - handle both
        const totalReports =
          totalReportsRes?.data?.data?.count ??
          totalReportsRes?.data?.count ??
          (typeof totalReportsRes.data === "number"
            ? totalReportsRes.data
            : 0);

        setOverviewData({
          male,
          female,
          totalPatients,
          totalReports,
        });

        const ageData = ageRatioRes?.data?.data ?? {};
        setAgeRatioData({
          kid: ageData.kid ?? 0,
          adult: ageData.adult ?? 0,
          elder: ageData.elder ?? 0,
        });

        console.log(
          "✅ Overview set:",
          { male, female, totalPatients, totalReports }
        );
        console.log("✅ Age ratio set:", ageData);
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      }
    };

    fetchAll();
  }, []);

  // ===== Fetch weekly medical documentation counts (Mon-Sun) =====
  useEffect(() => {
    const fetchWeeklyReports = async () => {
      console.log("📅 Fetching weekly documentations...");
      try {
        const res = await api.get("/document/get-weekly-document-count");
        console.log("📊 Weekly Documentations Response:", res.data);

        // Backend returns plain array (e.g. [{day:'Mon', count:3}, ...]) or wrapper {data: [...]}
        const raw =
          Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];

        // Normalize: ensure we have exactly 7 items for Mon..Sun if possible.
        const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        // Map backend array into dictionary for quick lookup
        const dict = {};
        raw.forEach((r) => {
          if (!r) return;
          const dayLabel = (r.day || "").toString();
          dict[dayLabel] = typeof r.count === "number" ? r.count : Number(r.count) || 0;
        });

        // Build final weekly array in Mon..Sun order
        const normalized = daysOrder.map((d) => ({
          day: d,
          count: dict[d] ?? 0,
        }));

        console.log("✅ Parsed Weekly Reports:", normalized);
        setWeeklyReports(normalized);
      } catch (err) {
        console.error("❌ Error fetching weekly reports:", err);
        // fallback: empty week
        setWeeklyReports([
          { day: "Mon", count: 0 },
          { day: "Tue", count: 0 },
          { day: "Wed", count: 0 },
          { day: "Thu", count: 0 },
          { day: "Fri", count: 0 },
          { day: "Sat", count: 0 },
          { day: "Sun", count: 0 },
        ]);
      }
    };

    fetchWeeklyReports();
  }, []);

  // ===== Fetch monthly revenue with forecasting =====
  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      console.log("💰 Fetching monthly revenue...");
      try {
        const res = await api.get("/statistics/get-monthly-sales");
        console.log("💵 Monthly Revenue Response:", res.data);

        const data = res.data?.data?.data ?? res.data?.data ?? {};
        
        setMonthlyRevenue({
          currentMonthRevenue: data.currentMonthRevenue ?? 0,
          lastMonthRevenue: data.lastMonthRevenue ?? 0,
          percentageChange: data.percentageChange ?? 0,
          isPositive: data.isPositive ?? true,
          forecast: {
            nextMonthPrediction: data.forecast?.nextMonthPrediction ?? 0,
            confidenceScore: data.forecast?.confidenceScore ?? 0,
            trend: data.forecast?.trend ?? 'stable',
            dataPointsUsed: data.forecast?.dataPointsUsed ?? 0,
            nextMonthName: data.forecast?.nextMonthName ?? '',
          },
        });

        console.log("✅ Monthly Revenue set:", data);
      } catch (err) {
        console.error("❌ Error fetching monthly revenue:", err);
      }
    };

    fetchMonthlyRevenue();
  }, []);

  // Convert backend weeklyReports to chart-friendly weeklyReportData
  const weeklyReportData = (weeklyReports || []).map((d) => ({
    day: d.day,
    value: d.count ?? 0,
  }));

  // === Static analytics sample (unchanged) ===
  const analyticsData = {
    users: 500,
    usersChange: 8,
    orders: 120,
    ordersChange: -5,
    pageViews: 4200,
    pageViewsChange: 3,
  };

  // patientVisitData now driven by backend ageRatioData
  const patientVisitData = [
    { label: "Elder", value: ageRatioData.elder, color: "#6366f1" },
    { label: "Adult", value: ageRatioData.adult, color: "#ec4899" },
    { label: "Kid", value: ageRatioData.kid, color: "#f59e0b" },
  ];

  // PIE helpers (kept same)
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

  const total = patientVisitData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  let startAngle = 0;
  const arcs = patientVisitData.map((item) => {
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const endAngle = startAngle + angle;
    const path = describeArc(150, 150, 100, startAngle, endAngle);
    const arc = { ...item, path };
    startAngle = endAngle;
    return arc;
  });

  // Helper to safely format numbers
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : n);

  // Helper to format currency
  const fmtCurrency = (n) => {
    if (typeof n !== "number") return n;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(n);
  };

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
                <p className="stat-value">{fmt(overviewData.totalPatients)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Total Reports</h3>
                <p className="stat-value">{fmt(overviewData.totalReports)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Male</h3>
                <p className="stat-value">{fmt(overviewData.male)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pink">
                <UserCheck size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label">Female</h3>
                <p className="stat-value">{fmt(overviewData.female)}</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid">
            {/* Dynamic Weekly Reports Line Graph */}
            <div className="chart-card">
              <h3 className="chart-title">Weekly Patient Reports</h3>
              <div className="line-chart-container">
                <svg width="100%" height="100%" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet">
                  {/* grid / y labels */}
                  {[10,20,30,40,50].map((v,i) => {
                    const y = 300 - 40 - (v * (220 / 50));
                    return (
                      <g key={i}>
                        <line x1="40" y1={y} x2="460" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                        <text x="15" y={y+4} fill="#94a3b8" fontSize="10">{v}</text>
                      </g>
                    );
                  })}

                  {(() => {
                    const padding = 40;
                    const width = 500;
                    const height = 300;
                    const points = weeklyReportData;
                    const xStep = (width - padding * 2) / (Math.max(points.length - 1, 1));
                    const maxVal = Math.max(...points.map(p => p.value), 50);
                    const yScale = (height - padding * 2) / maxVal;

                    const generateWeeklyPath = () => {
                      return points.map((d, i) => {
                        const x = padding + i * xStep;
                        const y = height - padding - d.value * yScale;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ');
                    };

                    const getWeeklyPoint = (index) => {
                      const x = padding + index * xStep;
                      const y = height - padding - (points[index]?.value ?? 0) * yScale;
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
                        {points.map((point, i) => {
                          const { x, y } = getWeeklyPoint(i);
                          return <circle key={i} cx={x} cy={y} r="5" fill="#ef4444" />;
                        })}
                        {points.map((point, i) => {
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

            {/* Dynamic Patient Visits Pie Chart */}
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
                    <span className="legend-percentage">{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ANALYTICS TAB ================= */}
      {activeTab === 'analytics' && (
        <div className="dashboard-content">
          <div className="analytics-header">
            <h1 className="dashboard-title">Analytics and Forecasting</h1>
          </div>

          {/* Analytics Stats Cards - Updated with Monthly Revenue */}
          <div className="stats-grid">
            {/* Monthly Revenue Card */}
            <div className="stat-card analytics">
              <div className="stat-icon-small green">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">Monthly Revenue</h3>
                <p className="stat-value-large">{fmtCurrency(monthlyRevenue.currentMonthRevenue)}</p>
                <div className={`stat-trend ${monthlyRevenue.isPositive ? 'positive' : 'negative'}`}>
                  <TrendingUp size={14} />
                  <span>{Math.abs(monthlyRevenue.percentageChange)}% vs last month</span>
                </div>
              </div>
            </div>

            {/* Forecast Card */}
            <div className="stat-card analytics forecast-card">
              <div className="stat-icon-small blue">
                <TrendingUp size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">Forecast: {monthlyRevenue.forecast.nextMonthName || 'Next Month'}</h3>
                <p className="stat-value-large">{fmtCurrency(monthlyRevenue.forecast.nextMonthPrediction)}</p>
                <div className="stat-meta">
                  <span className={`trend-badge ${monthlyRevenue.forecast.trend}`}>
                    {monthlyRevenue.forecast.trend}
                  </span>
                  <span className="confidence-score">
                    {monthlyRevenue.forecast.confidenceScore}% confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Top Services Card */}
            <div className="stat-card analytics">
              <div className="stat-icon-small purple">
                <Users size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">Top Services</h3>
                <p className="stat-value-large">{fmt(analyticsData.users)}</p>
                <div className="stat-trend positive">
                  <TrendingUp size={14} />
                  <span>{analyticsData.usersChange}% vs last period</span>
                </div>
              </div>
            </div>

            {/* Top Category Card */}
            <div className="stat-card analytics">
              <div className="stat-icon-small pink">
                <UserCheck size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">Top Category</h3>
                <p className="stat-value-large">{fmt(analyticsData.orders)}</p>
                <div className="stat-trend negative">
                  <TrendingUp size={14} />
                  <span>{Math.abs(analyticsData.ordersChange)}% vs last period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Charts: Top 5 Category + Top 5 Services */}
          <div className="charts-grid">
            {/* Top 5 Category (Dynamic Pie Chart) */}
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
                    const totalC = categoryData.reduce((sum, c) => sum + c.value, 0);
                    let startA = 0;
                    return categoryData.map((item, i) => {
                      const angle = (item.value / totalC) * 360;
                      const endAngle = startA + angle;
                      const path = describeArc(150, 150, 100, startA, endAngle);
                      startA = endAngle;
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

            {/* Top 5 Services (Dynamic Bar Graph) */}
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

          {/* Revenue vs Target (Line Graph) */}
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
                      <path d={makePath("target")} stroke="#14b8a6" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <path d={makePath("revenue")} stroke="#6366f1" strokeWidth="2" fill="none" strokeLinecap="round" />
                      {data.map((d, i) => {
                        const { x, y } = getPoint(d.revenue, i);
                        return <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" />;
                      })}
                      {data.map((d, i) => {
                        const x = padding + i * xStep;
                        return (
                          <text key={i} x={x} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="12">
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