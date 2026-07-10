import './GuessHistory.css';

interface GuessHistoryProps {
  guesses: string[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  return (
    <aside className="guess-history" aria-label="Intentos incorrectos">
      <h2 className="guess-history__title">No era</h2>
      {guesses.length === 0 ? (
        <p className="guess-history__empty">Sin intentos fallidos</p>
      ) : (
        <ul className="guess-history__list">
          {guesses.map((name, index) => (
            <li key={`${name}-${index}`} className="guess-history__item">
              {name}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
