"use client";

import { flagEmoji } from "@/lib/presence/countries";
import type { PresenceSnapshot } from "@/lib/presence/store";
import { LiveGlobe } from "./live-globe";

export function LivePresence({ snapshot }: { snapshot: PresenceSnapshot | null }) {
  const live = snapshot?.live ?? 0;
  const countries = snapshot?.countries ?? 0;
  const total = snapshot?.total ?? 0;
  const since = snapshot?.since
    ? new Date(snapshot.since).toLocaleDateString("en-US", { day: "numeric", month: "short" }).toLowerCase()
    : null;

  return (
    <section id="live" className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:px-6 md:py-14">
        <LiveGlobe dots={snapshot?.dots ?? []} />
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-faint">
            <p>live · who is on the site right now · country-level only</p>
            <p>refreshes every 5 min</p>
          </div>
          <p className="mt-6 flex items-end gap-3">
            <span className="text-[clamp(3.5rem,8vw,5.5rem)] font-medium leading-none tracking-[-0.06em]">
              {live}
            </span>
            <span className="pb-2 text-muted">{live === 1 ? "person on the site right now" : "people on the site right now"}</span>
          </p>
          <p className="mt-2 text-sm text-faint">
            from {countries} {countries === 1 ? "country" : "countries"}
            {total > 0 ? ` · ${total.toLocaleString()} ${total === 1 ? "visit" : "visits"}` : ""}
            {since ? ` since ${since}` : ""}
          </p>
          <ul className="mt-6 space-y-2.5">
            {(snapshot?.events ?? []).slice(0, 4).map((event, index) => (
              <li key={`${event.ago}-${event.countryName}-${index}`} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-[1px] text-base leading-none">{flagEmoji(event.country)}</span>
                <span>
                  someone{event.country ? ` in ${event.countryName}` : ""} {event.action}
                  <span className="text-faint"> / {event.ago}</span>
                </span>
              </li>
            ))}
            {!snapshot?.events.length ? (
              <li className="text-sm text-faint">
                {live > 0
                  ? "visits are counted. country dots appear after deploy, when vercel sends geo headers."
                  : "waiting on the first visit. country-level only, nobody is identifiable."}
              </li>
            ) : null}
          </ul>
          {snapshot?.topCountries.length ? (
            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.16em] text-faint">visitors · by country</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.topCountries.map((country) => (
                  <span
                    key={country.code}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-elev px-3 py-1.5 text-[12px] text-fg"
                  >
                    <span>{flagEmoji(country.code)}</span>
                    <span className="text-muted">{country.code}</span>
                    <span>{country.count.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
