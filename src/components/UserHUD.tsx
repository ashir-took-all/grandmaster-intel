import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Trophy, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface Profile {
  id: string;
  username: string;
  email: string;
  high_score: number;
}

export const UserHUD = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const newProfile = {
            id: user.id,
            username: user.user_metadata.username || user.email?.split('@')[0] || 'STRATEGIST',
            email: user.email || '',
            high_score: 0,
          };
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
          
          if (!createError) setProfile(createdProfile);
        } else if (profileData) {
          setProfile(profileData);
        }

        // Fetch rank (simple count of users with higher score + 1)
        if (profileData || user) {
          const score = profileData?.high_score || 0;
          const { count, error: rankError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('high_score', score);
          
          if (!rankError) setRank((count || 0) + 1);
        }
      }
      setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
        setRank(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return null;
  if (!profile) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-2 px-4 glass-panel border border-dash-accent/20 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.1)]"
    >
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold text-dash-accent uppercase tracking-widest">{profile.username}</div>
          <div className="w-2 h-2 rounded-full bg-dash-accent animate-pulse" />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-[8px] text-slate-500 font-mono uppercase tracking-tighter">
            <Trophy size={10} className="text-dash-gold" />
            Rank: {rank ? `#${rank}` : 'N/A'}
          </div>
          <div className="flex items-center gap-1 text-[8px] text-slate-500 font-mono uppercase tracking-tighter">
            <Globe size={10} className="text-dash-accent" />
            Score: {profile.high_score}
          </div>
        </div>
      </div>
      
      <div className="h-8 w-px bg-white/10 mx-1" />
      
      <button 
        onClick={handleLogout}
        className="p-2 bg-white/5 border border-white/10 rounded hover:bg-red-500/20 hover:border-red-500/30 transition-all text-slate-500 hover:text-red-400 group"
        title="Terminate Session"
      >
        <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
};
