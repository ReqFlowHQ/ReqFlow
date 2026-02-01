import { Helmet } from "react-helmet-async";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy · ReqFlow | OpenGraph Labs</title>
        <meta
          name="description"
          content="Read the Privacy Policy for ReqFlow, a modern API workflow tool built by OpenGraph Labs. Learn how user data is handled and protected."
        />
      </Helmet>
	<div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-gray-300 leading-relaxed">
        <h1 className="text-3xl font-semibold text-white mb-8">
          Privacy Policy
        </h1>

        <p className="mb-6 text-sm text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p className="mb-6">
          ReqFlow is a developer-focused software tool provided by{" "}
          <span className="text-white">OpenGraph Labs</span>. This Privacy Policy
          explains how information is collected, used, and protected when you
          access or use ReqFlow.
        </p>

        <p className="mb-6">
          OpenGraph Labs is committed to respecting user privacy and minimizing
          data collection. ReqFlow is designed to function with the least amount
          of personal information necessary.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Information We Collect
        </h2>

        <p className="mb-6">
          ReqFlow does not collect or store user passwords. Authentication is
          handled securely through trusted third-party identity providers such as
          Google and GitHub using OAuth.
        </p>

        <p className="mb-6">
          When you sign in, ReqFlow may receive basic account information from
          these providers, such as your name, email address, and profile image.
          This information is used solely for account identification and core
          application functionality.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          How Information Is Used
        </h2>

        <p className="mb-6">
          Any information collected is used exclusively to operate, maintain,
          and improve ReqFlow. This includes identifying user accounts, enabling
          authentication, and ensuring the proper functioning of the service.
        </p>

        <p className="mb-6">
          ReqFlow does not sell, rent, or trade user data. Personal information
          is never used for advertising or marketing purposes.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Data Storage and Security
        </h2>

        <p className="mb-6">
          OpenGraph Labs takes reasonable technical and organizational measures
          to protect user information from unauthorized access, disclosure, or
          misuse. However, no system can be guaranteed to be completely secure,
          and users acknowledge this inherent risk.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Third-Party Services
        </h2>

        <p className="mb-6">
          ReqFlow relies on third-party services such as Google and GitHub for
          authentication. These services operate under their own privacy
          policies, and users are encouraged to review them independently.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Changes to This Privacy Policy
        </h2>

        <p className="mb-6">
          OpenGraph Labs may update this Privacy Policy from time to time. Any
          changes will be reflected on this page. Continued use of ReqFlow after
          updates have been published constitutes acceptance of the revised
          policy.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Contact
        </h2>

        <p className="mb-6">
          If you have any questions or concerns about this Privacy Policy or how
          ReqFlow handles data, please refer to the official ReqFlow website or
          contact OpenGraph Labs through the appropriate support channels.
        </p>

        <p className="text-sm text-gray-500 mt-16 text-center">
          © {new Date().getFullYear()} OpenGraph Labs. All rights reserved.
        </p>
      </div>
      </div>
    </>
  );
}
