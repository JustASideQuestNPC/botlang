/* ----- src/constants/sample-programs.ts ----- */

const SAMPLE_PROGRAMS: { [key: string]: string } = {
    "square.bl": (
        "for (var i = 0; i < 4; i = i + 1) {\n" +
        "    moveFwd(100);\n" +
        "    rotate(90);\n" +
        "}"
    ),
    "berry.bl": (
        `# This demo program draws a COMPLETELY ORIGINAL\n` +
        `# piece of pixel art that was ABSOLUTELY NOT taken\n` +
        `# from one of NPC's favorite games.\n` +
        `\n` +
        `setMoveSpeed(1000);\n` +
        `\n` +
        `var PIXEL_SIZE = 25;\n` +
        `var PIXELS = [\n` +
        `  "     ##   ",\n` +
        `  "  ###gg#  ",\n` +
        `  " #gg#GGg# ",\n` +
        `  "#G#PggP#G#",\n` +
        `  " #PpPPpP# ",\n` +
        `  "#prrRRRRp#",\n` +
        `  "#rRRRrRRr#",\n` +
        `  "#pRrRpRRp#",\n` +
        `  "#RppRRppR#",\n` +
        `  " #RppppR# ",\n` +
        `  "  #RppR#  ",\n` +
        `  "   #RR#   ",\n` +
        `  "    ##    "\n` +
        `];\n` +
        `\n` +
        `# colors:\n` +
        `# '#': black\n` +
        `# 'g': light green\n` +
        `# 'G': dark green\n` +
        `# 'p': light purple/magenta\n` +
        `# 'P': purple\n` +
        `# 'r': light red\n` +
        `# 'R': red\n` +
        `function findColor(char) {\n` +
        `  if (char == "#") {\n` +
        `    setColorCSS("#000000");\n` +
        `  }\n` +
        `  else if (char == "g") {\n` +
        `    setColorCSS("#6abe30");\n` +
        `  }\n` +
        `  else if (char == "G") {\n` +
        `    setColorCSS("#37946e");\n` +
        `  }\n` +
        `  else if (char == "p") {\n` +
        `    setColorCSS("#800f36");\n` +
        `  }\n` +
        `  else if (char == "P") {\n` +
        `    setColorCSS("#491675");\n` +
        `  }\n` +
        `  else if (char == "r") {\n` +
        `    setColorCSS("#ff5f42");\n` +
        `  }\n` +
        `  else if (char == "R") {\n` +
        `    setColorCSS("#de2a2a");\n` +
        `  }\n` +
        `  else {\n` +
        `    print("Could not find color for character '" + char + "'");\n` +
        `  }\n` +
        `}\n` +
        `\n` +
        `function square() {\n` +
        `  setAngle(90);\n` +
        `  beginPoly();\n` +
        `  for (var i = 0; i < 4; i += 1) {\n` +
        `    moveFwd(PIXEL_SIZE);\n` +
        `    dropVertex();\n` +
        `    rotate(90);\n` +
        `  }\n` +
        `  endPoly();\n` +
        `}\n` +
        `\n` +
        `setAngle(90);\n` +
        `setPos(PIXEL_SIZE, PIXEL_SIZE);\n` +
        `\n` +
        `for (var y = 0; y < PIXELS.length; y += 1) {\n` +
        `  var row = PIXELS[y];\n` +
        `  for (var x = 0; x < row.length; x += 1) {\n` +
        `    if (row[x] != " ") {\n` +
        `      findColor(row[x]);\n` +
        `      square();\n` +
        `    }\n` +
        `    penUp();\n` +
        `    moveFwd(PIXEL_SIZE);\n` +
        `    penDown();\n` +
        `    # setMoveSpeed(getMoveSpeed() + 15);\n` +
        `  }\n` +
        `\n` +
        `  # i could just teleport, but this is cooler\n` +
        `  penUp();\n` +
        `  rotate(90);\n` +
        `  moveFwd(PIXEL_SIZE);\n` +
        `  rotate(90);\n` +
        `  moveFwd(row.length * PIXEL_SIZE);\n` +
        `  rotate(180);\n` +
        `  penDown();\n` +
        `}\n` +
        `\n` +
        `hideRobot();`
    ),
}

/* ----- end of file ----- */