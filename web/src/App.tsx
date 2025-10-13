import { useState } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import MainMenu from './components/MainMenu';
import PracticeMode from './components/PracticeMode';
import CrackMode from './components/CrackMode';
import './App.css';

type Screen = 'menu' | 'practice' | 'crack';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MainMenu onSelectMode={setCurrentScreen} />;
      case 'practice':
        return <PracticeMode onBack={() => setCurrentScreen('menu')} />;
      case 'crack':
        return <CrackMode onBack={() => setCurrentScreen('menu')} />;
      default:
        return <MainMenu onSelectMode={setCurrentScreen} />;
    }
  };

  return (
    <Theme accentColor="green" grayColor="slate" radius="large" scaling="100%">
      <div className="app">
        {renderScreen()}
      </div>
    </Theme>
  );
}

export default App;
