export declare abstract class EmailService {
    abstract sendOtpMail(to: string, code: string): Promise<void>;
}
