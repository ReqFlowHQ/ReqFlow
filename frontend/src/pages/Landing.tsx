import { Helmet } from "react-helmet-async";
import Reveal from "../components/Reveal";
import dashboardPreview from "../assets/dashboard-preview.png";
import { Github } from "lucide-react";
import SafeLink from "../components/SafeLink";
import ReqFlowLogo from "../components/ReqFlowLogo";

export default function Landing() {
  const googleSiteVerification =
    (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "").trim();

  return (
    <>
      <Helmet>
        <title>ReqFlow – Modern API Testing & Workflow Tool | OpenGraph Labs</title>
        <meta
          name="description"
          content="ReqFlow is a modern, developer-first API testing and workflow tool by OpenGraph Labs. Design, test, and understand APIs with clarity."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:image" content="https://reqflow.onlineappsandservices.online/og-preview.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="ReqFlow – Modern API Testing & Workflow Platform" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://reqflow.onlineappsandservices.online/og-preview.png" />

        {/* Open Graph */}
        <meta property="og:title" content="ReqFlow – Modern API Workflow Tool" />
        <meta
          property="og:description"
          content="A calm, focused alternative to Postman for modern API workflows."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reqflow.onlineappsandservices.online/" />
        <link
          rel="canonical"
          href="https://reqflow.onlineappsandservices.online/"
        />
        {googleSiteVerification ? (
          <meta
            name="google-site-verification"
            content={googleSiteVerification}
          />
        ) : null}

        <meta
          name="keywords"
          content="API testing tool, API workflow platform, Postman alternative, REST API testing, ReqFlow"
        />

      </Helmet>


      <div className="bg-[#0b0b0c] text-white">

        {/* NAV */}
        <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/40 border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-4 md:px-10 md:py-5">


            {/* Brand */}
            <div className="flex items-center gap-3 hover:opacity-90 transition">
               <ReqFlowLogo className="w-8 h-8 text-white" />


              <span className="font-semibold tracking-wide text-white text-sm md:text-base">
                OpenGraph Labs
              </span>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">

              <a
                href="https://github.com/ReqFlowHQ/reqflow"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/60 hover:text-white transition"
                aria-label="ReqFlow GitHub repository"
              >
                <Github className="w-4 h-4" />

                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Open Source
                </span>
              </a>


              <SafeLink to="/about" className="hover:text-white transition">
                About
              </SafeLink>
              <SafeLink to="/login" className="hover:text-white transition">
                Login
              </SafeLink>
            </nav>

          </div>
        </header>


        {/* HERO */}
        <section className="min-h-screen pt-20 md:pt-32 flex flex-col items-center justify-center text-center px-6">

          <Reveal>
            <h1 className="text-6xl md:text-7xl font-semibold tracking-tight wave-text wave-slow">
              ReqFlow
            </h1>


            <p className="mt-3 text-sm uppercase tracking-widest text-white/40">
              By OpenGraph Labs
            </p>

          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 text-xl text-white/75 max-w-2xl">
              A modern API testing and request workflow platform,
              designed for developers who value clarity.
            </p>

            <p className="mt-4 text-sm text-white/40">
              Open source • Built by OpenGraph Labs • MIT licensed
            </p>

          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-12 flex justify-center gap-8">

              <div className="relative isolate overflow-hidden rounded-full">
                <SafeLink
                  to="/login"
                  className="
          btn-wave
          inline-flex items-center justify-center
          px-7 py-3
          rounded-full
          font-medium
          text-black
        "
                >
                  <span className="btn-wave-text">Get Started</span>
                </SafeLink>
              </div>

              <div className="relative isolate overflow-hidden rounded-full">
                <SafeLink
                  to="/about"
                   aria-label="Learn more about ReqFlow, a modern API testing and request workflow platform"
                  className="
    btn-wave-secondary
    inline-flex items-center justify-center
    px-7 py-3
    rounded-full
    font-medium
  "
                >
                  <span className="btn-wave-text">Learn more</span>
                </SafeLink>


              </div>

            </div>
          </Reveal>



        </section>
        <section className="py-40 px-6 max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              APIs are already complex.
              <br />
              Your tools shouldn’t be.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-white/65 leading-relaxed">
              Modern software is built on APIs. Yet many API tools have grown bloated,
              overwhelming, and difficult to reason about.
              ReqFlow was created to bring clarity back to API workflows —
              by focusing on what developers actually need, and removing what they don’t.
            </p>
          </Reveal>
        </section>

        {/* PRODUCT PREVIEW */}
        <section className="py-32 px-6 max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center text-white/50 mb-10">
              A closer look at the ReqFlow workflow.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
              <img
                src={dashboardPreview}
                alt="ReqFlow dashboard preview"
                className="w-full object-cover"
              />
            </div>
          </Reveal>
        </section>


        {/* SECTION 1 */}
        <section className="py-40 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-start">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              Built around real workflows.
            </h2>

            <p className="mt-8 text-lg text-white/65 leading-relaxed">
              ReqFlow is designed around how developers actually work with APIs —
              not around abstract feature lists.
              Every request, response, and configuration step is treated as part of a
              clear and understandable workflow.
            </p>

            <p className="mt-6 text-lg text-white/65 leading-relaxed">
              Whether you are testing a single endpoint or iterating through a complex
              integration, ReqFlow keeps context visible and interactions predictable.
              There is no hidden state, no unnecessary abstraction, and no clutter.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <ul className="space-y-6 text-white/70 leading-relaxed">
              <li>
                <strong className="text-white">Intentional request editing.</strong>
                <br />
                Clear separation of method, headers, body, and authentication.
              </li>

              <li>
                <strong className="text-white">Readable responses.</strong>
                <br />
                Structured JSON formatting designed for inspection and debugging.
              </li>

              <li>
                <strong className="text-white">Temporary and saved flows.</strong>
                <br />
                Work freely without committing everything, then save what matters.
              </li>

              <li>
                <strong className="text-white">Focused by default.</strong>
                <br />
                No distractions, no noise — just the tools you need.
              </li>
            </ul>
          </Reveal>
        </section>

        <section className="py-40 px-6 max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              Designed with intention.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-white/65 leading-relaxed">
              ReqFlow follows a simple design philosophy:
              reduce cognitive load, surface what matters, and stay out of the way.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <p className="mt-6 text-lg text-white/65 leading-relaxed">
              Every visual element exists for a reason.
              Every interaction is predictable.
              The interface is calm so that complex systems feel manageable.
            </p>
          </Reveal>
        </section>


        {/* SECTION 2 */}
        <section className="py-40 px-6 max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              Built for developers.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 text-lg text-white/60 max-w-3xl">
              Native support for REST methods, headers, authentication,
              and beautifully formatted JSON responses.
            </p>
          </Reveal>
        </section>

        {/* SECTION 3 */}
        <section className="py-40 px-6 max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              Part of OpenGraph Labs.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg text-white/60 max-w-3xl mx-auto">
              A product studio focused on building elegant,
              developer-first tools.
            </p>
          </Reveal>
        </section>
        <section className="py-40 px-6 max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              Privacy and security, by default.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-white/65 leading-relaxed">
              ReqFlow uses trusted OAuth providers such as Google and GitHub for
              authentication. Passwords are never collected or stored.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <p className="mt-6 text-lg text-white/65 leading-relaxed">
              The platform is built with a data-minimization mindset.
              Only the information required for functionality is retained,
              and user data is never sold, shared, or monetized.
            </p>
          </Reveal>
        </section>


        <section className="py-40 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          <Reveal>
            <h3 className="text-xl font-semibold">Backend developers</h3>
            <p className="mt-3 text-white/60">
              Test endpoints, inspect payloads, and debug APIs with clarity.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h3 className="text-xl font-semibold">Frontend developers</h3>
            <p className="mt-3 text-white/60">
              Explore APIs, validate responses, and iterate faster.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <h3 className="text-xl font-semibold">Students & learners</h3>
            <p className="mt-3 text-white/60">
              Understand how APIs work without overwhelming tools.
            </p>
          </Reveal>
        </section>
        <section className="py-40 px-6 max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-semibold">
              A calmer way to work with APIs.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-white/65 leading-relaxed">
              ReqFlow is not trying to replace your workflow.
              It is designed to support it — quietly, reliably, and thoughtfully.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-12 flex justify-center">
              <div className="relative isolate overflow-hidden rounded-full">
                <SafeLink
                  to="/login"
                  className="
          btn-wave
          inline-flex items-center justify-center
          px-10 py-4
          min-h-[52px]
          text-base md:text-lg
          font-medium
          rounded-full
          text-black
          transition-all duration-300
          hover:scale-[1.04]
        "
                >
                  <span className="btn-wave-text">Get Started With ReqFlow</span>
                </SafeLink>
              </div>
            </div>
          </Reveal>


        </section>


        {/* FOOTER */}
        <footer className="py-10 text-center text-xs text-white/40 border-t border-white/5 space-x-4">
          <span>© {new Date().getFullYear()} OpenGraph Labs</span>

          <a
            href="https://github.com/ReqFlowHQ/reqflow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            GitHub
          </a>

          <SafeLink to="/privacy" className="hover:text-white">Privacy</SafeLink>
          <SafeLink to="/terms" className="hover:text-white">Terms</SafeLink>
        </footer>


      </div>
    </>
  );
}
