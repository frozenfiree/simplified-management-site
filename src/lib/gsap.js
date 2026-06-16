// Central GSAP configuration — register ScrollTrigger once and share a single
// instance across every component.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'power3.out', duration: 1 })

export { gsap, ScrollTrigger }
