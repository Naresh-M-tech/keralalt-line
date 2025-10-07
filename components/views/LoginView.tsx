
import React, { useState, useEffect } from 'react';
import { supabase } from '../../App';

type LoginType = 'Operator' | 'Customer';
type ViewState = 'signin' | 'signup' | 'forgot_password' | 'post_signup';

interface LoginViewProps {
    justVerified?: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ justVerified = false }) => {
    const [loginType, setLoginType] = useState<LoginType>('Operator');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [view, setView] = useState<ViewState>('signin');
    
    useEffect(() => {
        if (justVerified) {
            setMessage({ text: 'Your email has been verified successfully! You can now sign in.', type: 'success' });
        }
    }, [justVerified]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setMessage({ text: error.message, type: 'error' });
        }
        setLoading(false);
    };
    
    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setView('post_signup');
        }
        setLoading(false);
    };

    const handlePasswordResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        if (error) {
            setMessage({ text: `Error: ${error.message}`, type: 'error' });
        } else {
            setMessage({ text: `If an account with that email exists, a password reset link has been sent.`, type: 'success' });
        }
        setLoading(false);
    };

    const clearState = () => {
        setEmail('');
        setPassword('');
        setMessage(null);
    };
    
    const switchView = (newView: ViewState) => {
        clearState();
        setView(newView);
    };

    const renderSignInForm = () => (
        <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    {loginType === 'Operator' ? 'Operator Email' : 'Customer Email'}
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                    placeholder="e.g., operator@ksebl.in"
                />
            </div>

            <div>
                <label htmlFor="password"className="block text-sm font-medium text-gray-300">Password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                />
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <a href="#" onClick={(e) => { e.preventDefault(); switchView('forgot_password'); }} className="font-medium text-blue-400 hover:text-blue-300">
                    Forgot password?
                </a>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-sm text-center">
                <span className="text-gray-400">Don't have an account? </span>
                <a href="#" onClick={(e) => { e.preventDefault(); switchView('signup'); }} className="font-medium text-blue-400 hover:text-blue-300">
                    Sign Up
                </a>
            </div>
        </form>
    );

    const renderSignUpForm = () => (
         <form onSubmit={handleSignUpSubmit} className="space-y-6">
            <div className="text-center mb-4">
                 <h3 className="text-xl font-bold text-white">Create Account</h3>
                 <p className="text-sm text-gray-400 mt-1">For Customers & Electricians</p>
            </div>
            <div>
                <label htmlFor="email-signup" className="block text-sm font-medium text-gray-300">Email Address</label>
                <input id="email-signup" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white" />
            </div>
            <div>
                <label htmlFor="password-signup" className="block text-sm font-medium text-gray-300">Password</label>
                <input id="password-signup" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white" />
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            <div className="text-sm text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); switchView('signin'); }} className="font-medium text-blue-400 hover:text-blue-300">Back to Sign In</a>
            </div>
        </form>
    );

    const renderForgotPasswordForm = () => (
        <form onSubmit={handlePasswordResetRequest} className="space-y-6">
            <div className="text-center mb-4">
                 <h3 className="text-xl font-bold text-white">Reset Password</h3>
                 <p className="text-sm text-gray-400 mt-1">Enter your email for a reset link.</p>
            </div>
            <div>
                <label htmlFor="email-reset" className="block text-sm font-medium text-gray-300">Email Address</label>
                <input id="email-reset" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white" />
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-sm text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); switchView('signin'); }} className="font-medium text-blue-400 hover:text-blue-300">Back to Sign In</a>
            </div>
        </form>
    );
    
    const renderPostSignUpMessage = () => (
        <div className="text-center">
            <h3 className="text-xl font-bold text-white">Check Your Email</h3>
            <p className="text-sm text-green-400 mt-2">A verification link has been sent to your email address. Please click the link to activate your account.</p>
            <button onClick={() => switchView('signin')} className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Back to Sign In
            </button>
        </div>
    );
    
    const renderContent = () => {
        switch (view) {
            case 'signin':
                return renderSignInForm();
            case 'signup':
                 return renderSignUpForm();
            case 'forgot_password':
                return renderForgotPasswordForm();
            case 'post_signup':
                return renderPostSignUpMessage();
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <img className="mx-auto h-12 w-auto rounded-full" src="https://picsum.photos/48/48" alt="KSEBL Logo" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    KSEBL Grid Intelligence Platform
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
                    {message && (
                        <div className={`p-4 mb-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                           {message.text}
                        </div>
                    )}
                    {view === 'signin' && (
                        <div className="mb-6">
                            <div className="flex border-b border-gray-700">
                                <button
                                    onClick={() => setLoginType('Operator')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${loginType === 'Operator' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    Grid Operator
                                </button>
                                <button
                                    onClick={() => setLoginType('Customer')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${loginType === 'Customer' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    Customer / Electrician
                                </button>
                            </div>
                        </div>
                    )}
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default LoginView;
