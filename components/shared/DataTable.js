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
  minWidth = "960px",
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
        backgroundColor: "#FFFFFF",
        border: "1px solid #E8E2D4",
        borderRadius: "16px",
        boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Table Toolbar Header */}
      {(title || searchable || actions) && (
        <div
          className="data-table-toolbar"
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            backgroundColor: "#FFFFFF",
          }}
        >
          {title && (
            <h3
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "20px",
                lineHeight: "26px",
                fontWeight: "600",
                color: "#2B2D2A",
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
              gap: "12px",
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
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    color: "#5A584F",
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
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D9D2C0",
                    borderRadius: "10px",
                    padding: "0 14px 0 38px",
                    fontSize: "14px",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                    color: "#2B2D2A",
                    outline: "none",
                    width: "260px",
                    height: "44px",
                    minHeight: "44px",
                    boxSizing: "border-box",
                    transition: "border-color 0.16s ease, box-shadow 0.16s ease",
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
        <div style={{ padding: "40px 24px" }}>
          <EmptyState
            title={emptyTitle}
            description={searchTerm ? `No results for "${searchTerm}"` : emptyDescription}
          />
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table (>= 768px) with horizontal scroll wrapper */}
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
                    borderBottom: "1px solid #E8E2D4",
                    backgroundColor: "#F3EFE6",
                  }}
                >
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        backgroundColor: "#F3EFE6",
                        padding: "14px 20px",
                        fontWeight: "700",
                        color: "#5A584F",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        borderBottom: "1px solid #E8E2D4",
                        whiteSpace: "nowrap",
                        minWidth: col.minWidth || "auto",
                        width: col.width || "auto",
                        verticalAlign: "middle",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
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
                      height: "56px",
                      borderBottom: idx === currentRows.length - 1 ? "none" : "1px solid #E8E2D4",
                      transition: "background-color 0.16s ease",
                      backgroundColor: "#FFFFFF",
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
                              padding: "14px 20px",
                              fontSize: "14px",
                              color: "#2B2D2A",
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
                              padding: "14px 20px",
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
                            padding: "14px 20px",
                            color: col.primary ? "#2B2D2A" : "#5A584F",
                            fontSize: col.primary ? "15px" : "14px",
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
              padding: "16px",
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
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    width: "100%",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 6px rgba(43, 45, 42, 0.04)",
                  }}
                >
                  {columns.map((col) => {
                    if (col.key === "actions") {
                      return (
                        <div key={col.key} style={{ marginTop: "6px" }}>
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
                        <span style={{ color: "#5A584F", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {col.label}
                        </span>
                        <div style={{ textAlign: "right" }}>
                          {col.render ? col.render(row[col.key], row) : (
                            <span style={{ color: "#2B2D2A", fontWeight: col.primary ? "600" : "normal" }}>{String(row[col.key] ?? "—")}</span>
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
            padding: "14px 24px",
            borderTop: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            color: "#5A584F",
            backgroundColor: "#FAF9F7",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                color: currentPage === 1 ? "#A39E93" : "#2B2D2A",
                backgroundColor: "#FFFFFF",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.16s ease",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: "600", fontSize: "13px", color: "#2B2D2A" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                color: currentPage === totalPages ? "#A39E93" : "#2B2D2A",
                backgroundColor: "#FFFFFF",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.16s ease",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .table-row-hover:hover {
          background-color: #FAF9F7 !important;
        }
        .data-table-search-input:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
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
