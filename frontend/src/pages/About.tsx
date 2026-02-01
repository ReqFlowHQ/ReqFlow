import { Helmet } from "react-helmet-async";
import ReqFlowLogo from "../components/ReqFlowLogo";
export default function About() {
  return (
    <>
      <Helmet>
        <title>About ReqFlow · OpenGraph Labs</title>
        <meta
          name="description"
          content="Learn about ReqFlow, a modern API request and workflow tool built by OpenGraph Labs for developers who value clarity, speed, and design."
        />
      </Helmet>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-gray-300 leading-relaxed">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-14">
          <ReqFlowLogo className="w-14 h-14 text-white opacity-90" />


          <h1 className="text-3xl font-semibold text-white">
            About ReqFlow
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            A product by OpenGraph Labs
          </p>
        </div>

        <p className="mb-6">
          ReqFlow is a modern API request and workflow tool built for developers
          who want a faster, cleaner, and more focused alternative to traditional
          API testing platforms. It is designed to make working with HTTP APIs
          simple, transparent, and enjoyable — without unnecessary complexity.
        </p>

        <p className="mb-6">
          At its core, ReqFlow helps developers send HTTP requests, inspect
          structured responses, and manage API interactions with clarity.
          Whether you are testing endpoints, debugging integrations, or exploring
          new APIs, ReqFlow provides a streamlined environment that stays out of
          your way and lets you focus on the work that matters.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Built with developers in mind
        </h2>

        <p className="mb-6">
          ReqFlow is intentionally designed with a minimal and modern interface.
          Every interaction — from request configuration to response visualization —
          is built to reduce cognitive load and increase productivity.
          The goal is not to overwhelm users with features, but to provide
          the right tools at the right time.
        </p>

        <p className="mb-6">
          ReqFlow supports common HTTP methods, custom headers, authentication
          workflows, and clean JSON response formatting. The product continues
          to evolve with a strong focus on performance, usability, and developer
          experience.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          Security and authentication
        </h2>

        <p className="mb-6">
          ReqFlow uses trusted third-party authentication providers such as
          Google and GitHub for sign-in. User passwords are never collected or
          stored by ReqFlow. This approach reduces risk while providing a secure
          and familiar authentication experience.
        </p>

        <p className="mb-6">
          Protecting user data and respecting privacy are foundational principles.
          ReqFlow is built with security best practices in mind and avoids
          collecting unnecessary personal information.
        </p>

        <h2 className="text-xl font-semibold text-white mt-12 mb-4">
          About OpenGraph Labs
        </h2>

        <p className="mb-6">
          ReqFlow is a product of{" "}
          <span className="text-white">OpenGraph Labs</span>, an independent
          product studio focused on building modern, developer-first tools.
          OpenGraph Labs believes software tools should be powerful, intuitive,
          and thoughtfully designed.
        </p>

        <p className="mb-6">
          The mission of OpenGraph Labs is to create products that developers
          enjoy using every day — tools that feel reliable, fast, and intentional.
          ReqFlow is one step toward that vision.
        </p>

        <p className="text-sm text-gray-500 mt-12 text-center">
          © {new Date().getFullYear()} OpenGraph Labs. All rights reserved.
        </p>
      </div>
      </div>
    </>
  );
}
