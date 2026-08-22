"use client";

import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Navigation } from "lucide-react";
import { routeLink, site } from "@/lib/site";

const position: [number, number] = [site.geo.lat, site.geo.lng];
const address = site.address.full;
const markerIcon = divIcon({
  className: "brand-map-marker",
  html: `<span class="brand-map-marker__face"><img src="${site.logo}" alt="" /></span><span class="brand-map-marker__tip"></span>`,
  iconSize: [58, 70],
  iconAnchor: [29, 70],
  popupAnchor: [0, -66],
});

export default function LocationMapClient() {
  return (
    <div className="map-shell">
      <div className="premium-map" role="region" aria-label={`${site.name} ünvan xəritəsi: ${address}`}>
        <MapContainer
          center={position}
          zoom={17}
          scrollWheelZoom
          keyboard
          dragging
          touchZoom
          doubleClickZoom
          zoomControl
          attributionControl
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Marker position={position} icon={markerIcon} keyboard title={site.name}>
            <Popup>
              <strong>{site.name}</strong>
              <br />
              {address}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="map-address-card">
        <span className="eyebrow">Ünvan / {site.address.city}</span>
        <address>{address}</address>
        <a href={routeLink} target="_blank" rel="noreferrer" className="map-route">
          <Navigation size={17} /> Marşrut qur
        </a>
      </div>
    </div>
  );
}
