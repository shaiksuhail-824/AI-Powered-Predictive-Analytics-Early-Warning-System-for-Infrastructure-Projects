'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { getStateStatistics, normalizeStateName } from '../../data/mockData';
import { useAppStore } from '../../store/appStore';
import { StateStats } from '../../types';
import { MousePointer2, Hand, ExternalLink, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../services/api';

export interface StateSummaryItem {
  stateName: string;
  totalProjects: number;
  highRiskProjects: number;
  criticalRiskProjects: number;
  delayedProjects: number;
  averageRiskScore: number;
  dominantRiskLevel: string;
}

export interface IndiaMapInteractiveProps {
  stateSummaries?: StateSummaryItem[];
}

const geoUrl = '/india-states.json';

export const getRiskColorHex = (score: number) => {
  if (score >= 75) return '#ef4444'; // Critical - Crimson Red
  if (score >= 50) return '#f97316'; // High - Vibrant Orange
  if (score >= 25) return '#eab308'; // Medium - Warm Amber/Yellow
  return '#22c55e'; // Low - Emerald Green
};

export const getRiskTextColor = (level: string) => {
  switch (level) {
    case 'CRITICAL':
      return 'text-red-600 dark:text-red-400';
    case 'HIGH':
      return 'text-orange-600 dark:text-orange-400';
    case 'MEDIUM':
      return 'text-amber-600 dark:text-amber-400';
    case 'LOW':
    default:
      return 'text-emerald-600 dark:text-emerald-400';
  }
};

export const getRiskDotColor = (level: string) => {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-600';
    case 'HIGH':
      return 'bg-orange-500';
    case 'MEDIUM':
      return 'bg-amber-500';
    case 'LOW':
    default:
      return 'bg-emerald-500';
  }
};

// Precise label coordinates for major states (center of state)
interface StateLabelConfig {
  name: string;
  shortName?: string;
  coordinates: [number, number]; // [lon, lat]
  dx?: number;
  dy?: number;
  isCallout?: boolean;
  calloutTarget?: [number, number]; // For small states/UTs
}

