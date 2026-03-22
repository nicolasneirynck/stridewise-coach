import { isAxiosError } from 'axios';

interface ErrorProps {
  error: unknown
}

export default function Error({ error }: ErrorProps) {
  if (isAxiosError(error)) {
    return (
      <div className='mb-4 rounded-2xl border border-red-200 bg-red-50 p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-red-700'>
          Connection Error
        </p>
        <h4 className='mt-2 text-lg font-semibold text-red-900'>Oops, something went wrong</h4>
        <p className='text-red-700'>
          {error?.response?.data?.message || error.message}
          {error?.response?.data?.details && (
            <>
              :
              <br />
              {JSON.stringify(error.response.data.details)}
            </>
          )}
        </p>
      </div>
    );
  }
  if (error) {
    const genericError = error as { message?: string }

    return (
      <div className='mb-4 rounded-2xl border border-red-200 bg-red-50 p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-red-700'>
          Connection Error
        </p>
        <h4 className='mt-2 text-lg font-semibold text-red-900'>An unexpected error occured</h4>
        <p className='mt-2 text-red-700'>{genericError.message || JSON.stringify(error)}</p>
      </div >
    );
  }

  return null;
}
