import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../App';
import { KanbanStatus } from '../../types';
// @ts-ignore - Leaflet is loaded from a CDN
const L = window.L;

interface MapViewProps {
    userRole: string | null;
    onNotify: (message: string, type: 'success' | 'error') => void;
}

const MapView: React.FC<MapViewProps> = ({ userRole, onNotify }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any | null>(null);
    const layerRefs = useRef<{ [key: string]: any }>({});
    const pulseRefs = useRef<{ [key: string]: any }>({});
    const layerGroupsRef = useRef<{ [key: string]: any }>({});

    const [geoData, setGeoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isOperator = userRole === 'operator';

    // --- Helper Function ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Critical': return "#ef4444"; // red-500
            case 'Warning': return "#f59e0b";  // amber-500
            case 'Healthy': return "#3b82f6";  // blue-600
            default: return "#ffffff";
        }
    };
    
    // --- Helper to create interactive popup content ---
    const createPopupContent = (layer: any, properties: any) => {
        const popupNode = document.createElement('div');
        popupNode.innerHTML = `
            <div class="space-y-1">
              <p><strong>ID:</strong> ${properties.id}</p>
              <p><strong>Type:</strong> ${properties.type}</p>
              <p><strong>Status:</strong> <span style="color:${getStatusColor(properties.status)}">${properties.status}</span></p>
            </div>
        `;

        if (isOperator) {
            const button = document.createElement('button');
            button.className = "mt-2 w-full text-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-colors";
            button.innerText = 'Create Ticket';
            button.onclick = async () => {
                button.disabled = true;
                button.innerText = 'Creating...';

                const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
                const { error } = await supabase.from('tickets').insert([{
                    id: ticketId,
                    title: `${properties.type} fault on ${properties.id}`,
                    assetId: properties.id,
                    assignedTo: 'Unassigned',
                    status: KanbanStatus.ToDo,
                    created: new Date().toISOString()
                }]);

                if (error) {
                    onNotify(`Failed to create ticket: ${error.message}`, 'error');
                    button.disabled = false;
                    button.innerText = 'Create Ticket';
                } else {
                    onNotify(`Ticket ${ticketId} created successfully.`, 'success');
                    layer.closePopup();
                }
            };
            popupNode.appendChild(button);
        }
        return popupNode;
    };

    useEffect(() => {
        const fetchGeoData = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('network_geo')
                .select('*');

            if (error) {
                console.error("Supabase error fetching geo data:", error.message);
                setError(`Failed to fetch map data: ${error.message}`);
                setGeoData(null);
            } else if (data) {
                 const featureCollection = {
                    "type": "FeatureCollection",
                    "features": data.map((item: any) => ({
                        "type": "Feature",
                        "properties": item.properties,
                        "geometry": item.geometry,
                    }))
                };
                setGeoData(featureCollection);
                setError(null);
            }
            setLoading(false);
        };

        fetchGeoData();
    }, []);
    
    // Real-time updates subscription
    useEffect(() => {
        const channel = supabase.channel('realtime-network-geo-updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'network_geo' },
                (payload) => {
                    const updatedFeature = {
                        "properties": payload.new.properties,
                        "geometry": payload.new.geometry,
                    };
                    const assetId = updatedFeature.properties.id;
                    const layer = layerRefs.current[assetId];
                    
                    if (!layer) return; // Layer not found, do nothing

                    const oldStatus = layer.feature.properties.status;
                    const newStatus = updatedFeature.properties.status;
                    
                    // 1. Update layer's internal data and popup
                    layer.feature.properties = updatedFeature.properties;
                    layer.bindPopup(createPopupContent(layer, updatedFeature.properties));

                    // 2. Update style
                    const newColor = getStatusColor(newStatus);
                    if (layer.setStyle) { // For lines and points
                        const style = layer.feature.geometry.type === 'Point' 
                            ? { fillColor: newColor }
                            : { color: newColor };
                        layer.setStyle(style);
                    }

                    // 3. Update layer group membership if status changed
                    if (oldStatus !== newStatus && layerGroupsRef.current) {
                        layerGroupsRef.current[oldStatus.toLowerCase()]?.removeLayer(layer);
                        layerGroupsRef.current[newStatus.toLowerCase()]?.addLayer(layer);
                    }

                    // 4. Update pulsing animation
                    const existingPulse = pulseRefs.current[assetId];
                    const needsPulse = newStatus === 'Critical' || newStatus === 'Warning';

                    if (existingPulse && !needsPulse) {
                        // Remove pulse
                        layerGroupsRef.current.pulse?.removeLayer(existingPulse);
                        delete pulseRefs.current[assetId];
                    } else if (!existingPulse && needsPulse) {
                        // Add pulse
                        const latlng = layer.getLatLng();
                        if (latlng) {
                           const pulseIcon = L.divIcon({ className: 'pulse-container', html: `<div class="pulse-marker" style="box-shadow: 0 0 0 0 ${newColor}99;"></div>` });
                           const newPulse = L.marker(latlng, { icon: pulseIcon }).addTo(layerGroupsRef.current.pulse);
                           pulseRefs.current[assetId] = newPulse;
                        }
                    } else if (existingPulse && needsPulse) {
                        // Update existing pulse color (by replacing it)
                        layerGroupsRef.current.pulse?.removeLayer(existingPulse);
                        const latlng = layer.getLatLng();
                        if (latlng) {
                           const pulseIcon = L.divIcon({ className: 'pulse-container', html: `<div class="pulse-marker" style="box-shadow: 0 0 0 0 ${newColor}99;"></div>` });
                           const newPulse = L.marker(latlng, { icon: pulseIcon }).addTo(layerGroupsRef.current.pulse);
                           pulseRefs.current[assetId] = newPulse;
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOperator]); // Rerun if isOperator changes to update popups correctly

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current && geoData) {
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
            
            // --- Layers based on Status ---
            layerGroupsRef.current = {
                critical: L.layerGroup().addTo(mapRef.current),
                warning: L.layerGroup().addTo(mapRef.current),
                healthy: L.layerGroup().addTo(mapRef.current),
                pulse: L.layerGroup().addTo(mapRef.current),
            };

            L.geoJSON(geoData as any, {
                onEachFeature: (feature, layer) => {
                    const assetId = feature.properties.id;
                    layerRefs.current[assetId] = layer;
                    layer.bindPopup(createPopupContent(layer, feature.properties));
                    
                    // Add layer to the correct status group
                    const status = feature.properties.status.toLowerCase();
                    if (layerGroupsRef.current[status]) {
                        layerGroupsRef.current[status].addLayer(layer);
                    }
                },
                pointToLayer: (feature, latlng) => {
                    const color = getStatusColor(feature.properties.status);
                    
                    if (feature.properties.status !== 'Healthy') {
                        const pulseIcon = L.divIcon({
                            className: 'pulse-container',
                            html: `<div class="pulse-marker" style="box-shadow: 0 0 0 0 ${color}99;"></div>`
                        });
                        const pulseMarker = L.marker(latlng, { icon: pulseIcon }).addTo(layerGroupsRef.current.pulse);
                        pulseRefs.current[feature.properties.id] = pulseMarker;
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
                style: (feature) => ({
                    color: getStatusColor(feature.properties.status),
                    weight: feature.properties.type === 'HT Line' ? 4 : 2,
                    opacity: feature.properties.type === 'HT Line' ? 0.8 : 0.9,
                    dashArray: feature.properties.type === 'LT Line' ? '5, 5' : undefined
                })
            });

            // --- Controls ---
            const overlayMaps = {
                "<span class='text-red-500 font-semibold'>■</span> Critical Assets": layerGroupsRef.current.critical,
                "<span class='text-amber-500 font-semibold'>■</span> Warning Assets": layerGroupsRef.current.warning,
                "<span class='text-blue-500 font-semibold'>■</span> Healthy Assets": layerGroupsRef.current.healthy,
                "Alert Pulses": layerGroupsRef.current.pulse,
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
    }, [geoData]);

    if (loading) {
        return <div className="text-center p-8 text-gray-300">Loading Map Data...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400 bg-red-900/20 rounded-lg">{error}</div>;
    }

    return (
        <div className="bg-gray-800 p-2 rounded-lg shadow-lg h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full rounded-md" style={{ minHeight: '500px' }}></div>
        </div>
    );
};

export default MapView;