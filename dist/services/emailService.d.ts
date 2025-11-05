declare class EmailService {
    private transporter;
    private useSendGrid;
    constructor();
    private initializeSendGrid;
    private initializeTransporter;
    sendMagicLink(email: string, magicLink: string, userName?: string): Promise<void>;
    private sendMagicLinkWithSendGrid;
    private sendMagicLinkWithNodemailer;
    sendWelcomeEmail(email: string, userName: string): Promise<void>;
    private sendWelcomeEmailWithSendGrid;
    private sendWelcomeEmailWithNodemailer;
    private getMagicLinkHtmlTemplate;
    private getMagicLinkTextTemplate;
    private getWelcomeHtmlTemplate;
    private getWelcomeTextTemplate;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=emailService.d.ts.map