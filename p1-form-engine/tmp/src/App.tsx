import { useState, useCallback, useRef } from "react";
import { DynamicForm } from "@cliver/form-engine";
import type { FieldEvent } from "@cliver/form-engine";
import { allSchemas } from "./schemas.js";

export function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState<FieldEvent[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const handleFieldComplete = useCallback((event: FieldEvent) => {
    setEvents((prev) => [...prev, event]);
    // Auto-scroll the event log
    requestAnimationFrame(() => {
      logRef.current?.scrollTo(0, logRef.current.scrollHeight);
    });
  }, []);

  const clearEvents = () => setEvents([]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>P1 Form Engine Demo</h1>
        <p style={styles.subtitle}>
          Each tab loads a different JSON schema. Fill in fields and watch
          events appear in the log below.
        </p>
      </header>

      {/* Tab bar */}
      <nav style={styles.tabBar}>
        {allSchemas.map((s, i) => (
          <button
            key={s.schema.id}
            onClick={() => {
              setActiveTab(i);
              clearEvents();
            }}
            style={{
              ...styles.tab,
              ...(i === activeTab ? styles.tabActive : {}),
            }}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div style={styles.main}>
        {/* Form panel */}
        <div style={styles.formPanel}>
          <DynamicForm
            key={allSchemas[activeTab].schema.id}
            schema={allSchemas[activeTab].schema}
            onFieldComplete={handleFieldComplete}
            debounceMs={300}
          />
        </div>

        {/* Event log panel */}
        <div style={styles.logPanel}>
          <div style={styles.logHeader}>
            <h2 style={styles.logTitle}>Field events</h2>
            <button onClick={clearEvents} style={styles.clearBtn}>
              Clear
            </button>
          </div>
          <div ref={logRef} style={styles.logScroll}>
            {events.length === 0 && (
              <p style={styles.emptyLog}>
                No events yet. Fill in a field and tab out (or select an
                option) to emit a field_completed event.
              </p>
            )}
            {events.map((e, i) => (
              <div key={i} style={styles.eventCard}>
                <div style={styles.eventType}>{e.type}</div>
                <div style={styles.eventField}>
                  <span style={styles.eventLabel}>field:</span> {e.fieldId}
                </div>
                <div style={styles.eventValue}>
                  <span style={styles.eventLabel}>value:</span>{" "}
                  <code>{JSON.stringify(e.fieldValue)}</code>
                </div>
                <div style={styles.eventTime}>
                  <span style={styles.eventLabel}>time:</span>{" "}
                  {new Date(e.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px",
    color: "#1a1a2e",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    margin: 0,
  },
  tabBar: {
    display: "flex",
    gap: 0,
    borderBottom: "2px solid #e0e0e0",
    marginBottom: 20,
  },
  tab: {
    padding: "10px 20px",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#666",
    marginBottom: -2,
    transition: "color 0.15s, border-color 0.15s",
  },
  tabActive: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
    fontWeight: 600,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 24,
    alignItems: "start",
  },
  formPanel: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    padding: 24,
  },
  logPanel: {
    background: "#f8f9fa",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    position: "sticky",
    top: 20,
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e0e0e0",
    background: "#fff",
  },
  logTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
  },
  clearBtn: {
    fontSize: 12,
    padding: "4px 12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#fff",
    cursor: "pointer",
    color: "#666",
  },
  logScroll: {
    maxHeight: 500,
    overflow: "auto",
    padding: 12,
  },
  emptyLog: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px 0",
  },
  eventCard: {
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: 6,
    padding: "10px 12px",
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 1.5,
  },
  eventType: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: "#2563eb",
    letterSpacing: "0.05em",
    marginBottom: 4,
  },
  eventField: {
    fontWeight: 500,
  },
  eventValue: {},
  eventTime: {
    color: "#999",
    fontSize: 11,
  },
  eventLabel: {
    color: "#888",
  },
};

/* --- Global form styles (injected once) --- */
const styleTag = document.createElement("style");
styleTag.textContent = `
  #root form h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  #root form > div,
  #root form > fieldset {
    margin-bottom: 16px;
  }
  #root form label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
    color: #333;
  }
  #root form input[type="text"],
  #root form input[type="email"],
  #root form input[type="number"],
  #root form input[type="date"],
  #root form textarea,
  #root form select {
    display: block;
    width: 100%;
    padding: 8px 10px;
    font-size: 14px;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
    font-family: inherit;
  }
  #root form input:focus,
  #root form textarea:focus,
  #root form select:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  #root form input[aria-invalid="true"],
  #root form textarea[aria-invalid="true"],
  #root form select[aria-invalid="true"] {
    border-color: #dc2626;
  }
  #root form input[aria-invalid="true"]:focus,
  #root form textarea[aria-invalid="true"]:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  #root form textarea {
    min-height: 80px;
    resize: vertical;
  }
  #root form p {
    font-size: 12px;
    color: #888;
    margin: 4px 0 0 0;
  }
  #root form p[role="alert"] {
    color: #dc2626;
    font-weight: 500;
  }
  #root form fieldset {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 12px;
  }
  #root form fieldset legend {
    font-size: 13px;
    font-weight: 500;
    padding: 0 6px;
    color: #333;
  }
  #root form fieldset label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-weight: 400;
    cursor: pointer;
  }
  #root form input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
  }
  #root form input[type="file"] {
    font-size: 13px;
    padding: 6px 0;
  }
  body {
    margin: 0;
    background: #f5f5f7;
  }
`;
document.head.appendChild(styleTag);
