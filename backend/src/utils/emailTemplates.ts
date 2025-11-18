// FILE: backend/src/utils/emailTemplates.ts
export const verificationEmailTemplate = (userName: string, verifyLink: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Verify Your ReqFlow Account</title>
    <style>
      body {
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: linear-gradient(135deg, #5b21b6, #7c3aed, #0ea5e9);
        color: #f9fafb;
        margin: 0;
        padding: 0;
      }
      .container {
        background: #111827;
        border-radius: 12px;
        margin: 50px auto;
        max-width: 480px;
        padding: 30px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        background: linear-gradient(90deg, #818cf8, #c084fc, #5eead4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .button {
        display: block;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
        text-align: center;
        padding: 14px 0;
        border-radius: 8px;
        color: white;
        text-decoration: none;
        font-weight: 600;
        margin-top: 24px;
      }
      p {
        color: #e5e7eb;
        font-size: 15px;
        line-height: 1.6;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        margin-top: 40px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">ReqFlow</div>
      </div>
      <p>Hi ${userName},</p>
      <p>Thanks for signing up for <strong>ReqFlow</strong> — your self-hosted API testing companion.</p>
      <p>To activate your account, please verify your email address by clicking the button below:</p>
      <a href="${verifyLink}" class="button">Verify My Email</a>
      <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${verifyLink}" style="color:#38bdf8;">${verifyLink}</a></p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ReqFlow. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
