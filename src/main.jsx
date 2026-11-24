import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './ui/hud.css'
import { DRIVE } from './engine/world.js'

if (DRIVE) document.documentElement.classList.add('world-drive')

createRoot(document.getElementById('root')).render(<App />)
