import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { DigestData } from '@/types';

interface DigestEmailProps {
  data: DigestData;
  dashboardUrl: string;
}

export default function DigestEmail({ data, dashboardUrl }: DigestEmailProps) {
  const periodLabel = data.period.label.toLowerCase();

  return (
    <Html>
      <Head />
      <Preview>
        {data.stats.totalSessions > 0
          ? `${data.stats.totalSessions} sessions on ${data.projectName} ${periodLabel}`
          : `Your ${data.projectName} digest - ${periodLabel}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>NowWhy</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Heading style={heading}>
              {data.period.label} on {data.projectName}
            </Heading>
            <Text style={subheading}>
              {data.projectDomain}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Quick Stats */}
          <Section style={section}>
            <Text style={sectionTitle}>At a glance</Text>
            <table style={statsTable} cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={statCell}>
                    <Text style={statNumber}>{data.stats.totalSessions}</Text>
                    <Text style={statLabel}>Sessions</Text>
                  </td>
                  <td style={statCell}>
                    <Text style={statNumber}>{data.stats.uniqueVisitors}</Text>
                    <Text style={statLabel}>Visitors</Text>
                  </td>
                  <td style={statCell}>
                    <Text style={statNumber}>
                      {formatDuration(data.stats.avgSessionDuration)}
                    </Text>
                    <Text style={statLabel}>Avg. session</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Insights */}
          {data.insights.length > 0 && (
            <Section style={section}>
              <Text style={sectionTitle}>What happened</Text>
              {data.insights.map((insight, i) => (
                <Text key={i} style={insightItem}>
                  <span style={bullet}>•</span> {insight}
                </Text>
              ))}
            </Section>
          )}

          {/* Intent Breakdown */}
          {(data.intents.highIntent > 0 ||
            data.intents.signupAttempts > 0 ||
            data.intents.pricingEvaluations > 0) && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Text style={sectionTitle}>Visitor intent</Text>
                <table style={intentTable} cellPadding={0} cellSpacing={0}>
                  <tbody>
                    {data.intents.highIntent > 0 && (
                      <tr>
                        <td style={intentLabel}>High intent</td>
                        <td style={intentValue}>
                          <span style={intentBadge}>{data.intents.highIntent}</span>
                        </td>
                      </tr>
                    )}
                    {data.intents.signupAttempts > 0 && (
                      <tr>
                        <td style={intentLabel}>Signup attempts</td>
                        <td style={intentValue}>
                          <span style={intentBadge}>{data.intents.signupAttempts}</span>
                        </td>
                      </tr>
                    )}
                    {data.intents.pricingEvaluations > 0 && (
                      <tr>
                        <td style={intentLabel}>Evaluating pricing</td>
                        <td style={intentValue}>
                          <span style={intentBadge}>{data.intents.pricingEvaluations}</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Section>
            </>
          )}

          {/* Friction Alert */}
          {data.friction.total > 0 && (
            <>
              <Hr style={hr} />
              <Section style={frictionSection}>
                <Text style={frictionTitle}>Friction detected</Text>
                <Text style={frictionText}>
                  {data.friction.total} {data.friction.total === 1 ? 'instance' : 'instances'} of
                  possible visitor friction:
                </Text>
                {data.friction.byType.map(({ type, count }) => (
                  <Text key={type} style={frictionItem}>
                    {formatFrictionType(type)}: {count}
                  </Text>
                ))}
              </Section>
            </>
          )}

          {/* Top Pages */}
          {data.topPages.length > 0 && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Text style={sectionTitle}>Top pages</Text>
                <table style={pagesTable} cellPadding={0} cellSpacing={0}>
                  <tbody>
                    {data.topPages.map(({ path, views }) => (
                      <tr key={path}>
                        <td style={pagePath}>{path}</td>
                        <td style={pageViews}>{views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={dashboardUrl} style={ctaButton}>
              View Live Dashboard
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you enabled digest emails for {data.projectName}.
            </Text>
            <Text style={footerText}>
              <Link href={`${dashboardUrl}/settings`} style={footerLink}>
                Manage email preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatFrictionType(type: string): string {
  const labels: Record<string, string> = {
    PRICING_LOOP: 'Pricing revisits',
    NAV_LOOP: 'Navigation loops',
    FORM_STALL: 'Form pauses',
    CTA_DROP: 'CTA exits',
  };
  return labels[type] || type;
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px 32px 0',
};

const logoText = {
  color: '#f97316',
  fontSize: '24px',
  fontWeight: '700' as const,
  margin: '0',
};

const section = {
  padding: '0 32px',
};

const heading = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: '600' as const,
  lineHeight: '1.3',
  margin: '24px 0 8px',
};

const subheading = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 16px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '24px 32px',
};

const sectionTitle = {
  color: '#64748b',
  fontSize: '11px',
  fontWeight: '600' as const,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
};

const statsTable = {
  width: '100%',
};

const statCell = {
  textAlign: 'center' as const,
  verticalAlign: 'top' as const,
  padding: '0 8px',
};

const statNumber = {
  color: '#1e293b',
  fontSize: '32px',
  fontWeight: '700' as const,
  margin: '0 0 4px',
};

const statLabel = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0',
};

const insightItem = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const bullet = {
  color: '#f97316',
  marginRight: '8px',
};

const intentTable = {
  width: '100%',
};

const intentLabel = {
  color: '#475569',
  fontSize: '14px',
  padding: '8px 0',
};

const intentValue = {
  textAlign: 'right' as const,
  padding: '8px 0',
};

const intentBadge = {
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  color: '#1e293b',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '4px 12px',
};

const frictionSection = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  margin: '0 32px',
  padding: '16px 20px',
};

const frictionTitle = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
};

const frictionText = {
  color: '#a16207',
  fontSize: '14px',
  margin: '0 0 8px',
};

const frictionItem = {
  color: '#a16207',
  fontSize: '13px',
  margin: '0 0 4px',
  paddingLeft: '12px',
};

const pagesTable = {
  width: '100%',
};

const pagePath = {
  color: '#334155',
  fontFamily: 'monospace',
  fontSize: '13px',
  padding: '6px 0',
};

const pageViews = {
  color: '#64748b',
  fontSize: '13px',
  padding: '6px 0',
  textAlign: 'right' as const,
};

const ctaSection = {
  padding: '0 32px',
  textAlign: 'center' as const,
};

const ctaButton = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '14px 28px',
  textDecoration: 'none',
};

const footer = {
  padding: '32px 32px 0',
};

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};
