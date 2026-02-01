export default function AppLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b0b0c]">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-semibold wave-text">
          ReqFlow
        </div>

        <div className="flex items-center gap-1 text-white/60 text-sm">
          <span>Loading</span>
          <span className="animate-pulse">•</span>
          <span className="animate-pulse [animation-delay:150ms]">•</span>
          <span className="animate-pulse [animation-delay:300ms]">•</span>
        </div>
      </div>
    </div>
  );
}

