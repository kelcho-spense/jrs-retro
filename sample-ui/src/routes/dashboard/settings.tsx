import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Settings, Sun, Moon, Monitor, Bell, Globe, Palette, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/dashboard/settings')({
    component: SettingsPage,
})

type Theme = 'light' | 'dark' | 'system'

function SettingsPage() {
    const [theme, setTheme] = useState<Theme>('system')
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        marketing: false,
    })
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme) {
            setTheme(savedTheme)
        }
    }, [])

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (newTheme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.classList.toggle('dark', systemPrefersDark)
        } else {
            document.documentElement.classList.toggle('dark', newTheme === 'dark')
        }

        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
    }

    const themeOptions = [
        { value: 'light' as Theme, label: 'Light', icon: Sun },
        { value: 'dark' as Theme, label: 'Dark', icon: Moon },
        { value: 'system' as Theme, label: 'System', icon: Monitor },
    ]

    const notificationSettings = [
        {
            key: 'email' as const,
            label: 'Email Notifications',
            description: 'Receive important updates and security alerts via email.',
        },
        {
            key: 'push' as const,
            label: 'Push Notifications',
            description: 'Get real-time notifications in your browser.',
        },
        {
            key: 'marketing' as const,
            label: 'Marketing Emails',
            description: 'Receive news, tips, and special offers from us.',
        },
    ]

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Customize your experience and manage your preferences.
                </p>
            </div>

            {/* Save Confirmation */}
            {isSaved && (
                <div className="p-4 bg-green-500/10 dark:bg-green-400/10 border border-green-500/20 dark:border-green-400/20 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Settings saved!</span>
                </div>
            )}

            {/* Theme Settings */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-400/10 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose how the application looks to you.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-foreground">Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleThemeChange(option.value)}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${theme === option.value
                                    ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-500/5 dark:bg-cyan-400/5'
                                    : 'border-border hover:border-muted-foreground'
                                    }`}
                            >
                                <option.icon
                                    className={`w-6 h-6 ${theme === option.value
                                        ? 'text-cyan-500 dark:text-cyan-400'
                                        : 'text-muted-foreground'
                                        }`}
                                />
                                <span
                                    className={`text-sm font-medium ${theme === option.value
                                        ? 'text-cyan-600 dark:text-cyan-400'
                                        : 'text-foreground'
                                        }`}
                                >
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage how you receive notifications.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {notificationSettings.map((setting) => (
                        <div
                            key={setting.key}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                            <div>
                                <h3 className="font-medium text-foreground">{setting.label}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {setting.description}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setNotifications({
                                        ...notifications,
                                        [setting.key]: !notifications[setting.key],
                                    })
                                    setIsSaved(true)
                                    setTimeout(() => setIsSaved(false), 2000)
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[setting.key]
                                    ? 'bg-cyan-500 dark:bg-cyan-400'
                                    : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[setting.key]
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Language Settings */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-400/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Language & Region
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Set your preferred language and regional settings.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div>
                            <h3 className="font-medium text-foreground">Language</h3>
                            <p className="text-sm text-muted-foreground">English (US)</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Change
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div>
                            <h3 className="font-medium text-foreground">Timezone</h3>
                            <p className="text-sm text-muted-foreground">
                                {Intl.DateTimeFormat().resolvedOptions().timeZone}
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Change
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Data & Privacy</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your data and privacy settings.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                        Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                        Privacy Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                        Cookie Preferences
                    </Button>
                </div>
            </div>
        </div>
    )
}
