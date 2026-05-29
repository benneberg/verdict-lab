import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const broadcastExperimentUpdate = async (userId: string, data: any) => {
  if (supabase) {
    const channel = supabase.channel(`user-${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'experiment:complete',
      payload: data,
    });
  }
};

export const subscribeToExperimentUpdates = (userId: string, callback: (data: any) => void) => {
  if (supabase) {
    const channel = supabase.channel(`user-${userId}`);
    channel
      .on('broadcast', { event: 'experiment:complete' }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }
  return () => {};
};
