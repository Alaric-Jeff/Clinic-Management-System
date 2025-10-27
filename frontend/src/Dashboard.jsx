// Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  Activity,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import "./Dashboard.css";
import api from "./axios/api";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
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

  // Daily sales (today)
  const [dailySales, setDailySales] = useState({
    totalRevenue: 0,
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
      trend: "stable",
      dataPointsUsed: 0,
      nextMonthName: "",
    },
  });

  // Top performing services data
  const [topServices, setTopServices] = useState({
    currentMonth: {
      monthName: "",
      topServices: [],
      totalServicesAnalyzed: 0,
    },
    forecast: {
      nextMonthName: "",
      topPredictedServices: [],
      totalServicesForecasted: 0,
      note: "",
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

        // totalReports might be shaped differently; check multiple places
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
        console.log("📊 Weekly Reports Response:", res.data);

        // accept either array directly or { data: [...] }
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dict = {};

        raw.forEach((r) => {
          if (!r) return;
          const dayLabel = (r.day || "").toString();
          dict[dayLabel] =
            typeof r.count === "number" ? r.count : Number(r.count) || 0;
        });

        const normalized = daysOrder.map((d) => ({
          day: d,
          count: dict[d] ?? 0,
        }));

        console.log("✅ Parsed Weekly Reports:", normalized);
        setWeeklyReports(normalized);
      } catch (err) {
        console.error("❌ Error fetching weekly reports:", err);
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

        // Lots of backends wrap data differently; try to handle both shapes
        const data =
          res.data?.data?.data ?? res.data?.data ?? (res.data ?? {});

        setMonthlyRevenue({
          currentMonthRevenue: data.currentMonthRevenue ?? 0,
          lastMonthRevenue: data.lastMonthRevenue ?? 0,
          percentageChange: data.percentageChange ?? 0,
          isPositive: data.isPositive ?? true,
          forecast: {
            nextMonthPrediction:
              data.forecast?.nextMonthPrediction ?? 0,
            confidenceScore: data.forecast?.confidenceScore ?? 0,
            trend: data.forecast?.trend ?? "stable",
            dataPointsUsed: data.forecast?.dataPointsUsed ?? 0,
            nextMonthName: data.forecast?.nextMonthName ?? "",
          },
        });

        console.log("✅ Monthly Revenue set:", data);
      } catch (err) {
        console.error("❌ Error fetching monthly revenue:", err);
      }
    };

    fetchMonthlyRevenue();
  }, []);

  // ===== Fetch top performing services =====
  useEffect(() => {
    const fetchTopServices = async () => {
      console.log("🏆 Fetching top performing services...");
      try {
        const res = await api.get("/statistics/get-top-performing-services");
        console.log("📊 Top Services Response:", res.data);

        // Expecting res.data.data structure
        const responseData = res.data?.data ?? {};

        setTopServices({
          currentMonth: {
            monthName: responseData.currentMonth?.monthName ?? "",
            topServices: responseData.currentMonth?.topServices ?? [],
            totalServicesAnalyzed:
              responseData.currentMonth?.totalServicesAnalyzed ?? 0,
          },
          forecast: {
            nextMonthName: responseData.forecast?.nextMonthName ?? "",
            topPredictedServices:
              responseData.forecast?.topPredictedServices ?? [],
            totalServicesForecasted:
              responseData.forecast?.totalServicesForecasted ?? 0,
            note: responseData.forecast?.note ?? "",
          },
        });

        console.log("✅ Top Services set:", responseData);
      } catch (err) {
        console.error("❌ Error fetching top services:", err);
      }
    };

    fetchTopServices();
  }, []);

  // ===== Fetch today's sales =====
  useEffect(() => {
    const fetchDailySales = async () => {
      console.log("🧾 Fetching today's sales...");
      try {
        const res = await api.get("/statistics/get-daily-sales");
        console.log("🧾 Daily Sales Response:", res.data);

        // Response shape: { message, data: { totalRevenue: X } }
        const rec =
          res.data?.data ??
          (typeof res.data === "object" ? res.data : { totalRevenue: 0 });

        setDailySales({
          totalRevenue: typeof rec.totalRevenue === "number"
            ? rec.totalRevenue
            : Number(rec.totalRevenue) || 0,
        });

        console.log("✅ Daily sales set:", rec);
      } catch (err) {
        console.error("❌ Error fetching daily sales:", err);
        setDailySales({ totalRevenue: 0 });
      }
    };

    fetchDailySales();
  }, []);

  // Convert backend weeklyReports to chart-friendly weeklyReportData
  const weeklyReportData = (weeklyReports || []).map((d) => ({
    day: d.day,
    value: d.count ?? 0,
  }));

  // patientVisitData driven by backend ageRatioData
  const patientVisitData = [
    { label: "Elder", value: ageRatioData.elder, color: "#6366f1" },
    { label: "Adult", value: ageRatioData.adult, color: "#ec4899" },
    { label: "Kid", value: ageRatioData.kid, color: "#f59e0b" },
  ];

  // PIE helpers
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180.0;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M",
      cx,
      cy,
      "L",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  };

  const total = patientVisitData.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );
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
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(n);
  };

  // Get top 5 services for display
  const top5CurrentServices = (topServices.currentMonth.topServices || []).slice(
    0,
    5
  );
  const top5ForecastedServices = (topServices.forecast.topPredictedServices || []).slice(
    0,
    5
  );

  // Calculate max revenue for scaling bar chart
  const maxCurrentRevenue = Math.max(
    ...top5CurrentServices.map((s) => s.totalRevenue),
    1
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`toggle-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </div>
      </header>

      {activeTab === "overview" && (
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
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 500 300"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {[10, 20, 30, 40, 50].map((v, i) => {
                    const y = 300 - 40 - v * (220 / 50);
                    return (
                      <g key={i}>
                        <line
                          x1="40"
                          y1={y}
                          x2="460"
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                        <text x="15" y={y + 4} fill="#94a3b8" fontSize="10">
                          {v}
                        </text>
                      </g>
                    );
                  })}

                  {(() => {
                    const padding = 40;
                    const width = 500;
                    const height = 300;
                    const points = weeklyReportData;
                    const xStep =
                      (width - padding * 2) / Math.max(points.length - 1, 1);
                    const maxVal = Math.max(...points.map((p) => p.value), 50);
                    const yScale = (height - padding * 2) / maxVal;

                    const generateWeeklyPath = () => {
                      return points
                        .map((d, i) => {
                          const x = padding + i * xStep;
                          const y = height - padding - d.value * yScale;
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ");
                    };

                    const getWeeklyPoint = (index) => {
                      const x = padding + index * xStep;
                      const y =
                        height - padding - (points[index]?.value ?? 0) * yScale;
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
                          return (
                            <circle key={i} cx={x} cy={y} r="5" fill="#ef4444" />
                          );
                        })}
                        {points.map((point, i) => {
                          const x = padding + i * xStep;
                          return (
                            <text
                              key={i}
                              x={x}
                              y={height - padding + 20}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize="12"
                            >
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
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 300 300"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {arcs.map((arc, i) => (
                    <path key={i} d={arc.path} fill={arc.color} />
                  ))}
                </svg>
              </div>
              <div className="legend">
                {patientVisitData.map((item, i) => (
                  <div className="legend-item" key={i}>
                    <span
                      className="legend-color"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-percentage">
                      {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ANALYTICS TAB ================= */}
      {activeTab === "analytics" && (
        <div className="dashboard-content">
          <div className="analytics-header">
            <h1 className="dashboard-title">Analytics and Forecasting</h1>
          </div>

          {/* Revenue Cards */}
          <div className="stats-grid">
            {/* Today's Revenue Card */}
            <div className="stat-card analytics">
              <div className="stat-icon-small green">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">Today's Revenue</h3>
                <p className="stat-value-large">
                  {fmtCurrency(dailySales.totalRevenue)}
                </p>
              </div>
            </div>

            {/* Monthly Revenue Card */}
            <div className="stat-card analytics">
              <div className="stat-icon-small green">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">Monthly Revenue</h3>
                <p className="stat-value-large">
                  {fmtCurrency(monthlyRevenue.currentMonthRevenue)}
                </p>
                <div
                  className={`stat-trend ${
                    monthlyRevenue.isPositive ? "positive" : "negative"
                  }`}
                >
                  {monthlyRevenue.isPositive ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  <span>
                    {Math.abs(monthlyRevenue.percentageChange)}% vs last month
                  </span>
                </div>
              </div>
            </div>

            {/* Forecast Card */}
            <div className="stat-card analytics forecast-card">
              <div className="stat-icon-small blue">
                <TrendingUp size={20} />
              </div>
              <div className="stat-content">
                <h3 className="stat-label-small">
                  Forecast: {monthlyRevenue.forecast.nextMonthName || "Next Month"}
                </h3>
                <p className="stat-value-large">
                  {fmtCurrency(monthlyRevenue.forecast.nextMonthPrediction)}
                </p>
                <div className="stat-meta">
                  <span
                    className={`trend-badge ${monthlyRevenue.forecast.trend}`}
                  >
                    {monthlyRevenue.forecast.trend}
                  </span>
                  <span className="confidence-score">
                    {monthlyRevenue.forecast.confidenceScore}% confidence
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Services Charts */}
          <div className="charts-grid">
            {/* Top 5 Current Services */}
            <div className="chart-card">
              <h3 className="chart-title">
                Top 5 Services -{" "}
                {topServices.currentMonth.monthName || "Current Month"}
              </h3>
              <div className="bar-chart-container">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 500 280"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {(() => {
                    if (top5CurrentServices.length === 0) {
                      return (
                        <text
                          x="250"
                          y="140"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="14"
                        >
                          No data available
                        </text>
                      );
                    }

                    const barWidth = 60;
                    const barGap = 80;
                    const baseY = 220;
                    const chartHeight = 150;

                    return (
                      <>
                        {top5CurrentServices.map((s, i) => {
                          const height =
                            (s.totalRevenue / maxCurrentRevenue) * chartHeight;
                          const x = 50 + i * barGap;

                          return (
                            <g key={i}>
                              <rect
                                x={x}
                                y={baseY - height}
                                width={barWidth}
                                height={height}
                                fill="#6366f1"
                                rx="6"
                              />
                              <text
                                x={x + barWidth / 2}
                                y={baseY + 20}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="11"
                              >
                                {s.serviceName &&
                                s.serviceName.length > 10
                                  ? s.serviceName.substring(0, 10) + "..."
                                  : s.serviceName}
                              </text>
                              <text
                                x={x + barWidth / 2}
                                y={baseY - height - 8}
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="10"
                                fontWeight="600"
                              >
                                {fmtCurrency(s.totalRevenue)}
                              </text>
                              <text
                                x={x + barWidth / 2}
                                y={baseY + 35}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="9"
                              >
                                Qty: {s.totalQuantity ?? 0}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="chart-footer-note">
                {topServices.currentMonth.totalServicesAnalyzed} services analyzed
              </div>
            </div>

            {/* Top 5 Forecasted Services */}
            <div className="chart-card">
              <h3 className="chart-title">
                Top 5 Predicted Services -{" "}
                {topServices.forecast.nextMonthName || "Next Month"}
              </h3>
              <div className="bar-chart-container">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 500 280"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {(() => {
                    if (top5ForecastedServices.length === 0) {
                      return (
                        <text
                          x="250"
                          y="140"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="14"
                        >
                          Insufficient data for forecasting
                        </text>
                      );
                    }

                    const maxForecastRevenue = Math.max(
                      ...top5ForecastedServices.map((s) => s.predictedRevenue),
                      1
                    );
                    const barWidth = 60;
                    const barGap = 80;
                    const baseY = 220;
                    const chartHeight = 150;

                    return (
                      <>
                        {top5ForecastedServices.map((s, i) => {
                          const height =
                            (s.predictedRevenue / maxForecastRevenue) *
                            chartHeight;
                          const x = 50 + i * barGap;

                          let barColor = "#14b8a6";
                          if (s.trend === "increasing") barColor = "#10b981";
                          if (s.trend === "decreasing") barColor = "#ef4444";

                          return (
                            <g key={i}>
                              <rect
                                x={x}
                                y={baseY - height}
                                width={barWidth}
                                height={height}
                                fill={barColor}
                                rx="6"
                                opacity="0.9"
                              />
                              <text
                                x={x + barWidth / 2}
                                y={baseY + 20}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="11"
                              >
                                {s.serviceName &&
                                s.serviceName.length > 10
                                  ? s.serviceName.substring(0, 10) + "..."
                                  : s.serviceName}
                              </text>
                              <text
                                x={x + barWidth / 2}
                                y={baseY - height - 8}
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="10"
                                fontWeight="600"
                              >
                                {fmtCurrency(s.predictedRevenue)}
                              </text>
                              <text
                                x={x + barWidth / 2}
                                y={baseY + 35}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="9"
                              >
                                {s.confidenceScore ?? 0}% conf.
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="chart-footer-note">{topServices.forecast.note}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;