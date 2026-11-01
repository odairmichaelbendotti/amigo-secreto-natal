# Secret Santa - Multi-Tenant Gift Exchange Platform

A free, self-hosted web application for managing Secret Santa gift exchanges. Perfect for families, friend groups, and communities worldwide. Features multi-tenancy, email and password accounts, wishlist management, and automated Secret Santa partner assignments.

## Features

- **Multi-Tenant**: Unlimited groups can use the same installation
- **Group Creation**: Anyone can create a new Secret Santa group
- **Group invitations**: Share a link; guests register with full name, email and password and request approval
- **Admin Portal**: Approve or reject participation requests and generate assignments
- **User Login**: Email/password accounts with groups linked after approval
- **Wishlist Management**: Each person can add 1-5 gift items with links
- **Secret Santa Assignments**: Automated partner generation ensuring valid assignments
- **Mobile Responsive**: Works great on phones, tablets, and desktops
- **Data Isolation**: Each group's data is completely isolated from others

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: Email/password with encrypted session cookies
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

**For Development:**
- Node.js 20.19+, 22.12+, or 24+ installed (required by Prisma 7)
- PostgreSQL database OR Docker

**For Production (Easiest):**
- Docker and Docker Compose
- That's it!

### Quick Start with Docker (Recommended)

```bash
# 1. Start everything
docker-compose up -d

# 2. Access at http://localhost:3000
```

That's it! See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment.

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up your database**

   Update `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/secret_santa?schema=public"
   SESSION_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
   ```

3. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Admins

1. Create an account at `/create`, create your group and open its dashboard from `/groups`
2. Copy the group invitation link and share it with guests
3. Approve or reject the requests received in the dashboard
4. Once everyone has added their wishlist, click "Generate Assignments" to create Secret Santa pairs
5. View all assignments to verify everything worked

### For Participants

1. Open the group invitation link.
2. Create an account with full name, email and a password of at least 4 characters (or sign in).
3. The request appears in `/groups` while the administrator reviews it.
4. Once approved, open the group from `/groups`, create your wishlist and view your assignment after the draw.
5. On another device, sign in at `/login` with the same email and password; your groups are restored.

## Database Schema

- **User**: Stores account information and a bcrypt password hash
- **Person**: Links a user to a group with its approval status
- **WishlistItem**: Stores gift items for each person
- **Assignment**: Tracks who gives to whom each year
- **AdminConfig**: Stores admin password (hashed)

## Secret Santa Algorithm

The application uses a derangement algorithm to ensure:
- Everyone gives to exactly one person
- Everyone receives from exactly one person
- No one gives to themselves
- Minimum of 3 people required

## Development

### Project Structure

```
/app
  /admin          - Admin portal pages
  /api            - API routes
  /login          - User login page
  /wishlist       - User wishlist page
/lib              - Utilities and database client
/prisma           - Database schema
/components       - Reusable UI components (if needed)
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio to view/edit database

### Database Commands

- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma Client
- `npx prisma studio` - Open database GUI
- `npx prisma migrate reset` - Reset database (careful!)

## Deployment

### Environment Variables

Make sure to set these in your production environment:

```
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-random-session-secret-at-least-32-characters
```

### Build and Deploy

```bash
npm run build
npm start
```

Deploy to platforms like:
- Vercel (recommended for Next.js)
- Railway
- Heroku
- DigitalOcean App Platform

## Security Notes

- Admin password is hashed using bcrypt
- Login codes are randomly generated and unique
- No sensitive data is exposed to users
- Session data stored in browser sessionStorage (cleared on logout)

## Troubleshooting

### Database Connection Issues

Make sure your PostgreSQL server is running and the DATABASE_URL in `.env` is correct.

### Prisma Client Not Found

Run `npx prisma generate` to generate the Prisma Client.

### Port Already in Use

The app runs on port 3000 by default. Change it with:
```bash
npm run dev -- -p 3001
```

## Future Enhancements

Possible features to add:
- Gift budget suggestions
- Mark gifts as purchased
- Historical assignments from previous years
- Family group management
- Image uploads for wishlist items

## License

This is a personal project for family use. Feel free to adapt it for your own needs!

## Support

For issues or questions, please check the code comments or create an issue in the repository.

### Existing groups and requests

The account migration preserves groups, participants, wishes and assignments. A participant or administrator who still has the previous signed session can create an account in the same browser to link their existing access. Memberships are never claimed by name alone. Personal access codes are removed. Email is used only to sign in; no email delivery or SMTP is required.
