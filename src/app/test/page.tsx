import { supabase } from '@/utils/supabaseClient';

export default async function TestPage() {
  // call a built-in Supabase RPC that simply returns the DB version
  const { data, error } = await supabase.rpc('version');
  return (
    <main style={{ padding: 32 }}>
      <h1>Supabase ping</h1>
      {error ? (
        <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}
