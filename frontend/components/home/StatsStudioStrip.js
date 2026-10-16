import "./StatsStudioStrip.css";

export default function StatsStudioStrip() {
  return (
    <section className="stats-studio-section">
      <div className="public-container">
        {/* 1. Stats Glass Strip */}
        <div className="glass stats-glass-strip">
          <div className="stats-item">
            <b className="stats-number stats-number-gold">1,200+</b>
            <span className="stats-label">Verified Artists</span>
          </div>

          <div className="stats-item">
            <b className="stats-number stats-number-white">300+</b>
            <span className="stats-label">Production Studios</span>
          </div>

          <div className="stats-item">
            <b className="stats-number stats-number-gold">850+</b>
            <span className="stats-label">Auditions Posted</span>
          </div>

          <div className="stats-item">
            <b className="stats-number stats-number-green">100%</b>
            <span className="stats-label">Vismaya Verified</span>
          </div>
        </div>

        {/* 2. Centered Label below Stats Card (inside Container) */}
        <div className="stats-trusted-label-wrap">
          <span className="stats-trusted-label">
            TRUSTED BY LEADING PRODUCTION HOUSES
          </span>
        </div>
      </div>
    </section>
  );
}
