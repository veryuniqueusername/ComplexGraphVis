import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'index.css';

// Clear the existing HTML content
document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const root = createRoot(document.getElementById('app'));
root.render(<App />);
