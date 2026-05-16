export function DragDropFill({ 
  question, 
  userAnswers, 
  onSelectMatching, 
  showResult, 
  disabled 
}) {
  const currentAnswers = userAnswers || {};
  const segments = question.segments || [];

  const handleInputChange = (blankId, value) => {
    if (disabled) return;
    onSelectMatching(blankId, value);
  };

  return (
    <div className="flex flex-col gap-6 mt-2">
      <div className="p-5 bg-[rgba(0,0,0,0.1)] rounded-xl border border-[rgba(255,255,255,0.05)] text-lg leading-loose shadow-inner">
        {segments.map((seg, index) => {
          if (seg.type === 'text') {
            return <span key={index} className="whitespace-pre-wrap">{seg.content}</span>;
          }
          
          if (seg.type === 'blank') {
            const blankId = seg.id;
            const userText = String(currentAnswers[blankId] || '');
            let isCorrect = false;

            if (showResult) {
              const correctAnswers = (seg.answers || []).map(a => a.toLowerCase().trim().replace(/\s+/g, ' '));
              const userStr = userText.toLowerCase().trim().replace(/\s+/g, ' ');
              isCorrect = correctAnswers.includes(userStr);
            }

            let statusClass = 'border-[var(--color-border)] bg-[var(--color-surface)]';
            if (showResult) {
              statusClass = isCorrect ? 'border-[var(--color-success)] bg-[rgba(34,197,94,0.1)] text-[var(--color-success)]' : 'border-[var(--color-error)] bg-[rgba(239,68,68,0.1)] text-[var(--color-error)]';
            } else if (userText) {
              statusClass = 'border-[var(--color-accent)] bg-[rgba(124,58,237,0.05)] text-[var(--color-accent-light)]';
            }

            const minWidth = 100;
            const charWidth = 10;
            const calculatedWidth = Math.max(minWidth, userText.length * charWidth + 32);

            return (
              <input
                key={index}
                type="text"
                value={userText}
                onChange={(e) => handleInputChange(blankId, e.target.value)}
                disabled={disabled}
                style={{ width: `${calculatedWidth}px` }}
                className={`inline-flex h-[36px] mx-1 px-3 py-1 rounded-xl border-2 outline-none focus:border-[var(--color-accent)] transition-all align-baseline text-center font-bold text-base shadow-sm ${statusClass}`}
                placeholder="_____"
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
