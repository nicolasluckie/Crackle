# Privacy Policy

**Last Updated:** October 18, 2025

This privacy policy applies to the Crackle web application, created by Nicolas Luckie as an open-source service. This service is provided "AS IS" for helping users practice and solve Wordle puzzles.

## What Information We Collect

Crackle uses Rybbit Analytics, a privacy-focused, cookieless analytics platform, to understand how users interact with the application. We configure analytics to be anonymous and minimal. The following information may be collected:

### Usage Analytics (anonymous)
- Page views for key screens: 📄 main menu, practice mode, crack mode (tracked manually — not every page by default)
- Game interactions: 🎮
    - ⚙️ Mode selections (practice or crack)
    - 🎯 Guess submissions and guess counts
    - 🏆 Game completions and wins
    - 🔘 Button clicks (back, reset, new game)
- Technical data: 🖥️ Aggregated browser type and operating system
- Location data: 🌍 Country-level only (no city or precise location)

### What We Do NOT Collect
- ❌ No personal information (name, email, phone number, etc.)
- ❌ No precise location data (only country-level)
- ❌ No cookies for tracking (Rybbit is configured cookieless)
- ❌ No individual keystrokes (letters, backspace) or typed content
- ❌ No user profiles, session replays, or cross-session identifiers
- ❌ No personally identifiable information of any kind

## How We Use This Information

Anonymous usage data helps us:
- Understand which features are most popular
- Improve the user experience
- Identify and fix technical issues
- Make informed decisions about future features

## Third-Party Services

**Rybbit Analytics (Self-Hosted)** is used for anonymous, cookieless analytics. We self-host Rybbit on our own servers and do not send analytics data to Rybbit Cloud (rybbit.io). Rybbit is:
- GDPR & CCPA friendly
- Cookie-free by design
- Privacy-focused
- Open-source

Our configuration only uses basic web analytics and custom events relevant to gameplay and app navigation. We do not enable advanced features like session replay, user profiles, or any feature intended to identify individual users.

All events we store are aggregated and do not contain personal information. For general information about the Rybbit software, see: https://www.rybbit.io/docs and their privacy page: https://www.rybbit.io/privacy (note: those pages describe the platform; our deployment is self-hosted and data remains on infrastructure we control).

**Traffic Proxying (Cloudflare).** All application traffic and analytics events are proxied through Cloudflare to our servers. Cloudflare may process standard request metadata as part of providing network and security services. Crackle does not access or store IP addresses within the application logic. For details on Cloudflare’s data handling, see Cloudflare’s privacy policy.

**Note:** Analytics can be disabled by the site administrator by not configuring the analytics environment variables during deployment.

## Data Retention

Analytics data retention is determined by our self-hosted Rybbit deployment and is controlled by the site operator. We do not send analytics data to Rybbit Cloud.

Crackle itself does not collect or store personal information, so there is no user-specific data to delete from Crackle. Questions about analytics retention and deletion for our self-hosted instance can be directed to the contact below.

## Your Choices

- **Stop data collection**: Use an ad/script blocker to block analytics, or do not use the application
- **No account required**: Crackle requires no registration, login, or personal information

## Security

We implement industry-standard security practices to protect the application. Since no personal data is collected by Crackle, there is no personal information at risk within the application.

## Children's Privacy

Crackle does not collect personal information from anyone, including children.

The word list used in Crackle was sourced from an [open-source dataset of valid Wordle words](https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93) (14,854 words). To ensure the application remains family-friendly, we filtered out inappropriate words by cross-referencing with a [profanity word list](https://github.com/coffee-and-fun/google-profanity-words/blob/main/data/en.txt), removing 53 words.

The final word list contains 14,801 appropriate 5-letter words suitable for all ages.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. Continued use of the application after changes constitutes acceptance of the updated policy.

## Open Source

Crackle is open-source software. You can review the complete source code, including all analytics implementation, at:
https://github.com/nicolasluckie/crackle

## Contact

If you have questions about this privacy policy, contact:
Nicolas Luckie - nicolasluckie@gmail.com
