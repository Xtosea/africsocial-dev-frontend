import React, { useEffect, useRef, useState } from "react";

const PHOTON_URL = "https://photon.komoot.io/api/";

const uniqueParts = (parts) =>
  [...new Set(parts.map((part) => String(part || "").trim()).filter(Boolean))];

const formatPlace = (properties = {}) => {
  const name =
    properties.name ||
    properties.street ||
    properties.city ||
    properties.locality ||
    properties.district ||
    "Unknown place";

  const city =
    properties.city ||
    properties.locality ||
    properties.district ||
    properties.county;

  const subtitle = uniqueParts([
    city,
    properties.state,
    properties.country,
  ])
    .filter((part) => part !== name)
    .join(", ");

  const value = uniqueParts([
    name,
    city,
    properties.state,
    properties.country,
  ]).join(", ");

  return { name, subtitle, value };
};

export default function CheckInLocation({
  value = "",
  onChange,
  disabled = false,
}) {
  const [query, setQuery] = useState(value);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const blurRef = useRef(null);
  const geoRequestedRef = useRef(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const search = query.trim();

    if (!open || search.length < 2) {
      setPlaces([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          q: search,
          limit: "8",
        });

        if (coordinates) {
          params.set("lat", String(coordinates.latitude));
          params.set("lon", String(coordinates.longitude));
        }

        const response = await fetch(
          `${PHOTON_URL}?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Place search is temporarily unavailable.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          const results = (data.features || [])
            .map((feature) => formatPlace(feature.properties))
            .filter((place) => place.name && place.value);

          setPlaces(results);
        }
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError("Unable to search places right now. Please try again.");
          setPlaces([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timerRef.current);
      controller.abort();
    };
  }, [query, open, coordinates]);

  const handleFocus = () => {
    setOpen(true);

    if (blurRef.current) clearTimeout(blurRef.current);

    if (
      !geoRequestedRef.current &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      geoRequestedRef.current = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Global place search continues without location permission.
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
      );
    }
  };

  const selectPlace = (place) => {
    setQuery(place.value);
    onChange?.(place.value);
    setOpen(false);
    setPlaces([]);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        disabled={disabled}
        onFocus={handleFocus}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange?.(event.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          blurRef.current = setTimeout(() => setOpen(false), 160);
        }}
        placeholder="Search for a place to check in..."
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-500 disabled:opacity-50"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-[80] mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 shadow-xl">
          {loading && (
            <p className="p-3 text-sm text-zinc-400">Searching places...</p>
          )}

          {!loading &&
            places.map((place, index) => (
              <button
                key={`${place.value}-${index}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectPlace(place)}
                className="block w-full border-b border-zinc-800 p-3 text-left last:border-b-0 hover:bg-zinc-800"
              >
                <span className="block text-sm font-medium text-white">
                  {place.name}
                </span>
                {place.subtitle && (
                  <span className="mt-1 block text-xs text-zinc-400">
                    {place.subtitle}
                  </span>
                )}
              </button>
            ))}

          {!loading && !error && places.length === 0 && (
            <p className="p-3 text-sm text-zinc-400">No matching places found.</p>
          )}

          {error && (
            <p className="p-3 text-sm text-red-400">{error}</p>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-500">
        Search for places worldwide. Nearby results may appear first when location access is available.
      </p>
    </div>
  );
}
