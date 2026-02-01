import { Helmet } from "react-helmet-async";

const WAVE_TEXT = "We’ll be right back";

export default function Maintenance() {
  return (
    <>
      <Helmet>
        <title>Maintenance · ReqFlow</title>
        <meta
          name="description"
          content="ReqFlow is temporarily unavailable while we perform maintenance."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center
                      bg-[#0b0b0c] text-white text-center px-6">

        {/* WAVE TEXT */}
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight
               wave-text">
          {WAVE_TEXT.split("").map((char, index) => (
            <span
              key={index}
              className="wave-letter"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>

        <p className="mt-8 text-lg text-white/60 max-w-xl">
          ReqFlow is temporarily offline while we fix a few things
          and improve stability.
        </p>

        <p className="mt-4 text-sm text-white/40">
          Thanks for your patience.
        </p>
      </div>
    </>
  );
}

