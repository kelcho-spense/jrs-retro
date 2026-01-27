import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/auth/reset-password')({
    component: ResetPasswordPage,
    validateSearch: (search: Record<string, unknown>) => ({
        token: (search.token as string) || '',
    }),
})

function ResetPasswordPage() {
    const navigate = useNavigate()
    const { token } = useSearch({ from: '/auth/reset-password' })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    })

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains a number', met: /\d/.test(formData.password) },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (!token) {
            setError('Invalid or missing reset token')
            return
        }

        setIsLoading(true)

        try {
            await authClient.resetPassword({
                newPassword: formData.password,
                token,
            })
            setIsSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-green-500/10 dark:bg-green-400/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Password reset!</h2>
                    <p className="text-muted-foreground mt-2">
                        Your password has been successfully reset.
                        <br />
                        You can now sign in with your new password.
                    </p>
                </div>

                <Button
                    onClick={() => navigate({ to: '/auth/login' })}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-white hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600"
                >
                    Go to Sign In
                </Button>
            </div>
        )
    }

    if (!token) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 dark:bg-red-400/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Invalid Link</h2>
                    <p className="text-muted-foreground mt-2">
                        This password reset link is invalid or has expired.
                        <br />
                        Please request a new one.
                    </p>
                </div>

                <Link to="/auth/forgot-password">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-white hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600">
                        Request New Link
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
                <p className="text-muted-foreground mt-2">
                    Your new password must be different from previously used passwords.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 dark:bg-red-400/10 border border-red-500/20 dark:border-red-400/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                        New Password
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            className="pl-10 pr-10 bg-background border-border focus:border-cyan-500 dark:focus:border-cyan-400"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="mt-2 space-y-1">
                            {passwordRequirements.map((req, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2
                                        className={`w-4 h-4 ${req.met
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-muted-foreground'
                                            }`}
                                    />
                                    <span
                                        className={
                                            req.met
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {req.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">
                        Confirm Password
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            className="pl-10 pr-10 bg-background border-border focus:border-cyan-500 dark:focus:border-cyan-400"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-white hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resetting...
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </Button>
            </form>
        </div>
    )
}
