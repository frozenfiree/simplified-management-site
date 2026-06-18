import './styles/main.css'
import { initMascot } from './components/mascot/simman-bot.js'

// Mount the mascot into every [data-mascot] stage on the preview page so it can
// be reviewed at multiple sizes and on light/dark surfaces before it ships.
document.querySelectorAll('[data-mascot]').forEach((node) => initMascot(node))
