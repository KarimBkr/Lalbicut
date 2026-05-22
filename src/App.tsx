import { Theme } from './settings/types';
import { GentlemanBarber } from './components/generated/GentlemanBarber';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return <GentlemanBarber />;
}

export default App;