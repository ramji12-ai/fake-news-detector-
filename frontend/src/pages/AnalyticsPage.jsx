import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useAppData } from "../context/AppDataContext";

const DEMO_SAMPLE_RECORDS = [
  {
    id: "demo-1",
    title: "U.S. Senate passes bipartisan infrastructure legislation",
    prediction: "REAL",
    confidence: 98.79,
    timestamp: "2026-09-30T09:15:00.000Z"
  },
  {
    id: "demo-2",
    title: "Secret underground weather machine discovered by whistleblower",
    prediction: "FAKE",
    confidence: 99.41,
    timestamp: "2026-09-30T09:32:00.000Z"
  },
  {
    id: "demo-3",
    title: "Central bank officials signal cautious approach to interest rates",
    prediction: "REAL",
    confidence: 96.84,
    timestamp: "2026-09-30T10:05:00.000Z"
  },
  {
    id: "demo-4",
    title: "Miracle kitchen herb found to instantly reverse aging overnight",
    prediction: "FAKE",
    confidence: 94.12,
    timestamp: "2026-09-30T10:20:00.000Z"
  },
  {
    id: "demo-5",
    title: "Global trade ministers meet to discuss supply chain resilience",
    prediction: "REAL",
    confidence: 91.65,
    timestamp: "2026-09-30T10:45:00.000Z"
  }
];

