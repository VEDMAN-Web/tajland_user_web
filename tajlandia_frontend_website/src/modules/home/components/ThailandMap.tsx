'use client';

import { useEffect, useRef, useState } from 'react';
import type { HomePageContent } from "../types/home.types";

type ThailandMapProps = {
  pins: HomePageContent["map"]["pins"];
};

export function ThailandMap({ pins }: ThailandMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (mapLoaded) return;
    if (!mapContainer.current) return;

    const loadMapbox = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          console.error('Mapbox token not found');
          return;
        }

        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [100.9925, 15.87],
          zoom: 5.5,
          pitch: 20,
          bearing: 0,
          interactive: true,
          attributionControl: true,
        });

        map.current.on('load', () => {
          if (!map.current) return;

          try {
            // Add Thailand center marker
            if (!map.current.getSource('thailand-marker')) {
              map.current.addSource('thailand-marker', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      properties: { name: 'Thailand Center' },
                      geometry: {
                        type: 'Point',
                        coordinates: [100.9925, 15.87],
                      },
                    },
                  ],
                },
              });

              map.current.addLayer({
                id: 'thailand-marker-layer',
                type: 'circle',
                source: 'thailand-marker',
                paint: {
                  'circle-radius': 10,
                  'circle-color': '#c81e1e',
                  'circle-opacity': 0.8,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                },
              });
            }
          } catch (error) {
            console.error('Error adding Thailand marker:', error);
          }

          setMapLoaded(true);
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox error:', e);
        });
      } catch (error) {
        console.error('Error loading Mapbox:', error);
      }
    };

    loadMapbox();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapLoaded]);

  // Separate effect for updating pins
  useEffect(() => {
    if (!mapLoaded || !map.current || !pins || pins.length === 0) return;

    const mapboxgl = require('mapbox-gl');

    pins.forEach((pin: any, index: number) => {
      if (pin.lat && pin.lng) {
        try {
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setText(pin.name || `Location ${index + 1}`);

          new mapboxgl.Marker({ color: '#c81e1e' })
            .setLngLat([pin.lng, pin.lat])
            .setPopup(popup)
            .addTo(map.current);
        } catch (error) {
          console.error('Error adding pin marker:', error);
        }
      }
    });
  }, [mapLoaded, pins]);

  return (
    <div
      ref={mapContainer}
      className="w-full rounded-[1.5rem] overflow-hidden bg-gray-200"
      style={{
        width: '100%',
        height: '580px',
        minHeight: '580px',
        borderRadius: '1.5rem',
      }}
    />
  );
}
