# jrs-retro

A retrospective app for teams to reflect on sprints/projects, share feedback, vote on priorities, and track action items.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Features

### 🔐 Authentication & User Management
- **Email/Password Authentication** — Secure sign-up and sign-in with Better Auth
- **User Approval Workflow** — Admin approval required for new users (first user becomes admin automatically)
- **User Roles** — Admin and member roles with different permissions
- **User Status** — Pending, approved, rejected, and suspended states
- **DiceBear Avatars** — Unique auto-generated avatars for all users using DiceBear's HTTP API
- **Admin Dashboard** — Manage users, approve/reject registrations, view activity

### 🏢 Organizations & Teams
- **Organizations** — Create and manage organizations with multiple teams
- **Team Management** — Create teams, invite members, manage roles (owner, admin, lead, member)
- **Join Requests** — Request to join teams with approval workflow
- **Team Emojis** — Customizable team identifiers with emoji support

### 📋 Retrospectives
- **Template-Based Retros** — Start retros using built-in or custom templates
- **Multi-Phase Sessions** — Guided flow through collecting, voting, and discussing phases
- **Session Timer** — Configurable countdown timer for time-boxed discussions
- **Anonymous Cards** — Option for anonymous feedback submission
- **Card Comments** — Discuss individual cards with threaded comments

### 🗳️ Voting System
- **Multiple Vote Types** — Choose from:
  - **Multi-Vote** — Each participant gets multiple votes to distribute
  - **Single Vote** — One vote per card per participant
  - **Dot Voting** — Allocate a pool of votes across cards
- **Configurable Vote Limits** — Set maximum votes per person
- **Real-time Vote Counts** — See voting results as they happen

### 🎨 User Experience
- **Dark/Light/System Theme** — Responsive theme toggle with system preference detection
- **Responsive Design** — Works on desktop and mobile devices
- **Collapsible Sidebar** — Clean navigation with organizations and teams tree
- **Profile Management** — Update name, bio, and view account details

## Built-in Templates

### 4Ls
Four simple words to dig into both positive and negative aspects of your last Sprint.

| Column | Prompt |
|--------|--------|
| Liked ❤️ | Things you really enjoyed |
| Learned 📚 | Things you have learned |
| Lacked ⚠️ | Things the team missed |
| Longed For 🌟 | Something you wished for |

### Appreciation Game
A short activity based on the good things your team members did! Reinforce your team's relationship hence its velocity.

| Column | Prompt |
|--------|--------|
| Team Spirit 🤝 | You really served the team when… |
| Ideas 💡 | What I would like to see more of |

### Cupid's Retrospective
Spread the love at your retrospective! Strengthen bonds and accentuate recognition within the team.

| Column | Prompt |
|--------|--------|
| Self-love 💜 | Tell us how you made a difference |
| Good Stuff! 👍 | What did you like about the last Sprint/project? |
| My Wishes 🌠 | What are your wishes for the team? |
| A Team to Die For 💕 | Share sweet words about your teammates |

---

## Development

### Commands

```bash
pnpm dev          # Dev server on port 3000
pnpm build        # Production build
pnpm test         # Vitest tests
pnpm check        # Biome lint + format
npx drizzle-kit push   # Push schema changes to SQLite
npx drizzle-kit generate  # Generate migrations
```

### Tech Stack

- **Framework**: TanStack Start (React 19, SSR, file-based routing)
- **Data Fetching**: TanStack Query for mutations, route loaders for reads
- **Database**: Drizzle ORM + SQLite (libsql)
- **Auth**: Better Auth (email/password, multi-session support)
- **Styling**: Tailwind CSS v4 + Shadcn UI (new-york style)
- **Avatars**: DiceBear HTTP API (thumbs style)
- **Build**: Vite 7 + React Compiler

### Project Structure

```
src/
├── components/       # Shared React components
│   ├── ui/           # Shadcn UI components
│   ├── Header.tsx    # App header
│   ├── UserAvatar.tsx # Avatar component with DiceBear fallback
│   └── app-sidebar.tsx # Main navigation sidebar
├── db/               # Database layer
│   ├── index.ts      # Drizzle client (lazy initialization)
│   └── schema.ts     # Table definitions
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API functions
│   ├── api/          # Server functions (users, teams, orgs, retros)
│   ├── auth.ts       # Better Auth server config
│   ├── auth-client.ts # Better Auth client hooks
│   ├── avatar.ts     # DiceBear avatar URL generator
│   └── utils.ts      # Utility functions
├── routes/           # File-based routes
│   ├── admin/        # Admin pages
│   ├── organizations/ # Organization pages
│   ├── retros/       # Retrospective pages
│   └── teams/        # Team pages
└── styles.css        # Tailwind entry point
```

