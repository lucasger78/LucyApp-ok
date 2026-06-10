export default function Steps({ current }) {
  const steps = [
    { label: 'Catálogo', num: 1 },
    { label: 'Cliente', num: 2 },
    { label: 'Confirmación', num: 3 },
  ]

  return (
    <div className="steps">
      {steps.map((step, idx) => (
        <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`step ${current === step.num ? 'active' : current > step.num ? 'done' : ''}`}>
            <div className="step-circle">
              {current > step.num ? '✓' : step.num}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`step-line ${current > step.num ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
