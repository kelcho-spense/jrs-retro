import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/auth/verify-email')({
    component: VerifyEmailPage,
    validateSearch: (search: Record<string, unknown>) => ({
        token: (search.token as string) || '',
    }),
})

function VerifyEmailPage() {
    const { token } = useSearch({ from: '/auth/verify-email' })
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setStatus('no-token')
            return
        }

        const verifyEmail = async () => {
            try {
                await authClient.verifyEmail({
                    query: { token },
                })
                setStatus('success')
            } catch (err: any) {
                setError(err.message || 'Failed to verify email')
                setStatus('error')
            }
        }

        verifyEmail()
    }, [token])

    const handleResendVerification = async () => {
        try {
            setStatus('loading')
            await authClient.sendVerificationEmail({
                email: '', // This would need the user's email
                callbackURL: '/auth/verify-email',
            })
            // Show success message for resend
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification email')
            setStatus('error')
        }
    }

    if (status === 'loading') {
        return (
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 mx-auto bg-cyan-500/10 dark:bg-cyan-400/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-cyan-500 dark:text-cyan-400 animate-spin" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Verifying your email</h2>
                    <p className="text-muted-foreground mt-2">Please wait a moment...</p>
                </div>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-green-500/10 dark:bg-green-400/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Email verified!</h2>
                    <p className="text-muted-foreground mt-2">
                        Your email has been successfully verified.
                        <br />
                        You can now access all features of your account.
                    </p>
                </div>

                <Link to="/dashboard">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-white hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600">
                        Go to Dashboard
                    </Button>
                </Link>
            </div>
        )
    }

    if (status === 'no-token') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-amber-500/10 dark:bg-amber-400/10 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Verify your email</h2>
                    <p className="text-muted-foreground mt-2">
                        Please check your email for the verification link.
                        <br />
                        Click the link to verify your email address.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                        Didn't receive the email?
                    </p>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleResendVerification}
                    >
                        Resend Verification Email
                    </Button>
                </div>

                <Link
                    to="/auth/login"
                    className="block text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    Back to sign in
                </Link>
            </div>
        )
    }

    // Error state
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-500/10 dark:bg-red-400/10 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Verification failed</h2>
                <p className="text-muted-foreground mt-2">
                    {error || 'The verification link is invalid or has expired.'}
                </p>
            </div>

            <div className="space-y-3">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendVerification}
                >
                    Request New Verification Link
                </Button>
                <Link to="/auth/login">
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground"
                    >
                        Back to sign in
                    </Button>
                </Link>
            </div>
        </div>
    )
}
