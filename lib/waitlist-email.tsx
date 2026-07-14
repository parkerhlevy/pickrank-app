export const waitlistWelcomeEmailSubject = 'You’re on the PickRank waitlist';
export const waitlistWelcomeEmailPreviewText =
  'You’re officially on the list. We’ll let you know when it’s time to play.';
export const waitlistHomepageUrl = 'https://www.pickrankgames.com';

export function WaitlistWelcomeEmail() {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif', color: '#0f172a' }}>
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{waitlistWelcomeEmailPreviewText}</div>
        <main style={{ margin: '0 auto', maxWidth: 560, padding: '32px 18px' }}>
          <section
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ backgroundColor: '#0f172a', padding: '28px 24px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Email clients need a plain img tag. */}
              <img
                src={`${waitlistHomepageUrl}/brand/pickrank-wordmark-football-transparent-light.png`}
                width="180"
                alt="PickRank"
                style={{ display: 'block', height: 'auto', maxWidth: '100%' }}
              />
            </div>
            <div style={{ padding: '28px 24px' }}>
              <h1 style={{ margin: '0 0 18px', fontSize: 28, lineHeight: '34px', fontWeight: 800 }}>
                You’re on the list.
              </h1>
              <p style={{ margin: '0 0 16px', fontSize: 16, lineHeight: '26px' }}>
                Thanks for joining the PickRank waitlist.
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 16, lineHeight: '26px' }}>
                PickRank is a new weekly sports contest where you rank the players you think will finish highest, then
                see how your picks stack up when the games are over.
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 16, lineHeight: '26px' }}>
                We’re getting everything ready now. You’ll be among the first to know when PickRank is ready to play.
              </p>
              <p style={{ margin: '0 0 24px', fontSize: 16, lineHeight: '26px' }}>
                Until then, start thinking about who you’d rank at the top.
              </p>
              <a
                href={waitlistHomepageUrl}
                style={{
                  display: 'inline-block',
                  borderRadius: 8,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '12px 18px',
                  textDecoration: 'none',
                }}
              >
                Visit PickRank
              </a>
              <p style={{ margin: '28px 0 0', fontSize: 16, lineHeight: '26px' }}>The PickRank Team</p>
            </div>
          </section>
          <p style={{ margin: '18px 0 0', color: '#64748b', fontSize: 12, lineHeight: '18px', textAlign: 'center' }}>
            You are receiving this because you joined the PickRank waitlist. Unsubscribe links are managed in Resend for
            future launch broadcasts.
          </p>
        </main>
      </body>
    </html>
  );
}

export function renderWaitlistWelcomeEmailReact() {
  return <WaitlistWelcomeEmail />;
}

export function renderWaitlistWelcomeEmailHtml() {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background-color:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;">${waitlistWelcomeEmailPreviewText}</div>
    <main style="margin:0 auto;max-width:560px;padding:32px 18px;">
      <section style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0f172a;padding:28px 24px;">
          <img src="${waitlistHomepageUrl}/brand/pickrank-wordmark-football-transparent-light.png" width="180" alt="PickRank" style="display:block;height:auto;max-width:100%;" />
        </div>
        <div style="padding:28px 24px;">
          <h1 style="margin:0 0 18px;font-size:28px;line-height:34px;font-weight:800;">You’re on the list.</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:26px;">Thanks for joining the PickRank waitlist.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:26px;">PickRank is a new weekly sports contest where you rank the players you think will finish highest, then see how your picks stack up when the games are over.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:26px;">We’re getting everything ready now. You’ll be among the first to know when PickRank is ready to play.</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:26px;">Until then, start thinking about who you’d rank at the top.</p>
          <a href="${waitlistHomepageUrl}" style="display:inline-block;border-radius:8px;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:700;padding:12px 18px;text-decoration:none;">Visit PickRank</a>
          <p style="margin:28px 0 0;font-size:16px;line-height:26px;">The PickRank Team</p>
        </div>
      </section>
      <p style="margin:18px 0 0;color:#64748b;font-size:12px;line-height:18px;text-align:center;">You are receiving this because you joined the PickRank waitlist. Unsubscribe links are managed in Resend for future launch broadcasts.</p>
    </main>
  </body>
</html>`;
}

export function renderWaitlistWelcomeEmailText() {
  return [
    'You’re on the list.',
    '',
    'Thanks for joining the PickRank waitlist.',
    '',
    'PickRank is a new weekly sports contest where you rank the players you think will finish highest, then see how your picks stack up when the games are over.',
    '',
    'We’re getting everything ready now. You’ll be among the first to know when PickRank is ready to play.',
    '',
    'Until then, start thinking about who you’d rank at the top.',
    '',
    waitlistHomepageUrl,
    '',
    'The PickRank Team',
    '',
    'You are receiving this because you joined the PickRank waitlist. Unsubscribe links are managed in Resend for future launch broadcasts.',
  ].join('\n');
}
