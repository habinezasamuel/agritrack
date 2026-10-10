import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import ricePhoto from '../assets/rice.jpg';
import riceSackPhoto from '../assets/rice_sack.jpg';
import bananaPhoto from '../assets/banana.jpg';
import rainPhoto from '../assets/rain.jpg';
import seedPhoto from '../assets/seed.jpg';
import fertilizerPhoto from '../assets/fertilizer.jpg';
import livestockPhoto from '../assets/livestock.jpg';
import { FarmingSlideshow, FARMING_SLIDES, type FarmingSlide } from '../components/landing/FarmingSlideshow';

const benefits = [
  ['🐄', 'Livestock Rearing', 'Register cattle, goats, pigs and poultry, track health and get vet help.'],
  ['🍌', 'Banana Farming', 'Monitor healthy banana trees, manage suckers and forecast bunch harvests.'],
  ['🌾', 'Rice Terraces', 'Follow every rice crop stage from seed to irrigation and final harvest.'],
  ['📦', 'Harvest & Storage', 'Record yields, storage sacks, payments and market-ready produce.'],
];

const features = [
  ['Farm management', 'Register farms, fields, land size and crop seasons.'],
  ['Crop monitoring', 'Track planting dates, growth stages and expected harvests.'],
  ['Farming activities', 'Record planting, irrigation, weeding and crop care.'],
  ['Agricultural inputs', 'Apply for seeds and fertilizers with clear payment tracking.'],
  ['Financial records', 'Keep expenses, sales, revenue and profit in one place.'],
  ['Harvest management', 'Record harvest quantities and compare season performance.'],
  ['Notifications', 'Stay informed about applications, payments and harvest reminders.'],
  ['AI assistant', 'Ask farming questions and get context-aware guidance.'],
];

