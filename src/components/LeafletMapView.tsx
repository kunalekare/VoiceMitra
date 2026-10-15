import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Worker } from '../types';
import { computeRankingBreakdown } from '../utils/ranking';

interface LeafletMapViewProps {
  workers: Worker[];
  targetSkill: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  selectedCity: string;
  onSelectWorker: (worker: Worker) => void;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  workers,
  targetSkill,
  centerLat,
  centerLng,
  radiusKm,
  selectedCity,
  onSelectWorker
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center, circle, and worker markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([centerLat, centerLng], radiusKm > 30 ? 10 : 12);

    // Update radius circle
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
    }

    circleLayerRef.current = L.circle([centerLat, centerLng], {
      radius: radiusKm * 1000,
      color: '#ea580c',
      fillColor: '#f97316',
      fillOpacity: 0.12,
      weight: 2
    }).addTo(map);

    // Update markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      // User location marker
      const userIcon = L.divIcon({
        className: 'user-pin',
        html: `
          <div style="
            background: #0d9488;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-size: 14px;
            font-weight: bold;
          ">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([centerLat, centerLng], { icon: userIcon })
        .bindPopup(`<b>Your Search Location</b><br/>${selectedCity} (${radiusKm} km radius)`)
        .addTo(markersLayerRef.current);

      // Worker markers
      workers.forEach((worker) => {
        const breakdown = computeRankingBreakdown(worker, targetSkill, centerLat, centerLng);
        const isClose = breakdown.distanceKm <= radiusKm;

        const pinColor = isClose ? (worker.isAvailable ? '#ea580c' : '#64748b') : '#94a3b8';
        const badgeEmoji =
          worker.primarySkill.includes('Electric') ? '⚡' :
          worker.primarySkill.includes('Plumb') ? '💧' :
          worker.primarySkill.includes('Mason') ? '🧱' :
          worker.primarySkill.includes('Paint') ? '🎨' :
          worker.primarySkill.includes('Carpen') ? '🪚' :
          worker.primarySkill.includes('Driver') ? '🚗' : '🛠️';

        const workerIcon = L.divIcon({
          className: 'worker-pin',
          html: `
            <div style="
              background: ${pinColor};
              color: white;
              padding: 4px 8px;
              border-radius: 16px;
              font-size: 11px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              border: 2px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.25);
              cursor: pointer;
            ">
              <span>${badgeEmoji}</span>
              <span>${worker.name.split(' ')[0]}</span>
              <span style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1px 4px;">${breakdown.compositeScore}%</span>
            </div>
          `,
          iconSize: [100, 28],
          iconAnchor: [50, 28]
        });

        const marker = L.marker([worker.lat, worker.lng], { icon: workerIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 text-slate-800 dark:text-slate-100';
        popupContent.innerHTML = `
          <div style="font-family: inherit;">
            <div style="font-weight: 800; font-size: 13px; color: #ea580c;">${worker.name}</div>
            <div style="font-size: 11px; font-weight: 600; color: #475569;">${worker.primarySkill} • ${worker.experienceYears} yrs exp</div>
            <div style="font-size: 11px; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #f59e0b; font-weight: bold;">★ ${worker.reputationScore}</span>
              <span>•</span>
              <span style="color: #0d9488; font-weight: bold;">${breakdown.distanceKm} km away</span>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; font-size: 12px;">₹${worker.dailyWageExpected || 850}/day</span>
              <button id="view-worker-${worker.id}" style="
                background: #ea580c;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 10px;
                font-weight: bold;
                cursor: pointer;
              ">View & Hire</button>
            </div>
          </div>
        `;

        // Wire popup click
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-worker-${worker.id}`);
          if (btn) {
            btn.onclick = () => onSelectWorker(worker);
          }
        });

        if (markersLayerRef.current) {
          marker.addTo(markersLayerRef.current);
        }
      });
    }
  }, [workers, targetSkill, centerLat, centerLng, radiusKm, selectedCity, onSelectWorker]);

  return (
    <div className="relative h-[480px] w-full rounded-3xl overflow-hidden shadow-lg border border-orange-200 dark:border-slate-800">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 rounded-2xl bg-white/90 backdrop-blur p-2.5 text-[11px] font-bold text-slate-800 shadow-lg border border-slate-200 dark:bg-slate-900/90 dark:text-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-600 inline-block" />
          <span>Available Worker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-slate-500 inline-block" />
          <span>Busy / On Job</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-teal-600 inline-block" />
          <span>Search Center</span>
        </div>
      </div>
    </div>
  );
};
