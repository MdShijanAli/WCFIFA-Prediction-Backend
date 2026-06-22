import { MatchStatus, Round } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";


const teams = [
  { name: "Bangladesh", code: "BAN", group: "A" },
  { name: "India", code: "IND", group: "A" },
  { name: "Pakistan", code: "PAK", group: "A" },
  { name: "Nepal", code: "NEP", group: "A" },
  { name: "Sri Lanka", code: "SRI", group: "B" },
  { name: "Maldives", code: "MDV", group: "B" },
  { name: "Bhutan", code: "BHU", group: "B" },
  { name: "Afghanistan", code: "AFG", group: "B" },
  { name: "Myanmar", code: "MYA", group: "C" },
  { name: "Cambodia", code: "CAM", group: "C" },
  { name: "Laos", code: "LAO", group: "C" },
  { name: "Vietnam", code: "VIE", group: "C" },
  { name: "Thailand", code: "THA", group: "D" },
  { name: "Malaysia", code: "MAS", group: "D" },
  { name: "Indonesia", code: "IDN", group: "D" },
  { name: "Philippines", code: "PHI", group: "D" },
  { name: "China", code: "CHN", group: "E" },
  { name: "Japan", code: "JPN", group: "E" },
  { name: "South Korea", code: "KOR", group: "E" },
  { name: "North Korea", code: "PRK", group: "E" },
  { name: "Saudi Arabia", code: "KSA", group: "F" },
  { name: "UAE", code: "UAE", group: "F" },
  { name: "Qatar", code: "QAT", group: "F" },
  { name: "Kuwait", code: "KUW", group: "F" },
  { name: "Iran", code: "IRN", group: "G" },
  { name: "Iraq", code: "IRQ", group: "G" },
  { name: "Jordan", code: "JOR", group: "G" },
  { name: "Syria", code: "SYR", group: "G" },
  { name: "Uzbekistan", code: "UZB", group: "H" },
  { name: "Kazakhstan", code: "KAZ", group: "H" },
  { name: "Tajikistan", code: "TJK", group: "H" },
  { name: "Kyrgyzstan", code: "KGZ", group: "H" },
];

async function main() {
  // Skip if already seeded
  const existing = await prisma.team.count();
  if (existing > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Seeding database...");

  const createdTeams = await Promise.all(
    teams.map((team) => prisma.team.create({ data: team })),
  );

  console.log(`Created ${createdTeams.length} teams`);

  // Create Round of 32 matches
  const r32Matches = [];
  for (let i = 0; i < 16; i++) {
    r32Matches.push({
      round: Round.ROUND_OF_32,
      matchNumber: i + 1,
      homeTeamId: createdTeams[i * 2].id,
      awayTeamId: createdTeams[i * 2 + 1].id,
      status: MatchStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      venue: "TBD",
    });
  }

  await prisma.match.createMany({ data: r32Matches });
  console.log(`Created ${r32Matches.length} Round of 32 matches`);
  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
