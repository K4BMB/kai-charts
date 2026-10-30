import { useCopy } from './shared';

/** "Código" section: the generated snippet plus a Copiar button with feedback. */
export function CodeBox({ code }: { code: string }) {
  const [copied, copy] = useCopy();
  return (
    <section>
      <h2>Código</h2>
      <pre>
        <code>{code}</code>
      </pre>
      <button type="button" onClick={() => copy(code)}>
        {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </section>
  );
}
