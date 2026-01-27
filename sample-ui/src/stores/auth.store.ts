import { Store } from '@tanstack/react-store'

// Define the auth state shape
export interface AuthState {
    isLoading: boolean
    error: string | null
    successMessage: string | null
    isEmailVerificationSent: boolean
    isPasswordResetSent: boolean
}

// Create the initial state
const initialState: AuthState = {
    isLoading: false,
    error: null,
    successMessage: null,
    isEmailVerificationSent: false,
    isPasswordResetSent: false,
}

// Create the auth store
export const authStore = new Store<AuthState>(initialState)

// Store actions
export const authActions = {
    setLoading: (isLoading: boolean) => {
        authStore.setState((state) => ({
            ...state,
            isLoading,
        }))
    },

    setError: (error: string | null) => {
        authStore.setState((state) => ({
            ...state,
            error,
            successMessage: null,
        }))
    },

    setSuccess: (successMessage: string | null) => {
        authStore.setState((state) => ({
            ...state,
            successMessage,
            error: null,
        }))
    },

    setEmailVerificationSent: (sent: boolean) => {
        authStore.setState((state) => ({
            ...state,
            isEmailVerificationSent: sent,
        }))
    },

    setPasswordResetSent: (sent: boolean) => {
        authStore.setState((state) => ({
            ...state,
            isPasswordResetSent: sent,
        }))
    },

    reset: () => {
        authStore.setState(() => initialState)
    },
}
