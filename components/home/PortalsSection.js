import Link from "next/link";
import { UserCheck, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import "./PortalsSection.css";

export default function PortalsSection({ portals }) {
  const defaultPortals = [
    {
      role: "talent",
      title: "Talent Portal",
      subtitle: "For Actors, Models & Artists",
      description:
        "Build a verified industry profile, apply to live casting calls, submit self-tapes securely, and track application milestones in real-time.",
      route: "/talent/dashboard",
      icon: UserCheck,
      badge: "Verified Artist Hub",
    },
    {
      role: "organization",
      title: "Organization Portal",
      subtitle: "For Studios & Casting Directors",
      description:
        "Create projects, post detailed casting briefs for Vismaya compliance review, screen verified talent comp-cards, and manage callbacks.",
      route: "/recruiter/dashboard",
      icon: Building2,
      badge: "Production Console",
    },
    {
      role: "admin",
      title: "Vismaya Desk",
      subtitle: "Review & Operations Console",
      description:
        "Review and authenticate opportunity briefs, moderate self-tape submissions, relay audition sides, and enforce platform standards.",
      route: "/admin/dashboard",
      icon: ShieldCheck,
      badge: "Moderation Desk",
    },
  ];

  const displayPortals = portals && portals.length > 0 ? portals : defaultPortals;

  return (
    <section className="public-section portals-section">
      <div className="public-container">
        <div className="portals-header-wrap">
          <div className="eyebrow" style={{ marginBottom: "12px" }}>
            <span>Unified Ecosystem</span>
          </div>
          <h2 className="portals-heading">Select Your Portal</h2>
          <p className="portals-subtext">
            Seamlessly switch between dedicated workstations tailored for talent discovery, organization recruitment, and Vismaya compliance desk.
          </p>
        </div>

        <div className="portals-grid">
          {displayPortals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div key={portal.role} className="card-surface portal-card">
                <div className="portal-card-top">
                  <div className="portal-badge-row">
                    <div className="portal-icon-box">
                      <Icon size={24} />
                    </div>

                    <span className="portal-chip">
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="portal-title">{portal.title}</h3>
                    <span className="portal-subtitle">{portal.subtitle}</span>
                    <p className="portal-description">{portal.description}</p>
                  </div>
                </div>

                <Link
                  href={portal.route}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <span>Enter {portal.title}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
