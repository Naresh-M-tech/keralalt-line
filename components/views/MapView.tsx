
import React, { useEffect, useRef } from 'react';
import { networkGeoData } from '../../constants';
// @ts-ignore - Leaflet is loaded from a CDN
const L = window.L;

const MapView: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    // FIX: Cannot find namespace 'L'. Replaced L.Map with 'any' since Leaflet types are not globally available.
    const mapRef = useRef<any | null>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                center: [9.5, 76.8], // Centered over Kerala
                zoom: 8,
                preferCanvas: true,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(mapRef.current);
            
            const pulseLayer = L.layerGroup().addTo(mapRef.current);

            // --- Helper Functions ---
            const getStatusColor = (status: string) => {
                switch (status) {
                    case 'Critical': return "#ef4444"; // red-500
                    case 'Warning': return "#f59e0b";  // amber-500
                    case 'Healthy': return "#3b82f6";  // blue-600
                    default: return "#ffffff";
                }
            };
            
            // FIX: Cannot find namespace 'L'. Replaced L.Layer with 'any' since Leaflet types are not globally available.
            const onEachFeature = (feature: any, layer: any) => {
                if (feature.properties) {
                    const popupContent = `
                        <div class="space-y-1">
                          <p><strong>ID:</strong> ${feature.properties.id}</p>
                          <p><strong>Type:</strong> ${feature.properties.type}</p>
                          <p><strong>Status:</strong> <span style="color:${getStatusColor(feature.properties.status)}">${feature.properties.status}</span></p>
                          <button class="mt-2 w-full text-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-colors">Create Ticket</button>
                        </div>
                    `;
                    layer.bindPopup(popupContent);
                }
            };

            // --- Layers ---
            const substationsLayer = L.geoJSON(networkGeoData as any, {
                filter: (feature) => feature.properties.type === 'Substation',
                pointToLayer: (feature, latlng) => {
                     const color = getStatusColor(feature.properties.status);
                     
                     if (feature.properties.status !== 'Healthy') {
                        const pulseIcon = L.divIcon({
                            className: 'pulse-container',
                            html: `<div class="pulse-marker" style="box-shadow: 0 0 0 0 ${color}99;"></div>`
                        });
                        L.marker(latlng, { icon: pulseIcon }).addTo(pulseLayer);
                     }
                    
                     return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: color,
                        color: "#fff",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.9
                    });
                },
                onEachFeature: onEachFeature
            });

            const htLinesLayer = L.geoJSON(networkGeoData as any, {
                filter: (feature) => feature.properties.type === 'HT Line',
                style: (feature) => ({
                    color: getStatusColor(feature.properties.status),
                    weight: 4,
                    opacity: 0.8
                }),
                onEachFeature: onEachFeature
            });

            const ltLinesLayer = L.geoJSON(networkGeoData as any, {
                filter: (feature) => feature.properties.type === 'LT Line',
                style: (feature) => ({
                    color: getStatusColor(feature.properties.status),
                    weight: 2,
                    opacity: 0.9,
                    dashArray: '5, 5'
                }),
                onEachFeature: onEachFeature
            });

            // Add layers to map by default
            substationsLayer.addTo(mapRef.current);
            htLinesLayer.addTo(mapRef.current);
            ltLinesLayer.addTo(mapRef.current);

            // --- Controls ---
            const overlayMaps = {
                "Substations": substationsLayer,
                "HT Lines": htLinesLayer,
                "LT Lines": ltLinesLayer,
                "Alert Pulses": pulseLayer,
            };
            L.control.layers(null, overlayMaps, { collapsed: false }).addTo(mapRef.current);

            // Custom Legend Control
            const legend = new L.Control({ position: 'bottomright' });
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'legend');
                const statuses = ['Critical', 'Warning', 'Healthy'];
                let labels = '<h4>Status Legend</h4>';

                statuses.forEach(status => {
                    const color = getStatusColor(status);
                    labels += `<i style="background:${color}"></i> ${status}<br>`;
                });
                 labels += `<br><h4>Line Types</h4>`;
                 labels += `<i class="line" style="background-color: #fff; opacity: 0.8;"></i> HT Line<br>`;
                 labels += `<i class="line" style="border-top: 3px dashed #fff; background: transparent; opacity: 0.9; margin-top: 12px;"></i> LT Line<br>`;

                div.innerHTML = labels;
                return div;
            };
            legend.addTo(mapRef.current);
        }

        // Cleanup function
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <div className="bg-gray-800 p-2 rounded-lg shadow-lg h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full rounded-md" style={{ minHeight: '500px' }}></div>
        </div>
    );
};

export default MapView;
