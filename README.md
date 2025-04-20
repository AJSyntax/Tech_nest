# Tech Nest - Developer Portfolio Builder

Tech Nest is a full-stack web application that allows developers to create professional portfolios using customizable templates. The platform offers both free and premium templates, with features like user authentication, email verification, and portfolio customization.

![Tech Nest](https://github.com/AJSyntax/Tech_nest/raw/main/attached_assets/technest-preview.png)

## Features

- **User Authentication**: Secure login and registration with password complexity validation
- **Email Verification**: OTP-based email verification system
- **Password Recovery**: Secret question/answer system for account recovery
- **Portfolio Creation**: Intuitive interface for building developer portfolios
- **Template System**: Free and premium templates with different designs
- **Admin Dashboard**: Manage templates and approve purchase requests
- **Responsive Design**: Works on desktop and mobile devices
- **Portfolio Preview**: Live preview of portfolios before publishing
- **Portfolio Export**: Download portfolios as HTML/CSS/JS files

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- React Hook Form for form handling
- Shadcn UI components
- Wouter for routing

### Backend
- Node.js with Express
- SQLite database with Drizzle ORM
- Passport.js for authentication
- Express-session for session management
- Nodemailer for email functionality
- Handlebars for template rendering

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AJSyntax/Tech_nest.git
   cd Tech_nest
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the database:
   ```bash
   node create-db.js
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the development server at http://localhost:5000.

### Production Build

```bash
npm run build
npm run start
```

## Default Users

The application comes with two default users:

1. **Admin User**
   - Username: `admin`
   - Email: `admin@example.com`
   - Password: `password`
   - Role: `admin`

2. **Regular User**
   - Username: `user`
   - Email: `user@example.com`
   - Password: `password`
   - Role: `user`

## Environment Variables

The following environment variables can be set to customize the application:

- `SESSION_SECRET`: Secret key for session encryption (default: "technest-session-secret")
- `MAILTRAP_USER`: Mailtrap username for email testing
- `MAILTRAP_PASS`: Mailtrap password for email testing

## Project Structure

```
Tech_nest/
├── client/                 # Frontend code
│   ├── src/                # React components and hooks
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   └── context/        # React context providers
│   └── index.html          # HTML entry point
├── server/                 # Backend code
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   └── seed.ts             # Database seeding
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema and validation
├── migrations/             # Database migrations
├── create-db.js            # Database creation script
└── package.json            # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login a user
- `POST /api/logout` - Logout a user
- `GET /api/user` - Get current user information
- `POST /api/verify-otp` - Verify OTP code for email verification
- `POST /api/generate-otp` - Generate new OTP code
- `GET /api/user-question` - Get security question for a user
- `POST /api/verify-secret-answer` - Verify secret answer
- `POST /api/reset-password` - Reset user password

### Portfolios
- `GET /api/user/portfolios` - Get user's portfolios
- `POST /api/portfolios` - Create a new portfolio
- `GET /api/portfolios/:id` - Get a specific portfolio
- `PUT /api/portfolios/:id` - Update a portfolio
- `DELETE /api/portfolios/:id` - Delete a portfolio

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get a specific template
- `POST /api/template-purchases` - Request to purchase a template
- `GET /api/user/template-purchases` - Get user's template purchase requests

### Admin
- `GET /api/admin/template-purchases` - Get all template purchase requests
- `PUT /api/admin/template-purchases/:id` - Update purchase request status
- `POST /api/admin/templates` - Create a new template
- `PUT /api/admin/templates/:id` - Update a template
- `DELETE /api/admin/templates/:id` - Delete a template
- `GET /api/admin/users` - Get all users

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Shadcn UI](https://ui.shadcn.com/)
