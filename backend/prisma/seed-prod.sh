#!/bin/bash
# Run this once in Railway shell after first deploy to seed teams and matches
cd /app/backend && npx ts-node prisma/seed.ts