const process = [
  ['01', 'Choose crop', 'Select the field and crop season you are working on.'],
  ['02', 'Choose inputs', 'Select the seed or fertilizer that fits your crop.'],
  ['03', 'Select quantity', 'Enter the amount you need and review availability.'],
  ['04', 'Review cost', 'See your subtotal, tax and total before continuing.'],
  ['05', 'Make payment', 'Pay with Mobile Money or submit a bank reference.'],
  ['06', 'Officer approval', 'Authorized staff review and process the application.'],
];

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState<FarmingSlide>(FARMING_SLIDES[0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardPath = user?.role === 'OFFICER' ? '/officer' : user?.role === 'ADMIN' ? '/admin' : '/dashboard';
  const isRw = language === 'rw';

  return (
    <div className="min-h-screen bg-[#f8faf6] text-slate-900 selection:bg-emerald-200">
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/20 bg-[#0b2e22]/95 py-3 shadow-lg backdrop-blur-xl' : 'bg-[#0b2e22]/85 py-4 backdrop-blur-md'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-white" onClick={() => setMenuOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl shadow-lg shadow-emerald-900/30">🌾</span>
            <span><strong className="block text-lg leading-none tracking-tight">AgriTrack</strong><small className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">{t('rwandaAgriTrackOnline', 'Smart Agriculture Platform')}</small></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-emerald-50 lg:flex">
            <a href="#features" className="transition hover:text-emerald-300">{t('features', 'Features')}</a>
            <a href="#how-it-works" className="transition hover:text-emerald-300">{t('howItWorks', 'How It Works')}</a>
            <a href="#solutions" className="transition hover:text-emerald-300">{t('solutions', 'Solutions')}</a>
            <a href="#ai-assistant" className="transition hover:text-emerald-300">{t('aiAssistant', 'AI Assistant')}</a>
            <a href="#about" className="transition hover:text-emerald-300">{t('about', 'About')}</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher dark />
            <Link to={isAuthenticated ? dashboardPath : '/login'} className="rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">{isAuthenticated ? t('dashboard', 'Dashboard') : t('login', 'Login')}</Link>
            <Link to={isAuthenticated ? '/ai-assistant' : '/register'} className="rounded-lg bg-amber-300 px-5 py-2.5 text-sm font-extrabold text-[#173c2c] shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-200">{isAuthenticated ? t('aiAssistant', 'Open AI Assistant') : t('getStarted', 'Get Started')}</Link>
          </div>
          <button type="button" aria-label="Toggle navigation menu" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-2xl text-white lg:hidden">{menuOpen ? '×' : '☰'}</button>
        </div>
        {menuOpen && <nav className="border-t border-white/10 bg-[#0b2e22] px-5 py-5 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-bold text-white">
            <LanguageSwitcher dark />
            <a href="#features" onClick={() => setMenuOpen(false)}>{t('features', 'Features')}</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('howItWorks', 'How It Works')}</a>
            <a href="#solutions" onClick={() => setMenuOpen(false)}>{t('solutions', 'Solutions')}</a>
            <a href="#ai-assistant" onClick={() => setMenuOpen(false)}>{t('aiAssistant', 'AI Assistant')}</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>{t('about', 'About')}</a>
            <Link to={isAuthenticated ? dashboardPath : '/login'} onClick={() => setMenuOpen(false)} className="rounded-lg border border-white/20 px-4 py-3 text-center">{isAuthenticated ? t('dashboard', 'Dashboard') : t('login', 'Login')}</Link>
            <Link to={isAuthenticated ? '/ai-assistant' : '/register'} onClick={() => setMenuOpen(false)} className="rounded-lg bg-amber-300 px-4 py-3 text-center text-[#173c2c]">{isAuthenticated ? t('aiAssistant', 'Open AI Assistant') : t('getStarted', 'Get Started')}</Link>
          </div>
        </nav>}
      </header>

      <main>
        {/* Hero Section with Ambient Slideshow Background & Prominent Showcase Panel */}
        <section className="relative isolate overflow-hidden bg-[#041a12] pt-32 text-white sm:pt-40 lg:pt-44">
          {/* Continuous Ambient Background Slideshow Layer */}
          <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
            {FARMING_SLIDES.map((slide) => {
              const isCurrent = slide.id === activeSlide.id;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                    isCurrent ? 'opacity-35 scale-100' : 'opacity-0 scale-105'
                  }`}
                  style={{ backgroundImage: `url(${slide.image})` }}
                  aria-hidden="true"
                />
              );
            })}
            {/* Rich multi-stop dark gradient ensuring high text contrast */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,26,18,.96)_0%,rgba(6,35,24,.88)_50%,rgba(6,35,24,.70)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(52,211,153,.22),transparent_40%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pb-28">
            {/* Left Column: Headlines, Descriptions, Buttons & Synchronized Caption */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-200/10 px-4 py-2 text-xs font-extrabold tracking-[0.16em] text-emerald-200 shadow-sm backdrop-blur-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>🌱 {t('tagline', 'SMART FARMING • SMART DECISIONS')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight drop-shadow-md sm:text-6xl lg:text-7xl" style={{ color: '#ffffff' }}>
                <span className="block" style={{ color: '#ffffff' }}>
                  {t('growSmarterHeadline', 'Grow Smarter with AgriTrack')}
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-emerald-300 drop-shadow mt-2 tracking-normal" style={{ color: '#6ee7b7' }}>
                  {t('rwandaAgriTrackOnline', 'Rwanda Smart Agriculture')}
                </span>
              </h1>

              {/* Main Description */}
              <p className="mt-6 max-w-xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">
                {t(
                  'heroDescriptionMain',
                  'Manage your crops, monitor livestock, track farming activities, and receive helpful agricultural guidance in one place.'
                )}
              </p>

              {/* Synchronized Live Image Caption Banner */}
              <div className="mt-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-950/60 px-4 py-2 text-xs font-semibold text-emerald-100 backdrop-blur-md shadow-inner transition-all duration-500">
                <span className="text-sm">{activeSlide.badge.split(' ')[0]}</span>
                <span className="font-bold text-amber-300">
                  “{isRw ? activeSlide.captionRw : activeSlide.caption}”
                </span>
                <span className="hidden sm:inline text-emerald-300/50">•</span>
                <span className="text-emerald-200/80">
                  {isRw ? activeSlide.categoryRw : activeSlide.category}
                </span>
              </div>

              {/* Action Buttons: Get Started, Explore Features, Learn More */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to={isAuthenticated ? dashboardPath : '/register'}
                  className="inline-flex items-center justify-center rounded-xl bg-amber-300 px-6 py-4 font-extrabold text-[#173c2c] shadow-xl shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-200"
                >
                  🌱 {isAuthenticated ? t('openDashboard', 'Open My Dashboard') : t('getStarted', 'Get Started')}
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  {t('exploreFeatures', 'Explore Features')} ↓
                </a>

                <a
                  href="#solutions"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-900/40 px-6 py-4 font-bold text-emerald-100 backdrop-blur-sm transition hover:bg-emerald-900/70"
                >
                  {t('learnMore', 'Learn More')} →
                </a>
              </div>

              {/* 4 Category Highlights */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6 border-t border-white/10 text-xs font-bold text-emerald-100/90">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-500/20 p-1.5 text-base">🐄</span>
                  <span>Livestock Rearing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-yellow-500/20 p-1.5 text-base">🍌</span>
                  <span>Banana Farming</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-lime-500/20 p-1.5 text-base">🌾</span>
                  <span>Rice Terraces</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-teal-500/20 p-1.5 text-base">🌱</span>
                  <span>Crop Monitoring</span>
                </div>
              </div>
            </div>

            {/* Right Column: Prominent Automatic Farming Slideshow Panel */}
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <FarmingSlideshow
                currentLanguage={language}
                onSlideChange={(slide) => setActiveSlide(slide)}
              />
            </div>
          </div>
        </section>

        {/* Benefits Section with Realistic Agricultural Photography */}
        <section className="relative z-10 mx-auto -mt-10 grid max-w-7xl gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {benefits.map(([, title, text], index) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-2xl">
              {index === 0 && <img src={livestockPhoto} alt="Livestock cattle and pasture" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-md border-2 border-emerald-100" />}
              {index === 1 && <img src={bananaPhoto} alt="Banana Plantation" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-md border-2 border-emerald-100" />}
              {index === 2 && <img src={ricePhoto} alt="Rice field" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-md border-2 border-emerald-100" />}
              {index === 3 && <img src={riceSackPhoto} alt="Rice Harvest" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-md border-2 border-emerald-100" />}
              <h3 className="mt-2 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl"><span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">One connected platform</span><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Everything your farm needs.</h2><p className="mt-5 text-lg leading-8 text-slate-500">From the first seed to the final harvest, keep your work, decisions and records connected.</p></div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map(([title, text], index) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-xl"><span className="text-sm font-black text-emerald-700">0{index + 1}</span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div>
        </section>

        <section id="solutions" className="bg-[#0b2e22] py-24 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div><span className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Built for real farm work</span><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Everything your farm, in one place.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50/70">Farmers can manage their complete farming journey from one simple dashboard, with clear records that help them act with confidence.</p><div className="mt-8 grid grid-cols-2 gap-3 text-sm font-semibold text-emerald-50">{['Register farms', 'Manage fields', 'Monitor crops', 'Apply for inputs', 'Make payments', 'Track harvests', 'Track sales', 'Get AI assistance'].map(item => <div key={item} className="flex items-center gap-2"><span className="text-emerald-300">✓</span>{item}</div>)}</div><Link to={isAuthenticated ? dashboardPath : '/register'} className="mt-9 inline-flex rounded-xl bg-emerald-300 px-6 py-4 font-extrabold text-[#0b2e22] transition hover:bg-emerald-200">Explore Farmer Portal →</Link></div>
            <div className="rounded-3xl border border-emerald-300/20 bg-white/10 p-5 backdrop-blur-sm"><div className="rounded-2xl bg-[#f7fbf5] p-5 text-slate-900"><div className="flex items-center justify-between"><h3 className="font-black">AgriTrack Dashboard</h3><span className="text-xs font-bold text-emerald-700">This season</span></div><div className="mt-5 h-36 rounded-xl bg-[linear-gradient(165deg,#d1fae5,#ecfccb_55%,#f0fdf4)] p-4"><div className="flex h-full items-end gap-3">{[35, 48, 44, 65, 72, 86, 95].map((height, index) => <div key={index} className="flex-1 rounded-t-lg bg-emerald-600/75" style={{ height: `${height}%` }} />)}</div></div><div className="mt-4 grid grid-cols-3 gap-3">{[['Farms', '03'], ['Active crops', '06'], ['Expected harvest', '1.2t']].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}</div></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="mb-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="group overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-white ring-1 ring-emerald-950/5">
                    <img src={ricePhoto} alt="Rice crop" className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="block py-1.5 text-center text-[11px] font-black text-emerald-900 bg-emerald-100/90 tracking-wide">🌾 Rice Crop</span>
                  </div>
                  <div className="group overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-white ring-1 ring-emerald-950/5">
                    <img src={bananaPhoto} alt="Banana crop" className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="block py-1.5 text-center text-[11px] font-black text-emerald-900 bg-emerald-100/90 tracking-wide">🍌 Banana Tree</span>
                  </div>
                  <div className="group overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-white ring-1 ring-cyan-950/5">
                    <img src={rainPhoto} alt="Rain & Weather Care" className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="block py-1.5 text-center text-[11px] font-black text-cyan-900 bg-cyan-100/90 tracking-wide">🌧️ Rain & Care</span>
                  </div>
                  <div className="group overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-white ring-1 ring-amber-950/5">
                    <img src={riceSackPhoto} alt="Harvested rice sack" className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="block py-1.5 text-center text-[11px] font-black text-amber-900 bg-amber-100/90 tracking-wide">📦 Harvest Sack</span>
                  </div>
                </div>
                <h2 className="text-3xl font-black">Better inputs. Better growth.</h2>
                <p className="mt-3 text-slate-600">Browse the approved input catalogue, choose what fits your crop and follow your application through payment and review.</p>
                <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-bold text-emerald-950">
                  {['Rice seeds', 'Banana suckers', 'Rain & Care plan', 'Urea', 'DAP', 'NPK fertilizers'].map((item, index) => (
                    <div key={item} className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-3">
                      {index === 0 && <img src={seedPhoto} alt="Seeds" className="w-8 h-8 rounded-lg object-cover" />}
                      {index === 1 && <img src={bananaPhoto} alt="Banana" className="w-8 h-8 rounded-lg object-cover" />}
                      {index === 2 && <img src={rainPhoto} alt="Rain & Care" className="w-8 h-8 rounded-lg object-cover" />}
                      {index === 3 && <img src={fertilizerPhoto} alt="Fertilizer" className="w-8 h-8 rounded-lg object-cover" />}
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link to={isAuthenticated ? '/input-requests/new' : '/register'} className="mt-8 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 self-start">Explore Agricultural Inputs →</Link>
            </div>
            <div className="rounded-3xl bg-amber-50 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="text-4xl">🧑🏽‍🌾</span>
                <h2 className="mt-5 text-3xl font-black">Powerful tools for officers.</h2>
                <p className="mt-3 text-slate-600">Authorized agricultural officers can review farmers, monitor activity, process input applications and use reports to support better decisions.</p>
                <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-bold text-amber-950">
                  {['Farmers', 'Farms', 'Applications', 'Payments', 'Input stock', 'Reports'].map(item => <div key={item} className="rounded-xl bg-white p-4 shadow-sm">{item}</div>)}
                </div>
              </div>
              <Link to="/login" className="mt-8 inline-flex rounded-xl bg-[#0b2e22] px-5 py-3 font-bold text-white transition hover:bg-emerald-900 self-start">Explore Officer Portal →</Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="text-center"><span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Simple input applications</span><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">From selection to collection.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">A transparent process keeps every application easy to understand.</p></div><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{process.map(([number, title, text]) => <div key={number} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><span className="text-4xl font-black text-emerald-100">{number}</span><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div></section>

        <section id="ai-assistant" className="bg-emerald-50 py-24"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center"><div><span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Always-on farm support</span><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Meet your AI farming assistant 🤖</h2><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Get intelligent assistance for your farming journey whenever you need it, using the real assistant inside AgriTrack.</p><Link to={isAuthenticated ? '/ai-assistant' : '/login'} className="mt-8 inline-flex rounded-xl bg-emerald-700 px-6 py-4 font-extrabold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-1 hover:bg-emerald-800">Ask AgriTrack AI →</Link></div><div className="rounded-3xl bg-[#0b2e22] p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-center justify-between text-white"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400">🤖</span><div><p className="font-black">AI Farm Assistant</p><p className="text-xs text-emerald-200">Ready to help</p></div></div><img src={rainPhoto} alt="Weather advisory" className="h-10 w-10 rounded-xl object-cover border border-emerald-400/40" /></div><div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-500 p-4 text-sm font-medium text-white">How will this week's rainfall affect my rice and banana crops?</div><div className="mt-4 max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-700">The upcoming rain will provide ideal soil hydration for flowering and fruit development. Ensure drainage channels are clear to prevent waterlogging.</div><div className="mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-emerald-100/60">Ask a farming question...</div></div></div></section>

        <section id="about" className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="rounded-3xl bg-gradient-to-br from-amber-100 to-emerald-100 p-8 sm:p-12 lg:flex lg:items-center lg:justify-between"><div><span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Trust built into the platform</span><h2 className="mt-3 text-3xl font-black sm:text-4xl">Designed for accountable agriculture.</h2><p className="mt-4 max-w-2xl text-slate-600">Authentication, role-based access, protected records and controlled administration help each user see the tools they are authorized to use.</p></div><div className="mt-8 grid grid-cols-2 gap-3 text-sm font-bold text-emerald-950 lg:mt-0">{['🔐 Secure authentication', '👤 Role-based access', '🛡️ Protected data', '💳 Payment tracking'].map(item => <div key={item} className="rounded-xl bg-white/70 p-4">{item}</div>)}</div></div></section>

        <section className="relative overflow-hidden bg-[#0b2e22] py-24 text-center text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,.25),transparent_45%)]" /><div className="relative mx-auto max-w-3xl px-5"><h2 className="text-4xl font-black sm:text-6xl">Grow smarter with AgriTrack.</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-emerald-50/70">Start managing farms, crops, inputs, harvests and farming records from one intelligent platform.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to={isAuthenticated ? dashboardPath : '/register'} className="rounded-xl bg-amber-300 px-6 py-4 font-extrabold text-[#173c2c] transition hover:bg-amber-200">🌱 {isAuthenticated ? 'Open Dashboard' : 'Create Farmer Account'}</Link><Link to={isAuthenticated ? '/ai-assistant' : '/login'} className="rounded-xl border border-white/30 px-6 py-4 font-extrabold text-white transition hover:bg-white/10">{isAuthenticated ? 'Open AI Assistant' : 'Login'}</Link></div></div></section>
      </main>

      <footer className="bg-[#061d16] py-12 text-emerald-100/70"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]"><div><p className="text-2xl font-black text-white">🌾 AgriTrack</p><p className="mt-3 max-w-xs text-sm leading-6">Smart agriculture. Better decisions. Better harvests.</p></div><div><p className="font-bold text-white">Platform</p><div className="mt-4 grid gap-2 text-sm"><a href="#features" className="hover:text-white">Farm management</a><a href="#features" className="hover:text-white">Crop monitoring</a><a href="#how-it-works" className="hover:text-white">Agricultural inputs</a><a href="#ai-assistant" className="hover:text-white">AI assistant</a></div></div><div><p className="font-bold text-white">Portals</p><div className="mt-4 grid gap-2 text-sm"><Link to={isAuthenticated ? dashboardPath : '/register'} className="hover:text-white">{t('farmerPortal')}</Link><Link to={isAuthenticated ? dashboardPath : '/login'} className="hover:text-white">{t('officerPortal')}</Link><Link to={isAuthenticated ? dashboardPath : '/login'} className="hover:text-white">{t('adminAccess')}</Link></div></div></div><div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-5 pt-6 text-xs sm:px-8">© 2026 AgriTrack. All rights reserved.</div></footer>
    </div>
  );
}
