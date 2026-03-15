import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { isApiInvalidCredentialsError, useAuthStore } from '../store/authStore';

interface LocationState {
    from?: string;
}

export const LoginPage: React.FC = () => {
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as LocationState | undefined)?.from ?? '/';

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await login({ email: email.trim(), password });
            navigate(from, { replace: true });
        } catch (err) {
            if (isApiInvalidCredentialsError(err)) {
                navigate(`/register?email=${encodeURIComponent(email.trim())}&reason=user-not-found`, { replace: true });
                return;
            }

            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-950">
            <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Sign in</h1>
                <p className="mt-2 text-sm text-neutral-500">Continue to your Wind workspace.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Email
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Password
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-neutral-500">
                    No account?{' '}
                    <Link to="/register" className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};