const STATE_LABELS: StateLabelConfig[] = [
  { name: 'Rajasthan', coordinates: [73.88, 26.63] },
  { name: 'Gujarat', coordinates: [71.33, 22.42], dx: -5 },
  { name: 'Maharashtra', coordinates: [76.78, 19.3] },
  { name: 'Madhya Pradesh', coordinates: [78.42, 23.6] },
  { name: 'Uttar Pradesh', coordinates: [80.86, 27.0] },
  { name: 'Bihar', coordinates: [85.81, 25.8] },
  { name: 'Jharkhand', coordinates: [85.65, 23.66] },
  { name: 'West Bengal', coordinates: [87.85, 23.8] },
  { name: 'Odisha', coordinates: [84.44, 20.3] },
  { name: 'Chhattisgarh', coordinates: [82.32, 21.1] },
  { name: 'Andhra Pradesh', coordinates: [80.3, 15.6] },
  { name: 'Telangana', coordinates: [79.1, 17.8] },
  { name: 'Karnataka', coordinates: [76.1, 14.8] },
  { name: 'Tamil Nadu', coordinates: [78.4, 11.1] },
  { name: 'Kerala', coordinates: [76.4, 10.3], dx: -6 },
  { name: 'Punjab', coordinates: [75.3, 31.0] },
  { name: 'Haryana', coordinates: [76.1, 29.1], dy: 5 },
  { name: 'Himachal Pradesh', coordinates: [77.3, 31.8], dy: -4 },
  { name: 'Uttarakhand', coordinates: [79.2, 30.1] },
  { name: 'Jammu and Kashmir', shortName: 'Jammu &\nKashmir', coordinates: [75.0, 33.6] },
  { name: 'Ladakh', coordinates: [77.4, 34.2] },
  { name: 'Assam', coordinates: [92.8, 26.1] },
  { name: 'Arunachal Pradesh', shortName: 'Arunachal\nPradesh', coordinates: [94.5, 28.1], dy: -4 },
  { name: 'Meghalaya', coordinates: [91.3, 25.4], dy: 8 },
  { name: 'Nagaland', coordinates: [94.3, 26.1] },
  { name: 'Manipur', coordinates: [93.9, 24.7] },
  { name: 'Mizoram', coordinates: [92.8, 23.2] },
  { name: 'Tripura', coordinates: [91.7, 23.7] },
  
  // Callouts for smaller states / Union Territories with leader lines
  { 
    name: 'Chandigarh', 
    coordinates: [79.5, 31.6], 
    isCallout: true, 
    calloutTarget: [76.78, 30.73] 
  },
  { 
    name: 'Delhi', 
    coordinates: [79.2, 28.4], 
    isCallout: true, 
    calloutTarget: [77.10, 28.64] 
  },
  { 
    name: 'Sikkim', 
    coordinates: [88.5, 29.2], 
    isCallout: true, 
    calloutTarget: [88.47, 27.60] 
  },
  { 
    name: 'Goa', 
    coordinates: [71.6, 15.35], 
    isCallout: true, 
    calloutTarget: [74.01, 15.35] 
  },
  { 
    name: 'Puducherry', 
    coordinates: [82.2, 11.94], 
    isCallout: true, 
    calloutTarget: [79.82, 11.94] 
  },
  { 
    name: 'Lakshadweep', 
    coordinates: [70.0, 10.8], 
    isCallout: true, 
    calloutTarget: [72.93, 10.2] 
  },
  { 
    name: 'Andaman and Nicobar Islands', 
    shortName: 'Andaman & Nicobar\nIslands',
    coordinates: [90.0, 12.0], 
    isCallout: true, 
    calloutTarget: [92.9, 11.7] 
  },
];

