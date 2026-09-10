'use client';

import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getStateStatistics } from '../../data/mockData';
import { useAppStore } from '../../store/appStore';
import { MousePointer2, Hand } from 'lucide-react';

const geoUrl = "/india-states.json";

const getRiskLevel = (score: number) => {
  if (score >= 75) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};

const getRiskColorHex = (score: number) => {
  if (score >= 75) return "#ef4444"; // red-500
  if (score >= 60) return "#f97316"; // orange-500
  if (score >= 40) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
};

const getRiskTextColor = (level: string) => {
  if (level === "CRITICAL") return "text-red-600";
  if (level === "HIGH") return "text-orange-600";
  if (level === "MEDIUM") return "text-amber-500";
  return "text-emerald-500";
};

export function IndiaMapInteractive() {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipStats, setTooltipStats] = useState<any>(null);
  const { filters, setFilter } = useAppStore();

  const handleStateClick = (stateName: string) => {
    if (filters.state === stateName) {
      setFilter('state', 'All');
    } else {
      setFilter('state', stateName);
    }
  };

  return (
    <div className="relative w-full h-[600px] flex bg-[#e8ecef] rounded-lg overflow-hidden border border-slate-200">
      
      {/* Map Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 overflow-hidden">
        
        {/* Top Header & Legend */}
        <div className="absolute top-6 left-8 text-left z-10 pointer-events-none">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">India Infrastructure Risk Overview</h2>
          <p className="text-slate-500 text-sm mt-1 mb-4">Click a state to explore project-level insights</p>
          
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-slate-700">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
              <span className="text-xs font-medium text-slate-700">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-orange-500"></div>
              <span className="text-xs font-medium text-slate-700">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
              <span className="text-xs font-medium text-slate-700">Critical Risk</span>
            </div>
          </div>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1100,
            center: [82.5, 22.5]
          }}
          className="w-full h-[120%] -ml-16 drop-shadow-xl"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo, i) => {
                const stateName = geo.properties.name || geo.properties.ST_NM;
                const stats = getStateStatistics(stateName || "");
                const hasProjects = stats.totalProjects > 0;
                const isSelected = filters.state === stateName;
                const fillColor = hasProjects ? getRiskColorHex(stats.averageRisk) : "#d1d5db";

                return (
                  <Geography
                    key={geo.rsmKey || `geo-${i}`}
                    geography={geo}
                    onMouseEnter={() => {
                      if (stateName) {
                        setTooltipContent(stateName);
                        setTooltipStats(stats);
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                      setTooltipStats(null);
                    }}
                    onClick={() => {
                      if (stateName) handleStateClick(stateName);
                    }}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: isSelected ? "#000000" : "#ffffff",
                        strokeWidth: isSelected ? 2 : 0.75,
                        outline: "none",
                        cursor: "pointer",
                      },
                      hover: {
                        fill: hasProjects ? getRiskColorHex(stats.averageRisk) : "#e5e7eb",
                        stroke: "#000000",
                        strokeWidth: 2,
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        opacity: 0.9
                      },
                      pressed: {
                        fill: fillColor,
                        outline: "none",
                        opacity: 0.8
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Dynamic Tooltip */}
        {tooltipContent && (
          <div className="absolute bottom-8 left-8 bg-white p-4 shadow-xl rounded-xl border border-slate-200 w-64 pointer-events-none z-50 transition-all duration-200 ease-in-out">
            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">{tooltipContent}</h4>
            {tooltipStats && tooltipStats.totalProjects > 0 ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Projects:</span>
                  <span className="font-bold text-slate-700">{tooltipStats.totalProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">High Risk:</span>
                  <span className="font-bold text-slate-700">{tooltipStats.highRiskProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Average Risk Score:</span>
                  <span className="font-bold text-slate-700">{tooltipStats.averageRisk}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="text-slate-500">Risk Level:</span>
                  <span className={`font-bold flex items-center gap-1.5 ${getRiskTextColor(getRiskLevel(tooltipStats.averageRisk))}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                    {getRiskLevel(tooltipStats.averageRisk)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Projects:</span>
                  <span className="font-bold text-slate-700">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-slate-400">No Data</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Interaction Guide Panel */}
      <div className="w-[320px] bg-white/70 backdrop-blur-md border-l border-white/60 p-6 flex flex-col justify-center shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          Map Interaction
        </h3>
        
        <div className="space-y-6">
          <div className="flex gap-4 items-start group">
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600 mt-1 shadow-sm group-hover:scale-105 transition-transform">
              <MousePointer2 size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Hover over a state</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">View quick stats and risk level in the dynamic tooltip</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start group">
            <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-indigo-600 mt-1 shadow-sm group-hover:scale-105 transition-transform">
              <Hand size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Click a state</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Open state view and filter the project list below</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-50/80 border border-slate-200 rounded-xl p-4 relative shadow-sm">
          <div className="absolute -top-3 left-4 bg-white px-2.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
            <span>ⓘ</span> Example Tooltip
          </div>
          <h4 className="font-bold text-slate-800 mb-2 mt-2 border-b border-slate-200 pb-1.5">Maharashtra</h4>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Projects:</span>
              <span className="font-bold text-slate-700">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">High Risk:</span>
              <span className="font-bold text-slate-700">9</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Average Risk Score:</span>
              <span className="font-bold text-slate-700">76</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-500">Risk Level:</span>
              <span className="font-bold text-red-600 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
                Critical
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
