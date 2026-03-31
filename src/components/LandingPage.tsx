import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Rocket, TrendingUp, Briefcase, CheckCircle2, Globe, Zap, Twitter, Copy } from 'lucide-react';
import { Logo } from './Logo';

interface LandingPageProps {
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [waitlistRank, setWaitlistRank] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('key', '4Rp2qv');

    try {
      const response = await fetch('https://getlaunchlist.com/s/4Rp2qv', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('LaunchList Response:', data);

      if (response.ok || data.ok || data.status === 'success') {
        // Dynamic referral link extraction
        const link = data.referral_link || (data.data && data.data.referral_link);
        const rank = data.rank || (data.data && data.data.rank) || null;
        const userId = data.id || (data.data && data.data.id);
        
        // Fallback: If API doesn't return a link immediately, construct it
        const finalLink = link || `${window.location.origin}?ref=${userId || 'strategist'}`;
        
        setReferralLink(finalLink);
        setWaitlistRank(rank);
        setIsSubmitted(true);
      } else {
        console.error('LaunchList error:', data);
        // Fallback for demo/error state
        const fallbackLink = `${window.location.origin}?ref=strategist`;
        setReferralLink(fallbackLink);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Submission error:', error);
      const fallbackLink = `${window.location.origin}?ref=strategist`;
      setReferralLink(fallbackLink);
      setIsSubmitted(true);
    }
  };

  const copyToClipboard = () => {
    if (!referralLink) return;

    try {
      const textArea = document.createElement("textarea");
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error('Copy fallback failed:', err);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(referralLink).then(() => {
          setIsCopying(true);
          setTimeout(() => setIsCopying(false), 2000);
        });
      }
    }
  };

  const shareOnTwitter = () => {
    const text = `Just joined the waitlist for Grandmaster Intel. Better than school. Join me: ${referralLink || window.location.origin}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-dash-bg text-dash-text font-sans selection:bg-dash-accent selection:text-white overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      
      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dash-accent/10 border border-dash-accent/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Logo size={24} className="text-dash-accent" />
          </div>
          <span className="font-mono font-bold tracking-tighter text-xl uppercase">Grandmaster Intel</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        {/* Section 1: The Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="flex justify-center mb-8">
            <div className="hero-logo w-24 h-24 bg-dash-accent/5 border border-dash-accent/20 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.1)]">
              <Logo size={64} className="text-dash-accent" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dash-accent/10 border border-dash-accent/20 text-dash-accent text-[10px] font-mono uppercase tracking-widest mb-4">
            <Zap size={10} />
            Next-Gen Strategy Simulation
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Understand Geopolitics and Economics <span className="text-dash-accent">better than your school.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The first AI-powered strategy engine that turns Chess into a high-stakes global market simulator.
          </p>
        </motion.div>

        {/* Section 2: The Visual Proof */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-24 w-full"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-dash-accent to-dash-gold rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img 
                src="/dashboard-preview.png" 
                alt="Grandmaster Intel Executive Dashboard Preview" 
                className="w-full h-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://picsum.photos/seed/chess-dashboard/1200/800";
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 3: The Benefits */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            {
              icon: <Rocket className="text-dash-accent" />,
              title: "Real-Time Intelligence",
              desc: "Gemini 3.1 Flash-Lite analyzes every move through a geopolitical lens."
            },
            {
              icon: <TrendingUp className="text-dash-accent" />,
              title: "Economic Impact",
              desc: "Watch your tactics affect live Inflation, GDP, and Stability indicators."
            },
            {
              icon: <Briefcase className="text-dash-accent" />,
              title: "Executive Training",
              desc: "Transition from a basic player to a Global Strategist."
            }
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-8 rounded-2xl text-left space-y-4 hover:border-dash-accent/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-dash-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{benefit.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Section 4: The Waitlist Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 w-full max-w-2xl mx-auto glass-panel p-12 rounded-3xl border-dash-accent/20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dash-accent to-transparent opacity-50" />
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Ditch the textbooks. Join the exclusive waitlist for early access.</h2>
              <p className="text-slate-400">Be the first to master the board and the market.</p>
            </div>

            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 py-4"
              >
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 size={32} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-white font-bold text-2xl tracking-tight">Access Pending...</p>
                  {waitlistRank && (
                    <p className="text-dash-accent font-mono text-sm uppercase tracking-[0.2em]">
                      Current Rank: #{waitlistRank}
                    </p>
                  )}
                </div>

                <div className="w-full space-y-4 pt-4">
                  <p className="text-slate-400 text-sm">
                    You are now on the elite strategist shortlist. Share your unique link to climb the rankings.
                  </p>
                  
                  <div className="flex items-center gap-2 bg-dash-bg/50 border border-dash-border rounded-xl p-2 pl-4">
                    <input 
                      readOnly 
                      value={referralLink || 'https://grandmasterintel.com/ref/...' }
                      className="bg-transparent border-none outline-none text-xs text-slate-300 flex-1 font-mono"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
                      title="Copy Link"
                    >
                      {isCopying ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <button 
                    onClick={shareOnTwitter}
                    className="w-full py-4 bg-[#1DA1F2] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-blue-500/10"
                  >
                    <Twitter size={18} />
                    Share on X / Twitter
                  </button>
                </div>
              </motion.div>
            ) : (
              <form 
                onSubmit={handleSubmit} 
                className="launchlist-form space-y-4"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="Enter your executive email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-dash-bg/50 border border-dash-border rounded-xl px-6 py-4 focus:outline-none focus:border-dash-accent transition-colors text-white"
                  />
                  <button 
                    type="submit"
                    className="px-8 py-4 bg-dash-accent text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-dash-accent/20"
                  >
                    Secure My Early Access
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-widest">
                  <Globe size={12} />
                  Join 500+ Strategists in the queue.
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Section 5: The Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 w-full max-w-4xl mx-auto space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Live Strategist Rankings</h2>
            <p className="text-slate-400">Refer your business school peers to jump to the top of the queue.</p>
          </div>

          <div className="glass-panel p-1 rounded-3xl border-dash-accent/10 overflow-hidden shadow-2xl">
            <iframe 
              scrolling="yes" 
              src="https://getlaunchlist.com/w/e/4Rp2qv/leaderboard" 
              style={{ width: '100%', display: 'block', border: 'none', height: '600px' }}
              title="LaunchList Leaderboard"
              className="rounded-2xl"
            ></iframe>
          </div>
        </motion.div>
      </main>

      {/* Section 6: The Footer */}
      <footer className="relative z-10 border-t border-dash-border py-12 bg-dash-bg/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Built by a business student with Gemini AI. Real-world strategy, $0 investment, zero textbooks.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex justify-center gap-6 text-slate-600">
              <span className="text-[10px] font-mono uppercase tracking-widest">© 2026 Grandmaster Intel</span>
              <span className="text-[10px] font-mono uppercase tracking-widest">Confidential Intel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
