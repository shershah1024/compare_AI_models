// File: utils/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ModelPrice {
  model_name: string;
  input_price: number;
  output_price: number;
  provider: string;
}

export const fetchModelPrices = async (): Promise<ModelPrice[]> => {
  const { data, error } = await supabase.rpc('get_all_model_prices');
  if (error) throw error;
  return data;
};

export const upsertModelPrice = async (model: {
    name: string;
    input: number;
    output: number;
    provider: string;
  }): Promise<ModelPrice> => {
    const { data, error } = await supabase
      .rpc('upsert_model_price', {
        p_model_name: model.name,
        p_input_price: model.input,
        p_output_price: model.output,
        p_provider: model.provider
      });
  
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No data returned from upsert operation');
    return data[0] as ModelPrice;
  };
  
  

  export const subscribeToModelPrices = (callback: (payload: any) => void) => {
    const channel = supabase.channel('custom-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_model_prices' },
        callback
      )
      .subscribe();
  
    return channel;
  };
  