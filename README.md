# Streho - Health & Sports Ecosystem

A unified platform for athletes, coaches, and nutritionists to track training and medical data.

## Features

### For Athletes
- Track training activities (manual entry + Strava integration)
- Upload and manage medical documents (lab results, imaging, prescriptions)
- Connect with coaches and nutritionists
- View aggregated health and performance data

### For Coaches
- View athletes' training data and medical information
- Add notes and recommendations
- Create training plans
- Monitor athlete progress

### For Nutritionists
- Access client activity and health data
- Provide nutrition guidance based on holistic data
- Track client progress
- Add nutrition notes and plans

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **External APIs**: Strava API (more integrations coming)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Strava API credentials (optional, for Strava integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd streho
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `STRAVA_CLIENT_ID` & `STRAVA_CLIENT_SECRET`: From Strava API (optional)

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to see the application.

## Database Schema

The application uses a comprehensive schema including:

- **Users & Authentication**: User accounts with role-based access (Athlete, Coach, Nutritionist)
- **Medical Data**: Documents storage for lab results, imaging, prescriptions
- **Training Data**: Activities from manual entry or Strava integration
- **Relationships**: Coach-Athlete and Nutritionist-Client connections
- **Notes**: Coaching and nutrition notes/recommendations
- **Strava Integration**: OAuth tokens and sync status

## Project Structure

```
streho/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   └── auth/           # Authentication endpoints
│   ├── auth/               # Auth pages (login, register)
│   ├── dashboard/          # Dashboard pages
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── auth/               # Auth-related components
│   ├── dashboard/          # Dashboard components
│   └── providers/          # Context providers
├── lib/                     # Utility libraries
│   ├── auth/               # Auth configuration & utilities
│   └── prisma.ts           # Prisma client singleton
├── prisma/                  # Database schema & migrations
│   └── schema.prisma       # Database schema
├── types/                   # TypeScript type definitions
└── public/                  # Static files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma Client

## User Roles

1. **Athlete**: Primary users who track training and medical data
2. **Coach**: Work with athletes, view data, provide training guidance
3. **Nutritionist**: Work with clients, view data, provide nutrition guidance
4. **Admin**: System administration (future feature)

## Roadmap

### MVP (Current)
- [x] User authentication and registration
- [x] Role-based dashboards
- [x] Database schema
- [ ] Manual training entry
- [ ] Medical document upload
- [ ] Strava OAuth integration
- [ ] Coach-athlete relationships
- [ ] Basic data visualization

### Future Features
- Training Peaks integration
- Runna integration
- Advanced analytics and insights
- Mobile app
- Team management features
- AI-powered recommendations
- Export functionality
- API for third-party integrations

## Contributing

This is an MVP project. Contributions, issues, and feature requests are welcome!

## License

[Add your license here]

## Support

For questions or support, please open an issue in the repository.
