const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jlucrpzpacmlnmqfdana.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdWNycHpwYWNtbG5tcWZkYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDkwOTIsImV4cCI6MjA5NjEyNTA5Mn0.5zHjJZhU-_Q_iSydaoDI5VBsp4dobuXo2uGGkJUbxqw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log("Testing sign in for vendedor@allvino.com...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'vendedor@allvino.com',
    password: 'Allvino#b2b'
  });

  if (error) {
    console.error("Auth sign in error:", error.message);
    return;
  }

  console.log("Auth signed in successfully! User ID:", data.user.id);
  console.log("Retrieving profile from admin_users...");

  const { data: profile, error: profileError } = await supabase
    .from('admin_users')
    .select('ativo, role, nome')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error("Profile query error:", profileError.message);
    console.error("Full profile error object:", profileError);
  } else {
    console.log("Profile retrieved successfully:", profile);
  }
}

testLogin();
