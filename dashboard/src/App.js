import logo from './logo.svg';
import './App.css';
import TemplateRecommendation from './components/TemplateRecommendation';

function App() {
  return (
      <div className="App">
          <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <h1>NinjaTrader Dashboard</h1>
          </header>
          <main className="App-main">
              <div className="dashboard-section">
                  <TemplateRecommendation />
              </div>
          </main>
      </div>
  );
}

export default App;
