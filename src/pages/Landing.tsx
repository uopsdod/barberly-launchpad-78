import { Link } from "react-router-dom";
import { Search, BadgeCheck, Zap, ShieldCheck, Star } from "lucide-react";
import heroLeft from "@/assets/hero-left.jpg";
import heroRight from "@/assets/hero-right.jpg";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";
import barber4 from "@/assets/barber-4.jpg";

const filters = ["All", "Cut", "Color", "Perm", "Beard"] as const;

const barbers = [
  { name: "Marco Bellini", shop: "Atelier Nord · Brooklyn", img: barber1, services: ["Cut", "Beard"], rating: 4.9, reviews: 218, from: 38 },
  { name: "Iris Tanaka", shop: "Maison Iris · SoHo", img: barber2, services: ["Cut", "Color", "Perm"], rating: 4.8, reviews: 164, from: 65 },
  { name: "Leo Vasquez", shop: "Sharp & Co. · Williamsburg", img: barber3, services: ["Cut", "Beard"], rating: 4.9, reviews: 302, from: 42 },
  { name: "Henrik Møller", shop: "North Chair · West Village", img: barber4, services: ["Cut", "Beard"], rating: 5.0, reviews: 97, from: 55 },
  { name: "Sasha Park", shop: "Studio Sasha · NoHo", img: barber2, services: ["Color", "Perm"], rating: 4.7, reviews: 142, from: 80 },
  { name: "Daniel Cruz", shop: "Cruz Barbershop · LES", img: barber1, services: ["Cut", "Beard"], rating: 4.8, reviews: 256, from: 35 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <LogoStrip />
      <Features />
      <Popular />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Barberly
        </Link>
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search stylists or styles"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/70 border border-transparent focus:border-ring focus:bg-background outline-none text-sm transition"
            />
          </div>
        </div>
        <div className="ml-auto">
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, var(--cream) 0%, var(--background) 70%)" }}
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-12 sm:pt-20 pb-16">
        <p className="text-center text-xs tracking-[0.25em] uppercase text-muted-foreground animate-fade-up">
          — New Look —
        </p>

        <div className="mt-8 grid grid-cols-12 items-center gap-4 sm:gap-6">
          <div className="col-span-3 sm:col-span-3">
            <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-sand animate-fade-up">
              <img src={heroLeft} alt="Stylist portrait" className="size-full object-cover" width={768} height={960} />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-6 text-center">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl leading-[1.02] font-medium text-foreground animate-fade-up">
              Style with <em className="italic font-normal">Confident</em> Hair
            </h1>
            <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto animate-fade-up">
              Find a top-rated barber or stylist near you and book your chair in a few taps.
            </p>
          </div>
          <div className="col-span-3 sm:col-span-3">
            <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-sand animate-fade-up">
              <img src={heroRight} alt="Stylist portrait" className="size-full object-cover" width={768} height={960} />
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-2xl mx-auto animate-fade-up">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Find your stylist or search a style"
              className="w-full h-14 pl-14 pr-32 rounded-full bg-card border border-border shadow-sm focus:border-ring outline-none text-base"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
              Search
            </button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {filters.map((f, i) => (
              <button
                key={f}
                className={`h-9 px-4 rounded-full text-sm border transition ${
                  i === 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = ["Vogue", "GQ", "Allure", "Refinery29", "Dazed", "Hypebeast"];
  return (
    <section className="border-y border-border/60 bg-cream/50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        {logos.map((l) => (
          <span key={l} className="font-display text-xl text-muted-foreground/80 tracking-wide">
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: BadgeCheck, label: "Verified Barbers" },
    { icon: Zap, label: "Instant Booking" },
    { icon: ShieldCheck, label: "Secure Payment" },
    { icon: Star, label: "Top-Rated Styles" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
      <h2 className="font-display text-3xl sm:text-4xl text-center text-foreground">
        Best booking experience
      </h2>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-card border border-border/70 card-lift"
          >
            <div className="size-12 rounded-2xl bg-cream flex items-center justify-center">
              <Icon className="size-6 text-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Popular() {
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-24">
      <div className="flex items-end justify-between mb-10">
        <h2 className="font-display text-3xl sm:text-4xl text-foreground">Popular</h2>
        <span className="text-sm text-muted-foreground hidden sm:block">
          Hand-picked stylists this week
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {barbers.map((b) => (
          <button
            key={b.name}
            className="text-left rounded-3xl overflow-hidden bg-card border border-border/70 card-lift"
          >
            <div className="relative aspect-[4/5] bg-sand overflow-hidden">
              <img src={b.img} alt={b.name} loading="lazy" className="size-full object-cover" width={640} height={768} />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-background/90 backdrop-blur text-xs font-medium text-foreground">
                Popular
              </span>
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 h-7 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                from ${b.from}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-foreground leading-tight">{b.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{b.shop}</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-foreground text-foreground" />
                  <span className="font-medium text-foreground">{b.rating}</span>
                  <span className="text-muted-foreground">({b.reviews})</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {b.services.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80 border border-border/60"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-cream/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 flex items-center justify-between">
        <span className="font-display text-lg text-foreground">Barberly</span>
        <span className="text-sm text-muted-foreground">© 2026 Barberly</span>
      </div>
    </footer>
  );
}
