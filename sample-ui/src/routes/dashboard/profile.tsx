import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { User, Mail, Camera, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/dashboard/profile')({
    component: ProfilePage,
})

function ProfilePage() {
    const { data: session } = authClient.useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [formData, setFormData] = useState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await authClient.updateUser({
                name: formData.name,
            })
            setIsSaved(true)
            setTimeout(() => setIsSaved(false), 3000)
        } catch (error) {
            console.error('Failed to update profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your personal information and account details.
                </p>
            </div>

            {/* Avatar Section */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Profile Photo</h2>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500/20 dark:border-cyan-400/20"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-cyan-500/20 dark:border-cyan-400/20">
                                {getInitials(session?.user?.name || 'U')}
                            </div>
                        )}
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-500 dark:bg-cyan-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <p className="text-foreground font-medium">Upload a new photo</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            JPG, PNG or GIF. Max size 2MB.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm">
                                Upload Photo
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                    Personal Information
                </h2>

                <div className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
                            <User className="w-4 h-4 text-muted-foreground" />
                            Full Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                            className="bg-background border-border focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20"
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            disabled
                            className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-sm text-muted-foreground">
                            Email address cannot be changed. Contact support if you need
                            assistance.
                        </p>
                    </div>

                    {/* Account Info */}
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-medium text-foreground mb-3">
                            Account Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Account ID</span>
                                <p className="text-foreground font-mono mt-1">
                                    {session?.user?.id?.slice(0, 8)}...
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Member Since</span>
                                <p className="text-foreground mt-1">
                                    {session?.user?.createdAt
                                        ? new Date(session.user.createdAt).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                    {isSaved && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm">Changes saved!</span>
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-white hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="bg-card rounded-xl border border-red-500/20 dark:border-red-400/20 p-6">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    Danger Zone
                </h2>
                <p className="text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                </p>
                <Button
                    variant="outline"
                    className="border-red-500/50 text-red-600 hover:bg-red-500/10 dark:border-red-400/50 dark:text-red-400 dark:hover:bg-red-400/10"
                >
                    Delete Account
                </Button>
            </div>
        </div>
    )
}
