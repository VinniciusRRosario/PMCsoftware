import { supabase } from './supabaseClient.js';

// Verifica sessão ao carregar a página
export async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    const path = window.location.pathname;
    // Verifica se está na página de login (considerando subpastas ou root)
    const isLoginPage = path.includes('login.html');

    if (!session && !isLoginPage) {
        // Se não tem sessão e não está no login -> Manda pro login
        window.location.href = '/login.html';
    } else if (session && isLoginPage) {
        // Se tem sessão e tenta acessar login -> Manda pro dashboard
        window.location.href = '/index.html';
    }
    
    return session;
}

// Monitoramento em tempo real (Segurança Extra)
// Se o usuário fizer logout em outra aba ou o token expirar, redireciona.
supabase.auth.onAuthStateChange((event, session) => {
    const isLoginPage = window.location.pathname.includes('login.html');

    if (event === 'SIGNED_OUT' && !isLoginPage) {
        window.location.href = '/login.html';
    }
    if (event === 'SIGNED_IN' && isLoginPage) {
        window.location.href = '/index.html';
    }
});

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao sair:', error);
    window.location.href = '/login.html';
}
