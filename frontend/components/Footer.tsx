export default function Footer() {
  const developers = [
    { name: "B. Pavan", role: "Backend & RAG" },
    { name: "A. Abhinav", role: "Frontend & UI/UX" },
    { name: "B. Naveen", role: "Data Analysis" },
    { name: "K. Krishna Teja", role: "Frontend" },
  ]

  return (
    <footer className="w-full border-t border-border py-6 mt-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-3">
        <p className="text-xs text-text-dim font-mono tracking-widest uppercase">
          Developed by
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          {developers.map((dev) => (
            <div key={dev.name} className="flex flex-col items-center">
              <span className="text-sm font-semibold text-text-muted">{dev.name}</span>
              <span className="text-[11px] text-text-dim font-mono tracking-wide">{dev.role}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-dim font-mono tracking-wider mt-1">
          &copy; {new Date().getFullYear()} SkillVector
        </p>
      </div>
    </footer>
  )
}
