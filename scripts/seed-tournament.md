# seed-tournament.js

Seeds a test tournament with teams from `data.txt`. Run `seed-users.js` first to ensure the users exist in the database.

## Prerequisites

- `.env.local` present with `MONGODB_URI` set
- Users in `data.txt` already seeded via `seed-users.js`

## Usage

```bash
node seed-tournament.js
node seed-tournament.js --name "Friday League"
node seed-tournament.js --name "Friday League" --organizer carl@gmail.com
node seed-tournament.js --mode doubles
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--name` | `Seed Test Tournament` | Tournament name |
| `--mode` | `doubles` | `doubles` or `singles` |
| `--organizer` | First user found | Email of the organizer |

## How teams are built

Users in `data.txt` are separated into groups by blank lines. In **doubles** mode each group becomes one team:

```
Aka@gmail.com       ← Team 1
Jen@gmail.com       ↗

Fiona@gmail.com     ← Team 2
Kieran@gmail.com    ↗
```

In **singles** mode each unique email becomes its own team, blank lines are ignored.

If one user in a doubles pair is missing from the database the team is created with `status: open` (half-team). If both are missing the group is skipped.

## After running

1. Log in as the organizer
2. Find the tournament on the dashboard
3. Click **Start Tournament** to generate the bracket
