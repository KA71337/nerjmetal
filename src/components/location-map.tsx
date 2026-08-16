"use client";

import dynamic from "next/dynamic";

const LocationMapClient = dynamic(() => import("./location-map-client"), {
  ssr: false,
  loading: () => <div className="map-loading" role="status" aria-label="Xəritə yüklənir">Xəritə yüklənir…</div>,
});

export function LocationMap() {
  return <LocationMapClient />;
}
