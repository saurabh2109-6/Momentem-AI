"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateService = void 0;
const common_1 = require("@nestjs/common");
let EmailTemplateService = class EmailTemplateService {
    getOtpTemplate(code) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Momentum AI Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #09090b;
            color: #f4f4f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            padding: 32px;
            border-radius: 24px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.05em;
            background: linear-gradient(to right, #6366f1, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 16px;
            text-align: center;
          }
          .otp-container {
            text-align: center;
            margin: 32px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #6366f1;
            padding: 12px 24px;
            border-radius: 16px;
            background-color: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            display: inline-block;
          }
          .alert {
            font-size: 12px;
            color: #a1a1aa;
            line-height: 1.6;
            margin-top: 24px;
            padding: 16px;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
          }
          .ignore-msg {
            font-size: 12px;
            color: #71717a;
            margin-top: 16px;
            text-align: center;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #71717a;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">MOMENTUM AI</span>
            <div class="title">Verify Your Security Session</div>
          </div>
          <p style="font-size: 14px; line-height: 1.5; color: #d4d4d8;">
            Please use the following secure one-time password (OTP) to complete your request. This code is valid for exactly <strong>5 minutes</strong>.
          </p>
          <div class="otp-container">
            <span class="otp-code">${code}</span>
          </div>
          <div class="alert">
            <strong>Security Warning:</strong> Never share this verification code with anyone. Momentum AI support agents will never request this PIN. If you did not trigger this login or signup block, change your security credentials immediately.
          </div>
          <p class="ignore-msg">
            If you did not request this email, you can safely ignore it. No actions will be taken on your account.
          </p>
          <div class="footer">
            Sent securely by Momentum AI © 2026. <br>
            For assistance, contact <a href="mailto:support@momentumai.app">support@momentumai.app</a>
          </div>
        </div>
      </body>
      </html>
    `;
    }
};
exports.EmailTemplateService = EmailTemplateService;
exports.EmailTemplateService = EmailTemplateService = __decorate([
    (0, common_1.Injectable)()
], EmailTemplateService);
//# sourceMappingURL=email.templates.js.map