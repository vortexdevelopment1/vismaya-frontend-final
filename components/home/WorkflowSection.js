import "./WorkflowSection.css";

export default function WorkflowSection({ steps }) {
  const defaultSteps = [
    {
      number: "01",
      title: "Organizations Submit Briefs",
      description:
        "Production houses create projects and submit comprehensive character briefs including sides, shoot dates, and verified compensation.",
    },
    {
      number: "02",
      title: "Vismaya Verifies & Publishes",
      description:
        "Our operations desk audits each casting call for authenticity, escrow guarantee, and industry compliance before opening live.",
    },
    {
      number: "03",
      title: "Talent Applies with Profile",
      description:
        "Verified artists review character sides and submit applications with KYC credentials, headshots, and encrypted self-tapes.",
    },
    {
      number: "04",
      title: "Screen, Shortlist & Audition",
      description:
        "Casting directors review talent pools, shortlist candidates, request digital or studio callbacks, and finalize casting selections.",
    },
  ];

  const displaySteps = steps && steps.length > 0 ? steps : defaultSteps;

  return (
    <section className="public-section workflow-section">
      <div className="public-container">
        <div className="workflow-header">
          <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
            <span>Verified Process</span>
          </div>
          <h2 className="workflow-heading">How Vismaya Works</h2>
          <p className="workflow-subtext">
            Our 4-step verified workflow ensures maximum transparency, authenticated production budgets, and legitimate callbacks.
          </p>
        </div>

        <div className="workflow-grid">
          {displaySteps.map((step) => (
            <div key={step.number} className="card-surface workflow-card">
              <span className="workflow-step-num">{step.number}</span>
              <h3 className="workflow-step-title">{step.title}</h3>
              <p className="workflow-step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
