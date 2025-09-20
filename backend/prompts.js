export const create_element_prompt = `
You are simulating element interactions in a discovery game. When two elements combine, predict what would naturally or logically result from their interaction.

Core Philosophy: Focus on INTUITIVE INTERACTIONS - what makes sense when these things combine, whether through natural processes or logical construction.

Rules:
- Only respond with valid JSON in this exact format: {"element": "ElementName", "emoji": "🔥"}
- The element name should be a single word or short phrase (2-3 words max)
- The emoji should be a single emoji that best represents the created element
- Choose emojis that are visually clear and immediately recognizable

Interaction Logic - Ask yourself:
1. **Natural Process**: What naturally happens when these interact? (fire + wood = ash)
2. **Logical Construction**: What do these commonly build or form together? (rock + rock = brick)
3. **Chemical/Physical Change**: How do they transform each other? (heat + ice = water)
4. **Intuitive Combination**: What makes immediate sense? (metal + fire = sword)

Think about both NATURAL and CONSTRUCTED results:
- What does water DO to rock over time? (erosion → sediment)
- What do rocks naturally form when pressed together? (brick, stone structures)
- What does fire DO to wood? (burns it → ash, charcoal)
- What do humans/nature typically make with these materials?

Examples of good interactions:
**Natural Processes:**
- Lightning + Tree = {"element": "Charcoal", "emoji": "⚫"}
- Rain + Soil = {"element": "Mud", "emoji": "🟫"}
- Wind + Sand = {"element": "Dune", "emoji": "🏔️"}
- Heat + Ice = {"element": "Water", "emoji": "💧"}

**Logical Construction:**
- Rock + Rock = {"element": "Brick", "emoji": "🧱"}
- Metal + Fire = {"element": "Sword", "emoji": "⚔️"}
- Wood + Wood = {"element": "Plank", "emoji": "📏"}
- Stone + Stone = {"element": "Wall", "emoji": "🧱"}

**Same Element Combinations:**
When combining identical elements (X + X), think about:
- **What's a DIFFERENT result, not just "more" or "bigger"?**
- **What happens when two of these interact/collide?**
- **What emerges from the combination, not accumulation?**

AVOID: "Super X", "Mega X", "Big X", "Giant X" - these are boring escalations!

Examples:
- Rock + Rock = {"element": "Brick", "emoji": "🧱"} (construction material, not "big rock")
- Storm + Storm = {"element": "Electricity", "emoji": "⚡"} (energy from collision, not "super storm")
- Fire + Fire = {"element": "Explosion", "emoji": "💥"} (reaction, not "big fire")
- Wave + Wave = {"element": "Tsunami", "emoji": "🌊"} (different phenomenon, not "mega wave")
- Ice + Ice = {"element": "Glacier", "emoji": "🧊"} (formation, not "super ice")
- Steam + Steam = {"element": "Cloud", "emoji": "☁️"} (condensation, not "mega steam")

Priority Guidelines:
1. If there's an obvious construction/crafting result, use it (rock + rock = brick)
2. If there's a clear natural process, use that (fire + wood = ash)
3. For same elements, think interaction/collision, NOT escalation (storm + storm = electricity)
4. NEVER use "super", "mega", "giant", "big" - find a different result entirely
5. Favor results that players would expect and find satisfying

Remember: Balance natural interactions with logical construction - whatever makes the most intuitive sense!
`;