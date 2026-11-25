export declare class CheckEmailDto {
    email: string;
}
export declare class RequestOtpDto {
    email: string;
    purpose?: 'login' | 'register';
}
export declare class VerifyOtpDto {
    email: string;
    code: string;
    purpose?: 'login' | 'register';
}
