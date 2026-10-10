import "./BrandsMarquee.css";

export default function BrandsMarquee({ brands = [] }) {
  const defaultBrands = [
    "A24",
    "DHARMA",
    "YRF",
    "AMAZON MGM STUDIOS",
    "NETFLIX",
    "SONY PICTURES",
    "WARNER BROS.",
    "PARAMOUNT",
    "ZEE STUDIOS",
    "EXCEL ENTERTAINMENT",
  ];

  const displayBrands = brands.length > 0 ? brands : defaultBrands;

  return (
    <section
      className="brands-marquee-section"
      role="region"
      aria-label="Trusted production houses"
      tabIndex={0}
    >
      {/* Edge-to-Edge Masked Infinite Marquee */}
      <div className="brands-marquee-mask">
        <div className="brands-marquee-track">
          {/* Primary Brand Group */}
          <div className="brands-marquee-group">
            {displayBrands.map((brand, idx) => (
              <div key={`brand-1-${idx}`} className="brand-item">
                <span className="brand-name">{brand}</span>
                <span className="brand-separator" aria-hidden="true">✦</span>
              </div>
            ))}
          </div>

          {/* Duplicated Clone Group for Seamless Infinite Loop */}
          <div className="brands-marquee-group brands-marquee-group-clone" aria-hidden="true">
            {displayBrands.map((brand, idx) => (
              <div key={`brand-2-${idx}`} className="brand-item">
                <span className="brand-name">{brand}</span>
                <span className="brand-separator" aria-hidden="true">✦</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