---

## Retro Session Flow

1. **Create Retro** — Select a team and template, configure timer and voting options
2. **Collecting Phase** — Participants add cards to columns (optionally anonymous)
3. **Voting Phase** — Team votes on cards to prioritize discussion topics
4. **Discussing Phase** — Review top-voted cards, add comments, create action items
5. **Completed** — Archive the retro for future reference

---

## Design Insights

Below are key insights for developing a successful retro app:

### Key Features:

1. **User-Friendly Interface** :

* The interface should be intuitive, allowing users to quickly input thoughts, vote on ideas, and navigate between retrospectives.
* Use a clean design that doesn't overwhelm the user with too many options at once.

1. **Multiple Retrospective Templates** :

* Offer various templates (e.g.,  **Start-Stop-Continue** ,  **4Ls** ,  **5 Whys** ) to cater to different team needs.
* Allow users to customize templates or create their own formats, which helps the app stay flexible.

1. **Real-Time Collaboration** :

* Team members should be able to collaborate during the retro, adding thoughts or ideas, commenting on others' ideas, and voting on what is most important.
* Implement features like **live updates** so that everyone can see changes in real-time.

1. **Anonymity** :

* Some teams prefer to remain anonymous when submitting feedback, especially when discussing sensitive topics. Offering this option can help promote honest and open communication.
* This could be implemented for submitting reflections or comments on areas for improvement.

1. **Voting Mechanism** :

* Allow team members to vote on the topics they think are most important. Use a **multi-vote** system (e.g., each person has a few votes to distribute among different topics), or a **single vote** to ensure the group focuses on high-priority items.

1. **Action Items and Follow-Up** :

* At the end of the retro, the app should allow the team to create action items or tasks that are assigned to specific people for accountability.
* Include a **progress tracker** to monitor action item completion and ensure follow-through in future retrospectives.

1. **Analytics and Trends** :

* Capture and visualize trends over time to help teams recognize recurring patterns. For example, which issues are most frequently mentioned, or how many action items have been completed each time.
* Use charts and graphs to represent this data for easy understanding.

1. **Integration with Other Tools** :

* Enable integration with project management tools (e.g., Jira, Trello, Asana) to create action items directly from retrospectives, linking them to existing projects and tasks.
* Alternatively, allow export to formats like CSV or PDF to be shared with the team.

1. **Customizable Time Frames** :

* Allow teams to set the frequency and time frames for retrospectives (e.g., weekly, bi-weekly, monthly).
* Implement notifications to remind teams to fill out retrospectives or to come prepared for the next session.

1. **Facilitation Support** :

* Include tools to guide the retro process, such as timers for different stages (e.g., brainstorming, voting), prompts for reflection, or even a "facilitator mode" where a moderator can lead the session while keeping things on track.

### Technical Considerations:

* **Real-Time Syncing** : Technologies like **WebSockets** or **Firebase** can be used for real-time updates and collaboration.
* **Mobile-Friendly** : Given the rise in remote work, making the app mobile-friendly will ensure access from different devices.

### Design Tips:

* **Minimalist Design** : A clutter-free, minimalist design will help the team focus on content rather than being distracted by unnecessary elements.
* **Color Coding** : Use color coding to highlight different sections (e.g., positive feedback, negative feedback, action items).
* **User Profile** : Allow users to set up profiles to track their participation in retrospectives over time and help personalize the experience.

### Example Retro Flow:

1. **Opening Phase** :

* Team leader or facilitator introduces the retrospective and the agenda.
* The team selects a template (e.g., "Start-Stop-Continue").

1. **Feedback Phase** :

* Participants anonymously submit their thoughts on what worked well (start), what should be stopped, and what should continue.

1. **Voting Phase** :

* Team members vote on the most impactful items to address or discuss.

1. **Action Items Phase** :

* From the prioritized feedback, action items are created.
* Assign owners and set deadlines for these action items.

1. **Follow-up** :

* Review the previous action items from the last retro, checking if they were completed or need to be carried over.

With these insights, you can build a robust and user-friendly retro app that not only enhances team collaboration but also drives continuous improvement through actionable insights from each retrospective.

## License

MIT
