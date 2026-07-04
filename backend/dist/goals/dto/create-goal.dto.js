"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGoalDto = exports.CreateGoalDto = exports.GoalPriority = exports.GoalStatus = void 0;
const class_validator_1 = require("class-validator");
var GoalStatus;
(function (GoalStatus) {
    GoalStatus["TODO"] = "TODO";
    GoalStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GoalStatus["COMPLETED"] = "COMPLETED";
    GoalStatus["MISSED"] = "MISSED";
    GoalStatus["ARCHIVED"] = "ARCHIVED";
})(GoalStatus || (exports.GoalStatus = GoalStatus = {}));
var GoalPriority;
(function (GoalPriority) {
    GoalPriority["LOW"] = "LOW";
    GoalPriority["MEDIUM"] = "MEDIUM";
    GoalPriority["HIGH"] = "HIGH";
    GoalPriority["URGENT"] = "URGENT";
})(GoalPriority || (exports.GoalPriority = GoalPriority = {}));
class CreateGoalDto {
    title;
    description;
    status;
    priority;
    category;
    colorLabel;
    estimatedTime;
    actualTime;
    startAt;
    endAt;
    isRecurring;
    recurrenceRule;
    parentId;
}
exports.CreateGoalDto = CreateGoalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Goal title is required' }),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(GoalStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(GoalPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "colorLabel", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateGoalDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateGoalDto.prototype, "actualTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Start date is required' }),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "startAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'End date is required' }),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "endAt", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateGoalDto.prototype, "isRecurring", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "recurrenceRule", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "parentId", void 0);
class UpdateGoalDto {
    title;
    description;
    status;
    priority;
    category;
    colorLabel;
    estimatedTime;
    actualTime;
    startAt;
    endAt;
    isRecurring;
    recurrenceRule;
    parentId;
}
exports.UpdateGoalDto = UpdateGoalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(GoalStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(GoalPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "colorLabel", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateGoalDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateGoalDto.prototype, "actualTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "startAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "endAt", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateGoalDto.prototype, "isRecurring", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "recurrenceRule", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateGoalDto.prototype, "parentId", void 0);
//# sourceMappingURL=create-goal.dto.js.map