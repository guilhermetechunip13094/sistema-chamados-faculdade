using Microsoft.Extensions.Options;
using SistemaChamados.Configuration;
using System.Net;
using System.Net.Mail;

namespace SistemaChamados.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            var fromAddress = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName);
            var toAddress = new MailAddress(toEmail);

            var smtp = new SmtpClient
            {
                Host = _emailSettings.SmtpServer,
                Port = _emailSettings.Port,
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(fromAddress.Address, _emailSettings.Password)
            };

            using (var mailMessage = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = message,
                IsBodyHtml = true // Permite enviar HTML no corpo do e-mail
            })
            {
                await smtp.SendMailAsync(mailMessage);
            }
        }
    }
}