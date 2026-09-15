interface EmailTemplateBranding {
	brandName?: string;
	logoUrl?: string;
	siteUrl?: string;
}

interface EmailTemplateProps extends EmailTemplateBranding {
	title: string;
	content: string;
	actionUrl?: string;
	actionText?: string;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

export const getHtmlTemplate = ({
	title,
	content,
	actionUrl,
	actionText,
	brandName = "Chevere Max",
	logoUrl,
	siteUrl = "https://www.cheveremax.com",
}: EmailTemplateProps): string => {
	const year = new Date().getFullYear();

	const logoMark = logoUrl?.trim()
		? `<img src="${escapeAttr(logoUrl.trim())}" alt="${escapeHtml(
				brandName,
			)}" width="auto" style="border:0;display:inline-block;max-height:26px;max-width:200px;width:auto;height:auto;" />`
		: `<span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#121212;font-size:16px;font-weight:800;letter-spacing:0.02em;line-height:1;">${escapeHtml(
				brandName,
			)}</span>`;

	const actionButton =
		actionUrl && actionText
			? `<a href="${escapeAttr(actionUrl)}" target="_blank" style="display:inline-block;margin-top:24px;padding:13px 28px;background-color:#d4af37;color:#121212 !important;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;border-radius:999px;">${escapeHtml(
					actionText,
				)}</a>`
			: "";

	return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1e8;-webkit-text-size-adjust:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="width:100%;padding:36px 12px;box-sizing:border-box;background-color:#f4f1e8;">
    <div style="max-width:540px;margin:0 auto;">

      <div style="background-color:#ffffff;border-radius:16px;box-shadow:0 12px 32px rgba(18,18,18,0.08);">

        <!-- Stub / faja superior con la marca -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background-color:#121212;border-radius:16px 16px 0 0;">
          <tr>
            <td style="padding:20px 22px 18px;border-bottom:1px dashed rgba(212,175,55,0.45);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="display:inline-block;background-color:#ffffff;border-radius:10px;padding:8px 14px;line-height:1;">${logoMark}</span>
                  </td>
                  <td align="right" style="vertical-align:middle;color:#d4af37;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;white-space:nowrap;padding-left:8px;">Boleta digital</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Perforación (muescas laterales) -->
        <div style="position:relative;height:16px;">
          <div style="position:absolute;left:-15px;top:-15px;width:30px;height:30px;border-radius:50%;background-color:#f4f1e8;"></div>
          <div style="position:absolute;right:-15px;top:-15px;width:30px;height:30px;border-radius:50%;background-color:#f4f1e8;"></div>
        </div>

        <!-- Cuerpo de la boleta -->
        <div style="padding:8px 24px 22px;border-radius:0 0 16px 16px;">
          <h1 style="margin:0 0 18px;color:#121212;font-size:22px;line-height:1.3;letter-spacing:-0.02em;font-weight:800;">
            ${escapeHtml(title)}
          </h1>
          <div style="color:#48483f;font-size:15px;line-height:1.7;">${content}</div>
          ${actionButton}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:28px;border-top:1px dashed #dcd8cb;">
            <tr>
              <td style="padding-top:16px;color:#9a968a;font-size:11px;line-height:1.6;">
                Si no solicitaste este correo, puedes ignorarlo con seguridad.<br>
                &copy; ${year} ${escapeHtml(brandName)}. Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </div>
      </div>

      <p style="text-align:center;color:#9a968a;font-size:11px;margin:18px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        Enviado por <a href="${escapeAttr(siteUrl)}" style="color:#96710e;text-decoration:underline;">${escapeHtml(brandName)}</a>
      </p>

    </div>
  </div>
</body>
</html>`;
};
