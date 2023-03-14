# [TDD MOOC](https://tdd.mooc.fi): Untestable Code

This is an exercise for learning about unit testing and writing testable code.

You have been given four examples of untestable or at least hard-to-test code.
See the `src` and `test` directories.
The examples are numbered 1 to 4, in order of difficulty.

**First determine that what things make the code examples hard to test.**
(See [Chapter 3](https://tdd.mooc.fi/3-challenges) of the course material.)
Write your learnings as comments in the untestable code.

**Then create a copy of the untestable code, refactor it to be easily testable, and write tests for it.**

P.S. If you want an extra challenge, also write tests for the original untestable code. Then compare the tests you wrote
for the refactored code and the original code, and see how much more complicated they are.

---

_This exercise is part of the [TDD MOOC](https://tdd.mooc.fi) at the University of Helsinki, brought to you
by [Esko Luontola](https://twitter.com/EskoLuontola) and [Nitor](https://nitor.com/)._

## Prerequisites

You'll need a recent [Node.js](https://nodejs.org/) version. Then download this project's dependencies with:

    npm install

Part 4 of this exercise provides [Docker](https://www.docker.com/products/docker-desktop/) configuration for starting
the database, but you may also run [PostgreSQL](https://www.postgresql.org/download/) without containers.

## Developing

Start the database (used by untestable4)

    docker compose up -d

This will start a [PostgreSQL 13](https://www.postgresql.org/docs/13/index.html) database to which you can connect using
the following settings:

- Host: `localhost`
- Port: `5432`
- User: `untestable`
- Password: `secret`
- Database: `untestable`
- It will also create a `users` table in the `public` schema based on [src/create-tables.sql](src/create-tables.sql)

Stop and destroy the database

    docker compose down

Run tests once

    npm run test

Run tests continuously

    npm run autotest

Code reformat

    npm run format