export default function AnalyticsPage() {
  const { settings } = useSettings();
  const { historyItems } = useAppData();
  const [useDemoPreview, setUseDemoPreview] = useState(false);
  const navigate = useNavigate();

  const hasRealHistory = historyItems.length > 0;
  const activeRecords = hasRealHistory
    ? historyItems
    : useDemoPreview
    ? DEMO_SAMPLE_RECORDS
    : [];

  const stats = useMemo(() => {
    const total = activeRecords.length;
    if (total === 0) {
      return {
        total: 0,
        realCount: 0,
        fakeCount: 0,
        realPct: "0.0",
        fakePct: "0.0",
        avgConf: "0.0",
        buckets: [],
        timeline: []
      };
    }

    const realCount = activeRecords.filter(
      (i) => i.prediction === "REAL"
    ).length;
    const fakeCount = activeRecords.filter(
      (i) => i.prediction === "FAKE"
    ).length;
    const sumConf = activeRecords.reduce(
      (acc, item) => acc + (Number(item.confidence) || 0),
      0
    );
    const avgConf = (sumConf / total).toFixed(1);
    const realPct = ((realCount / total) * 100).toFixed(1);
    const fakePct = ((fakeCount / total) * 100).toFixed(1);

    const buckets = [
      { label: "95–100%", min: 95, max: 100.01, count: 0 },
      { label: "85–95%", min: 85, max: 95, count: 0 },
      { label: "70–85%", min: 70, max: 85, count: 0 },
      { label: "< 70%", min: 0, max: 70, count: 0 }
    ];

    activeRecords.forEach((item) => {
      const c = Number(item.confidence) || 0;
      for (const b of buckets) {
        if (c >= b.min && c < b.max) {
          b.count += 1;
          break;
        }
      }
    });

    const timeline = activeRecords.slice(0, 14).reverse();

    return {
      total,
      realCount,
      fakeCount,
      realPct,
      fakePct,
      avgConf,
      buckets,
      timeline
    };
  }, [activeRecords]);

  return (
    <div
      className={`page-container ${
        settings.animations ? "page-transition" : ""
      }`}
    >
      <section className="section-header section-header-row">
        <div>
          <div className="eyebrow-badge">STATISTICAL INSIGHTS</div>
          <h1 className="section-title">Analytics Dashboard</h1>
          <p className="section-subtitle">
            Visual breakdown of REAL vs FAKE classifications, confidence
            distributions, and prediction history over time.
          </p>
        </div>
        {!hasRealHistory && (
          <div className="section-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setUseDemoPreview((prev) => !prev)}
            >
              {useDemoPreview
                ? "Hide Sample Demo Preview"
                : "Preview with Sample Demo Data"}
            </button>
          </div>
        )}
      </section>

      {/* Clearly labeled Demo Banner if viewing sample data */}
      {!hasRealHistory && useDemoPreview && (
        <div className="card demo-analytics-banner" role="status">
          <span className="demo-badge">DEMO / SAMPLE DATA</span>
          <span>
            Showing clearly labeled sample data because your local prediction
            history is currently empty. Analyze any article in the{" "}
            <strong>Detector</strong> to replace this with your live analysis
            metrics.
          </span>
        </div>
      )}

      {activeRecords.length === 0 ? (
        <div className="card empty-state-card" id="analyticsEmptyState">
          <div className="empty-state-icon" aria-hidden="true">
            📊
          </div>
          <h3 className="empty-state-title">
            No prediction history data yet.
          </h3>
          <p className="empty-state-desc">
            Analyze news articles in the Detector to automatically populate live
            charts, or click <strong>Preview with Sample Demo Data</strong>{" "}
            above to inspect the dashboard layout.
          </p>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/detector")}
            >
              Analyze a News Article
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setUseDemoPreview(true)}
            >
              Load Labeled Demo Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="analytics-content" id="analyticsContent">
          {/* 4 KPI Stat Cards */}
          <div className="analytics-kpi-grid">
            <div className="card kpi-card">
              <span className="kpi-label">Total Articles Analyzed</span>
              <span className="kpi-value" id="statTotalCount">
                {stats.total}
              </span>
              <span className="kpi-sub">
                {hasRealHistory
                  ? "Stored in local history"
                  : "Sample demo dataset"}
              </span>
            </div>

            <div className="card kpi-card kpi-card-real">
              <span className="kpi-label">REAL Articles</span>
              <span className="kpi-value text-real" id="statRealCount">
                {stats.realCount}
              </span>
              <span className="kpi-sub" id="statRealSub">
                {stats.realPct}% of total
              </span>
            </div>

            <div className="card kpi-card kpi-card-fake">
              <span className="kpi-label">FAKE Articles</span>
              <span className="kpi-value text-fake" id="statFakeCount">
                {stats.fakeCount}
              </span>
              <span className="kpi-sub" id="statFakeSub">
                {stats.fakePct}% of total
              </span>
            </div>

            <div className="card kpi-card">
              <span className="kpi-label">Average Confidence</span>
              <span className="kpi-value" id="statAvgConfidence">
                {stats.avgConf}%
              </span>
              <span className="kpi-sub">Mean classifier probability</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="analytics-charts-grid">
            {/* Chart 1: REAL vs FAKE Distribution */}
            <div className="card chart-card">
              <h3 className="card-subtitle">REAL vs FAKE Distribution</h3>
              <div className="distribution-visual">
                <div className="dist-bar-stacked">
                  <div
                    className="dist-segment-fake"
                    style={{ width: `${stats.fakePct}%` }}
                    title={`FAKE: ${stats.fakePct}%`}
                  />
                  <div
                    className="dist-segment-real"
                    style={{ width: `${stats.realPct}%` }}
                    title={`REAL: ${stats.realPct}%`}
                  />
                </div>
                <div className="dist-legend">
                  <div className="dist-legend-item">
                    <span className="legend-dot real-dot" />
                    <span>
                      REAL:{" "}
                      <strong>
                        {stats.realCount} ({stats.realPct}%)
                      </strong>
                    </span>
                  </div>
                  <div className="dist-legend-item">
                    <span className="legend-dot fake-dot" />
                    <span>
                      FAKE:{" "}
                      <strong>
                        {stats.fakeCount} ({stats.fakePct}%)
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Confidence Distribution */}
            <div className="card chart-card">
              <h3 className="card-subtitle">Confidence Distribution</h3>
              <div className="bucket-bars">
                {stats.buckets.map((b) => {
                  const pct =
                    stats.total > 0
                      ? Math.round((b.count / stats.total) * 100)
                      : 0;
                  return (
                    <div key={b.label} className="bucket-row">
                      <span className="bucket-label">{b.label}</span>
                      <div className="bucket-track">
                        <div
                          className="bucket-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="bucket-count">{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 3: Prediction History Over Time */}
            <div className="card chart-card chart-card-wide">
              <h3 className="card-subtitle">Prediction History Over Time</h3>
              <div className="timeline-chart">
                {stats.timeline.map((item) => {
                  const conf = Math.max(
                    12,
                    Math.min(100, Number(item.confidence) || 50)
                  );
                  const barClass =
                    item.prediction === "REAL" ? "bar-real" : "bar-fake";
                  const d = new Date(item.timestamp);
                  const shortTime = d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  return (
                    <div
                      key={item.id}
                      className="timeline-col"
                      title={`${item.title || "Article"} — ${
                        item.prediction
                      } (${Number(item.confidence).toFixed(2)}%)`}
                    >
                      <div
                        className={`timeline-bar ${barClass}`}
                        style={{ height: `${conf}%` }}
                      />
                      <span className="timeline-label">{shortTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
