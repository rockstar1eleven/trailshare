import { supabase } from '../../lib/supabase';

export type ReportRow = {
  id: string;
  user_id: string | null;
  trail_name: string;
  area: string | null;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert' | null;
  date_hiked: string;
  miles: number | null;
  elevation: number | null;
  conditions: string[];
  trail_types: string[];
  rating: number | null;
  hazards: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  helpful: number;
  created_at: string;
};

export async function listReports() {
  const { data, error } = await supabase.from('reports')
    .select('*, report_images(url), comments(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function insertReport(row: Partial<ReportRow>, imageUrls: string[]) {
  const user = (await supabase.auth.getUser()).data.user;
  const payload = { ...row, user_id: user ? user.id : null };
  const { data, error } = await supabase.from('reports').insert(payload).select().single();
  if (error) throw error;
  if (imageUrls.length) {
    const imgs = imageUrls.map((url) => ({ report_id: data.id, url }));
    const { error: e2 } = await supabase.from('report_images').insert(imgs);
    if (e2) throw e2;
  }
  return data as ReportRow;
}

export async function addHelpful(id: string) {
  const { error } = await supabase.rpc('increment_helpful', { rid: id });
  if (error) throw error;
}
