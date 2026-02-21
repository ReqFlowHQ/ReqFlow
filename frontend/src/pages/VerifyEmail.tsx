import { Helmet } from "react-helmet-async";
import { useParams, useSearchParams } from "react-router-dom";
import SafeLink from "../components/SafeLink";

export default function VerifyEmail() {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get("token");

  return (
    <>
      <Helmet>
        <title>Verify Email · ReqFlow</title>
        <meta
          name="description"
          content="ReqFlow uses OAuth login. Email verification links are deprecated."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="flex h-screen items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-900">
        <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-md dark:bg-gray-800">
          <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Verification link received
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            ReqFlow currently uses OAuth sign-in (Google/GitHub), so manual email
            verification is not required.
          </p>

          {token ? (
            <p className="mt-3 break-all text-xs text-slate-500 dark:text-slate-400">
              Token: {token}
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              No verification token was provided.
            </p>
          )}

          <div className="mt-6">
            <SafeLink
              to="/login"
              className="inline-flex rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
            >
              Go to Login
            </SafeLink>
          </div>
        </div>
      </div>
    </>
  );
}
