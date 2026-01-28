
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrafficNode, TrafficLink } from '../types';

const INITIAL_NODES: TrafficNode[] = [
  { id: '1', x: 100, y: 100, label: 'EXIT', congestion: 0.8 },
  { id: '2', x: 300, y: 100, label: 'KPRIET', congestion: 0.2 },
  { id: '3', x: 500, y: 200, label: 'CANTEEN', congestion: 0.4 },
  { id: '4', x: 100, y: 300, label: 'KPRCAS', congestion: 0.6 },
  { id: '5', x: 300, y: 400, label: 'ZIG - ZAG', congestion: 0.9 },
  { id: '6', x: 500, y: 500, label: 'ENTERANCE', congestion: 0.3 },
];

const INITIAL_LINKS: TrafficLink[] = [
  { id: 'l1', source: '1', target: '2', speed: 60, status: 'normal' },
  { id: 'l2', source: '2', target: '3', speed: 80, status: 'normal' },
  { id: 'l3', source: '1', target: '4', speed: 30, status: 'slow' },
  { id: 'l4', source: '4', target: '5', speed: 20, status: 'congested' },
  { id: 'l5', source: '2', target: '5', speed: 45, status: 'normal' },
  { id: 'l6', source: '3', target: '6', speed: 90, status: 'normal' },
  { id: 'l7', source: '5', target: '6', speed: 15, status: 'congested' },
];

const TrafficMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [links, setLinks] = useState(INITIAL_LINKS);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    // Draw links
    svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", d => nodes.find(n => n.id === d.source)?.x || 0)
      .attr("y1", d => nodes.find(n => n.id === d.source)?.y || 0)
      .attr("x2", d => nodes.find(n => n.id === d.target)?.x || 0)
      .attr("y2", d => nodes.find(n => n.id === d.target)?.y || 0)
      .attr("stroke", d => {
        if (d.status === 'congested') return '#ef4444';
        if (d.status === 'slow') return '#f59e0b';
        return '#10b981';
      })
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round")
      .attr("class", "cursor-pointer hover:opacity-80 transition-opacity")
      .append("title")
      .text(d => `Speed: ${d.speed} km/h - Status: ${d.status}`);

    // Draw nodes
    const nodeGroups = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
      .attr("r", 15)
      .attr("fill", d => {
        if (d.congestion > 0.7) return '#991b1b';
        if (d.congestion > 0.4) return '#92400e';
        return '#065f46';
      })
      .attr("stroke", "#f8fafc")
      .attr("stroke-width", 2);

    nodeGroups.append("text")
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text(d => d.label);

    // Animated particles to simulate traffic flow
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source)!;
      const target = nodes.find(n => n.id === link.target)!;
      const count = Math.floor(link.speed / 10);
      
      for (let i = 0; i < count; i++) {
        svg.append("circle")
          .attr("r", 3)
          .attr("fill", "#fff")
          .attr("opacity", 0.8)
          .transition()
          .duration(5000 / (link.speed / 20))
          .delay(i * 1000)
          .on("start", function repeat() {
            d3.select(this)
              .attr("cx", source.x)
              .attr("cy", source.y)
              .transition()
              .duration(5000 / (link.speed / 20))
              .attr("cx", target.x)
              .attr("cy", target.y)
              .on("end", repeat);
          });
      }
    });

  }, [nodes, links]);

  return (
    <div className="relative w-full h-[600px] bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden shadow-inner">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur p-4 rounded-lg border border-slate-600">
        <h3 className="text-sm font-semibold mb-2">Live Map Legend</h3>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span>Fluent Flow (60+ km/h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
            <span>Slow Traffic (30-60 km/h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span>Congested (&lt; 30 km/h)</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
};

export default TrafficMap;
