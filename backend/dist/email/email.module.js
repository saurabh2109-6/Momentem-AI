"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const email_templates_1 = require("./email.templates");
const email_service_interface_1 = require("./interfaces/email-service.interface");
const email_service_1 = require("./email.service");
const email_provider_1 = require("./email.provider");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        providers: [
            email_templates_1.EmailTemplateService,
            email_provider_1.mailerProvider,
            {
                provide: email_service_interface_1.EmailService,
                useClass: email_service_1.EmailServiceImpl,
            },
        ],
        exports: [email_service_interface_1.EmailService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map