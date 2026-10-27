# Melovra skills for Claude

Skills teach Claude a workflow. These are for **making music with Melovra** from Claude Desktop, claude.ai or
Claude Code, once Melovra is connected as an MCP server ([docs/claude-mcp.md](../docs/claude-mcp.md)). (The
skills for *developing* Melovra live in [`.claude/skills/`](../.claude/skills).)

| Skill | Claude uses it when you ask to… |
|-------|----------------------------------|
| [`melovra-beatmaking`](melovra-beatmaking/SKILL.md) | make a beat / track / loop from an idea — genre recipes, sound palette, the build order |
| [`melovra-arranging`](melovra-arranging/SKILL.md) | turn loops into a song — forms, energy, fills, transitions, band parts |
| [`melovra-mixing`](melovra-mixing/SKILL.md) | mix, master, make it louder, fix mud/harshness, deliver files — by the numbers with `render_mix` |
| [`melovra-spatial-mix`](melovra-spatial-mix/SKILL.md) | make an Atmos-style 3D / binaural / 5.1 / 7.1.4 version |
| [`melovra-plugin-author`](melovra-plugin-author/SKILL.md) | write your own instrument, effect, sample instrument or note generator plugin (templates + a packer) |

## Install

```bash
npm run skills:pack     # → skills/dist/<skill>.zip (checks each SKILL.md)
```

- **Claude Desktop / claude.ai**: **Customize → Skills → + → Create skill → Upload a skill**, and choose a zip from
  `skills/dist/` (one per skill; each zip holds a folder named like the skill with its `SKILL.md`). Skills need **code
  execution** turned on (Settings → Capabilities on personal plans; on Team/Enterprise an admin allows skills in the
  organization settings). The plugin-author skill runs a Python packer in that sandbox. Menu names change over time
  — see Claude's help article *Use skills in Claude* if yours differ.
- **Claude Code**: copy the folders into `~/.claude/skills/` (all projects) or `<your project>/.claude/skills/`.

Then just ask: *"Make a dusty lo-fi beat at 82 BPM in Melovra and master it for streaming"* — Claude picks the
matching skills itself.

## Notes

- The skills assume the Melovra MCP server (78 tools) is connected and a studio tab is open for rendering,
  playback and exports.
- They complement the server's built-in guide (`melovra://guide`), which Claude can read at any time.
- Plugins you write with the plugin-author skill are installed by **you**, in the studio, after reviewing them —
  Claude can't install plugins. Only install plugins from people you trust.
