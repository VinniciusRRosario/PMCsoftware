import { supabase } from './supabaseClient.js';

// Verifica sessão ao carregar a página
export async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    const path = window.location.pathname;
    // Verifica se está na página de login (considerando subpastas ou root)
    const isLoginPage = path.includes('login.html');

    if (!session && !isLoginPage) {
        // CORRIGIDO: Removida a barra '/' do início
        window.location.href = 'login.html';
    } else if (session && isLoginPage) {
        // CORRIGIDO: Removida a barra '/' do início
        window.location.href = 'index.html';
    }
    
    return session;
}

// Monitoramento em tempo real (Segurança Extra)
supabase.auth.onAuthStateChange((event, session) => {
    const isLoginPage = window.location.pathname.includes('login.html');

    if (event === 'SIGNED_OUT' && !isLoginPage) {
        // CORRIGIDO: Removida a barra '/' do início
        window.location.href = 'login.html';
    }
    if (event === 'SIGNED_IN' && isLoginPage) {
        // CORRIGIDO: Removida a barra '/' do início
        window.location.href = 'index.html';
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
    // CORRIGIDO: Removida a barra '/' do início
    window.location.href = 'login.html';
}