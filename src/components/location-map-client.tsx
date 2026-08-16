"use client";

import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const position: [number, number] = [40.4265337, 49.8868771];
const address = "Bakı şəhəri, Nərimanov rayonu, Ziya Bünyadov prospekti, 112";
const markerIcon = divIcon({
  className: "brand-map-marker",
  html: '<span class="brand-map-marker__face"><img src="/brand/nerj-metal-official-logo.jpg" alt="" /></span><span class="brand-map-marker__tip"></span>',
  iconSize: [58, 70],
  iconAnchor: [29, 70],
  popupAnchor: [0, -66],
});

export default function LocationMapClient() {
  return (
    <div className="premium-map" role="region" aria-label={`NERJ METAL ünvan xəritəsi: ${address}`}>
      <MapContainer center={position} zoom={17} scrollWheelZoom={false} keyboard zoomControl attributionControl className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} icon={markerIcon} keyboard title="NERJ METAL">
          <Popup><strong>NERJ METAL</strong><br />{address}</Popup>
        </Marker>
      </MapContainer>
      <div className="map-address-card">
        <span className="eyebrow">Ünvan / Bakı</span>
        <address>{address}</address>
        <a href="tel:+994708440664">(070) 844-06-64</a>
      </div>
    </div>
  );
}