export function IndiaMapInteractive({ stateSummaries: propStateSummaries }: IndiaMapInteractiveProps = {}) {
  const [internalStateSummaries, setInternalStateSummaries] = useState<StateSummaryItem[]>([]);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipStats, setTooltipStats] = useState<StateStats | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { filters, setFilter } = useAppStore();

  useEffect(() => {
    if (!propStateSummaries || propStateSummaries.length === 0) {
      apiClient.getStates().then((res) => {
        if (res && res.length > 0) {
          setInternalStateSummaries(
            res.map((s) => ({
              stateName: s.stateName,
              totalProjects: s.totalProjects,
              highRiskProjects: s.highRiskProjects,
              criticalRiskProjects: s.criticalRiskProjects,
              delayedProjects: s.delayedProjects,
              averageRiskScore: s.averageRiskScore,
              dominantRiskLevel: s.dominantRiskLevel,
            }))
          );
        }
      }).catch(() => {
        // Fallback silently if offline; getStateStats will fall back gracefully
      });
    }
  }, [propStateSummaries]);

  const effectiveSummaries = useMemo(() => {
    return (propStateSummaries && propStateSummaries.length > 0)
      ? propStateSummaries
      : internalStateSummaries;
  }, [propStateSummaries, internalStateSummaries]);

  const apiStateMap = useMemo(() => {
    const map = new Map<string, StateSummaryItem>();
    effectiveSummaries.forEach((s) => {
      map.set(normalizeStateName(s.stateName).toLowerCase(), s);
    });
    return map;
  }, [effectiveSummaries]);

  const getStateStats = useCallback((rawName: string): StateStats => {
    const canonical = normalizeStateName(rawName);
    const apiItem = apiStateMap.get(canonical.toLowerCase());
    if (apiItem) {
      const domLevel = (apiItem.dominantRiskLevel || 'LOW').toUpperCase();
      const riskLevel: StateStats['riskLevel'] = 
        domLevel === 'CRITICAL' ? 'CRITICAL' :
        domLevel === 'HIGH' ? 'HIGH' :
        domLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW';

      return {
        stateName: apiItem.stateName,
        totalProjects: apiItem.totalProjects,
        highRiskProjects: apiItem.highRiskProjects,
        criticalRiskProjects: apiItem.criticalRiskProjects,
        costRiskProjects: Math.max(0, apiItem.highRiskProjects - apiItem.criticalRiskProjects),
        timeRiskProjects: apiItem.delayedProjects,
        sectorDistribution: [],
        averageRisk: Math.round(apiItem.averageRiskScore),
        riskLevel,
      };
    }
    return getStateStatistics(canonical);
  }, [apiStateMap]);

  const handleStateClick = (rawStateName: string) => {
    const canonical = normalizeStateName(rawStateName);
    if (filters.state === canonical) {
      setFilter('state', 'All');
    } else {
      setFilter('state', canonical);
    }
  };

  const handleMouseEnter = (rawStateName: string, event?: React.MouseEvent) => {
    const canonical = normalizeStateName(rawStateName);
    setHoveredState(canonical);
    const stats = getStateStats(canonical);
    setTooltipStats(stats);
    if (event) {
      const bounds = event.currentTarget.closest('svg')?.getBoundingClientRect();
      if (bounds) {
        setTooltipPos({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
    setTooltipStats(null);
    setTooltipPos(null);
  };

  // Determine active state for side panel: hovered state > selected state > default Maharashtra
  const activeSideState = useMemo(() => {
    if (hoveredState) return hoveredState;
    if (filters.state && filters.state !== 'All') return filters.state;
    return 'Maharashtra'; // Default showcase matching reference design
  }, [hoveredState, filters.state]);

  const activeSideStats: StateStats = useMemo(() => {
    return getStateStats(activeSideState);
  }, [activeSideState, getStateStats]);

  const isStateSelected = (rawStateName: string) => {
    if (!filters.state || filters.state === 'All') return false;
    return normalizeStateName(rawStateName) === normalizeStateName(filters.state);
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-slate-50 via-[#edf2f7] to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row">
      {/* Map Canvas Area */}
      <div className="flex-1 relative flex flex-col items-center justify-between p-4 sm:p-6 min-h-[580px] lg:min-h-[660px]">
        {/* Top Header & Risk Legend */}
        <div className="w-full flex flex-col sm:flex-row sm:items-start justify-between gap-4 z-10 pointer-events-auto">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              India Infrastructure Risk Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Click a state to explore project-level insights
            </p>
          </div>

          {/* Risk Legend Pill Container */}
          <div className="inline-flex items-center flex-wrap gap-3 sm:gap-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 self-start">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                Low Risk
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                Medium Risk
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                High Risk
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                Critical Risk
              </span>
            </div>
          </div>
        </div>

        {/* Interactive India Map SVG with 3D Relief Depth */}
        <div className="w-full flex-1 relative flex items-center justify-center -my-2">
          <ComposableMap
            width={800}
            height={700}
            projection="geoMercator"
            projectionConfig={{
              scale: 1210,
              center: [82.8, 21.8],
            }}
            viewBox="0 0 800 700"
            className="w-full h-full max-h-[600px] sm:max-h-[640px] select-none"
          >
            <defs>
              {/* 3D Drop Shadow Filter */}
              <filter id="relief-3d-shadow" x="-10%" y="-10%" width="130%" height="135%">
                <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.22" />
                <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
              </filter>
            </defs>

            <Geographies geography={geoUrl}>
              {({ geographies }) => (
                <>
                  {/* LAYER 1: 3D Relief Bottom Extrusion Shadow Layer */}
                  <g transform="translate(4, 9)" filter="url(#relief-3d-shadow)" opacity={0.65} pointerEvents="none">
                    {geographies.map((geo, i) => (
                      <Geography
                        key={`shadow-${geo.rsmKey || i}`}
                        geography={geo}
                        fill="#64748b"
                        stroke="#64748b"
                        strokeWidth={0.5}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </g>

                  {/* LAYER 2: 3D Relief Mid Extrusion Layer (Tactile Board Effect) */}
                  <g transform="translate(2, 4.5)" opacity={0.5} pointerEvents="none">
                    {geographies.map((geo, i) => (
                      <Geography
                        key={`depth-${geo.rsmKey || i}`}
                        geography={geo}
                        fill="#94a3b8"
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </g>

                  {/* LAYER 3: Interactive Front State Polygons */}
                  <g>
                    {geographies.map((geo, i) => {
                      const rawName = (geo.properties?.name || geo.properties?.ST_NM || '') as string;
                      const canonicalName = normalizeStateName(rawName);
                      const stats = getStateStats(canonicalName);
                      const hasProjects = stats.totalProjects > 0;
                      const selected = isStateSelected(canonicalName);
                      const hovered = hoveredState === canonicalName;

                      // Vibrant risk color assignment
                      const baseColor = hasProjects ? getRiskColorHex(stats.averageRisk) : '#cbd5e1';

                      return (
                        <Geography
                          key={geo.rsmKey || `state-${i}`}
                          geography={geo}
                          fill={baseColor}
                          stroke={selected ? '#0f172a' : hovered ? '#1e293b' : '#ffffff'}
                          strokeWidth={selected ? 2.4 : hovered ? 1.8 : 0.85}
                          className="transition-all duration-150 cursor-pointer outline-none hover:brightness-105 active:brightness-95"
                          onMouseEnter={(e) => handleMouseEnter(canonicalName, e)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleStateClick(canonicalName)}
                          style={{ outline: 'none' }}
                        />
                      );
                    })}
                  </g>

                  {/* LAYER 4: State Labels & Leader Lines */}
                  <g pointerEvents="none" className="select-none">
                    {STATE_LABELS.map((item) => {
                      const isHovered = hoveredState === item.name;
                      const isSelected = isStateSelected(item.name);

                      if (item.isCallout && item.calloutTarget) {
                        return (
                          <g key={`callout-${item.name}`} className="transition-opacity duration-150">
                            {/* Target Coordinate Dot */}
                            <Marker coordinates={item.calloutTarget}>
                              <circle r="2.5" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
                            </Marker>

                            {/* Pointer Leader Line */}
                            <Marker coordinates={item.calloutTarget}>
                              <line
                                x1="0"
                                y1="0"
                                x2={(item.coordinates[0] - item.calloutTarget[0]) * 18}
                                y2={(item.calloutTarget[1] - item.coordinates[1]) * 18}
                                stroke="#475569"
                                strokeWidth="0.85"
                                strokeDasharray="2 2"
                              />
                            </Marker>

                            {/* Callout Label */}
                            <Marker coordinates={item.coordinates}>
                              <text
                                textAnchor={item.coordinates[0] > 80 ? 'start' : 'end'}
                                alignmentBaseline="middle"
                                className={`text-[9px] font-bold tracking-tight ${
                                  isSelected || isHovered
                                    ? 'fill-blue-700 font-extrabold'
                                    : 'fill-slate-800 dark:fill-slate-100'
                                }`}
                                style={{
                                  paintOrder: 'stroke',
                                  stroke: '#ffffff',
                                  strokeWidth: '2.5px',
                                  strokeLinejoin: 'round',
                                }}
                              >
                                {item.shortName || item.name}
                              </text>
                            </Marker>
                          </g>
                        );
                      }

                      // Major State Centered Label
                      return (
                        <Marker key={`label-${item.name}`} coordinates={item.coordinates}>
                          <text
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            dx={item.dx || 0}
                            dy={item.dy || 0}
                            className={`text-[9px] sm:text-[9.5px] font-bold tracking-tight transition-transform duration-150 ${
                              isSelected || isHovered
                                ? 'fill-blue-900 font-black scale-105'
                                : 'fill-slate-900 dark:fill-slate-950'
                            }`}
                            style={{
                              paintOrder: 'stroke',
                              stroke: '#ffffff',
                              strokeWidth: '2.5px',
                              strokeLinejoin: 'round',
                              textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                            }}
                          >
                            {item.shortName ? (
                              item.shortName.split('\n').map((line, lineIdx) => (
                                <tspan key={lineIdx} x={item.dx || 0} dy={lineIdx === 0 ? '-0.3em' : '1em'}>
                                  {line}
                                </tspan>
                              ))
                            ) : (
                              item.name
                            )}
                          </text>
                        </Marker>
                      );
                    })}
                  </g>
                </>
              )}
            </Geographies>
          </ComposableMap>

          {/* Floating Hover Tooltip */}
          {hoveredState && tooltipStats && (
            <div
              className="absolute bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-xl rounded-xl border border-slate-200/90 dark:border-slate-700 w-60 pointer-events-none z-30 transition-all duration-150 ease-out"
              style={{
                left: tooltipPos ? `${Math.min(Math.max(tooltipPos.x + 12, 16), 460)}px` : '24px',
                top: tooltipPos ? `${Math.min(Math.max(tooltipPos.y - 40, 16), 480)}px` : '24px',
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{hoveredState}</h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${getRiskTextColor(
                    tooltipStats.riskLevel
                  )} bg-slate-100 dark:bg-slate-800`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${getRiskDotColor(tooltipStats.riskLevel)}`}></span>
                  {tooltipStats.riskLevel}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Total Projects:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{tooltipStats.totalProjects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">High / Critical:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {tooltipStats.highRiskProjects + tooltipStats.criticalRiskProjects}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Average Risk Score:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{tooltipStats.averageRisk} / 100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right-Hand "Map Interaction" Guide Panel */}
      <div className="w-full lg:w-[320px] xl:w-[340px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-sm z-20">
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              Map Interaction
            </h3>
            {filters.state && filters.state !== 'All' && (
              <button
                onClick={() => setFilter('state', 'All')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md transition-colors"
                title="Reset to All States"
              >
                <RotateCcw size={12} /> Clear Filter
              </button>
            )}
          </div>

          {/* Interaction Instruction Rows */}
          <div className="space-y-4">
            <div className="flex gap-3.5 items-start group">
              <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-2 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <MousePointer2 size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Hover over a state</h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  View quick stats in tooltip
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start group">
              <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Hand size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Click a state</h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Open state view with projects
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Active State / Example Tooltip Card */}
          <div className="mt-6 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-xl p-4 relative shadow-sm">
            <div className="absolute -top-2.5 left-3.5 bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
              <span>ⓘ</span>{' '}
              {filters.state && filters.state !== 'All'
                ? 'Selected State'
                : hoveredState
                ? 'Inspecting State'
                : 'Example Tooltip'}
            </div>

            <div className="mt-1 mb-2.5 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                {activeSideStats.stateName}
              </h4>
              {filters.state === activeSideStats.stateName && (
                <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Projects:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeSideStats.totalProjects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">High Risk:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeSideStats.highRiskProjects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Average Risk Score:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeSideStats.averageRisk}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Risk Level:</span>
                <span
                  className={`font-extrabold flex items-center gap-1.5 ${getRiskTextColor(activeSideStats.riskLevel)}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${getRiskDotColor(activeSideStats.riskLevel)}`}></span>
                  {activeSideStats.riskLevel.charAt(0) + activeSideStats.riskLevel.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Link to Full State Report */}
        <div className="mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <Link
            href={`/admin/state/${activeSideStats.stateName.toLowerCase().replace(/\s+/g, '-')}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-mospi-600 hover:bg-mospi-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:shadow"
          >
            <span>Explore {activeSideStats.stateName} Insights</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
