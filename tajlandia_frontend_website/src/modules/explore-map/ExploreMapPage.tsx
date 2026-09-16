import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { routes } from "@/lib/constants/routes";

const destinations = [
  {
    name: "Phuket",
    badge: "ICON",
    detail: "Island life, reimagined.",
    locations: "24 locations",
    image: "/images/explore/phuket.jpg",
  },
  {
    name: "Krabi",
    badge: "POPULAR",
    detail: "Where limestone meets the sea.",
    locations: "16 locations",
    image: "/images/explore/krabi.jpg",
  },
  {
    name: "Chiang Mai",
    badge: "STANDARD",
    detail: "Mountains, culture and quiet.",
    locations: "12 locations",
    image: "/images/explore/chiang-mai.jpg",
  },
] as const;

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m15.6 15.6 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function MapControlIcon({ type }: { type: "plus" | "minus" }) {
  return <span aria-hidden="true" className="text-lg leading-none">{type === "plus" ? "+" : "−"}</span>;
}

export function ExploreMapPage() {
  return (
    <div className="bg-[#fbfcfd] pb-16 md:pb-24">
      <section className="px-4 pb-12 pt-14 sm:px-8 md:pt-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-[40px] leading-none tracking-[-0.04em] text-navy sm:text-[52px]">
              Discover <span className="italic text-brand-red">Thailand</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[470px] text-sm leading-6 text-muted">
              Explore remarkable destinations across Thailand. Every place has a story, and yours is waiting to be discovered.
            </p>
            <label className="mx-auto mt-7 flex h-11 max-w-[360px] items-center gap-3 rounded-full border border-line bg-white px-4 text-left text-xs text-muted shadow-[0_6px_18px_rgba(11,31,77,0.05)]">
              <SearchIcon />
              <input type="search" placeholder="Search city, region, or destination..." className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aab2bd]" />
            </label>
          </div>
        </Container>
      </section>

      <section className="px-4 sm:px-8">
        <Container>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#dbe8ed] bg-white p-2 shadow-[0_15px_40px_rgba(11,31,77,0.1)] sm:p-3">
            <Image
              src="/images/home/map.png"
              alt="Map of Thailand and surrounding destinations"
              width={1217}
              height={580}
              priority
              sizes="(max-width: 1280px) 100vw, 1217px"
              className="h-auto w-full rounded-[1.35rem]"
            />
            <div className="absolute bottom-7 right-7 flex flex-col overflow-hidden rounded-full border border-[#dfe7ef] bg-white text-navy shadow-[0_4px_12px_rgba(11,31,77,0.12)] sm:bottom-8 sm:right-8">
              <button type="button" aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center hover:bg-[#f4f7fa]"><MapControlIcon type="plus" /></button>
              <span className="mx-auto h-px w-4 bg-line" />
              <button type="button" aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center hover:bg-[#f4f7fa]"><MapControlIcon type="minus" /></button>
            </div>
          </div>
        </Container>
      </section>

      <section className="px-4 pt-14 sm:px-8 md:pt-20">
        <Container>
          <div className="mb-7 flex items-end justify-between gap-5">
            <div>
              <h2 className="font-display text-[42px] leading-none tracking-[-0.04em] text-navy sm:text-[60px]">Explore by <span className="italic text-brand-red">Destination</span></h2>
            </div>
            <Link href={routes.contact} className="hidden text-[10px] font-medium text-navy underline underline-offset-4 sm:block">Browse All 6 Provinces →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {destinations.map((destination) => (
              <Link key={destination.name} href={routes.contact} className="group relative block h-[336px] overflow-hidden rounded-[1rem] bg-navy shadow-[0_8px_22px_rgba(11,31,77,0.12)] sm:h-[420px]">
                <Image src={destination.image} alt={destination.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071536] via-[#071536]/25 to-transparent" />
                <div className="absolute left-4 top-4 rounded bg-white/80 px-2 py-1 text-[9px] font-medium tracking-wide text-navy">{destination.badge}</div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h3 className="text-[32px] font-semibold leading-none tracking-[-0.03em]">{destination.name}</h3>
                  <p className="mt-2 max-w-[240px] text-[13px] leading-5 text-white/80">{destination.detail}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/30 pt-3 text-[10px] text-white/90">
                    <span>{destination.locations}</span>
                    <span>Discover Plots →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="px-4 pt-14 sm:px-8 md:pt-20">
        <Container>
          <Card className="grid items-stretch gap-8 overflow-hidden p-2 sm:p-3 lg:min-h-[628px] lg:grid-cols-2 lg:gap-10">
            <div className="relative min-h-[300px] overflow-hidden rounded-[1.25rem] bg-navy lg:min-h-0">
              <Image src="/images/explore/featured-thailand.jpg" alt="Thailand destination coastline" fill sizes="(max-width: 1024px) 100vw, 45vw" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center px-4 py-8 sm:px-8 lg:pr-12">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-navy"><span className="text-brand-red">•</span> Discover Thailand</p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-navy sm:text-5xl">Thailand, One Place at a Time.</h2>
              <p className="mt-3 text-base leading-7 text-muted sm:text-lg">From island coastlines to mountain cities, discover the places, landscapes, and destinations that make Thailand unforgettable.</p>
              <div className="mt-6 grid max-w-[560px] grid-cols-2 gap-6 border-y border-line py-5 text-xs text-muted sm:text-sm">
                <span><strong className="block text-xl text-navy sm:text-2xl">03 Regions</strong>Destinations</span>
                <span><strong className="block text-xl text-navy sm:text-2xl">03 Zones</strong>Zones</span>
                <span><strong className="block text-base text-navy sm:text-lg">Available across Thailand</strong>Plots to explore</span>
                <span><strong className="block text-xl text-navy sm:text-2xl">100 Rai</strong>Minimum collection</span>
              </div>
              <Button href={routes.explore} className="mt-5" size="sm">Explore the Map →</Button>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}
