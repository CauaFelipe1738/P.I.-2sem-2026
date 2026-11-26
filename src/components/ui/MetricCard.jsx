export default function MetricCard({ label, value, badge, icon }) {
  return (
    <article className="flex min-h-[82px] items-center justify-between rounded-xl border border-[#d9e1eb] bg-white px-4 py-3 shadow-[0_2px_5px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[12px] font-medium text-slate-600">{label}</p>
        <div className="mt-1.5 flex items-center gap-2.5">
          <strong className="text-[24px] leading-none tracking-tight text-slate-950">{value}</strong>
          {badge && (
            <span className="rounded bg-[#e9f6f0] px-2 py-1 text-[10px] font-semibold text-[#138466]">
              {badge}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <span className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-[#eaf3ff]">
          <img src={icon} alt="" className="dashboard-stat-icon" />
        </span>
      )}
    </article>
  )
}
