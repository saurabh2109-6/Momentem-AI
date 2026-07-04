"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailServiceImpl_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const email_templates_1 = require("./email.templates");
const email_provider_1 = require("./email.provider");
let EmailServiceImpl = EmailServiceImpl_1 = class EmailServiceImpl {
    transporter;
    templates;
    config;
    logger = new common_1.Logger(EmailServiceImpl_1.name);
    constructor(transporter, templates, config) {
        this.transporter = transporter;
        this.templates = templates;
        this.config = config;
        this.verifySmtpConnection();
    }
    async verifySmtpConnection() {
        const user = this.config.get('EMAIL_USER');
        const pass = this.config.get('EMAIL_PASS');
        if (!user || !pass) {
            this.logger.warn('EMAIL_USER or EMAIL_PASS environment variables are missing. Console fallback will be active in development.');
            return;
        }
        try {
            await this.transporter.verify();
            this.logger.log('SMTP connection established and verified successfully.');
        }
        catch (err) {
            this.logger.error(`SMTP Connection failed: ${err.message}. Please check EMAIL_USER/EMAIL_PASS credentials.`);
        }
    }
    async sendOtpMail(to, code) {
        const from = this.config.get('EMAIL_FROM') || 'Momentum AI <noreply@momentum.app>';
        const htmlContent = this.templates.getOtpTemplate(code);
        const mailOptions = {
            from,
            to,
            subject: 'Momentum AI Verification Code',
            html: htmlContent,
            text: `Your Momentum AI Verification Code is: ${code}. Valid for 5 minutes.`,
        };
        const isProduction = this.config.get('NODE_ENV') === 'production';
        const emailUser = this.config.get('EMAIL_USER');
        const emailPass = this.config.get('EMAIL_PASS');
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                this.logger.log(`SMTP Delivery Attempt ${attempt}/${maxAttempts} for ${to}`);
                if (!isProduction) {
                    this.logger.log(`[DEV ONLY] OTP code is: ${code}`);
                }
                if (!emailUser || !emailPass) {
                    throw new Error('SMTP credentials are not configured');
                }
                await this.transporter.sendMail(mailOptions);
                this.logger.log(`Email Sent successfully to ${to}`);
                return;
            }
            catch (err) {
                this.logger.error(`Email Failed (Attempt ${attempt}/${maxAttempts}) to ${to}. Error: ${err.message}`);
                if (!isProduction || !emailUser || !emailPass) {
                    this.logger.warn(`[LOCAL FALLBACK ACTIVE] Printed verification code above. Bypassing SMTP exception for development.`);
                    return;
                }
                if (attempt === maxAttempts) {
                    throw new common_1.InternalServerErrorException(`Failed to send verification OTP email: ${err.message}`);
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    }
};
exports.EmailServiceImpl = EmailServiceImpl;
exports.EmailServiceImpl = EmailServiceImpl = EmailServiceImpl_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(email_provider_1.MAILER_TRANSPORTER)),
    __metadata("design:paramtypes", [Object, email_templates_1.EmailTemplateService,
        config_1.ConfigService])
], EmailServiceImpl);
//# sourceMappingURL=email.service.js.map