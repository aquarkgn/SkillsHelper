import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Hero } from '@/sections/Hero'
import { PainPoints } from '@/sections/PainPoints'
import { Features } from '@/sections/Features'
import { QuickStart } from '@/sections/QuickStart'
import { Credibility } from '@/sections/Credibility'

const REPO_URL = 'https://github.com/aquarkgn/HuHaa-MySkills'

export default function App() {
  return (
    <div className="min-h-full">
      <Nav repoUrl={REPO_URL} />
      <main>
        <Hero repoUrl={REPO_URL} />
        <PainPoints />
        <Features />
        <QuickStart />
        <Credibility />
      </main>
      <Footer repoUrl={REPO_URL} />
    </div>
  )
}
