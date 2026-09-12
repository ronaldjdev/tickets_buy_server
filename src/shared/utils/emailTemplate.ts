interface EmailTemplateProps {
	title: string;
	content: string;
	actionUrl?: string;
	actionText?: string;
}

export const getHtmlTemplate = ({
	title,
	content,
	actionUrl,
	actionText,
}: EmailTemplateProps): string => {
	const logoUrl = `https://res.cloudinary.com/der1bbrbc/image/upload/v1766040211/ChatGPT_Image_13_ago_2025_11_44_41_p.m._crxpo6.png`;
	const year = new Date().getFullYear();

	return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #ffffff;
      color: #09090b;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
      line-height: 1.5;
    }
    .email-wrapper {
      width: 100%;
      padding: 40px 20px;
      background-color: #ffffff;
    }
    .email-container {
      max-width: 480px;
      margin: 0 auto;
    }
    .email-header {
      margin-bottom: 32px;
    }
    .email-header img {
      height: 32px;
      width: auto;
    }
    .email-body {
      margin-bottom: 32px;
    }
    .email-body h1 {
      color: #09090b;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.025em;
      margin-top: 0;
      margin-bottom: 24px;
      text-align: left;
    }
    .email-body p {
      font-size: 16px;
      line-height: 24px;
      color: #3f3f46;
      margin-bottom: 24px;
      text-align: left;
    }
    .action-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #18181b;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      text-align: center;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    .email-footer {
      border-top: 1px solid #e4e4e7;
      padding-top: 32px;
      color: #71717a;
      font-size: 12px;
      text-align: left;
    }
    .email-footer p {
      margin: 0;
      margin-bottom: 8px;
    }
    .email-footer a {
      color: #71717a;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <a href="https://www.dashboard.celux.com.co" target="_blank">
          <img src="${logoUrl}" alt="Celux Logo">
        </a>
      </div>

      <!-- Body -->
      <div class="email-body">
        <h1>${title}</h1>
        ${content}
        
        ${
					actionUrl && actionText
						? `<a href="${actionUrl}" class="action-button">${actionText}</a>`
						: ""
				}
        
        <p style="font-size: 14px; color: #71717a; margin-top: 32px;">
          Si no solicitaste este correo, puedes ignorarlo con seguridad.
        </p>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p>&copy; ${year} Celux. Todos los derechos reservados.</p>
        <p>
          <a href="https://www.dashboard.celux.com.co">Celux</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
