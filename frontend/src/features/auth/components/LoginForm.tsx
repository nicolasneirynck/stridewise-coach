import { useState } from 'react'
import axios from 'axios'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { login } from '../api/auth'

type LoginFormValues = {
  email: string
  password: string
}

type LoginFormProps = {
  onLoginSuccess: (token: string) => void
}

const AUTH_TOKEN_STORAGE_KEY = 'stridewise_auth_token'

const developerAccounts = {
  user: {
    email: 'user@stridewise.local',
    password: 'User123!',
    label: 'Developer login: User',
  },
  admin: {
    email: 'admin@stridewise.local',
    password: 'Admin123!',
    label: 'Developer login: Admin',
  },
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormValues>({ mode: 'onChange' })

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setLoginError(null)
    setLoginSuccess(null)

    try {
      const response = await login(values)
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token)
      onLoginSuccess(response.token)
      setLoginSuccess('Signed in succesfully.')
      reset()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setLoginError(error.response?.data?.message ?? 'Login failed.')
        return
      }

      setLoginError('Could not reach the backend. Is the API running?')
    }
  }

  function fillDeveloperLogin(account: keyof typeof developerAccounts) {
    const selectedAccount = developerAccounts[account]

    setValue('email', selectedAccount.email, { shouldValidate: true })
    setValue('password', selectedAccount.password, { shouldValidate: true })
    setLoginError(null)
    setLoginSuccess(null)
  }

  return (
    <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          StrideWise Coach
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          Sign in
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Welcome back. Enter your details to continue to the dashboard.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Developer shortcuts
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => fillDeveloperLogin('user')}
            className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-amber-400 hover:text-zinc-950"
          >
            {developerAccounts.user.label}
          </button>
          <button
            type="button"
            onClick={() => fillDeveloperLogin('admin')}
            className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-amber-400 hover:text-zinc-950"
          >
            {developerAccounts.admin.label}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            {...register('password', { required: 'Password is required' })}
            type="password"
            className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-amber-500 focus:bg-white"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </label>

        {loginError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loginError}
          </p>
        )}

        {loginSuccess && (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {loginSuccess}
          </p>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </section>
  )
}
