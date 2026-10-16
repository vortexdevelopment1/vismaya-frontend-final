/**
 * Formats a date string (e.g. "2026-10-25" or ISO timestamp) into "25 Oct 2026".
 * @param {string|Date} dateInput
 * @returns {string} e.g. "25 Oct 2026"
 */
export function formatDate(dateInput) {
  if (!dateInput) return "Open";
  try {
    const d = typeof dateInput === "string" && dateInput.includes("-") && !dateInput.includes("T")
      ? new Date(`${dateInput}T00:00:00`)
      : new Date(dateInput);

    if (isNaN(d.getTime())) return String(dateInput);

    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a date into a short string like "25 Oct".
 * @param {string|Date} dateInput 
 * @returns {string} e.g. "25 Oct"
 */
export function formatShortDate(dateInput) {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" && dateInput.includes("-") && !dateInput.includes("T")
      ? new Date(`${dateInput}T00:00:00`)
      : new Date(dateInput);

    if (isNaN(d.getTime())) return String(dateInput);

    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];

    return `${day} ${month}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns deadline countdown info for the top-right chip.
 * If 3 days or fewer remain: returns red-tinted alert chip info.
 * Otherwise: returns formatted date chip info.
 * @param {string|Date} deadlineInput 
 * @returns {{ isUrgent: boolean, label: string, shortText: string }}
 */
export function getDeadlineChipInfo(deadlineInput) {
  if (!deadlineInput) {
    return { isUrgent: false, label: "Open Call", shortText: "Open" };
  }

  try {
    const deadline = typeof deadlineInput === "string" && deadlineInput.includes("-") && !deadlineInput.includes("T")
      ? new Date(`${deadlineInput}T23:59:59`)
      : new Date(deadlineInput);

    if (isNaN(deadline.getTime())) {
      return { isUrgent: false, label: `Closes ${deadlineInput}`, shortText: String(deadlineInput) };
    }

    const now = new Date();
    // Normalize to date difference in milliseconds
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { isUrgent: true, label: "Closes today", shortText: "Today" };
    } else if (diffDays === 1) {
      return { isUrgent: true, label: "Closes tomorrow", shortText: "1 day" };
    } else if (diffDays <= 3) {
      return { isUrgent: true, label: `Closes in ${diffDays} days`, shortText: `${diffDays} days` };
    } else {
      const shortDate = formatShortDate(deadlineInput);
      return { isUrgent: false, label: `Closes ${shortDate}`, shortText: shortDate };
    }
  } catch {
    return { isUrgent: false, label: `Closes ${deadlineInput}`, shortText: String(deadlineInput) };
  }
}

/**
 * Shortens opportunity types for compact header chip display.
 * @param {string} type 
 * @returns {string}
 */
export function formatTypeShort(type) {
  if (!type) return "Opportunity";
  const map = {
    "Commercial / TVC": "Commercial",
    "OTT Series": "OTT Series",
    "Feature Film": "Feature Film",
    "Music Video": "Music Video",
    "Theatre": "Theatre",
    "Short Film": "Short Film",
    "Print / Editorial": "Print",
  };
  return map[type] || type;
}

/**
 * Parses remuneration text for clean display and full tooltip.
 * e.g. "₹1,50,000 lump sum (2 shoot days)" -> { display: "₹1,50,000 lump sum", full: "₹1,50,000 lump sum (2 shoot days)" }
 * @param {string} remuneration 
 * @returns {{ display: string, full: string }}
 */
export function formatRemunerationDisplay(remuneration) {
  if (!remuneration) {
    return { display: "Negotiable", full: "Remuneration negotiable upon casting" };
  }

  const full = remuneration.trim();
  // Strip parenthetical text or verbose suffix for display
  let display = full
    .replace(/\s*\([^)]*\)/g, "") // removes (2 shoot days), etc.
    .replace(/\s*\+\s*Travel.*$/i, "") // removes + Travel & Accommodation if too long
    .replace(/-/g, "–") // Use proper en-dash
    .trim();

  if (!display) display = full;

  return { display, full };
}
