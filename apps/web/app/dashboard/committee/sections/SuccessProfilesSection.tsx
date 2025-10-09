export default function SuccessProfilesSection({ profiles }: any) {
  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Success Profiles</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((p: any) => (
          <div key={p._id} className="border rounded p-3">
            <h3 className="font-semibold">{p.role}</h3>
            <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
            <ul className="list-disc pl-5 text-sm">
              {p.key_competencies?.map((c: string) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}