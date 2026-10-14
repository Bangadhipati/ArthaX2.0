import React from "react";
import { Zap, Loader2, Server } from "lucide-react";

export default function SpiderLoadingAnimation({ status = "connecting", onConnect }) {
  const isConnecting = status === "connecting";

  // 8-spoke spider web geometry
  const radius = 64;
  const rings = [0.25, 0.5, 0.75, 1.0];
  const spokes = 8;
  const angles = Array.from({ length: spokes }, (_, i) => (i * 2 * Math.PI) / spokes);

  const getPolygonPoints = (scale) => {
    return angles
      .map((angle) => {
        const x = 100 + radius * scale * Math.cos(angle);
        const y = 100 + radius * scale * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="spider-loading-container">
      {/* Spider Web Radar Canvas */}
      <div className="spider-web-wrapper">
        <svg viewBox="0 0 200 200" className="spider-web-svg">
          <defs>
            <radialGradient id="spiderCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#5e5ce6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0a84ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="spiderSweep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffd60a" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background Ambient Radial Glow */}
          <circle cx="100" cy="100" r="76" fill="url(#spiderCoreGlow)" className="spider-pulse-core" />

          {/* Web Rings (Octagons) */}
          {rings.map((scale, idx) => (
            <polygon
              key={`ring-${idx}`}
              points={getPolygonPoints(scale)}
              fill="none"
              stroke="rgba(10, 132, 255, 0.28)"
              strokeWidth={idx === 3 ? 1.4 : 1}
              strokeDasharray={idx % 2 === 1 ? "4 3" : undefined}
              className="spider-ring"
            />
          ))}

          {/* Web Spokes (Radial lines from center) */}
          {angles.map((angle, idx) => {
            const x = 100 + radius * Math.cos(angle);
            const y = 100 + radius * Math.sin(angle);
            return (
              <line
                key={`spoke-${idx}`}
                x1="100"
                y1="100"
                x2={x.toFixed(1)}
                y2={y.toFixed(1)}
                stroke="rgba(10, 132, 255, 0.35)"
                strokeWidth="1"
              />
            );
          })}

          {/* Sweeping Radar Beam */}
          <g className="spider-radar-beam">
            <line
              x1="100"
              y1="100"
              x2="100"
              y2={100 - radius}
              stroke="url(#spiderSweep)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy={100 - radius} r="3" fill="#ffd60a" filter="drop-shadow(0 0 6px #ffd60a)" />
          </g>

          {/* Pulsating Spider Web Nodes */}
          {rings.map((scale, rIdx) =>
            angles.map((angle, aIdx) => {
              if ((rIdx + aIdx) % 2 === 1) return null;
              const x = 100 + radius * scale * Math.cos(angle);
              const y = 100 + radius * scale * Math.sin(angle);
              return (
                <circle
                  key={`node-${rIdx}-${aIdx}`}
                  cx={x.toFixed(1)}
                  cy={y.toFixed(1)}
                  r="2"
                  fill="#64d2ff"
                  className="spider-node"
                  style={{ animationDelay: `${(rIdx * 0.3 + aIdx * 0.15) % 2}s` }}
                />
              );
            })
          )}

          {/* Center Glowing Hub */}
          <circle cx="100" cy="100" r="7" fill="#0a84ff" filter="drop-shadow(0 0 10px #0a84ff)" />
          <circle cx="100" cy="100" r="3" fill="#ffffff" />
        </svg>
      </div>

      {/* Connection Meta & Dynamic Status */}
      <div className="spider-loading-meta">
        <div className="spider-status-badge">
          {isConnecting ? (
            <Loader2 size={13} className="spin-animation" style={{ color: "var(--apple-gold)" }} />
          ) : (
            <Server size={13} style={{ color: "var(--apple-cyan)" }} />
          )}
          <span>{isConnecting ? "Waking Up AI Cloud Instance..." : "AI Cloud Server Asleep"}</span>
        </div>

        <h3 className="spider-loading-title">
          {isConnecting ? "Auto-Detecting Live AI Server" : "Market Intelligence Ready to Connect"}
        </h3>
        <p className="spider-loading-desc">
          {isConnecting
            ? "Free tier instance is spinning up. The live chart and AI predictions will automatically stream in once online."
            : "Click 'Connect AI' at the top or below to wake up the server and stream real-time data."}
        </p>

        {!isConnecting && onConnect && (
          <button onClick={onConnect} className="apple-button apple-button-primary spider-connect-btn">
            <Zap size={14} />
            <span>Connect to AI Engine</span>
          </button>
        )}
      </div>
    </div>
  );
}
