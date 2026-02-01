import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service · ReqFlow | OpenGraph Labs</title>
        <meta
          name="description"
          content="Read the Terms of Service for ReqFlow, a modern API workflow tool built by OpenGraph Labs."
        />
      </Helmet>
	<div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-gray-300 leading-relaxed">
        <h1 className="text-3xl font-semibold text-white mb-8">
          Terms of Service
        </h1>

        <p className="mb-6 text-sm text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p className="mb-6">
          ReqFlow is a developer-focused software tool provided by{" "}
          <span className="text-white">OpenGraph Labs</span>. By accessing or
          using ReqFlow, you agree to be bound by the terms and conditions
          outlined below. If you do not agree with these terms, you should not
          use the service.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Use of the Service
        </h2>

        <p className="mb-6">
          ReqFlow is provided as an early-access developer tool intended for
          testing, inspecting, and managing HTTP APIs. You agree to use the
          service responsibly, in compliance with all applicable laws and
          regulations, and only for lawful purposes.
        </p>

        <p className="mb-6">
          You may not use ReqFlow to engage in any activity that is abusive,
          harmful, disruptive, or interferes with the operation of the service
          or the experience of other users.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Early Access and Availability
        </h2>

        <p className="mb-6">
          ReqFlow is currently offered in an early-access state. Features may
          change, be modified, or be removed at any time without prior notice.
          OpenGraph Labs does not guarantee uninterrupted availability of the
          service.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Accounts and Authentication
        </h2>

        <p className="mb-6">
          Authentication is provided through trusted third-party identity
          providers such as Google and GitHub. ReqFlow does not collect or store
          user passwords. You are responsible for maintaining the security of
          your authenticated account and access credentials.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Intellectual Property
        </h2>

        <p className="mb-6">
          All content, software, and branding associated with ReqFlow,
          including but not limited to logos, design elements, and source code,
          are the intellectual property of OpenGraph Labs unless otherwise
          stated. You may not copy, modify, or redistribute any part of the
          service without explicit permission.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Disclaimer of Warranties
        </h2>

        <p className="mb-6">
          ReqFlow is provided on an “as-is” and “as-available” basis. OpenGraph
          Labs makes no warranties, expressed or implied, regarding the
          reliability, accuracy, or suitability of the service for any
          particular purpose.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Limitation of Liability
        </h2>

        <p className="mb-6">
          To the maximum extent permitted by law, OpenGraph Labs shall not be
          liable for any direct, indirect, incidental, or consequential damages
          arising from the use or inability to use ReqFlow, including but not
          limited to data loss, service interruption, or business impact.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Changes to These Terms
        </h2>

        <p className="mb-6">
          OpenGraph Labs reserves the right to update or modify these Terms of
          Service at any time. Continued use of ReqFlow after changes have been
          published constitutes acceptance of the revised terms.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Contact
        </h2>

        <p className="mb-6">
          If you have any questions about these Terms of Service, please refer
          to the official ReqFlow website or contact OpenGraph Labs through the
          appropriate support channels.
        </p>

        <p className="text-sm text-gray-500 mt-16 text-center">
          © {new Date().getFullYear()} OpenGraph Labs. All rights reserved.
        </p>
      </div>
      </div>
    </>
  );
}
