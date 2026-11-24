'use client';
import { useEffect, useRef, useState } from 'react';
import type { Equipment, Library, Stock } from '@/lib/domain';
import { formatDate } from '@/lib/domain';
import 'leaflet/dist/leaflet.css';
export type MapLocation = Library & {
  equipment: Array<Equipment & { stock: Stock[] }>;
};
export function LocationMap({
  locations,
  admin,
  preview = false,
}: {
  locations: MapLocation[];
  admin: boolean;
  preview?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let map: import('leaflet').Map | undefined;
    (async () => {
      try {
        const L = await import('leaflet');
        if (disposed || !container.current) return;
        map = L.map(container.current).setView([51.54, -0.09], 11);
        const tiles = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(map);
        tiles.on('tileerror', () => {
          if (!disposed) setFailed(true);
        });
        const icon = L.divIcon({
          className: 'library-map-marker',
          html: '<span aria-hidden="true">↟</span>',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
        });
        for (const library of locations) {
          const content = document.createElement('div');
          content.className = 'map-popup';
          const title = document.createElement('h3');
          title.textContent = library.name;
          content.append(title);
          const address = document.createElement('p');
          address.textContent = library.address;
          content.append(address);
          if (!library.equipment.length) {
            const p = document.createElement('p');
            p.textContent = 'No active equipment at this location.';
            content.append(p);
          }
          for (const equipment of library.equipment) {
            const section = document.createElement('section');
            const heading = document.createElement('strong');
            heading.textContent = equipment.name;
            section.append(heading);
            for (const s of equipment.stock) {
              const line = document.createElement('div');
              line.textContent = `${formatDate(s.date)}: ${s.capacity - s.reserved} available`;
              section.append(line);
            }
            const link = document.createElement('a');
            link.href = preview
              ? '/setup'
              : admin
                ? '/admin'
                : `/equipment/${encodeURIComponent(equipment.id)}`;
            link.textContent = preview
              ? 'Set up borrowing'
              : admin
                ? 'Manage equipment'
                : 'Borrow this equipment';
            section.append(link);
            content.append(section);
          }
          L.marker([library.latitude, library.longitude], {
            icon,
            title: library.name,
            alt: library.name,
          })
            .addTo(map)
            .bindPopup(content, { maxWidth: 340, maxHeight: 360 });
        }
        if (locations.length)
          map.fitBounds(
            L.latLngBounds(
              locations.map(
                (l) => [l.latitude, l.longitude] as [number, number],
              ),
            ),
            { padding: [45, 45], maxZoom: 13 },
          );
      } catch {
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [locations, admin, preview]);
  return (
    <section aria-label="Interactive library map">
      <div ref={container} className="location-map" />
      {failed && (
        <p className="notice" role="status">
          Some map tiles could not load. All locations and borrowing links are
          available in the list below.
        </p>
      )}
    </section>
  );
}
