import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export const RegisterPage: React.FC = () => {
    const { register } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState(searchParams.get('email') ?? '');
    const [password, setPassword] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const reason = searchParams.get('reason');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await register({ name: name.trim(), email: email.trim(), password });
            navigate('/', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-950">
            <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Create account</h1>
                <p className="mt-2 text-sm text-neutral-500">Set up your Wind account and continue.</p>

                {reason === 'user-not-found' ? (
                    <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        User not found. Please register first.
                    </p>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Name
                        <input
                            type="text"
                            required
                            minLength={2}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

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
                        {isSubmitting ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-neutral-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};
