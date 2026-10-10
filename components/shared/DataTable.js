"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = "Search records...",
  title,
  actions,
  pageSize = 5,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching your query.",
  renderMobileCard,
  minWidth = "1100px",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      typeof val === "string" || typeof val === "number"
        ? String(val).toLowerCase().includes(searchTerm.toLowerCase())
        : false
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.07)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "16px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* Table Toolbar Header */}
      {(title || searchable || actions) && (
        <div
          className="data-table-toolbar"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          {title && (
            <h3
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "18px",
                lineHeight: "24px",
                fontWeight: "700",
                color: "#eceaf5",
                margin: 0,
              }}
            >
              {title}
            </h3>
          )}

          <div
            className="data-table-actions-container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginLeft: "auto",
            }}
          >
            {searchable && (
              <div
                className="data-table-search-wrap"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    color: "#a3acc2",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="data-table-search-input"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.055)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "10px",
                    padding: "0 12px 0 34px",
                    fontSize: "13px",
                    color: "#eceaf5",
                    outline: "none",
                    width: "240px",
                    height: "38px",
                    minHeight: "38px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Table Content */}
      {filteredData.length === 0 ? (
        <div style={{ padding: "32px 20px" }}>
          <EmptyState
            title={emptyTitle}
            description={searchTerm ? `No results for "${searchTerm}"` : emptyDescription}
          />
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table (>= 768px) */}
          <div
            className="dt-desktop-view"
            style={{
              width: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "14px",
                tableLayout: "auto",
                minWidth: minWidth,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
                    backgroundColor: "#0f1626",
                  }}
                >
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        backgroundColor: "#0f1626",
                        padding: "12px 18px",
                        fontWeight: "700",
                        color: "var(--gold)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.10em",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
                        whiteSpace: "nowrap",
                        minWidth: col.minWidth || "auto",
                        width: col.width || "auto",
                        verticalAlign: "middle",
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={{
                      height: "52px",
                      borderBottom: idx === currentRows.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
                      transition: "background-color var(--transition)",
                    }}
                    className="table-row-hover"
                  >
                    {columns.map((col) => {
                      const minW = col.minWidth || "auto";

                      if (col.render) {
                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: "10px 18px",
                              fontSize: "14px",
                              color: "#eceaf5",
                              verticalAlign: "middle",
                              minWidth: minW,
                            }}
                          >
                            {col.render(row[col.key], row)}
                          </td>
                        );
                      }

                      const value = row[col.key];

                      if (col.key === "status" || col.type === "badge") {
                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: "10px 18px",
                              fontSize: "14px",
                              verticalAlign: "middle",
                              minWidth: minW,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <StatusBadge status={value} size="xs" />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: "10px 18px",
                            color: "#eceaf5",
                            fontSize: "14px",
                            fontWeight: col.primary ? "600" : "normal",
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                            minWidth: minW,
                          }}
                        >
                          {value !== undefined && value !== null ? String(value) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< 768px) */}
          <div
            className="dt-mobile-view"
            style={{
              display: "none",
              flexDirection: "column",
              gap: "12px",
              padding: "14px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {currentRows.map((row, idx) => {
              if (renderMobileCard) {
                return (
                  <div key={row.id || idx} style={{ width: "100%" }}>
                    {renderMobileCard(row, idx)}
                  </div>
                );
              }

              return (
                <div
                  key={row.id || idx}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {columns.map((col) => {
                    if (col.key === "actions") {
                      return (
                        <div key={col.key} style={{ marginTop: "4px" }}>
                          {col.render ? col.render(row[col.key], row) : null}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={col.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          gap: "8px",
                        }}
                      >
                        <span style={{ color: "#7e89a3", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                          {col.label}
                        </span>
                        <div style={{ textAlign: "right" }}>
                          {col.render ? col.render(row[col.key], row) : (
                            <span style={{ color: "#eceaf5" }}>{String(row[col.key] ?? "—")}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {filteredData.length > pageSize && (
        <div
          className="data-table-pagination"
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            color: "#a3acc2",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: currentPage === 1 ? "#7e89a3" : "#eceaf5",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition)",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: "600", fontSize: "13px", color: "#eceaf5" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: currentPage === totalPages ? "#7e89a3" : "#eceaf5",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition)",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.04) !important;
        }
        @media (max-width: 768px) {
          .dt-desktop-view {
            display: none !important;
          }
          .dt-mobile-view {
            display: flex !important;
          }
          .data-table-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .data-table-actions-container {
            width: 100% !important;
            margin-left: 0 !important;
          }
          .data-table-search-wrap {
            width: 100% !important;
          }
          .data-table-search-input {
            width: 100% !important;
          }
          .data-table-pagination {
            flex-direction: column !important;
            align-items: center !important;
            gap: 10px !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
