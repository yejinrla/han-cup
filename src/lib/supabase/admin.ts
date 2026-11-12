import 'server-only';
import {createClient} from '@supabase/supabase-js';
export function adminClient(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.NEXT_PUBLIC_SUPABASE_URL)throw new Error('운영 연결이 준비되지 않았습니다.');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
