type Props = {
  className?: string;
};

export default function ReqFlowLogo({ className = "w-8 h-8" }: Props) {
  return (
    <img
      src="/assets/reqflow-logo.png"
      alt=""                       // 🔥 prevents alt text flash
      aria-label="ReqFlow"         // ♿ keeps accessibility
      width={64}
      height={64}
      className={`inline-block object-contain ${className}`}
      loading="eager"
      decoding="sync"
      fetchpriority="high"
      draggable={false}
    />
  );
}

