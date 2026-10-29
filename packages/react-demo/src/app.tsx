import { useEffect, useState } from 'react';
import { Playground } from './playground';
import { Showcase } from './showcase';
import { useHashRoute } from './use-hash-route';
import './app.css';

type Theme = 'light' | 'dark' | 'brand';

const TITLES = {
  showcase: 'kai-charts · demo React',
  playground: 'kai-charts · playground React',
} as const;

export function App() {
  const route = useHashRoute();
  const [theme, setTheme] = useState<Theme>('light');
  // Showcase-only states, controlled from the header.
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>
            kai-charts <span className="tag">React</span>
          </h1>
          <p>Gráficos SVG para React 18+ · sin dependencias · colores por tokens CSS</p>
        </div>
        <nav className="nav" aria-label="Secciones">
          <a href="#/" className={route === 'showcase' ? 'active' : undefined}>
            Vitrina
          </a>
          <a href="#/playground" className={route === 'playground' ? 'active' : undefined}>
            Playground
          </a>
          <a href="../angular/">Demo Angular</a>
          <a href="https://github.com/K4BMB/kai-charts" target="_blank" rel="noopener">
            GitHub
          </a>
        </nav>
        <div className="controls" role="group" aria-label="Opciones de la demo">
          <label>
            Tema
            <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="brand">Marca</option>
            </select>
          </label>
          {route === 'showcase' && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={loading}
                  onChange={(e) => setLoading(e.target.checked)}
                />
                Cargando
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={empty}
                  onChange={(e) => setEmpty(e.target.checked)}
                />
                Sin datos
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showTable}
                  onChange={(e) => setShowTable(e.target.checked)}
                />
                Tabla espejo
              </label>
            </>
          )}
        </div>
      </header>

      {route === 'playground' ? (
        <Playground />
      ) : (
        <Showcase loading={loading} empty={empty} showTable={showTable} />
      )}
    </div>
  );
}
