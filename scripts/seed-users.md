# seed-users.js

Seeds users from `data.txt` into MongoDB. Existing users matched by email are skipped.

## Prerequisites

- `.env.local` present with `MONGODB_URI` set
- `bcryptjs` installed (included in project dependencies)

## Usage

```bash
node seed-users.js
node seed-users.js --password secret123
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--password` | `password1` | Password assigned to all seeded users |

## data.txt format

One email per line. Blank lines are ignored.

```
Aka@gmail.com
Jen@gmail.com

Fiona@gmail.com
Kieran@gmail.com
```

Emails are normalised to lowercase before insert. The display name is derived from the part before the `@`.

## What gets created

Each user document inserted into the `users` collection:

```json
{
  "email": "aka@gmail.com",
  "displayName": "Aka",
  "passwordHash": "<bcrypt hash>",
  "createdAt": "<now>"
}
```

## After running

Run `seed-tournament.js` to create a tournament and join the seeded users to it.
